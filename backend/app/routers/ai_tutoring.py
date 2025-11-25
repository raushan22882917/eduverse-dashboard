"""AI Tutoring endpoints for enhanced feedback and study planning"""

from fastapi import APIRouter, HTTPException, status
from app.models.ai_features import FeedbackRequest, StudyPlanRequest, QuestionAnswerRequest
from app.services.ai_tutoring_service import AITutoringService
from app.utils.exceptions import APIException
from supabase import create_client
from app.config import settings

router = APIRouter(prefix="/ai-tutoring", tags=["AI Tutoring"])

# Initialize Supabase client
supabase_client = create_client(
    settings.supabase_url,
    settings.supabase_service_key
)

# Initialize service
ai_tutoring_service = AITutoringService(supabase_client)


@router.post("/feedback")
async def get_personalized_feedback(request: FeedbackRequest):
    """
    Get personalized feedback for student work
    
    Args:
        request: Feedback request with content and performance data
    
    Returns:
        Personalized feedback with suggestions
    """
    try:
        feedback = await ai_tutoring_service.get_personalized_feedback(
            user_id=request.user_id,
            content=request.content,
            subject=request.subject,
            performance_data=request.performance_data
        )
        return {
            "success": True,
            **feedback
        }
    except APIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate feedback: {str(e)}"
        )


@router.post("/study-plan")
async def generate_study_plan(request: StudyPlanRequest):
    """
    Generate personalized study plan
    
    Args:
        request: Study plan request with subject and duration
    
    Returns:
        Detailed study plan
    """
    try:
        study_plan = await ai_tutoring_service.generate_study_plan(
            user_id=request.user_id,
            subject=request.subject,
            days=request.days,
            hours_per_day=request.hours_per_day
        )
        return {
            "success": True,
            **study_plan
        }
    except APIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate study plan: {str(e)}"
        )


@router.post("/answer")
async def answer_question(request: QuestionAnswerRequest):
    """
    Answer student questions with explanations
    
    Args:
        request: Question answer request
    
    Returns:
        Answer with explanation and resources
    """
    try:
        answer = await ai_tutoring_service.answer_question(
            user_id=request.user_id,
            question=request.question,
            subject=request.subject,
            context=request.context
        )
        return {
            "success": True,
            **answer
        }
    except APIException as e:
        print(f"APIException in answer_question: {e.message} (code: {e.code})")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Unexpected error in answer_question endpoint: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to answer question: {str(e)}"
        )

