import os
import time
import uuid
import math
import numpy as np
import pandas as pd
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import litellm

from context_engine.context import Context
from context_engine.models import Memory, MemoryType
from context_engine.store import MemoryStore
from context_engine.pipeline import ScoringPipeline, ScoredMemory
from context_engine.selector import GreedyTokenSelector
from eval.baselines import get_vector_rag

load_dotenv()

app = FastAPI(title="Context Scheduler API", version="1.0.0")

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global active Context instance for the session
GLOBAL_CTX = Context(user_id="default_user")

# Models
class AddMemoryRequest(BaseModel):
    content: str
    type: str
    timestamp: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

class QueryRequest(BaseModel):
    query: str
    max_tokens: int = 500
    generate_llm: bool = True

class SeedPresetRequest(BaseModel):
    preset_name: str # "recency_conflict", "multi_hop", "redundancy_incident"

def format_time_ago(timestamp: float, now: float = None) -> str:
    if now is None:
        now = time.time()
    delta = max(0, now - timestamp)
    if delta < 60:
        return f"{int(delta)}s ago"
    elif delta < 3600:
        return f"{int(delta // 60)}m ago"
    elif delta < 86400:
        return f"{int(delta // 3600)}h ago"
    else:
        days = delta / 86400
        return f"{days:.1f}d ago"

def seed_default_memories(ctx: Context, preset: str = "recency_conflict"):
    ctx.store = MemoryStore()
    now = time.time()
    t_base = now - 86400 * 30 # 30 days ago
    
    if preset == "recency_conflict":
        # 1. Old Fact from 30 days ago
        ctx.store.add_memory(
            content="The primary contact for Engineering is Charlie.",
            memory_type=MemoryType.PREFERENCE,
            metadata={"source": "team_directory_v1"}
        )
        # Manually backdate the first memory
        first_id = ctx.store._next_faiss_id - 1
        ctx.store._memories[first_id].timestamp = t_base

        # 2. Distractors across the month
        for i, budget in enumerate([33, 45, 61, 75, 93]):
            ctx.store.add_memory(
                content=f"The budget for Engineering is ${budget}k this quarter.",
                memory_type=MemoryType.FACT,
                metadata={"source": "finance_sheet"}
            )
            mid = ctx.store._next_faiss_id - 1
            ctx.store._memories[mid].timestamp = t_base + (i * 86400 * 5)

        # 3. New Event from 1 day ago (overrides Charlie)
        ctx.store.add_memory(
            content="Charlie left the company. The new primary contact for Engineering is Heidi.",
            memory_type=MemoryType.EVENT,
            metadata={"source": "hr_announcement"}
        )
        mid = ctx.store._next_faiss_id - 1
        ctx.store._memories[mid].timestamp = now - 86400 * 1

    elif preset == "multi_hop":
        # Hop 1: Project requirement
        ctx.store.add_memory(
            content="Project Zeta requires a framework with strong server-side rendering support.",
            memory_type=MemoryType.FACT,
            metadata={"source": "project_brief"}
        )
        # Hop 2: Framework choice
        ctx.store.add_memory(
            content="We chose Nuxt for Project Zeta because it excels at server-side rendering.",
            memory_type=MemoryType.DECISION,
            metadata={"source": "architecture_decision"}
        )
        # Near duplicate requirement (to test deduplication)
        ctx.store.add_memory(
            content="Strong SSR support is a hard requirement for Project Zeta.",
            memory_type=MemoryType.FACT,
            metadata={"source": "meeting_notes"}
        )
        # Distractors
        for s in range(1, 6):
            ctx.store.add_memory(
                content=f"Server {s} CPU usage for Project Zeta is at {20 + s*7}%.",
                memory_type=MemoryType.FACT,
                metadata={"source": "datadog"}
            )

    elif preset == "redundancy_incident":
        # 1 Primary Incident alert
        ctx.store.add_memory(
            content="The Auth service just went down with a Timeout error.",
            memory_type=MemoryType.EVENT,
            metadata={"alert_id": "auth_timeout_critical"}
        )
        # 4 Duplicate alerts with slightly varied wording
        duplicates = [
            "The Auth service just went down with a Timeout error.",
            "Auth service outage reported: request timeout error encountered.",
            "The Auth service is down due to a Timeout error.",
            "Alert: Auth service timed out and is currently down."
        ]
        for dup in duplicates:
            ctx.store.add_memory(
                content=dup,
                memory_type=MemoryType.EVENT,
                metadata={"alert_id": "auth_timeout_duplicate"}
            )
        # Metric distractors
        for t in [371, 404, 424, 450]:
            ctx.store.add_memory(
                content=f"Normal traffic on Auth is {t} requests/sec.",
                memory_type=MemoryType.FACT,
                metadata={"source": "traffic_monitor"}
            )

# Initial seed
seed_default_memories(GLOBAL_CTX, "recency_conflict")

