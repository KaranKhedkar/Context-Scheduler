import uuid
import time
import faiss
import numpy as np
from typing import List, Dict, Optional, Tuple
from sentence_transformers import SentenceTransformer
from .models import Memory, MemoryType

_MODEL_CACHE = {}

class MemoryStore:
    def __init__(self, embedding_model_name: str = "all-MiniLM-L6-v2"):
        if embedding_model_name not in _MODEL_CACHE:
            _MODEL_CACHE[embedding_model_name] = SentenceTransformer(embedding_model_name)
        self.model = _MODEL_CACHE[embedding_model_name]
        # Using L2 distance is standard, but we want cosine similarity for relevance.
        # Cosine similarity is equivalent to inner product (IndexFlatIP) of normalized vectors.
        # all-MiniLM-L6-v2 outputs are normalized by default if we tell it to, but we'll normalize manually to be safe.
        embedding_dim = self.model.get_sentence_embedding_dimension()
        
        # IndexFlatIP calculates exact inner product
        self.index = faiss.IndexFlatIP(embedding_dim)
        
        # To map FAISS integer IDs back to our UUIDs
        self._memories: Dict[int, Memory] = {}
        self._next_faiss_id = 0
        
    def _normalize(self, vector: np.ndarray) -> np.ndarray:
        norm = np.linalg.norm(vector, axis=1, keepdims=True)
        # avoid division by zero
        norm = np.where(norm == 0, 1e-10, norm)
        return vector / norm

    def add_memory(self, content: str, memory_type: MemoryType, metadata: Optional[Dict] = None) -> str:
        memory_id = str(uuid.uuid4())
        timestamp = time.time()
        
        # Generate embedding
        embedding = self.model.encode([content], convert_to_numpy=True)
        embedding = self._normalize(embedding)
        
        # Add to FAISS
        self.index.add(embedding)
        
        # Create and store memory object
        memory = Memory(
            id=memory_id,
            type=memory_type,
            content=content,
            embedding=embedding[0].tolist(),
            timestamp=timestamp,
            metadata=metadata or {}
        )
        self._memories[self._next_faiss_id] = memory
        self._next_faiss_id += 1
        
        return memory_id
        
    def search(self, query: str, top_k: int = 100) -> List[Tuple[Memory, float]]:
        """
        Returns top_k nearest memories based on cosine similarity,
        along with their raw similarity score.
        """
        if self.index.ntotal == 0:
            return []
            
        query_embedding = self.model.encode([query], convert_to_numpy=True)
        query_embedding = self._normalize(query_embedding)
        
        # Actual search limit is min of requested k and total items
        k = min(top_k, self.index.ntotal)
        
        similarities, indices = self.index.search(query_embedding, k)
        
        results = []
        for i in range(k):
            idx = int(indices[0][i])
            if idx in self._memories:
                score = float(similarities[0][i])
                results.append((self._memories[idx], score))
                
        return results

    def get_all_memories(self) -> List[Memory]:
        """Returns all memories, useful for the baseline full-history retrieval."""
        return list(self._memories.values())
