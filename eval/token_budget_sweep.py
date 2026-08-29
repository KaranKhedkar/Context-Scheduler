import sys
import os
import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from eval.dataset import generate_dataset
from eval.baselines import get_full_history, get_naive_truncation, get_vector_rag
from eval.metrics import compute_metrics
from context_engine.store import MemoryStore
from context_engine.context import Context
from context_engine.models import Memory, MemoryType
from context_engine.selector import GreedyTokenSelector

def run_token_budget_sweep(seed: int = 123):
    dataset = generate_dataset(n_samples=30, seed=seed)
    budgets = [25, 50, 75, 100, 150, 250, 500]
    selector = GreedyTokenSelector()
    
    print(f"Pre-encoding stores for {len(dataset)} samples (seed={seed})...")
    sample_stores = []
    
    for sample in dataset:
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
            
        full_history_memories = get_full_history(store)
        full_history_tokens = sum(selector._count_tokens(m.content) for m in full_history_memories)
        
        # Precompute search candidates
        candidates = ctx.store.search(sample.query, top_k=100)
        scored = ctx.pipeline.run(candidates)
        
        sample_stores.append({
            "sample": sample,
            "store": store,
            "ctx": ctx,
            "full_history_memories": full_history_memories,
            "full_history_tokens": full_history_tokens,
            "scored": scored
        })
        
    sweep_results = []
    print(f"\nRunning Token Budget Sweep across budgets: {budgets}")
    
    for b in budgets:
        ce_recalls, ce_precs, ce_reducs = [], [], []
        rag_recalls, rag_precs, rag_reducs = [], [], []
        naive_recalls, naive_precs, naive_reducs = [], [], []
        
        for item in sample_stores:
            sample = item["sample"]
            store = item["store"]
            ctx = item["ctx"]
            full_history_tokens = item["full_history_tokens"]
            scored = item["scored"]
            
            # 1. Naive Truncation
            mems_naive = get_naive_truncation(store, b)
            m_naive = compute_metrics(mems_naive, sample.required_memory_ids, full_history_tokens)
            naive_recalls.append(m_naive["recall"])
            naive_precs.append(m_naive["precision"])
            naive_reducs.append(m_naive["token_reduction"])
            
            # 2. Vector RAG
            mems_rag = get_vector_rag(store, sample.query, b)
            m_rag = compute_metrics(mems_rag, sample.required_memory_ids, full_history_tokens)
            rag_recalls.append(m_rag["recall"])
            rag_precs.append(m_rag["precision"])
            rag_reducs.append(m_rag["token_reduction"])
            
            # 3. Context Engine
            selected = ctx.selector.select(scored, b)
            mems_ce = [sm.memory for sm in selected]
            m_ce = compute_metrics(mems_ce, sample.required_memory_ids, full_history_tokens)
            ce_recalls.append(m_ce["recall"])
            ce_precs.append(m_ce["precision"])
            ce_reducs.append(m_ce["token_reduction"])
            
        sweep_results.append({
            "Budget": b,
            "CE_Recall": np.mean(ce_recalls),
            "CE_Precision": np.mean(ce_precs),
            "CE_Token_Reduction": np.mean(ce_reducs),
            "RAG_Recall": np.mean(rag_recalls),
            "RAG_Precision": np.mean(rag_precs),
            "RAG_Token_Reduction": np.mean(rag_reducs),
            "Naive_Recall": np.mean(naive_recalls),
            "Naive_Precision": np.mean(naive_precs),
            "Naive_Token_Reduction": np.mean(naive_reducs),
        })
        
    df = pd.DataFrame(sweep_results)
    print("\n=== TOKEN BUDGET SWEEP RESULTS (WITH 7-DAY RECENCY HALF-LIFE) ===")
    print(df.to_string(index=False))
    df.to_csv("budget_sweep_results.csv", index=False)
    
    # Generate Pareto Curve Chart
    plt.figure(figsize=(10, 6))
    plt.plot(df["Budget"], df["CE_Recall"], marker='o', label="Context Engine (Recall)", color='#10B981', linewidth=2.5)
    plt.plot(df["Budget"], df["RAG_Recall"], marker='s', label="Vector RAG (Recall)", color='#3B82F6', linewidth=2, linestyle='--')
    plt.plot(df["Budget"], df["Naive_Recall"], marker='^', label="Naive Truncation (Recall)", color='#EF4444', linewidth=1.5, linestyle=':')
    
    plt.title("Pareto Curve: Recall vs. Token Budget Constraint (7-Day Half-Life)", fontsize=14, fontweight='bold', pad=15)
    plt.xlabel("Token Budget (max_tokens)", fontsize=12)
    plt.ylabel("Recall (Coverage of Required Needles)", fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.6)
    plt.legend(fontsize=11, loc='lower right')
    plt.tight_layout()
    plt.savefig("budget_sweep_chart.png", dpi=300)
    print("\nSaved budget sweep chart to budget_sweep_chart.png")

if __name__ == "__main__":
    run_token_budget_sweep()
