import os
import time
import litellm
import numpy as np
from context_engine.selector import GreedyTokenSelector

def compute_metrics(retrieved_memories, required_ids, full_history_tokens):
    retrieved_ids = [m.id for m in retrieved_memories]
    retrieved_set = set(retrieved_ids)
    required_set = set(required_ids)
    
    if not retrieved_set:
        precision = 0.0
    else:
        true_positives = len(retrieved_set.intersection(required_set))
        precision = true_positives / len(retrieved_set)
        
    if not required_set:
        recall = 1.0
    else:
        true_positives = len(retrieved_set.intersection(required_set))
        recall = true_positives / len(required_set)
        
    selector = GreedyTokenSelector()
    retrieved_tokens = sum(selector._count_tokens(m.content) for m in retrieved_memories)
    
    if full_history_tokens > 0:
        reduction = 1.0 - (retrieved_tokens / full_history_tokens)
    else:
        reduction = 0.0
        
    return {
        "precision": precision,
        "recall": recall,
        "token_reduction": reduction
    }

def llm_as_judge(query: str, context_text: str, expected_answer: str, model: str = "custom_openai/openai/gpt-oss-120b") -> float:
    """
    Returns 1.0 if the LLM using the context correctly answers the query,
    matching the semantic intent of the expected_answer. Returns 0.0 otherwise.
    Returns np.nan if the API call fails after max retries.
    """
    prompt = f"""
You are evaluating a Retrieval-Augmented Generation system.
Based ONLY on the provided Context, answer the Query.
If the Context does not contain the answer, reply with 'INSUFFICIENT_CONTEXT'.

Context:
{context_text}

Query:
{query}
"""
    
    max_retries = 3
    for attempt in range(max_retries):
        # Enforce rate limit (30 RPM limit -> ~2.1 seconds per request)
        time.sleep(2.1)
        
        try:
            # Pass 1: Generation
            response = litellm.completion(
                model="custom_openai/openai/gpt-oss-120b",
                api_base="https://api.groq.com/openai/v1",
                api_key=os.environ.get("GROQ_API_KEY"),
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0
            )
            llm_answer = response.choices[0].message.content
            
            if "INSUFFICIENT_CONTEXT" in llm_answer:
                return 0.0
                
            # Pass 2: Exact evaluation
            eval_prompt = f"""
You are an impartial judge. Evaluate if the Actual Answer matches the semantic intent of the Expected Answer.
Ignore minor phrasing differences. Focus on whether the core facts are correct.
Reply with EXACTLY ONE WORD: 'YES' if it matches, 'NO' if it does not.

Expected Answer: {expected_answer}
Actual Answer: {llm_answer}
"""
            time.sleep(2.1)
            eval_response = litellm.completion(
                model="custom_openai/openai/gpt-oss-120b",
                api_base="https://api.groq.com/openai/v1",
                api_key=os.environ.get("GROQ_API_KEY"),
                messages=[{"role": "user", "content": eval_prompt}],
                temperature=0.0
            )
            
            result = eval_response.choices[0].message.content.strip().upper()
            return 1.0 if "YES" in result else 0.0
            
        except Exception as e:
            print(f"LLM Judge error (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                print("Retrying in 10 seconds...")
                time.sleep(10)
            else:
                print("Max retries exhausted. Returning NaN for this sample.")
                
    return np.nan
