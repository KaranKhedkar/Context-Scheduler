import sys
import os
import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from eval.dataset import generate_dataset
from eval.baselines import get_full_history, get_naive_truncation, get_vector_rag
from eval.metrics import compute_metrics, llm_as_judge
from context_engine.store import MemoryStore
from context_engine.context import Context

# Load environment variables (for GROQ_API_KEY)
load_dotenv()

import argparse

def run_evaluation(seed: int = 42):
    print(f"Generating dataset (seed={seed})...")
    dataset = generate_dataset(n_samples=30, seed=seed)
    
    results = []
    
    for i, sample in enumerate(dataset):
        print(f"\n--- Evaluating Sample {i+1} ---")
        
        # 1. Setup Data
        store = MemoryStore()
        ctx = Context(user_id="eval_user")
        
        # Populate stores
        for m_data in sample.memories:
            # We bypass the Context API slightly here to inject exact timestamps for testing
            memory_id = m_data["id"]
            embedding = store.model.encode([m_data["content"]], convert_to_numpy=True)
            embedding = store._normalize(embedding)
            
            store.index.add(embedding)
            
            from context_engine.models import Memory, MemoryType
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
            
            # Populate Context Engine's internal store
            ctx.store._memories = dict(store._memories)
            ctx.store._next_faiss_id = store._next_faiss_id
            # Rebuild index for ctx to be identical
            ctx.store.index.reset()
            for faiss_id, mem in ctx.store._memories.items():
                ctx.store.index.add(np.array([mem.embedding], dtype=np.float32))
                
        max_tokens = 50 # deliberately small budget to force selection
        
        # We need full history tokens for baseline reduction metric
        full_history_memories = get_full_history(store)
        from context_engine.selector import GreedyTokenSelector
        selector = GreedyTokenSelector()
        full_history_tokens = sum(selector._count_tokens(m.content) for m in full_history_memories)
        
        # --- Baseline 1: Full History ---
        t0 = time.time()
        mems_full = full_history_memories
        t_full = time.time() - t0
        metrics_full = compute_metrics(mems_full, sample.required_memory_ids, full_history_tokens)
        context_text_full = "\n".join([m.content for m in mems_full])
        acc_full = llm_as_judge(sample.query, context_text_full, sample.expected_answer)
        
        results.append({
            "Sample": i+1,
            "Method": "Full History",
            "Precision": metrics_full["precision"],
            "Recall": metrics_full["recall"],
            "Token Reduction": metrics_full["token_reduction"],
            "Accuracy": acc_full,
            "Latency (s)": t_full,
            "Engine Overhead (s)": 0.0
        })

        # --- Baseline 2: Naive Truncation ---
        t0 = time.time()
        mems_naive = get_naive_truncation(store, max_tokens)
        t_naive = time.time() - t0
        metrics_naive = compute_metrics(mems_naive, sample.required_memory_ids, full_history_tokens)
        context_text_naive = "\n".join([m.content for m in mems_naive])
        acc_naive = llm_as_judge(sample.query, context_text_naive, sample.expected_answer)
        
        results.append({
            "Sample": i+1,
            "Method": "Naive Truncation",
            "Precision": metrics_naive["precision"],
            "Recall": metrics_naive["recall"],
            "Token Reduction": metrics_naive["token_reduction"],
            "Accuracy": acc_naive,
            "Latency (s)": t_naive,
            "Engine Overhead (s)": 0.0
        })
        
        # --- Baseline 3: Vector RAG ---
        t0 = time.time()
        mems_rag = get_vector_rag(store, sample.query, max_tokens)
        t_rag = time.time() - t0
        metrics_rag = compute_metrics(mems_rag, sample.required_memory_ids, full_history_tokens)
        context_text_rag = "\n".join([m.content for m in mems_rag])
        acc_rag = llm_as_judge(sample.query, context_text_rag, sample.expected_answer)
        
        results.append({
            "Sample": i+1,
            "Method": "Vector RAG",
            "Precision": metrics_rag["precision"],
            "Recall": metrics_rag["recall"],
            "Token Reduction": metrics_rag["token_reduction"],
            "Accuracy": acc_rag,
            "Latency (s)": t_rag,
            "Engine Overhead (s)": 0.0
        })
        
        # --- Method 4: Context Engine ---
        # Measure overhead separately
        t0 = time.time()
        candidates = ctx.store.search(sample.query, top_k=100)
        t_retrieve = time.time() - t0
        
        t1 = time.time()
        scored = ctx.pipeline.run(candidates)
        selected = ctx.selector.select(scored, max_tokens)
        mems_ce = [sm.memory for sm in selected]
        t_overhead = time.time() - t1
        
        t_ce_total = t_retrieve + t_overhead
        metrics_ce = compute_metrics(mems_ce, sample.required_memory_ids, full_history_tokens)
        context_text_ce = "\n".join([m.content for m in mems_ce])
        acc_ce = llm_as_judge(sample.query, context_text_ce, sample.expected_answer)
        
        results.append({
            "Sample": i+1,
            "Method": "Context Engine",
            "Precision": metrics_ce["precision"],
            "Recall": metrics_ce["recall"],
            "Token Reduction": metrics_ce["token_reduction"],
            "Accuracy": acc_ce,
            "Latency (s)": t_ce_total,
            "Engine Overhead (s)": t_overhead
        })

    # Summarize Results
    df = pd.DataFrame(results)
    summary = df.groupby("Method").agg({
        "Sample": "count",
        "Precision": "mean",
        "Recall": "mean",
        "Token Reduction": "mean",
        "Accuracy": "mean",
        "Latency (s)": "mean",
        "Engine Overhead (s)": "mean"
    }).rename(columns={"Sample": "N"}).reset_index()
    
    print("\n\n=== EVALUATION RESULTS ===")
    
    # Dataset statistics
    n_samples = len(dataset)
    total_required = sum(len(s.required_memory_ids) for s in dataset)
    avg_required = total_required / max(1, n_samples)
    multi_hop_count = sum(1 for s in dataset if len(s.required_memory_ids) > 1)
    
    print(f"Dataset Size (N): {n_samples}")
    print(f"Average required memories per question: {avg_required:.2f}")
    print(f"Multi-hop questions (required > 1): {multi_hop_count}")
    print("\n--- Exact LLM-as-Judge Prompt (Pass 1) ---")
    print("You are evaluating a Retrieval-Augmented Generation system.")
    print("Based ONLY on the provided Context, answer the Query.")
    print("If the Context does not contain the answer, reply with 'INSUFFICIENT_CONTEXT'.")
    print("------------------------------------------\n")
    print("\n--- Exact LLM-as-Judge Prompt (Pass 2) ---")
    print("You are an impartial judge. Evaluate if the Actual Answer matches the semantic intent of the Expected Answer.")
    print("Ignore minor phrasing differences. Focus on whether the core facts are correct.")
    print("Reply with EXACTLY ONE WORD: 'YES' if it matches, 'NO' if it does not.")
    print("------------------------------------------\n")
    
    print(summary.to_string(index=False))
    
    # Save to CSV
    summary.to_csv("eval_results.csv", index=False)
    
    # Generate Chart
    plt.figure(figsize=(10, 6))
    
    methods = summary["Method"]
    x = range(len(methods))
    
    plt.bar([pos - 0.2 for pos in x], summary["Precision"], width=0.2, label='Precision', color='blue')
    plt.bar([pos for pos in x], summary["Recall"], width=0.2, label='Recall', color='green')
    plt.bar([pos + 0.2 for pos in x], summary["Token Reduction"], width=0.2, label='Token Reduction', color='orange')
    
    plt.xticks(x, methods)
    plt.ylabel('Score')
    plt.title('Context Selection Performance by Method')
    plt.legend()
    plt.ylim(0, 1.1)
    
    plt.savefig('eval_chart.png')
    print("\nSaved chart to eval_chart.png")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Context Engine Evaluations")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for synthetic dataset generation")
    args = parser.parse_args()
    
    if not os.environ.get("GROQ_API_KEY"):
        print("WARNING: GROQ_API_KEY is not set. LLM Accuracy will be reported as 0.")
    run_evaluation(seed=args.seed)
