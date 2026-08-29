from typing import List, Tuple
from context_engine.store import MemoryStore
from context_engine.models import Memory
from context_engine.selector import GreedyTokenSelector

def get_full_history(store: MemoryStore) -> List[Memory]:
    """Returns all memories in chronological order."""
    memories = store.get_all_memories()
    memories.sort(key=lambda m: m.timestamp)
    return memories

def get_naive_truncation(store: MemoryStore, max_tokens: int) -> List[Memory]:
    """
    Retrieves memories in chronological order (newest first), 
    until max_tokens is reached, then reverses them to chronological.
    """
    memories = store.get_all_memories()
    memories.sort(key=lambda m: m.timestamp, reverse=True)
    
    selector = GreedyTokenSelector()
    
    selected = []
    current_tokens = 0
    for m in memories:
        tokens = selector._count_tokens(m.content)
        if current_tokens + tokens <= max_tokens:
            selected.append(m)
            current_tokens += tokens
            
    # Reverse to chronological
    selected.reverse()
    return selected

def get_vector_rag(store: MemoryStore, query: str, max_tokens: int) -> List[Memory]:
    """
    Plain similarity search. Retrieves top-K from vector store,
    then fills budget. No deduplication, no recency decay.
    """
    # Get a lot of candidates just in case they are small
    candidates = store.search(query, top_k=100)
    
    # Sort just by relevance (FAISS already returns sorted by relevance, but we'll ensure)
    candidates.sort(key=lambda x: x[1], reverse=True)
    
    selector = GreedyTokenSelector()
    
    selected = []
    current_tokens = 0
    for m, score in candidates:
        tokens = selector._count_tokens(m.content)
        if current_tokens + tokens <= max_tokens:
            selected.append(m)
            current_tokens += tokens
            
    # Chronological sort for context
    selected.sort(key=lambda m: m.timestamp)
    return selected
