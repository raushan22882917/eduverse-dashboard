"""Admin panel endpoints for content management and student oversight"""

from fastapi import APIRouter, Query, HTTPException, UploadFile, File, BackgroundTasks, Request, Depends
from typing import Optional, List
from slowapi import Limiter
from slowapi.util import get_remote_address
from io import StringIO
import pandas as pd

from app.models.admin import (
    AdminDashboardMetrics,
    StudentOverview,
    StudentDetailedProfile,
    ContentUploadRequest,
    ContentUploadResponse,
    ContentPreview
)
from app.models.base import Subject
from app.services.admin_service import admin_service
from app.services.content_service import content_service
from app.utils.exceptions import APIException

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/admin/dashboard", response_model=AdminDashboardMetrics)
@limiter.limit("50/minute")
async def get_admin_dashboard(request: Request):
    """
    Get admin dashboard with aggregate metrics
    
    Returns comprehensive metrics including:
    - Active students count (active in last 7 days)
    - Total students count
    - Average mastery score across all students and topics
    - Completion rate (topics with mastery >= 80%)
    - Flagged students list (mastery < 50%)
    - Total content items
    - Total test sessions
    
    Returns:
    - AdminDashboardMetrics with all aggregate data
    """
    try:
        metrics = await admin_service.get_dashboard_metrics()
        return metrics
        
    except APIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/students", response_model=List[StudentOverview])
@limiter.limit("50/minute")
async def get_students(
    request: Request,
    subject: Optional[Subject] = Query(None, description="Filter by subject"),
    min_mastery: Optional[float] = Query(None, description="Minimum mastery score", ge=0, le=100),
    max_mastery: Optional[float] = Query(None, description="Maximum mastery score", ge=0, le=100),
    active_days: Optional[int] = Query(None, description="Filter students active in last N days", ge=1),
    limit: int = Query(50, description="Maximum number of results", ge=1, le=200),
    offset: int = Query(0, description="Pagination offset", ge=0)
):
    """
    Get list of students with optional filters
    
    Query Parameters:
    - subject: Filter by specific subject (mathematics, physics, chemistry, biology)
    - min_mastery: Minimum average mastery score (0-100)
    - max_mastery: Maximum average mastery score (0-100)
    - active_days: Show only students active in last N days
    - limit: Maximum number of students to return (default: 50, max: 200)
    - offset: Pagination offset (default: 0)
    
    Returns:
    - List of StudentOverview objects with aggregated metrics
    
    Notes:
    - Students are sorted by average mastery score (ascending) to show struggling students first
    - Flagged students (mastery < 50%) are marked with is_flagged=True
    """
    try:
        students = await admin_service.get_students(
            subject=subject,
            min_mastery=min_mastery,
            max_mastery=max_mastery,
            active_days=active_days,
            limit=limit,
            offset=offset
        )
        
        return students
        
    except APIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/students/{student_id}", response_model=StudentDetailedProfile)
@limiter.limit("50/minute")
async def get_student_profile(request: Request, student_id: str):
    """
    Get detailed profile for a specific student
    
    Path Parameters:
    - student_id: Student user ID (UUID)
    
    Returns:
    - StudentDetailedProfile with comprehensive data including:
      - Progress by subject with completion rates
      - List of completed topics
      - Total time spent learning
      - Test session history (last 20 sessions)
      - Average test score
      - Activity metrics (last active, streak days)
      - Achievements earned
    
    Raises:
    - 404: Student not found
    """
    try:
        profile = await admin_service.get_student_profile(student_id)
        return profile
        
    except APIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/content/upload", response_model=ContentUploadResponse, status_code=201)
@limiter.limit("20/minute")
async def upload_content(
    request: Request,
    content_request: ContentUploadRequest,
    background_tasks: BackgroundTasks
):
    """
    Upload and tag content (NCERT/PYQ/HOTS)
    
    Request Body:
    - type: Content type ('ncert', 'pyq', 'hots')
    - subject: Subject
    - chapter: Chapter name (optional)
    - topic_id: Topic ID (optional)
    - difficulty: Difficulty level (optional)
    - title: Content title (optional)
    - content_text: Main content text
    - metadata: Additional metadata
    - PYQ-specific: year, marks, solution, topic_ids
    - HOTS-specific: question_type
    
    Returns:
    - ContentUploadResponse with content ID and indexing status
    
    Notes:
    - Automatically triggers embedding generation and indexing
    - Content is immediately available in RAG pipeline after indexing
    """
    try:
        response = await content_service.upload_content(
            content_request=content_request,
            trigger_indexing=True
        )
        return response
        
    except APIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/content/upload/file", response_model=ContentUploadResponse, status_code=201)
