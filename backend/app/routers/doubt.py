"""Doubt solver endpoints"""

from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from typing import Optional, List
from app.models.doubt import (
    DoubtResponse,
    DoubtType
)
from app.models.base import Subject, BaseResponse
from app.services.doubt_solver_service import doubt_solver_service
from app.utils.exceptions import APIException

router = APIRouter(prefix="/doubt", tags=["Doubt Solver"])


@router.post("/text", response_model=DoubtResponse)
async def process_text_doubt(
    user_id: str,
    text: str,
    subject: Optional[Subject] = None
):
    """
    Process a text-based doubt query
    
    Args:
        user_id: User ID submitting the doubt
        text: Question text
        subject: Optional subject hint
        
    Returns:
        DoubtResponse with NCERT summary, solved example, PYQ, and HOTS question
    """
    try:
        if not text or not text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question text cannot be empty"
            )
        
        if not user_id or not user_id.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID is required"
            )
        
        response = await doubt_solver_service.process_text_doubt(
            user_id=user_id,
            text=text,
            subject=subject
        )
        
        return response
        
    except APIException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.detail
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process text doubt: {str(e)}"
        )


@router.post("/image", response_model=DoubtResponse)
async def process_image_doubt(
    user_id: str = Form(...),
    image: UploadFile = File(...),
    subject: Optional[Subject] = Form(None)
):
    """
    Process an image-based doubt query
    
    Args:
        user_id: User ID submitting the doubt
        image: Image file containing the question
        subject: Optional subject hint
        
    Returns:
        DoubtResponse with NCERT summary, solved example, PYQ, and HOTS question
    """
    try:
        if not user_id or not user_id.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID is required"
            )
        
        # Validate file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if image.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
            )
        
        # Read image bytes
        image_bytes = await image.read()
        
        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(image_bytes) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image file too large. Maximum size is 10MB"
            )
        
        response = await doubt_solver_service.process_image_doubt(
            user_id=user_id,
            image_bytes=image_bytes,
            subject=subject
        )
        
        return response
        
    except APIException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.detail
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process image doubt: {str(e)}"
        )


@router.post("/voice", response_model=DoubtResponse)
async def process_voice_doubt(
    user_id: str = Form(...),
    audio: UploadFile = File(...),
    subject: Optional[Subject] = Form(None)
):
    """
    Process a voice-based doubt query
    
    Args:
        user_id: User ID submitting the doubt
        audio: Audio file containing the question
        subject: Optional subject hint
        
    Returns:
        DoubtResponse with NCERT summary, solved example, PYQ, and HOTS question
    """
    try:
        if not user_id or not user_id.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID is required"
            )
        
        # Validate file type
        allowed_types = ["audio/wav", "audio/wave", "audio/x-wav", "audio/mpeg", "audio/mp3", "audio/webm", "audio/ogg"]
        if audio.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed types: wav, mp3, webm, ogg"
            )
        
        # Read audio bytes
        audio_bytes = await audio.read()
        
        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(audio_bytes) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio file too large. Maximum size is 10MB"
            )
        
        # Determine audio format from filename
        audio_format = "wav"
        if audio.filename:
            ext = audio.filename.split(".")[-1].lower()
            if ext in ["mp3", "wav", "webm", "ogg", "flac"]:
                audio_format = ext
        
        response = await doubt_solver_service.process_voice_doubt(
            user_id=user_id,
            audio_bytes=audio_bytes,
            audio_format=audio_format,
            subject=subject
        )
        
        return response
        
    except APIException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.detail
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process voice doubt: {str(e)}"
        )


@router.get("/history", response_model=List[dict])
async def get_doubt_history(
    user_id: str,
    limit: int = 20,
    offset: int = 0
):
    """
    Get doubt history for a user
    
    Args:
        user_id: User ID
        limit: Number of records to fetch (default: 20)
        offset: Offset for pagination (default: 0)
        
    Returns:
        List of doubt records
    """
    try:
        if not user_id or not user_id.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID is required"
            )
        
        history = await doubt_solver_service.get_doubt_history(
            user_id=user_id,
            limit=limit,
            offset=offset
        )
        
        return history
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch doubt history: {str(e)}"
        )
