"""Wolfram Alpha service for mathematical verification"""

import re
from typing import Optional, List, Dict
import wolframalpha
import xmltodict
from redis import Redis
import json
import hashlib

from app.config import settings
from app.models.doubt import WolframStep
from app.utils.exceptions import APIException


class WolframService:
    """Service for Wolfram Alpha API integration"""
    
    def __init__(self):
        """Initialize Wolfram service"""
        self._client: Optional[wolframalpha.Client] = None
        self._redis_client: Optional[Redis] = None
        self._cache_enabled = True
        self._cache_ttl = 86400  # 24 hours
        
        # Patterns for detecting numerical/mathematical questions
        self.math_patterns = [
            r'\d+\s*[\+\-\*/\^]\s*\d+',  # Basic arithmetic
            r'solve|calculate|compute|evaluate|find\s+the\s+value',  # Calculation keywords
            r'equation|integral|derivative|limit|summation',  # Calculus operations
            r'=\s*\?|\?\s*=',  # Equation with unknown
            r'\d+\s*x\s*\d+',  # Multiplication notation
            r'sin|cos|tan|log|ln|exp|sqrt',  # Mathematical functions
            r'd/dx|∫|∑|∏|lim',  # Mathematical symbols
            r'matrix|determinant|eigenvalue',  # Linear algebra
            r'differentiate|integrate',  # Calculus verbs
            r'plot|graph|visualize|draw',  # Graph/plot keywords
            r'x\^2|x\^3|y\s*=',  # Equations that might need graphs
        ]
    
    def _get_client(self) -> wolframalpha.Client:
        """Get or create Wolfram Alpha client"""
        if self._client is None:
            self._client = wolframalpha.Client(settings.wolfram_app_id)
        return self._client
    
    def _get_redis_client(self) -> Optional[Redis]:
        """Get or create Redis client for caching"""
        if not self._cache_enabled:
            return None
        
        if self._redis_client is None:
            try:
                self._redis_client = Redis(
                    host=settings.redis_host,
                    port=settings.redis_port,
                    password=settings.redis_password if settings.redis_password else None,
                    decode_responses=True,
                    socket_connect_timeout=2
                )
                # Test connection
                self._redis_client.ping()
            except Exception as e:
                print(f"Redis connection failed: {e}")
                self._cache_enabled = False
                return None
        
        return self._redis_client
    
    def _get_cache_key(self, query: str) -> str:
        """Generate cache key for query"""
        # Create hash of query for cache key
        query_hash = hashlib.md5(query.lower().strip().encode()).hexdigest()
        return f"wolfram:{query_hash}"
    
    def _get_cached_result(self, query: str) -> Optional[Dict]:
        """Get cached result for query"""
        try:
            redis_client = self._get_redis_client()
            if redis_client is None:
                return None
            
            cache_key = self._get_cache_key(query)
            cached = redis_client.get(cache_key)
            
            if cached:
                return json.loads(cached)
            
            return None
        except Exception as e:
            print(f"Cache retrieval error: {e}")
            return None
    
    def _cache_result(self, query: str, result: Dict):
        """Cache result for query"""
        try:
            redis_client = self._get_redis_client()
            if redis_client is None:
                return
            
            cache_key = self._get_cache_key(query)
            redis_client.setex(
                cache_key,
                self._cache_ttl,
                json.dumps(result)
            )
        except Exception as e:
            print(f"Cache storage error: {e}")
    
    def is_numerical_question(self, text: str) -> bool:
        """
        Detect if the question is numerical/mathematical
        
        Args:
            text: Question text
            
        Returns:
            True if numerical, False otherwise
        """
        text_lower = text.lower()
        
        for pattern in self.math_patterns:
            if re.search(pattern, text_lower):
                return True
        
        return False
    
    async def solve_math_problem(
        self,
        query: str,
        include_steps: bool = True
    ) -> Optional[Dict]:
        """
        Solve a math problem using Wolfram Alpha
        
        Args:
            query: Mathematical query
            include_steps: Whether to include step-by-step solution
            
        Returns:
            Dictionary with solution, steps, and metadata, or None if failed
        """
        try:
            # Check cache first
            cached_result = self._get_cached_result(query)
            if cached_result:
                return cached_result
            
            # Get Wolfram client
            client = self._get_client()
            if not client:
                print("Warning: Wolfram Alpha client not initialized")
                return None
            
            # Query Wolfram Alpha
            try:
                res = client.query(query)
            except Exception as query_error:
                print(f"Wolfram Alpha query error: {query_error}")
                return None
            
            # Parse response
            result = self._parse_wolfram_response(res, include_steps)
            
            if result:
                # Cache the result
                self._cache_result(query, result)
            
            return result
            
        except Exception as e:
            import traceback
            print(f"Wolfram Alpha error: {e}")
            print(f"Traceback: {traceback.format_exc()}")
            return None
    
    def _parse_wolfram_response(
        self,
        response,
        include_steps: bool = True
    ) -> Optional[Dict]:
        """
        Parse Wolfram Alpha response
        
        Args:
            response: Wolfram Alpha response object
            include_steps: Whether to include step-by-step solution
            
        Returns:
            Parsed result dictionary or None
        """
        try:
            result = {
                "answer": None,
                "steps": [],
                "input_interpretation": None,
                "plots": [],
                "metadata": {}
            }
            
            # Extract pods
            for pod in response.pods:
                pod_title = pod.title.lower()
                
                # Input interpretation
                if "input" in pod_title or "interpretation" in pod_title:
                    result["input_interpretation"] = self._extract_pod_text(pod)
                
                # Result/Answer
                elif any(keyword in pod_title for keyword in ["result", "solution", "answer", "value"]):
                    if result["answer"] is None:
                        result["answer"] = self._extract_pod_text(pod)
                
                # Step-by-step solution
                elif include_steps and any(keyword in pod_title for keyword in ["step", "solution", "possible intermediate"]):
                    steps_text = self._extract_pod_text(pod)
                    if steps_text:
                        result["steps"].append({
                            "title": pod.title,
                            "content": steps_text
                        })
                
                # Plots/Visualizations
                elif "plot" in pod_title or "graph" in pod_title or "visual" in pod_title:
                    for subpod in pod.subpods:
                        if hasattr(subpod, 'img') and subpod.img:
                            img_url = None
                            if hasattr(subpod.img, 'src'):
                                img_url = subpod.img.src
                            elif hasattr(subpod.img, 'url'):
                                img_url = subpod.img.url
                            
                            if img_url:
                                result["plots"].append({
                                    "title": pod.title,
                                    "url": img_url
                                })
            
            # Return None if no answer found
            if result["answer"] is None:
                return None
            
            return result
            
        except Exception as e:
            import traceback
            print(f"Response parsing error: {e}")
            print(f"Traceback: {traceback.format_exc()}")
            return None
    
    def _extract_pod_text(self, pod) -> Optional[str]:
        """Extract text from a Wolfram pod"""
        try:
            texts = []
            for subpod in pod.subpods:
                if hasattr(subpod, 'plaintext') and subpod.plaintext:
                    texts.append(subpod.plaintext)
            
            return "\n".join(texts) if texts else None
        except Exception:
            return None
    
    def format_steps_for_response(self, wolfram_result: Dict) -> List[WolframStep]:
        """
        Format Wolfram steps for DoubtResponse
        
        Args:
            wolfram_result: Parsed Wolfram result
            
        Returns:
            List of WolframStep objects
        """
        steps = []
        
        # Add input interpretation as first step
        if wolfram_result.get("input_interpretation"):
            steps.append(WolframStep(
                step_number=1,
                description="Problem Understanding",
                expression=wolfram_result["input_interpretation"],
                explanation="This is how Wolfram Alpha interpreted your question."
            ))
        
        # Add solution steps
        step_offset = len(steps)
        for idx, step_data in enumerate(wolfram_result.get("steps", [])):
            steps.append(WolframStep(
                step_number=step_offset + idx + 1,
                description=step_data.get("title", f"Step {idx + 1}"),
                expression=step_data.get("content", ""),
                explanation=None
            ))
        
        # Add final answer
        if wolfram_result.get("answer"):
            steps.append(WolframStep(
                step_number=len(steps) + 1,
                description="Final Answer",
                expression=wolfram_result["answer"],
                explanation="This is the final result."
            ))
        
        return steps
    
    async def verify_numerical_answer(
        self,
        question: str,
        student_answer: str,
        tolerance: float = 0.01
    ) -> Dict:
        """
        Verify a student's numerical answer
        
        Args:
            question: The math question
            student_answer: Student's answer
            tolerance: Acceptable error tolerance (default: 0.01)
            
        Returns:
            Dictionary with verification result
        """
        try:
            # Get Wolfram solution
            wolfram_result = await self.solve_math_problem(question, include_steps=False)
            
            if not wolfram_result or not wolfram_result.get("answer"):
                return {
                    "verified": False,
                    "correct": None,
                    "expected_answer": None,
                    "message": "Could not verify answer with Wolfram Alpha"
                }
            
            expected_answer = wolfram_result["answer"]
            
            # Try to extract numerical values for comparison
            try:
                # Extract numbers from both answers
                student_nums = re.findall(r'-?\d+\.?\d*', student_answer)
                expected_nums = re.findall(r'-?\d+\.?\d*', expected_answer)
                
                if student_nums and expected_nums:
                    student_val = float(student_nums[0])
                    expected_val = float(expected_nums[0])
                    
                    # Check if within tolerance
                    is_correct = abs(student_val - expected_val) <= tolerance
                    
                    return {
                        "verified": True,
                        "correct": is_correct,
                        "expected_answer": expected_answer,
                        "student_value": student_val,
                        "expected_value": expected_val,
                        "message": "Answer verified" if is_correct else "Answer is incorrect"
                    }
            except (ValueError, IndexError):
                pass
            
            # Fallback to string comparison
            is_correct = student_answer.strip().lower() == expected_answer.strip().lower()
            
            return {
                "verified": True,
                "correct": is_correct,
                "expected_answer": expected_answer,
                "message": "Answer verified" if is_correct else "Answer is incorrect"
            }
            
        except Exception as e:
            return {
                "verified": False,
                "correct": None,
                "expected_answer": None,
                "message": f"Verification failed: {str(e)}"
            }
    
    async def verify_answer(
        self,
        question: str,
        student_answer: str,
        expected_answer: Optional[str] = None,
        tolerance: float = 0.01
    ) -> Optional[Dict]:
        """
        Verify a student's answer against expected answer or Wolfram solution
        
        Args:
            question: The math question
            student_answer: Student's submitted answer
            expected_answer: Optional expected answer for comparison
            tolerance: Acceptable error tolerance (default: 0.01 = 1%)
            
        Returns:
            Dictionary with is_correct, feedback, and explanation, or None if verification fails
        """
        try:
            # If expected answer provided, compare directly
            if expected_answer:
                # Try numerical comparison
                try:
                    student_nums = re.findall(r'-?\d+\.?\d*', student_answer)
                    expected_nums = re.findall(r'-?\d+\.?\d*', expected_answer)
                    
                    if student_nums and expected_nums:
                        student_val = float(student_nums[0])
                        expected_val = float(expected_nums[0])
                        
                        # Check if within tolerance (percentage-based)
                        if expected_val != 0:
                            error_percent = abs((student_val - expected_val) / expected_val)
                            is_correct = error_percent <= tolerance
                        else:
                            is_correct = abs(student_val - expected_val) <= tolerance
                        
                        if is_correct:
                            return {
                                "is_correct": True,
                                "feedback": "Great job! Your answer is correct.",
                                "explanation": f"Your answer ({student_val}) matches the expected answer ({expected_val})."
                            }
                        else:
                            return {
                                "is_correct": False,
                                "feedback": "Your answer is close but not quite right. Check your calculations.",
                                "explanation": f"Your answer ({student_val}) differs from the expected answer ({expected_val})."
                            }
                except (ValueError, IndexError):
                    # Fallback to string comparison
                    is_correct = student_answer.strip().lower() == expected_answer.strip().lower()
                    
                    if is_correct:
                        return {
                            "is_correct": True,
                            "feedback": "Correct! Well done.",
                            "explanation": "Your answer matches the expected answer."
                        }
                    else:
                        return {
                            "is_correct": False,
                            "feedback": "Your answer doesn't match the expected answer. Review your work.",
                            "explanation": f"Expected: {expected_answer}, Got: {student_answer}"
                        }
            
            # Otherwise, use Wolfram to verify
            verification = await self.verify_numerical_answer(question, student_answer, tolerance)
            
            if verification.get("verified"):
                is_correct = verification.get("correct", False)
                
                if is_correct:
                    return {
                        "is_correct": True,
                        "feedback": "Excellent! Your answer is verified as correct by Wolfram Alpha.",
                        "explanation": f"Your answer matches the computed solution: {verification.get('expected_answer')}"
                    }
                else:
                    return {
                        "is_correct": False,
                        "feedback": "Your answer doesn't match the computed solution. Try again.",
                        "explanation": f"Expected: {verification.get('expected_answer')}, Got: {student_answer}"
                    }
            
            return None
            
        except Exception as e:
            print(f"Answer verification error: {e}")
            return None


# Global instance
wolfram_service = WolframService()
