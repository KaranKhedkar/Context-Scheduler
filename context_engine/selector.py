import tiktoken
from typing import List
from .pipeline import ScoredMemory

class GreedyTokenSelector:
    def __init__(self, tokenizer_name: str = "cl100k_base"):
        # We use tiktoken for fast and accurate token counting (standard for GPT models).
        # This can be swapped for a HuggingFace tokenizer if desired.
        self.tokenizer = tiktoken.get_encoding(tokenizer_name)
        
    def _count_tokens(self, text: str) -> int:
        return len(self.tokenizer.encode(text))

    def select(self, candidates: List[ScoredMemory], max_tokens: int) -> List[ScoredMemory]:
        """
        Greedy token-budget selection heuristic.
        Ranks candidates by (score / token_count) and selects until the budget is filled.
        Not an exact knapsack solve (which is NP-hard), but a greedy approximation.
        """
        # Calculate token counts and value density
        memory_stats = []
        for sm in candidates:
            tokens = self._count_tokens(sm.memory.content)
            if tokens == 0:
                continue
            
            density = sm.final_score / tokens
            memory_stats.append({
                "scored_memory": sm,
                "tokens": tokens,
                "density": density
            })
            
        # Rank by score density descending
        memory_stats.sort(key=lambda x: x["density"], reverse=True)
        
        selected = []
        current_tokens = 0
        
        for stat in memory_stats:
            if current_tokens + stat["tokens"] <= max_tokens:
                selected.append(stat["scored_memory"])
                current_tokens += stat["tokens"]
                
        # Optional: sorting selected memories back to chronological order might be useful for LLM context,
        # but the prompt didn't explicitly request it. We return them as ranked.
        # Actually, for an LLM prompt, chronologically ordering the selected facts often improves accuracy.
        # I'll sort them chronologically before returning.
        selected.sort(key=lambda sm: sm.memory.timestamp)
        
        return selected
