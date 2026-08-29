from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, Any, Optional
import time

class MemoryType(Enum):
    FACT = "FACT"
    DECISION = "DECISION"
    PREFERENCE = "PREFERENCE"
    EVENT = "EVENT"

@dataclass
class Memory:
    id: str
    type: MemoryType
    content: str
    embedding: list[float]
    timestamp: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)
