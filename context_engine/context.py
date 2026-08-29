import time
from typing import Optional, Dict
from .models import MemoryType, Memory
from .store import MemoryStore
from .pipeline import ScoringPipeline
from .selector import GreedyTokenSelector

class Context:
    def __init__(self, user_id: str):
        self.user_id = user_id
        
        # Instantiate internals. In a full system, these might be injected or configured.
        self.store = MemoryStore()
        self.pipeline = ScoringPipeline()
        self.selector = GreedyTokenSelector()
        
    def add(self, memory_text: str, type: str) -> None:
        """
        Developer-facing API to add a memory.
        """
        try:
            mem_type = MemoryType(type)
        except ValueError:
            raise ValueError(f"Invalid memory type: {type}. Must be one of {[m.value for m in MemoryType]}")
            
        metadata = {"user_id": self.user_id}
        self.store.add_memory(content=memory_text, memory_type=mem_type, metadata=metadata)
        
    def build(self, query: str, max_tokens: int = 8000) -> str:
        """
        Developer-facing API to build the context for a query under a token budget.
        """
        # 1. Retrieve top-k broad candidates from the vector store
        # 100 is a reasonable candidate pool size for a strict budget.
        candidates = self.store.search(query, top_k=100)
        
        # 2. Score and deduplicate candidates
        scored_memories = self.pipeline.run(candidates)
        
        # 3. Apply greedy token-budget selection
        selected_memories = self.selector.select(scored_memories, max_tokens)
        
        # 4. Format into a single string for the LLM
        formatted_context = "\n".join([sm.memory.content for sm in selected_memories])
        return formatted_context
