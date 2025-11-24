"""Content chunking service using LangChain"""

from typing import List, Dict
from langchain_text_splitters import RecursiveCharacterTextSplitter
import uuid
from app.models.content import ContentItem
from app.utils.exceptions import ChunkingError


class ChunkingService:
    """Service for chunking content into smaller pieces for RAG"""
    
    def __init__(self):
        """Initialize text splitter"""
        # Default splitter for NCERT content (200-300 words ~ 1000-1500 chars)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1200,  # ~250 words
            chunk_overlap=200,  # ~40 words overlap
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
    
    def chunk_text(
        self,
        text: str,
        chunk_size: int = 1200,
        chunk_overlap: int = 200
    ) -> List[str]:
        """
        Chunk text into smaller pieces
        
        Args:
            text: Input text to chunk
            chunk_size: Maximum size of each chunk in characters
            chunk_overlap: Overlap between chunks in characters
            
        Returns:
            List of text chunks
        """
        try:
            # Create custom splitter if different from default
            if chunk_size != 1200 or chunk_overlap != 200:
                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=chunk_size,
                    chunk_overlap=chunk_overlap,
                    length_function=len,
                    separators=["\n\n", "\n", ". ", " ", ""]
                )
            else:
                splitter = self.text_splitter
            
            chunks = splitter.split_text(text)
            return chunks
        except Exception as e:
            raise ChunkingError(f"Failed to chunk text: {str(e)}")
    
    def chunk_content_item(
        self,
        content_item: ContentItem,
        chunk_size: int = 1200,
        chunk_overlap: int = 200
    ) -> List[Dict]:
        """
        Chunk a content item and prepare for indexing
        
        Args:
            content_item: Content item to chunk
            chunk_size: Maximum size of each chunk
            chunk_overlap: Overlap between chunks
            
        Returns:
            List of chunk dictionaries with metadata
        """
        try:
            chunks = self.chunk_text(
                content_item.content_text,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap
            )
            
            # Prepare chunks with metadata
            chunk_data = []
            for idx, chunk_text in enumerate(chunks):
                chunk_id = f"{content_item.id}_chunk_{idx}"
                
                chunk_metadata = {
                    "chunk_id": chunk_id,
                    "content_id": content_item.id,
                    "text": chunk_text,
                    "chunk_index": idx,
                    "total_chunks": len(chunks),
                    "subject": content_item.subject.value,
                    "type": content_item.type.value,
                    "chapter": content_item.chapter or "",
                    "topic_id": content_item.topic_id or "",
                    "difficulty": content_item.difficulty.value if content_item.difficulty else "",
                }
                
                # Add any additional metadata from content item
                if content_item.metadata:
                    chunk_metadata.update({
                        f"content_{k}": v 
                        for k, v in content_item.metadata.items()
                    })
                
                chunk_data.append({
                    "id": chunk_id,
                    "text": chunk_text,
                    "metadata": chunk_metadata
                })
            
            return chunk_data
        except Exception as e:
            raise ChunkingError(f"Failed to chunk content item: {str(e)}")
    
    def chunk_documents(
        self,
        documents: List[Dict[str, str]],
        chunk_size: int = 1200,
        chunk_overlap: int = 200
    ) -> List[Dict]:
        """
        Chunk multiple documents
        
        Args:
            documents: List of documents with 'text' and 'metadata' keys
            chunk_size: Maximum size of each chunk
            chunk_overlap: Overlap between chunks
            
        Returns:
            List of chunk dictionaries
        """
        try:
            all_chunks = []
            
            for doc in documents:
                text = doc.get("text", "")
                metadata = doc.get("metadata", {})
                doc_id = metadata.get("id", str(uuid.uuid4()))
                
                chunks = self.chunk_text(text, chunk_size, chunk_overlap)
                
                for idx, chunk_text in enumerate(chunks):
                    chunk_id = f"{doc_id}_chunk_{idx}"
                    
                    chunk_metadata = {
                        **metadata,
                        "chunk_id": chunk_id,
                        "chunk_index": idx,
                        "total_chunks": len(chunks),
                        "text": chunk_text
                    }
                    
                    all_chunks.append({
                        "id": chunk_id,
                        "text": chunk_text,
                        "metadata": chunk_metadata
                    })
            
            return all_chunks
        except Exception as e:
            raise ChunkingError(f"Failed to chunk documents: {str(e)}")


# Global instance
chunking_service = ChunkingService()
