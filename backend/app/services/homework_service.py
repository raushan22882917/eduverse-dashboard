"""Homework assistant service with graduated hints"""

import json
import uuid
from typing import Optional, Dict, List
from datetime import datetime
import google.generativeai as genai
from supabase import create_client, Client

from app.config import settings
from app.models.base import Subject
from app.models.doubt import (
    HomeworkSession,
    HomeworkAttempt,
    HintResponse,
    HomeworkStartRequest,
    HomeworkStartResponse,
    HomeworkAttemptRequest,
    HomeworkAttemptResponse
)
from app.services.wolfram_service import wolfram_service
from app.utils.exceptions import APIException


class HomeworkService:
    """Service for homework assistance with graduated hints"""
    
    def __init__(self):
        """Initialize homework service"""
        self._gemini_initialized = False
        self._supabase_client: Optional[Client] = None
        self.wolfram_service = wolfram_service
        
        # Hint generation prompts
        self.hint_prompts = {
            1: """Generate a basic hint for this homework problem. The hint should:
- Point the student in the right direction
- NOT reveal the solution
- Help them understand what concept to apply
- Be encouraging and supportive

Question: {question}
Subject: {subject}

Provide only the hint text, no additional formatting.""",
            
            2: """Generate a detailed hint for this homework problem. The hint should:
- Provide more specific guidance than the basic hint
- Show the approach or method to use
- Still NOT reveal the complete solution
- Include relevant formulas or concepts if applicable

Question: {question}
Subject: {subject}
Previous hint: {previous_hint}

Provide only the hint text, no additional formatting.""",
            
            3: """Generate the complete solution for this homework problem. Include:
- Step-by-step solution
- Clear explanations for each step
- Final answer
- Any relevant formulas or concepts used

Question: {question}
Subject: {subject}

Provide the complete solution."""
        }
        
        # Answer evaluation prompt
        self.evaluation_prompt = """Evaluate if the student's answer is correct for this question.

Question: {question}
Subject: {subject}
Student's Answer: {student_answer}
{correct_answer_hint}

Provide a JSON response with:
1. is_correct: true if the answer is correct, false otherwise
2. feedback: Constructive feedback for the student (2-3 sentences)
3. explanation: Brief explanation of why the answer is correct or incorrect

For numerical answers, consider answers within 1% tolerance as correct.
For text answers, check if the key concepts are present even if wording differs.

Response format:
{{
  "is_correct": true/false,
  "feedback": "feedback text",
  "explanation": "explanation text"
}}

Only respond with the JSON, no additional text."""
    
    def _initialize_gemini(self):
        """Initialize Gemini API"""
        if not self._gemini_initialized:
            genai.configure(api_key=settings.gemini_api_key)
            self._gemini_initialized = True
    
    def _get_supabase_client(self) -> Client:
        """Get or create Supabase client"""
        if self._supabase_client is None:
            self._supabase_client = create_client(
                settings.supabase_url,
                settings.supabase_service_key
            )
        return self._supabase_client
    
    async def start_homework_session(
        self,
        request: HomeworkStartRequest
    ) -> HomeworkStartResponse:
        """
        Start a new homework session
        
        Args:
            request: Homework start request with question and user details
            
        Returns:
            HomeworkStartResponse with session ID
        """
        try:
            supabase = self._get_supabase_client()
            
            # Generate question ID if not provided
            question_id = request.question_id or str(uuid.uuid4())
            
            # Create session data
            session_data = {
                "user_id": request.user_id,
                "question_id": question_id,
                "question": request.question,
                "subject": request.subject.value,
                "hints_revealed": 0,
                "attempts": [],
                "is_complete": False,
                "solution_revealed": False,
                "correct_answer": request.correct_answer,
                "metadata": {},
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Insert into database
            response = supabase.table("homework_sessions").insert(session_data).execute()
            
            if not response.data or len(response.data) == 0:
                raise Exception("Failed to create homework session")
            
            session_id = response.data[0]["id"]
            
            return HomeworkStartResponse(
                session_id=session_id,
                question=request.question,
                subject=request.subject,
                message="Homework session started. Try solving the problem first, then request hints if needed."
            )
            
        except Exception as e:
            raise APIException(
                status_code=500,
                detail=f"Failed to start homework session: {str(e)}"
            )
    
    async def get_hint(
        self,
        session_id: str,
        hint_level: Optional[int] = None
    ) -> HintResponse:
        """
        Get a hint for the homework problem
        
        Args:
            session_id: Homework session ID
            hint_level: Specific hint level (1-3), or None for next level
            
        Returns:
            HintResponse with hint text
        """
        try:
            supabase = self._get_supabase_client()
            
            # Get session
            response = supabase.table("homework_sessions")\
                .select("*")\
                .eq("id", session_id)\
                .execute()
            
            if not response.data or len(response.data) == 0:
                raise APIException(
                    status_code=404,
                    detail="Homework session not found"
                )
            
            session = response.data[0]
            
            # Check if session is complete
            if session["is_complete"]:
                raise APIException(
                    status_code=400,
                    detail="Homework session is already complete"
                )
            
            # Determine hint level
            current_hints_revealed = session["hints_revealed"]
            if hint_level is None:
                # Get next hint level
                next_level = current_hints_revealed + 1
            else:
                # Use requested level
                next_level = hint_level
            
            # Validate hint level
            if next_level < 1 or next_level > 3:
                raise APIException(
                    status_code=400,
                    detail="Hint level must be between 1 and 3"
                )
            
            # Check if hint already revealed
            if next_level <= current_hints_revealed:
                raise APIException(
                    status_code=400,
                    detail=f"Hint level {next_level} has already been revealed"
                )
            
            # Generate hint
            hint_text = await self._generate_hint(
                question=session["question"],
                subject=session["subject"],
                hint_level=next_level,
                previous_hint=None  # Could fetch from metadata if stored
            )
            
            # Update session
            update_data = {
                "hints_revealed": next_level,
                "solution_revealed": next_level == 3,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            supabase.table("homework_sessions")\
                .update(update_data)\
                .eq("id", session_id)\
                .execute()
            
            return HintResponse(
                session_id=session_id,
                hint_level=next_level,
                hint_text=hint_text,
                is_final_hint=next_level == 3
            )
            
        except APIException:
            raise
        except Exception as e:
            raise APIException(
                status_code=500,
                detail=f"Failed to get hint: {str(e)}"
            )
    
    async def _generate_hint(
        self,
        question: str,
        subject: str,
        hint_level: int,
        previous_hint: Optional[str] = None
    ) -> str:
        """
        Generate hint using Gemini
        
        Args:
            question: Homework question
            subject: Subject name
            hint_level: Hint level (1-3)
            previous_hint: Previous hint text if available
            
        Returns:
            Generated hint text
        """
        try:
            self._initialize_gemini()
            
            # Get prompt template
            prompt_template = self.hint_prompts.get(hint_level)
            if not prompt_template:
                raise Exception(f"Invalid hint level: {hint_level}")
            
            # Format prompt
            prompt = prompt_template.format(
                question=question,
                subject=subject,
                previous_hint=previous_hint or "N/A"
            )
            
            # Generate hint
            model = genai.GenerativeModel('gemini-1.5-pro')
            response = model.generate_content(prompt)
            
            hint_text = response.text.strip()
            
            return hint_text
            
        except Exception as e:
            raise Exception(f"Failed to generate hint: {str(e)}")
    
    async def submit_attempt(
        self,
        request: HomeworkAttemptRequest
    ) -> HomeworkAttemptResponse:
        """
        Submit an answer attempt for homework
        
        Args:
            request: Homework attempt request with session ID and answer
            
        Returns:
            HomeworkAttemptResponse with evaluation feedback
        """
        try:
            supabase = self._get_supabase_client()
            
            # Get session
            response = supabase.table("homework_sessions")\
                .select("*")\
                .eq("id", request.session_id)\
                .execute()
            
            if not response.data or len(response.data) == 0:
                raise APIException(
                    status_code=404,
                    detail="Homework session not found"
                )
            
            session = response.data[0]
            
            # Check if session is complete
            if session["is_complete"]:
                raise APIException(
                    status_code=400,
                    detail="Homework session is already complete"
                )
            
            # Get current attempts
            attempts = session.get("attempts", [])
            attempts_count = len(attempts)
            
            # Evaluate answer
            evaluation = await self._evaluate_answer(
                question=session["question"],
                subject=session["subject"],
                student_answer=request.answer,
                correct_answer=session.get("correct_answer")
            )
            
            is_correct = evaluation["is_correct"]
            feedback = evaluation["feedback"]
            
            # Create attempt record
            attempt = {
                "answer": request.answer,
                "timestamp": datetime.utcnow().isoformat(),
                "is_correct": is_correct,
                "feedback": feedback
            }
            
            attempts.append(attempt)
            attempts_count = len(attempts)
            
            # Check if should reveal solution (3 attempts or correct answer)
            solution_revealed = session["solution_revealed"] or attempts_count >= 3 or is_correct
            is_complete = is_correct or attempts_count >= 3
            
            # Get solution if revealing
            solution = None
            if solution_revealed and not session["solution_revealed"]:
                solution = await self._generate_hint(
                    question=session["question"],
                    subject=session["subject"],
                    hint_level=3,
                    previous_hint=None
                )
            
            # Update session
            update_data = {
                "attempts": attempts,
                "is_complete": is_complete,
                "solution_revealed": solution_revealed,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            supabase.table("homework_sessions")\
                .update(update_data)\
                .eq("id", request.session_id)\
                .execute()
            
            return HomeworkAttemptResponse(
                session_id=request.session_id,
                is_correct=is_correct,
                feedback=feedback,
                attempts_count=attempts_count,
                solution_revealed=solution_revealed,
                solution=solution
            )
            
        except APIException:
            raise
        except Exception as e:
            raise APIException(
                status_code=500,
                detail=f"Failed to submit attempt: {str(e)}"
            )
    
    async def _evaluate_answer(
        self,
        question: str,
        subject: str,
        student_answer: str,
        correct_answer: Optional[str] = None
    ) -> Dict:
        """
        Evaluate student's answer
        
        Args:
            question: Homework question
            subject: Subject name
            student_answer: Student's submitted answer
            correct_answer: Optional correct answer for verification
            
        Returns:
            Dictionary with is_correct, feedback, and explanation
        """
        try:
            # Check if numerical question and use Wolfram for verification
            is_numerical = await self._is_numerical_question(question)
            
            if is_numerical and correct_answer:
                # Try Wolfram verification for numerical answers
                try:
                    wolfram_result = await self.wolfram_service.verify_answer(
                        question=question,
                        student_answer=student_answer,
                        expected_answer=correct_answer
                    )
                    
                    if wolfram_result:
                        return {
                            "is_correct": wolfram_result.get("is_correct", False),
                            "feedback": wolfram_result.get("feedback", "Answer evaluated using Wolfram verification."),
                            "explanation": wolfram_result.get("explanation", "")
                        }
                except Exception as e:
                    print(f"Wolfram verification failed: {e}")
                    # Fall through to Gemini evaluation
            
            # Use Gemini for evaluation
            self._initialize_gemini()
            
            # Build correct answer hint
            correct_answer_hint = ""
            if correct_answer:
                correct_answer_hint = f"Correct Answer (for reference): {correct_answer}"
            
            # Format prompt
            prompt = self.evaluation_prompt.format(
                question=question,
                subject=subject,
                student_answer=student_answer,
                correct_answer_hint=correct_answer_hint
            )
            
            # Generate evaluation
            model = genai.GenerativeModel('gemini-1.5-pro')
            response = model.generate_content(prompt)
            
            # Parse JSON response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            evaluation = json.loads(response_text)
            
            return {
                "is_correct": evaluation.get("is_correct", False),
                "feedback": evaluation.get("feedback", "Answer evaluated."),
                "explanation": evaluation.get("explanation", "")
            }
            
        except Exception as e:
            print(f"Evaluation error: {e}")
            # Fallback evaluation
            return {
                "is_correct": False,
                "feedback": "Unable to evaluate answer automatically. Please review the solution.",
                "explanation": str(e)
            }
    
    async def _is_numerical_question(self, question: str) -> bool:
        """
        Check if question is numerical
        
        Args:
            question: Question text
            
        Returns:
            True if numerical, False otherwise
        """
        import re
        
        # Patterns for numerical questions
        patterns = [
            r'\d+\s*[\+\-\*/\^]\s*\d+',
            r'solve|calculate|compute|find\s+the\s+value',
            r'equation|integral|derivative|limit',
            r'=\s*\?|\?\s*=',
        ]
        
        question_lower = question.lower()
        for pattern in patterns:
            if re.search(pattern, question_lower):
                return True
        return False
    
    async def get_session(self, session_id: str) -> HomeworkSession:
        """
        Get homework session by ID
        
        Args:
            session_id: Session ID
            
        Returns:
            HomeworkSession object
        """
        try:
            supabase = self._get_supabase_client()
            
            response = supabase.table("homework_sessions")\
                .select("*")\
                .eq("id", session_id)\
                .execute()
            
            if not response.data or len(response.data) == 0:
                raise APIException(
                    status_code=404,
                    detail="Homework session not found"
                )
            
            session_data = response.data[0]
            
            return HomeworkSession(
                id=session_data["id"],
                user_id=session_data["user_id"],
                question_id=session_data["question_id"],
                question=session_data["question"],
                hints_revealed=session_data["hints_revealed"],
                attempts=session_data.get("attempts", []),
                is_complete=session_data["is_complete"],
                solution_revealed=session_data["solution_revealed"],
                created_at=datetime.fromisoformat(session_data["created_at"].replace("Z", "+00:00")),
                updated_at=datetime.fromisoformat(session_data["updated_at"].replace("Z", "+00:00"))
            )
            
        except APIException:
            raise
        except Exception as e:
            raise APIException(
                status_code=500,
                detail=f"Failed to get session: {str(e)}"
            )
    
    async def get_user_sessions(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> List[HomeworkSession]:
        """
        Get homework sessions for a user
        
        Args:
            user_id: User ID
            limit: Number of records to fetch
            offset: Offset for pagination
            
        Returns:
            List of HomeworkSession objects
        """
        try:
            supabase = self._get_supabase_client()
            
            response = supabase.table("homework_sessions")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .limit(limit)\
                .offset(offset)\
                .execute()
            
            sessions = []
            for session_data in response.data:
                sessions.append(HomeworkSession(
                    id=session_data["id"],
                    user_id=session_data["user_id"],
                    question_id=session_data["question_id"],
                    question=session_data["question"],
                    hints_revealed=session_data["hints_revealed"],
                    attempts=session_data.get("attempts", []),
                    is_complete=session_data["is_complete"],
                    solution_revealed=session_data["solution_revealed"],
                    created_at=datetime.fromisoformat(session_data["created_at"].replace("Z", "+00:00")),
                    updated_at=datetime.fromisoformat(session_data["updated_at"].replace("Z", "+00:00"))
                ))
            
            return sessions
            
        except Exception as e:
            raise APIException(
                status_code=500,
                detail=f"Failed to get user sessions: {str(e)}"
            )


# Global instance
homework_service = HomeworkService()