@app.get("/api/memories")
def get_memories():
    now = time.time()
    selector = GreedyTokenSelector()
    
    memories_list = []
    for faiss_id, mem in GLOBAL_CTX.store._memories.items():
        tokens = selector._count_tokens(mem.content)
        memories_list.append({
            "id": mem.id,
            "faiss_id": faiss_id,
            "type": mem.type.value,
            "content": mem.content,
            "timestamp": mem.timestamp,
            "time_ago": format_time_ago(mem.timestamp, now),
            "tokens": tokens,
            "metadata": mem.metadata
        })
    
    # Sort newest first
    memories_list.sort(key=lambda m: m["timestamp"], reverse=True)
    return {"total": len(memories_list), "memories": memories_list}

@app.post("/api/memories")
def add_memory(req: AddMemoryRequest):
    try:
        mem_type = MemoryType(req.type.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid type: {req.type}. Must be FACT, DECISION, PREFERENCE, or EVENT.")
    
    GLOBAL_CTX.add(req.content, type=mem_type.value)
    
    # If custom timestamp provided
    if req.timestamp is not None:
        last_id = GLOBAL_CTX.store._next_faiss_id - 1
        GLOBAL_CTX.store._memories[last_id].timestamp = req.timestamp
        
    return {"status": "success", "message": "Memory added successfully"}

@app.post("/api/seed_preset")
def seed_preset(req: SeedPresetRequest):
    if req.preset_name not in ["recency_conflict", "multi_hop", "redundancy_incident"]:
        raise HTTPException(status_code=400, detail="Invalid preset name.")
    seed_default_memories(GLOBAL_CTX, req.preset_name)
    return {"status": "success", "preset": req.preset_name, "total_memories": len(GLOBAL_CTX.store._memories)}

@app.post("/api/query")
def run_query(req: QueryRequest):
    now = time.time()
    selector = GreedyTokenSelector()
    
    # 1. Search candidates
    candidates = GLOBAL_CTX.store.search(req.query, top_k=100)
    if not candidates:
        return {
            "context_text": "",
            "llm_answer": "No memories found in store.",
            "tokens_used": 0,
            "budget_limit": req.max_tokens,
            "budget_progression": [],
            "candidates_trace": [],
            "vector_rag": {"tokens_used": 0, "memories": [], "context_text": ""}
        }
        
    # 2. Score candidates
    scored = GLOBAL_CTX.pipeline.score_candidates(candidates, current_time=now)
    
    # Sort deterministically
    scored.sort(
        key=lambda sm: (sm.final_score, sm.memory.timestamp, sm.memory.id), 
        reverse=True
    )
    
    # 3. Deduplication with rich trace
    kept: List[ScoredMemory] = []
    dedup_info: Dict[str, Dict[str, Any]] = {} # id -> {similar_to_id, similar_to_content, similarity}
    
    for current in scored:
        is_redundant = False
        current_emb = np.array(current.memory.embedding)
        
        for kept_item in kept:
            kept_emb = np.array(kept_item.memory.embedding)
            sim = float(np.dot(current_emb, kept_emb))
            
            if sim >= GLOBAL_CTX.pipeline.redundancy_threshold:
                is_redundant = True
                dedup_info[current.memory.id] = {
                    "similar_to_id": kept_item.memory.id,
                    "similar_to_content": kept_item.memory.content,
                    "similarity": round(sim, 3)
                }
                break
                
        if not is_redundant:
            kept.append(current)
            
    # 4. Greedy Selection with step progression
    # Calculate density on kept memories
    density_ranked = []
    for sm in kept:
        toks = selector._count_tokens(sm.memory.content)
        density = sm.final_score / max(1, toks)
        density_ranked.append({
            "scored_memory": sm,
            "tokens": toks,
            "density": density
        })
        
    density_ranked.sort(
        key=lambda item: (item["density"], item["scored_memory"].memory.timestamp, item["scored_memory"].memory.id),
        reverse=True
    )
    
    # Budget accumulation
    running_tokens = 0
    selected_memories = []
    allocation_status: Dict[str, Dict[str, Any]] = {}
    budget_progression = []
    
    for rank_idx, item in enumerate(density_ranked):
        sm = item["scored_memory"]
        toks = item["tokens"]
        
        if running_tokens + toks <= req.max_tokens:
            running_tokens += toks
            selected_memories.append(sm.memory)
            allocation_status[sm.memory.id] = {
                "status": "INCLUDED",
                "rank": rank_idx + 1,
                "token_cost": toks,
                "cumulative_tokens": running_tokens
            }
            budget_progression.append({
                "step": rank_idx + 1,
                "memory_id": sm.memory.id,
                "content": sm.memory.content,
                "tokens_added": toks,
                "cumulative_tokens": running_tokens,
                "percentage_used": round((running_tokens / req.max_tokens) * 100, 1),
                "status": "INCLUDED"
            })
        else:
            allocation_status[sm.memory.id] = {
                "status": "CUT_BY_BUDGET",
                "rank": rank_idx + 1,
                "token_cost": toks,
                "remaining_budget": req.max_tokens - running_tokens
            }
            budget_progression.append({
                "step": rank_idx + 1,
                "memory_id": sm.memory.id,
                "content": sm.memory.content,
                "tokens_added": toks,
                "cumulative_tokens": running_tokens,
                "percentage_used": round((running_tokens / req.max_tokens) * 100, 1),
                "status": "CUT_BY_BUDGET"
            })
            
    # Assemble final context
    context_text = "\n".join([m.content for m in selected_memories])
    
    # 5. Build unified candidate trace for UI
    candidates_trace = []
    for sm in scored:
        mid = sm.memory.id
        toks = selector._count_tokens(sm.memory.content)
        density = sm.final_score / max(1, toks)
        
        if mid in allocation_status:
            status_data = allocation_status[mid]
            status = status_data["status"]
            status_detail = (
                f"Rank #{status_data['rank']} • {toks} tokens" if status == "INCLUDED" 
                else f"Exceeds remaining budget ({toks}t > {status_data['remaining_budget']}t left)"
            )
            sim_info = None
        elif mid in dedup_info:
            status = "DEDUPLICATED"
            sim_info = dedup_info[mid]
            status_detail = f"Similar to '{sim_info['similar_to_content'][:30]}...' ({int(sim_info['similarity']*100)}% match)"
        else:
            status = "BELOW_THRESHOLD"
            status_detail = "Filtered out before selection"
            sim_info = None
            
        candidates_trace.append({
            "id": mid,
            "type": sm.memory.type.value,
            "content": sm.memory.content,
            "timestamp": sm.memory.timestamp,
            "time_ago": format_time_ago(sm.memory.timestamp, now),
            "relevance": round(sm.relevance, 4),
            "recency": round(sm.recency, 4),
            "final_score": round(sm.final_score, 4),
            "tokens": toks,
            "score_density": round(density, 5),
            "status": status,
            "status_detail": status_detail,
            "dedup_match": sim_info
        })
        
    # Sort candidates_trace: INCLUDED first, then CUT_BY_BUDGET, then DEDUPLICATED, then BELOW_THRESHOLD
    status_order = {"INCLUDED": 1, "CUT_BY_BUDGET": 2, "DEDUPLICATED": 3, "BELOW_THRESHOLD": 4}
    candidates_trace.sort(key=lambda c: (status_order.get(c["status"], 5), -c["final_score"]))
    
    # 6. Run Vector RAG baseline for comparison
    rag_memories = get_vector_rag(GLOBAL_CTX.store, req.query, req.max_tokens)
    rag_tokens = sum(selector._count_tokens(m.content) for m in rag_memories)
    rag_context = "\n".join([m.content for m in rag_memories])
    
    vector_rag_data = {
        "tokens_used": rag_tokens,
        "memories_count": len(rag_memories),
        "context_text": rag_context,
        "memories": [
            {
                "id": m.id,
                "type": m.type.value,
                "content": m.content,
                "tokens": selector._count_tokens(m.content),
                "time_ago": format_time_ago(m.timestamp, now)
            }
            for m in rag_memories
        ]
    }
    
    # 7. Generate real LLM answer if enabled
    llm_answer = ""
    if req.generate_llm:
        if os.environ.get("GROQ_API_KEY"):
            try:
                system_prompt = f"""You are a helpful assistant. Answer the user's question using ONLY the provided context. If the context does not contain the answer, say 'I don't have enough context in memory to answer that.'

Context:
{context_text}"""
                response = litellm.completion(
                    model="custom_openai/openai/gpt-oss-120b",
                    api_base="https://api.groq.com/openai/v1",
                    api_key=os.environ.get("GROQ_API_KEY"),
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": req.query}
                    ],
                    temperature=0.0
                )
                llm_answer = response.choices[0].message.content
            except Exception as e:
                llm_answer = f"[LLM generation notice: {str(e)}]\n\nContext assembled:\n{context_text}"
        else:
            llm_answer = f"[Note: GROQ_API_KEY not set in .env. Showing assembled context directly]:\n\n{context_text}"
            
    return {
        "query": req.query,
        "budget_limit": req.max_tokens,
        "tokens_used": running_tokens,
        "token_reduction_pct": round((1.0 - (running_tokens / max(1, sum(selector._count_tokens(m.content) for m in GLOBAL_CTX.store._memories.values())))) * 100, 1) if GLOBAL_CTX.store._memories else 0,
        "context_text": context_text,
        "llm_answer": llm_answer,
        "budget_progression": budget_progression,
        "candidates_trace": candidates_trace,
        "vector_rag": vector_rag_data
    }

@app.get("/api/benchmark")
def get_benchmark_data():
    eval_csv_path = "eval_results.csv"
    sweep_csv_path = "budget_sweep_results.csv"
    
    eval_data = []
    if os.path.exists(eval_csv_path):
        df_eval = pd.read_csv(eval_csv_path)
        eval_data = df_eval.to_dict(orient="records")
        
    sweep_data = []
    if os.path.exists(sweep_csv_path):
        df_sweep = pd.read_csv(sweep_csv_path)
        sweep_data = df_sweep.to_dict(orient="records")
        
    return {
        "eval_results": eval_data,
        "budget_sweep": sweep_data,
        "dataset_metadata": {
            "samples_count": 30,
            "avg_required_needles": 1.33,
            "multihop_samples": 10,
            "half_life_hours": 168.0
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
