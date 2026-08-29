import uuid
import time
import random
from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class EvalSample:
    query: str
    memories: List[Dict[str, Any]]
    required_memory_ids: List[str]
    expected_answer: str

def generate_multi_hop_sample(t_base: float, index: int) -> EvalSample:
    needle_id_1 = str(uuid.uuid4())
    needle_id_2 = str(uuid.uuid4())
    
    projects = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa"]
    frameworks = ["React", "Vue", "Angular", "Svelte", "NextJS", "Nuxt", "Gatsby", "Remix", "Astro", "Solid"]
    
    project = projects[index % len(projects)]
    framework = frameworks[index % len(frameworks)]
    
    memories = [
        {"id": needle_id_1, "type": "FACT", "content": f"Project {project} requires a framework with strong server-side rendering support.", "timestamp": t_base},
        {"id": needle_id_2, "type": "DECISION", "content": f"We chose {framework} because it excels at server-side rendering.", "timestamp": t_base + 100},
    ]
    
    # Add distractors
    for i in range(15):
        memories.append({
            "id": str(uuid.uuid4()),
            "type": "FACT",
            "content": f"Server {i} CPU usage for Project {project} is at {random.randint(10,90)}%.",
            "timestamp": t_base + (i * 10)
        })
        
    # Near duplicate of needle 1
    memories.append({
        "id": str(uuid.uuid4()),
        "type": "FACT",
        "content": f"Strong SSR support is a hard requirement for Project {project}.",
        "timestamp": t_base + 200
    })
    
    return EvalSample(
        query=f"Why did we choose {framework} for Project {project}?",
        memories=memories,
        required_memory_ids=[needle_id_1, needle_id_2],
        expected_answer=f"We chose {framework} for Project {project} because the project requires strong server-side rendering support."
    )

def generate_recency_conflict_sample(t_base: float, index: int) -> EvalSample:
    needle_new = str(uuid.uuid4())
    needle_old = str(uuid.uuid4())
    
    names_old = ["Alice", "Bob", "Charlie", "David", "Eve"]
    names_new = ["Frank", "Grace", "Heidi", "Ivan", "Judy"]
    roles = ["Marketing", "Sales", "Engineering", "HR", "Design"]
    
    old_name = names_old[index % len(names_old)]
    new_name = names_new[index % len(names_new)]
    role = roles[index % len(roles)]
    
    memories = [
        # Old fact from 30 days ago (should NOT be in required_memory_ids)
        {"id": needle_old, "type": "PREFERENCE", "content": f"The primary contact for {role} is {old_name}.", "timestamp": t_base},
        # New fact that overrides it (recent, e.g. 29 days after t_base / 1 day ago)
        {"id": needle_new, "type": "EVENT", "content": f"{old_name} left the company. The new primary contact for {role} is {new_name}.", "timestamp": t_base + (86400 * 29)},
    ]
    
    # Add distractors distributed across the 30-day window
    for i in range(15):
        memories.append({
            "id": str(uuid.uuid4()),
            "type": "FACT",
            "content": f"The budget for {role} is ${random.randint(10,100)}k this quarter.",
            "timestamp": t_base + (i * 86400 * 1.8)
        })
        
    return EvalSample(
        query=f"Who should I contact for {role}?",
        memories=memories,
        required_memory_ids=[needle_new],
        expected_answer=f"You should contact {new_name}, as {old_name} has left the company."
    )

def generate_redundancy_sample(t_base: float, index: int) -> EvalSample:
    needle_id = str(uuid.uuid4())
    
    services = ["Auth", "Payment", "Notification", "Database", "Search"]
    errors = ["Timeout", "500 Internal", "OOM", "Connection Refused", "DNS Resolution"]
    
    service = services[index % len(services)]
    error = errors[index % len(errors)]
    
    # Best, highest scoring memory
    memories = [
        {"id": needle_id, "type": "EVENT", "content": f"The {service} service is down due to a {error} error.", "timestamp": t_base + 1000},
    ]
    
    # Add highly redundant, near identical memories that should be stripped
    for i in range(10):
        memories.append({
            "id": str(uuid.uuid4()),
            "type": "EVENT",
            "content": f"The {service} service just went down with a {error} error.",
            "timestamp": t_base + i
        })
        
    # Add distractors
    for i in range(15):
        memories.append({
            "id": str(uuid.uuid4()),
            "type": "FACT",
            "content": f"Normal traffic on {service} is {random.randint(100,500)} requests/sec.",
            "timestamp": t_base - (i * 100)
        })
        
    return EvalSample(
        query=f"Why is the {service} service down?",
        memories=memories,
        required_memory_ids=[needle_id],
        expected_answer=f"The {service} service is down due to a {error} error."
    )

def generate_dataset(n_samples: int = 30, seed: int = 42) -> List[EvalSample]:
    """
    Generates a synthetic dataset of N conversations containing:
    - Multi-hop reasoning
    - Recency conflicts
    - Redundancy overload
    """
    random.seed(seed)
    dataset = []
    base_time = time.time() - 86400 * 30 # 30 days ago
    
    samples_per_type = n_samples // 3
    
    for i in range(samples_per_type):
        dataset.append(generate_multi_hop_sample(base_time - i * 1000, i))
        
    for i in range(samples_per_type):
        dataset.append(generate_recency_conflict_sample(base_time - i * 1000, i))
        
    for i in range(samples_per_type):
        dataset.append(generate_redundancy_sample(base_time - i * 1000, i))
        
    random.shuffle(dataset)
    return dataset
