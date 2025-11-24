"""AI Tutoring service for enhanced feedback and study planning"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import json
import re
import google.generativeai as genai
from supabase import Client
from app.config import settings
from app.models.base import Subject
from app.utils.exceptions import APIException

# Configure Gemini
genai.configure(api_key=settings.gemini_api_key)


class AITutoringService:
    """Service for AI-powered tutoring, feedback, and study planning"""
    
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
        self.model = genai.GenerativeModel('gemini-pro')
    
    async def get_personalized_feedback(
        self,
        user_id: str,
        content: str,
        subject: Subject,
        performance_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate personalized feedback based on student performance
        
        Args:
            user_id: Student user ID
            content: Content/question/answer to provide feedback on
            subject: Subject area
            performance_data: Optional performance metrics
        
        Returns:
            Dictionary with feedback, suggestions, and improvement areas
        """
        try:
            # Get student progress if not provided
            if not performance_data:
                progress_response = self.supabase.table('progress').select('*').eq('user_id', user_id).eq('subject', subject.value).execute()
                performance_data = {
                    'mastery_scores': [p.get('mastery_score', 0) for p in progress_response.data],
                    'streak_days': progress_response.data[0].get('streak_days', 0) if progress_response.data else 0
                }
            
            prompt = f"""You are an AI tutor helping a Class 12 student with {subject.value}.

Student's current performance:
- Average mastery score: {sum(performance_data.get('mastery_scores', [0])) / max(len(performance_data.get('mastery_scores', [1])), 1):.1f}%
- Current streak: {performance_data.get('streak_days', 0)} days

Student's work:
{content}

Provide:
1. Specific, constructive feedback on what they did well
2. Areas for improvement with actionable suggestions
3. Encouragement and motivation
4. Next steps to strengthen understanding

Format your response as JSON with keys: feedback, strengths, improvements, next_steps, encouragement"""

            response = self.model.generate_content(prompt)
            feedback_text = response.text
            
            # Parse JSON response (simple extraction)
            json_match = re.search(r'\{.*\}', feedback_text, re.DOTALL)
            if json_match:
                feedback_data = json.loads(json_match.group())
            else:
                # Fallback if JSON parsing fails
                feedback_data = {
                    'feedback': feedback_text,
                    'strengths': [],
                    'improvements': [],
                    'next_steps': [],
                    'encouragement': feedback_text
                }
            
            return {
                'user_id': user_id,
                'subject': subject.value,
                'feedback': feedback_data,
                'generated_at': datetime.utcnow().isoformat()
            }
        except Exception as e:
            raise APIException(
                code="FEEDBACK_GENERATION_ERROR",
                message=f"Failed to generate feedback: {str(e)}",
                status_code=500
            )
    
    async def generate_study_plan(
        self,
        user_id: str,
        subject: Subject,
        days: int = 7,
        hours_per_day: float = 2.0
    ) -> Dict[str, Any]:
        """
        Generate personalized study plan
        
        Args:
            user_id: Student user ID
            subject: Subject to create plan for
            days: Number of days for the plan
            hours_per_day: Hours available per day
        
        Returns:
            Detailed study plan with topics, activities, and timeline
        """
        try:
            # Get student progress
            progress_response = self.supabase.table('progress').select('*, topics(*)').eq('user_id', user_id).eq('subject', subject.value).execute()
            
            # Get weak areas (low mastery scores)
            weak_topics = [
                p for p in progress_response.data 
                if p.get('mastery_score', 0) < 60
            ]
            
            # Get upcoming topics
            topics_response = self.supabase.table('topics').select('*').eq('subject', subject.value).order('order_index').execute()
            all_topics = topics_response.data
            
            prompt = f"""Create a personalized {days}-day study plan for a Class 12 {subject.value} student.

Available time: {hours_per_day} hours per day
Total days: {days}

Student's weak areas (need more practice):
{json.dumps([{'topic': t.get('topics', {}).get('name', 'Unknown'), 'mastery': t.get('mastery_score', 0)} for t in weak_topics[:5]], indent=2) if weak_topics else 'None identified'}

All topics to cover:
{json.dumps([{'name': t.get('name'), 'chapter': t.get('chapter')} for t in all_topics[:10]], indent=2)}

Create a detailed study plan with:
1. Daily schedule with specific topics
2. Learning activities (reading, practice problems, videos)
3. Practice goals for each day
4. Review sessions for weak areas
5. Assessment checkpoints

Format as JSON with structure:
{{
  "plan_duration_days": {days},
  "daily_schedule": [
    {{
      "day": 1,
      "date": "YYYY-MM-DD",
      "topics": ["topic1", "topic2"],
      "activities": [
        {{"type": "reading", "duration_minutes": 30, "description": "..."}},
        {{"type": "practice", "duration_minutes": 45, "description": "..."}}
      ],
      "goals": ["goal1", "goal2"],
      "review_topics": ["weak_topic1"]
    }}
  ],
  "assessment_checkpoints": [
    {{"day": 3, "type": "quiz", "topics": ["topic1", "topic2"]}}
  ],
  "total_hours": {days * hours_per_day}
}}"""

            response = self.model.generate_content(prompt)
            plan_text = response.text
            
            # Parse JSON response
            json_match = re.search(r'\{.*\}', plan_text, re.DOTALL)
            if json_match:
                plan_data = json.loads(json_match.group())
            else:
                raise APIException(
                    code="PLAN_PARSING_ERROR",
                    message="Failed to parse study plan response",
                    status_code=500
                )
            
            return {
                'user_id': user_id,
                'subject': subject.value,
                'plan': plan_data,
                'generated_at': datetime.utcnow().isoformat()
            }
        except Exception as e:
            raise APIException(
                code="STUDY_PLAN_ERROR",
                message=f"Failed to generate study plan: {str(e)}",
                status_code=500
            )
    
    async def answer_question(
        self,
        user_id: str,
        question: str,
        subject: Subject,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Answer student questions with explanations
        
        Args:
            user_id: Student user ID
            question: Student's question
            subject: Subject area
            context: Optional context or previous conversation
        
        Returns:
            Answer with explanation and related resources
        """
        try:
            prompt = f"""You are an AI tutor helping a Class 12 student with {subject.value}.

Student's question: {question}

{f"Context from previous conversation: {context}" if context else ""}

Provide:
1. A clear, step-by-step answer
2. Explanation of key concepts
3. Related examples or analogies
4. Practice suggestions
5. Common mistakes to avoid

Format as JSON with keys: answer, explanation, examples, practice_suggestions, common_mistakes"""

            response = self.model.generate_content(prompt)
            answer_text = response.text
            
            # Parse JSON response
            json_match = re.search(r'\{.*\}', answer_text, re.DOTALL)
            if json_match:
                answer_data = json.loads(json_match.group())
            else:
                answer_data = {
                    'answer': answer_text,
                    'explanation': answer_text,
                    'examples': [],
                    'practice_suggestions': [],
                    'common_mistakes': []
                }
            
            return {
                'user_id': user_id,
                'question': question,
                'subject': subject.value,
                'answer': answer_data,
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            raise APIException(
                code="QUESTION_ANSWER_ERROR",
                message=f"Failed to answer question: {str(e)}",
                status_code=500
            )

