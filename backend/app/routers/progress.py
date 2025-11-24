"""Progress tracking endpoints"""

from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from supabase import Client
import logging

from app.models.progress import Progress, ProgressUpdate
from app.models.base import Subject
from app.services.progress_service import ProgressService
from app.services.analytics_service import AnalyticsService
from app.config import settings
from supabase import create_client

router = APIRouter()


def get_supabase_client() -> Client:
    """Get Supabase client"""
    return create_client(settings.supabase_url, settings.supabase_service_key)


def get_analytics_service(supabase: Client = Depends(get_supabase_client)) -> AnalyticsService:
    """Get analytics service instance"""
    return AnalyticsService(supabase)


def get_progress_service(
    supabase: Client = Depends(get_supabase_client),
    analytics: AnalyticsService = Depends(get_analytics_service)
) -> ProgressService:
    """Get progress service instance"""
    return ProgressService(supabase, analytics)


@router.get("/progress/{user_id}", response_model=List[Progress])
async def get_user_progress(
    user_id: str,
    subject: Optional[Subject] = Query(None, description="Filter by subject"),
    service: ProgressService = Depends(get_progress_service)
):
    """
    Get all progress records for a user
    
    Args:
        user_id: User ID
        subject: Optional subject filter
        
    Returns:
        List of progress records
    """
    return await service.get_user_progress(user_id, subject)


@router.get("/progress/{user_id}/summary")
async def get_user_progress_summary(
    user_id: str,
    service: ProgressService = Depends(get_progress_service)
):
    """
    Get summary of user's overall progress
    
    Args:
        user_id: User ID
        
    Returns:
        Progress summary with statistics
    """
    try:
        return await service.get_user_summary(user_id)
    except Exception as e:
        logger.error(f"Error fetching progress summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch progress summary: {str(e)}"
        )


@router.get("/progress/{user_id}/topic/{topic_id}", response_model=Optional[Progress])
async def get_topic_progress(
    user_id: str,
    topic_id: str,
    service: ProgressService = Depends(get_progress_service)
):
    """
    Get progress for a specific topic
    
    Args:
        user_id: User ID
        topic_id: Topic ID
        
    Returns:
        Progress record or None
    """
    return await service.get_progress_by_topic(user_id, topic_id)


@router.put("/progress")
async def update_progress(
    user_id: str = Query(..., description="User ID"),
    topic_id: str = Query(..., description="Topic ID"),
    subject: Subject = Query(..., description="Subject"),
    correct_answers: int = Query(..., description="Number of correct answers"),
    total_questions: int = Query(..., description="Total questions attempted"),
    time_spent_minutes: int = Query(..., description="Time spent in minutes"),
    service: ProgressService = Depends(get_progress_service)
):
    """
    Update progress for a topic with new activity data
    
    Args:
        user_id: User ID
        topic_id: Topic ID
        subject: Subject
        correct_answers: Number of correct answers in this session
        total_questions: Total questions in this session
        time_spent_minutes: Time spent in minutes
        
    Returns:
        Updated progress record and any new achievements
    """
    # Update progress
    progress = await service.update_progress(
        user_id=user_id,
        topic_id=topic_id,
        subject=subject,
        correct_answers=correct_answers,
        total_questions=total_questions,
        time_spent_minutes=time_spent_minutes
    )
    
    # Check for new achievements
    new_achievements = await service.check_and_award_achievements(user_id, topic_id)
    
    return {
        "progress": progress,
        "new_achievements": new_achievements
    }


@router.get("/progress/{user_id}/achievements")
async def get_user_achievements(
    user_id: str,
    service: ProgressService = Depends(get_progress_service)
):
    """
    Get all achievements earned by a user
    
    Args:
        user_id: User ID
        
    Returns:
        List of all achievements across all topics
    """
    try:
        progress_records = await service.get_user_progress(user_id)
        
        all_achievements = []
        for record in progress_records:
            # Handle cases where achievements might be None or not a list
            achievements = record.achievements if record.achievements else []
            if not isinstance(achievements, list):
                achievements = []
            
            for achievement in achievements:
                if isinstance(achievement, dict):
                    achievement_with_topic = {
                        **achievement,
                        "topic_id": record.topic_id,
                        "subject": record.subject.value
                    }
                    all_achievements.append(achievement_with_topic)
        
        # Sort by earned_at date (most recent first)
        all_achievements.sort(key=lambda x: x.get("earned_at", "") or "", reverse=True)
        
        return {
            "total_achievements": len(all_achievements),
            "achievements": all_achievements
        }
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching achievements: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch achievements: {str(e)}"
        )
