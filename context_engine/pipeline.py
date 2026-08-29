import math
import time
import numpy as np
from typing import List, Tuple, Dict
from dataclasses import dataclass
from .models import Memory

@dataclass
class ScoredMemory:
    memory: Memory
    relevance: float
    recency: float
    final_score: float

class ScoringPipeline:
    def __init__(
        self,
        relevance_weight: float = 0.7,
        recency_weight: float = 0.3,
        half_life_hours: float = 168.0,
        redundancy_threshold: float = 0.90
    ):
        self.relevance_weight = relevance_weight
        self.recency_weight = recency_weight
        self.half_life_seconds = half_life_hours * 3600
        self.redundancy_threshold = redundancy_threshold
        
    def _calculate_recency(self, timestamp: float, current_time: float) -> float:
        """
        Exponential time-decay function.
        Score is 1.0 at current_time, and 0.5 at current_time - half_life_seconds.
        """
        age = max(0, current_time - timestamp)
        # N(t) = N_0 * (1/2)^(t / t_half)
        return math.pow(0.5, age / self.half_life_seconds)

    def score_candidates(
        self, 
        candidates: List[Tuple[Memory, float]], 
        current_time: float = None
    ) -> List[ScoredMemory]:
        """
        Scores candidates based on relevance (from vector search) and recency.
        """
        if current_time is None:
            current_time = time.time()
            
        scored_memories = []
        for memory, relevance in candidates:
            # relevance is already cosine similarity [0, 1] from FAISS
            recency = self._calculate_recency(memory.timestamp, current_time)
            
            final_score = (
                self.relevance_weight * relevance + 
                self.recency_weight * recency
            )
            
            scored_memories.append(ScoredMemory(
                memory=memory,
                relevance=relevance,
                recency=recency,
                final_score=final_score
            ))
            
        return scored_memories

    def deduplicate(self, scored_memories: List[ScoredMemory]) -> List[ScoredMemory]:
        """
        Drops near-duplicate memories before final selection.
        
        Deterministic Deduplication Rule:
        When two memories exceed the pairwise similarity threshold:
        1. Keep the one with the higher individual final_score.
        2. If scores are exactly equal, keep the one with the more recent timestamp.
        3. If timestamps are exactly equal, keep the one with the lexicographically smaller ID.
        """
        # Sort memories deterministically to ensure stable deduplication:
        # Highest score first, then newest, then smallest ID.
        scored_memories.sort(
            key=lambda sm: (sm.final_score, sm.memory.timestamp, sm.memory.id), 
            reverse=True
        )
        
        # We need to compute pairwise cosine similarities. 
        # For small candidate sets (e.g. top 100), computing this pairwise is O(N^2) which is cheap.
        kept = []
        for current in scored_memories:
            is_redundant = False
            current_emb = np.array(current.memory.embedding)
            
            for kept_item in kept:
                kept_emb = np.array(kept_item.memory.embedding)
                # Compute cosine similarity
                similarity = np.dot(current_emb, kept_emb)
                
                if similarity >= self.redundancy_threshold:
                    # Current is redundant. Since we sorted by (score, timestamp) descending,
                    # the kept_item is guaranteed to be better or equal deterministically.
                    is_redundant = True
                    break
                    
            if not is_redundant:
                kept.append(current)
                
        return kept

    def run(self, candidates: List[Tuple[Memory, float]]) -> List[ScoredMemory]:
        scored = self.score_candidates(candidates)
        deduplicated = self.deduplicate(scored)
        return deduplicated
