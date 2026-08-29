import sys
import os
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from eval.dataset import generate_dataset
from eval.baselines import get_full_history, get_naive_truncation, get_vector_rag
from eval.metrics import compute_metrics
from context_engine.store import MemoryStore
from context_engine.context import Context
from context_engine.models import Memory, MemoryType

def diagnose(seed: int = 123):
    dataset = generate_dataset(n_samples=30, seed=seed)
    max_tokens = 50
    
    print(f"Total samples: {len(dataset)} (seed={seed})")
    
    for i, sample in enumerate(dataset):
        store = MemoryStore()
        ctx = Context(user_id="eval_user")
        
        for m_data in sample.memories:
            memory_id = m_data["id"]
            embedding = store.model.encode([m_data["content"]], convert_to_numpy=True)
            embedding = store._normalize(embedding)
            store.index.add(embedding)
            
            memory = Memory(
                id=memory_id,
                type=MemoryType(m_data["type"]),
                content=m_data["content"],
                embedding=embedding[0].tolist(),
                timestamp=m_data["timestamp"],
                metadata={}
            )
            store._memories[store._next_faiss_id] = memory
            store._next_faiss_id += 1
            
        ctx.store._memories = dict(store._memories)
        ctx.store._next_faiss_id = store._next_faiss_id
        ctx.store.index.reset()
        for faiss_id, mem in ctx.store._memories.items():
            ctx.store.index.add(np.array([mem.embedding], dtype=np.float32))
            
        # 1. Vector RAG
        mems_rag = get_vector_rag(store, sample.query, max_tokens)
        metrics_rag = compute_metrics(mems_rag, sample.required_memory_ids, 1000)
        
        # 2. Context Engine
        candidates = ctx.store.search(sample.query, top_k=100)
        scored = ctx.pipeline.run(candidates)
        selected = ctx.selector.select(scored, max_tokens)
        mems_ce = [sm.memory for sm in selected]
        metrics_ce = compute_metrics(mems_ce, sample.required_memory_ids, 1000)
        
        ce_missed = set(sample.required_memory_ids) - set(m.id for m in mems_ce)
        rag_missed = set(sample.required_memory_ids) - set(m.id for m in mems_rag)
        
        if metrics_ce["recall"] < 1.0 or metrics_rag["recall"] < 1.0:
            print(f"\n=======================================================")
            print(f"SAMPLE {i+1}: {sample.query}")
            print(f"Expected: {sample.expected_answer}")
            print(f"Required IDs: {sample.required_memory_ids}")
            print(f"CE Recall: {metrics_ce['recall']:.2f}, RAG Recall: {metrics_rag['recall']:.2f}")
            
            if ce_missed:
                print(f"--> Context Engine MISSED {len(ce_missed)} required memories:")
                for mid in ce_missed:
                    target_mem = next(m for m in sample.memories if m["id"] == mid)
                    print(f"    Missing ID: {mid}")
                    print(f"    Content: '{target_mem['content']}' (Type: {target_mem['type']})")
                    
                    in_cand = any(c[0].id == mid for c in candidates)
                    in_scored = any(sm.memory.id == mid for sm in scored)
                    print(f"    In FAISS Candidates (top 100): {in_cand}")
                    print(f"    Survived Deduplication: {in_scored}")
                    
                    if in_scored:
                        sm = next(sm for sm in scored if sm.memory.id == mid)
                        rank = [s.memory.id for s in scored].index(mid) + 1
                        toks = ctx.selector._count_tokens(sm.memory.content)
                        print(f"    Score: {sm.final_score:.4f} (Relevance: {sm.relevance:.4f}, Recency: {sm.recency:.4f})")
                        print(f"    Tokens: {toks}, Density (Score/Token): {sm.final_score/toks:.6f}, Rank: {rank}/{len(scored)}")
                    else:
                        # Find why it was deduplicated
                        print("    [!] Dropped during pairwise deduplication!")
                        
            print(f"\n--> Context Engine Selected ({len(mems_ce)} memories, {sum(ctx.selector._count_tokens(m.content) for m in mems_ce)} tokens / {max_tokens} max):")
            for sm in selected:
                is_req = sm.memory.id in sample.required_memory_ids
                toks = ctx.selector._count_tokens(sm.memory.content)
                print(f"    [{'REQ' if is_req else 'NON'}] (tokens: {toks}, score: {sm.final_score:.4f}) {sm.memory.content}")
                
            print(f"\n--> Vector RAG Selected ({len(mems_rag)} memories):")
            for m in mems_rag:
                is_req = m.id in sample.required_memory_ids
                print(f"    [{'REQ' if is_req else 'NON'}] {m.content}")

if __name__ == "__main__":
    diagnose()