@limiter.limit("10/minute")
async def upload_content_file(
    request: Request,
    file: UploadFile = File(...),
    subject: Subject = Query(..., description="Subject"),
    chapter: Optional[str] = Query(None, description="Chapter name"),
    topic_id: Optional[str] = Query(None, description="Topic ID"),
    difficulty: Optional[str] = Query(None, description="Difficulty level"),
    class_grade: Optional[int] = Query(None, description="Class/Grade number (e.g., 8, 9, 10, 11, 12)")
):
    """
    Upload content from file (PDF or text)
    
    Form Data:
    - file: File to upload (PDF or text file)
    
    Query Parameters:
    - subject: Subject (required)
    - chapter: Chapter name (optional)
    - topic_id: Topic ID (optional)
    - difficulty: Difficulty level (optional)
    
    Returns:
    - ContentUploadResponse with content ID and indexing status
    
    Supported file types:
    - application/pdf
    - text/plain
    - text/markdown
    
    Notes:
    - Extracts text from PDF using PyPDF2
    - Automatically triggers embedding generation and indexing
    """
    try:
        # Read file content
        file_content = await file.read()
        
        # Determine file type if not provided
        file_type = file.content_type
        if not file_type or file_type == "application/octet-stream":
            # Try to infer from filename
            if file.filename:
                filename_lower = file.filename.lower()
                if filename_lower.endswith('.pdf'):
                    file_type = "application/pdf"
                elif filename_lower.endswith(('.txt', '.md')):
                    file_type = "text/plain"
                else:
                    file_type = "text/plain"  # Default to text
        
        # Upload file
        response = await content_service.upload_file(
            file_content=file_content,
            file_type=file_type,
            subject=subject,
            chapter=chapter,
            topic_id=topic_id,
            difficulty=difficulty,
            filename=file.filename,
            class_grade=class_grade,
            metadata={"original_filename": file.filename}
        )
        
        return response
        
    except APIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        error_trace = traceback.format_exc()
        logger.error(f"Error uploading file: {str(e)}\n{error_trace}")
        # Return a more user-friendly error message
        error_detail = str(e)
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {error_detail}")


@router.post("/content/reindex", status_code=202)
@limiter.limit("5/minute")
async def reindex_content(request: Request, background_tasks: BackgroundTasks):
    """
    Re-index all content in the RAG pipeline
    
    Returns:
    - 202 Accepted with reindexing results
    
    Notes:
    - This is a potentially long-running operation
    - Regenerates embeddings for all content items
    - Updates vector database with new embeddings
    - Use sparingly as it consumes API quota
    """
    try:
        # Execute reindexing in background
        def reindex_task():
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(content_service.reindex_all_content())
            loop.close()
            return result
        
        background_tasks.add_task(reindex_task)
        
        return {
            "success": True,
            "message": "Content reindexing started in background",
            "status": "processing"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/content/preview/{content_id}", response_model=ContentPreview)
@limiter.limit("50/minute")
async def preview_content(request: Request, content_id: str):
    """
    Preview how content appears in RAG pipeline
    
    Path Parameters:
    - content_id: Content item ID (UUID)
    
    Returns:
    - ContentPreview showing:
      - Original content text (truncated to 500 chars)
      - Embedding ID
      - Content chunks (first 5 chunks, truncated to 200 chars each)
      - Metadata
    
    Notes:
    - Useful for verifying content chunking before indexing
    - Shows how content will be split for RAG retrieval
    """
    try:
        preview = await content_service.preview_content(content_id)
        return preview
        
    except APIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/export")
@limiter.limit("10/minute")
async def export_students(
    request: Request,
    subject: Optional[Subject] = Query(None, description="Filter by subject"),
    min_mastery: Optional[float] = Query(None, description="Minimum mastery score", ge=0, le=100),
    max_mastery: Optional[float] = Query(None, description="Maximum mastery score", ge=0, le=100),
    active_days: Optional[int] = Query(None, description="Filter students active in last N days", ge=1)
):
    """
    Export student data as CSV
    
    Query Parameters:
    - subject: Filter by specific subject
    - min_mastery: Minimum average mastery score (0-100)
    - max_mastery: Maximum average mastery score (0-100)
    - active_days: Show only students active in last N days
    
    Returns:
    - CSV file with student data including:
      - User ID, name, email
      - Subjects (comma-separated)
      - Average mastery score
      - Topics completed
      - Total time spent (minutes)
      - Test sessions count
      - Average test score
      - Last active date
      - Streak days
      - Flagged status
      - Created date
    
    Notes:
    - Exports up to 1000 students
    - CSV is returned as downloadable file
    - Use filters to narrow down export scope
    """
    try:
        # Get student data for export
        export_data = await admin_service.export_students_data(
            subject=subject,
            min_mastery=min_mastery,
            max_mastery=max_mastery,
            active_days=active_days
        )
        
        if not export_data:
            raise HTTPException(
                status_code=404,
                detail="No students found matching the criteria"
            )
        
        # Convert to pandas DataFrame
        df = pd.DataFrame(export_data)
        
        # Generate CSV
        csv_buffer = StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue()
        
        # Return CSV as response
        from fastapi.responses import Response
        
        filename = f"students_export_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except APIException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
