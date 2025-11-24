"""Content management service for admin operations"""

from typing import Optional, List, Dict
from datetime import datetime
import uuid
import re
import logging
from supabase import create_client, Client
import PyPDF2
from io import BytesIO

from app.config import settings

logger = logging.getLogger(__name__)
from app.models.content import (
    ContentItem,
    ContentItemCreate,
    PYQ,
    PYQCreate,
    HOTSQuestion,
    HOTSQuestionCreate,
    ContentType,
    DifficultyLevel
)
from app.models.admin import ContentUploadRequest, ContentUploadResponse, ContentPreview
from app.models.base import Subject
from app.services.content_indexer import content_indexer
from app.utils.exceptions import APIException


class ContentService:
    """Service for content management operations"""
    
    def __init__(self):
        """Initialize content service with Supabase client"""
        self.supabase: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_key
        )
    
    async def upload_content(
        self,
        content_request: ContentUploadRequest,
        trigger_indexing: bool = True
    ) -> ContentUploadResponse:
        """
        Upload and tag content (NCERT/PYQ/HOTS)
        
        Args:
            content_request: Content upload request with metadata
            trigger_indexing: Whether to trigger embedding generation
        
        Returns:
            ContentUploadResponse with content ID and indexing status
        """
        try:
            content_id = str(uuid.uuid4())
            embedding_id = None
            indexed = False
            
            # Handle different content types
            if content_request.type == "pyq":
                # Insert into pyqs table
                pyq_data = {
                    "id": content_id,
                    "subject": content_request.subject.value,
                    "year": content_request.year,
                    "question": content_request.content_text,
                    "solution": content_request.solution or "",
                    "marks": content_request.marks or 1,
                    "topic_ids": content_request.topic_ids,
                    "difficulty": content_request.difficulty,
                    "metadata": content_request.metadata,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                
                response = self.supabase.table("pyqs").insert(pyq_data).execute()
                
                if not response.data:
                    raise APIException(
                        code="DATABASE_ERROR",
                        message="Failed to insert PYQ into database",
                        status_code=500
                    )
                
                # Create content item for indexing
                if trigger_indexing:
                    content_item = ContentItem(
                        id=content_id,
                        type=ContentType.PYQ,
                        subject=content_request.subject,
                        chapter=content_request.chapter,
                        topic_id=content_request.topic_id,
                        difficulty=DifficultyLevel(content_request.difficulty) if content_request.difficulty else None,
                        title=content_request.title,
                        content_text=f"Question: {content_request.content_text}\nSolution: {content_request.solution}",
                        metadata=content_request.metadata,
                        embedding_id=None,
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    
                    # Index content
                    index_result = await content_indexer.index_content_item(content_item)
                    indexed = index_result.get("success", False)
                    embedding_id = content_id  # Use content_id as embedding_id
            
            elif content_request.type == "hots":
                # Insert into hots_questions table
                hots_data = {
                    "id": content_id,
                    "subject": content_request.subject.value,
                    "topic_id": content_request.topic_id,
                    "question": content_request.content_text,
                    "solution": content_request.solution or "",
                    "difficulty": content_request.difficulty or "hard",
                    "question_type": content_request.question_type or "case_based",
                    "metadata": content_request.metadata,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                
                response = self.supabase.table("hots_questions").insert(hots_data).execute()
                
                if not response.data:
                    raise APIException(
                        code="DATABASE_ERROR",
                        message="Failed to insert HOTS question into database",
                        status_code=500
                    )
                
                # Create content item for indexing
                if trigger_indexing:
                    content_item = ContentItem(
                        id=content_id,
                        type=ContentType.HOTS,
                        subject=content_request.subject,
                        chapter=content_request.chapter,
                        topic_id=content_request.topic_id,
                        difficulty=DifficultyLevel(content_request.difficulty) if content_request.difficulty else DifficultyLevel.HARD,
                        title=content_request.title,
                        content_text=f"Question: {content_request.content_text}\nSolution: {content_request.solution}",
                        metadata=content_request.metadata,
                        embedding_id=None,
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    
                    # Index content
                    index_result = await content_indexer.index_content_item(content_item)
                    indexed = index_result.get("success", False)
                    embedding_id = content_id
            
            else:  # ncert or other content types
                # Validate topic_id if provided (must be UUID format)
                topic_id = None
                if content_request.topic_id:
                    # Check if it's a valid UUID format
                    try:
                        uuid.UUID(content_request.topic_id)
                        topic_id = content_request.topic_id
                    except (ValueError, AttributeError):
                        # Not a valid UUID, try to look up by name or skip
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.warning(f"Invalid topic_id format: {content_request.topic_id}. Skipping topic_id.")
                        # Optionally, you could look up topic by name here
                        # For now, we'll just skip it
                        topic_id = None
                
                # Insert into content table
                content_data = {
                    "id": content_id,
                    "type": content_request.type,
                    "subject": content_request.subject.value,
                    "chapter": content_request.chapter,
                    "topic_id": topic_id,
                    "difficulty": content_request.difficulty,
                    "title": content_request.title,
                    "content_text": content_request.content_text,
                    "metadata": content_request.metadata,
                    "embedding_id": None,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                
                response = self.supabase.table("content").insert(content_data).execute()
                
                if not response.data:
                    raise APIException(
                        code="DATABASE_ERROR",
                        message="Failed to insert content into database",
                        status_code=500
                    )
                
                # Create content item for indexing
                if trigger_indexing:
                    try:
                        content_item = ContentItem(
                            id=content_id,
                            type=ContentType(content_request.type),
                            subject=content_request.subject,
                            chapter=content_request.chapter,
                            topic_id=content_request.topic_id,
                            difficulty=DifficultyLevel(content_request.difficulty) if content_request.difficulty else None,
                            title=content_request.title,
                            content_text=content_request.content_text,
                            metadata=content_request.metadata,
                            embedding_id=None,
                            created_at=datetime.now(),
                            updated_at=datetime.now()
                        )
                        
                        # Index content (don't fail if indexing fails)
                        try:
                            index_result = await content_indexer.index_content_item(content_item)
                            indexed = index_result.get("success", False)
                            embedding_id = content_id
                            
                            # Update embedding_id in database
                            if indexed:
                                self.supabase.table("content")\
                                    .update({"embedding_id": embedding_id})\
                                    .eq("id", content_id)\
                                    .execute()
                        except Exception as index_error:
                            # Log indexing error but don't fail the upload
                            import logging
                            logger = logging.getLogger(__name__)
                            logger.warning(f"Content indexing failed for {content_id}: {str(index_error)}")
                            indexed = False
                    except Exception as item_error:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.warning(f"Failed to create content item for indexing: {str(item_error)}")
                        indexed = False
            
            return ContentUploadResponse(
                id=content_id,
                type=content_request.type,
                subject=content_request.subject,
                embedding_id=embedding_id,
                indexed=indexed,
                message=f"Content uploaded successfully. Indexed: {indexed}"
            )
            
        except APIException:
            raise
        except Exception as e:
            raise APIException(
                code="UPLOAD_ERROR",
                message=f"Failed to upload content: {str(e)}",
                status_code=500
            )
    
    async def upload_file(
        self,
        file_content: bytes,
        file_type: str,
        subject: Subject,
        chapter: Optional[str] = None,
        topic_id: Optional[str] = None,
        difficulty: Optional[str] = None,
        metadata: Optional[Dict] = None,
        filename: Optional[str] = None,
        class_grade: Optional[int] = None
    ) -> ContentUploadResponse:
        """
        Upload content from file (PDF or text)
        
        Args:
            file_content: File content as bytes
            file_type: File MIME type
            subject: Subject
            chapter: Chapter name
            topic_id: Topic ID (must be UUID format)
            difficulty: Difficulty level
            metadata: Additional metadata
        
        Returns:
            ContentUploadResponse
        """
        try:
            # Validate topic_id format if provided (must be UUID)
            validated_topic_id = None
            if topic_id:
                try:
                    # Try to parse as UUID
                    uuid.UUID(topic_id)
                    validated_topic_id = topic_id
                except (ValueError, AttributeError, TypeError):
                    # Not a valid UUID format - log warning and skip
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Invalid topic_id format (not a UUID): {topic_id}. Skipping topic_id.")
                    # Set to None to avoid database error
                    validated_topic_id = None
            
            # Extract text from file
            if file_type == "application/pdf":
                text = self._extract_text_from_pdf(file_content)
            elif file_type.startswith("text/"):
                text = file_content.decode("utf-8")
            else:
                raise APIException(
                    code="UNSUPPORTED_FILE_TYPE",
                    message=f"Unsupported file type: {file_type}",
                    status_code=400
                )
            
            # Upload file to Supabase Storage
            file_url = None
            storage_path = None
            if filename:
                try:
                    # Determine class name (use class_grade if provided, otherwise default to "general")
                    class_name = f"class_{class_grade}" if class_grade else "general"
                    subject_name = subject.value.lower()
                    
                    # Sanitize filename
                    safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
                    
                    # Create storage path: class_name/subject_name/filename
                    storage_path = f"{class_name}/{subject_name}/{safe_filename}"
                    
                    # Upload to Supabase Storage bucket "content"
                    storage_response = self.supabase.storage.from_("content").upload(
                        path=storage_path,
                        file=file_content,
                        file_options={"content-type": file_type, "upsert": "true"}
                    )
                    
                    if storage_response:
                        # Get public URL
                        url_response = self.supabase.storage.from_("content").get_public_url(storage_path)
                        if isinstance(url_response, str):
                            file_url = url_response
                        elif isinstance(url_response, dict):
                            file_url = url_response.get("publicUrl")
                        else:
                            # Try to get URL from response data
                            file_url = getattr(url_response, 'publicUrl', None) if hasattr(url_response, 'publicUrl') else None
                        
                        logger.info(f"File uploaded to storage: {storage_path}, URL: {file_url}")
                except Exception as e:
                    # Log error but don't fail the upload
                    logger.warning(f"Failed to upload file to storage: {str(e)}. Continuing with text extraction only.")
            
            # Prepare metadata with file URL
            content_metadata = metadata or {}
            if file_url:
                content_metadata["pdf_url"] = file_url
                content_metadata["file_url"] = file_url
                content_metadata["storage_path"] = storage_path
                content_metadata["original_filename"] = filename
            
            # Create upload request
            upload_request = ContentUploadRequest(
                type="ncert",
                subject=subject,
                chapter=chapter,
                topic_id=validated_topic_id,
                difficulty=difficulty,
                content_text=text,
                metadata=content_metadata
            )
            
            return await self.upload_content(upload_request)
            
        except APIException:
            raise
        except Exception as e:
            raise APIException(
                code="FILE_UPLOAD_ERROR",
                message=f"Failed to upload file: {str(e)}",
                status_code=500
            )
    
    def _extract_text_from_pdf(self, pdf_content: bytes) -> str:
        """
        Extract text from PDF file
        
        Args:
            pdf_content: PDF file content as bytes
        
        Returns:
            Extracted text
        """
        try:
            pdf_file = BytesIO(pdf_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_parts = []
            for page in pdf_reader.pages:
                text_parts.append(page.extract_text())
            
            return "\n\n".join(text_parts)
            
        except Exception as e:
            raise APIException(
                code="PDF_EXTRACTION_ERROR",
                message=f"Failed to extract text from PDF: {str(e)}",
                status_code=500
            )
    
    async def reindex_all_content(self) -> Dict:
        """
        Re-index all content in the database
        
        Returns:
            Dictionary with reindexing results
        """
        try:
            # Get all content from content table
            content_response = self.supabase.table("content").select("*").execute()
            
            content_items = []
            for row in content_response.data:
                content_items.append(ContentItem(
                    id=row["id"],
                    type=ContentType(row["type"]),
                    subject=Subject(row["subject"]),
                    chapter=row.get("chapter"),
                    topic_id=row.get("topic_id"),
                    difficulty=DifficultyLevel(row["difficulty"]) if row.get("difficulty") else None,
                    title=row.get("title"),
                    content_text=row["content_text"],
                    metadata=row.get("metadata", {}),
                    embedding_id=row.get("embedding_id"),
                    created_at=datetime.fromisoformat(row["created_at"]),
                    updated_at=datetime.fromisoformat(row["updated_at"])
                ))
            
            # Index all content
            result = await content_indexer.index_content_batch(content_items)
            
            return {
                "success": result["success"],
                "total_items": result["total_items"],
                "successful_items": result["successful_items"],
                "failed_items": result["failed_items"],
                "total_chunks": result["total_chunks"],
                "total_embeddings": result["total_embeddings"],
                "message": f"Reindexed {result['successful_items']} out of {result['total_items']} content items"
            }
            
        except Exception as e:
            raise APIException(
                code="REINDEX_ERROR",
                message=f"Failed to reindex content: {str(e)}",
                status_code=500
            )
    
    async def preview_content(self, content_id: str) -> ContentPreview:
        """
        Preview how content appears in RAG pipeline
        
        Args:
            content_id: Content item ID
        
        Returns:
            ContentPreview with chunks and similar content
        """
        try:
            # Get content from database
            content_response = self.supabase.table("content")\
                .select("*")\
                .eq("id", content_id)\
                .execute()
            
            if not content_response.data:
                raise APIException(
                    code="CONTENT_NOT_FOUND",
                    message=f"Content {content_id} not found",
                    status_code=404
                )
            
            row = content_response.data[0]
            
            # Create content item
            content_item = ContentItem(
                id=row["id"],
                type=ContentType(row["type"]),
                subject=Subject(row["subject"]),
                chapter=row.get("chapter"),
                topic_id=row.get("topic_id"),
                difficulty=DifficultyLevel(row["difficulty"]) if row.get("difficulty") else None,
                title=row.get("title"),
                content_text=row["content_text"],
                metadata=row.get("metadata", {}),
                embedding_id=row.get("embedding_id"),
                created_at=datetime.fromisoformat(row["created_at"]),
                updated_at=datetime.fromisoformat(row["updated_at"])
            )
            
            # Get chunks (would need to query vector DB or recreate)
            from app.services.chunking_service import chunking_service
            chunks = chunking_service.chunk_content_item(content_item)
            
            chunk_previews = [
                {
                    "id": chunk["id"],
                    "text": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"],
                    "metadata": chunk["metadata"]
                }
                for chunk in chunks[:5]  # Show first 5 chunks
            ]
            
            return ContentPreview(
                content_id=content_id,
                content_text=content_item.content_text[:500] + "..." if len(content_item.content_text) > 500 else content_item.content_text,
                embedding_id=content_item.embedding_id,
                chunks=chunk_previews,
                similar_content=[],  # Would need to query vector DB
                metadata=content_item.metadata
            )
            
        except APIException:
            raise
        except Exception as e:
            raise APIException(
                code="PREVIEW_ERROR",
                message=f"Failed to preview content: {str(e)}",
                status_code=500
            )


# Global content service instance
content_service = ContentService()
