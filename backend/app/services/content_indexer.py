"""Content indexing service for RAG pipeline"""

import asyncio
from typing import List, Dict, Optional
import uuid
from app.models.content import ContentItem
from app.services.embedding_service import embedding_service
from app.services.vector_db_service import vector_db_service
from app.services.chunking_service import chunking_service
from app.utils.exceptions import RAGPipelineError


class ContentIndexer:
    """Service for indexing content into the RAG pipeline"""
    
    def __init__(self):
        """Initialize content indexer"""
        self.embedding_service = embedding_service
        self.vector_db_service = vector_db_service
        self.chunking_service = chunking_service
    
    async def index_content_item(
        self,
        content_item: ContentItem,
        chunk_size: int = 1200,
        chunk_overlap: int = 200
    ) -> Dict:
        """
        Index a single content item into the RAG pipeline
        
        Args:
            content_item: Content item to index
            chunk_size: Size of text chunks
            chunk_overlap: Overlap between chunks
            
        Returns:
            Dictionary with indexing results
        """
        try:
            # Step 1: Chunk the content
            chunks = self.chunking_service.chunk_content_item(
                content_item,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap
            )
            
            if not chunks:
                return {
                    "content_id": content_item.id,
                    "chunks_created": 0,
                    "embeddings_generated": 0,
                    "success": False,
                    "message": "No chunks created from content"
                }
            
            # Step 2: Generate embeddings for all chunks
            chunk_texts = [chunk["text"] for chunk in chunks]
            embeddings = await self.embedding_service.generate_embeddings_batch(
                chunk_texts,
                batch_size=10
            )
            
            # Step 3: Prepare vectors for Pinecone
            vectors = []
            for chunk, embedding in zip(chunks, embeddings):
                vectors.append((
                    chunk["id"],  # vector ID
                    embedding,    # embedding vector
                    chunk["metadata"]  # metadata
                ))
            
            # Step 4: Upsert to vector database
            await self.vector_db_service.upsert_vectors(vectors)
            
            return {
                "content_id": content_item.id,
                "chunks_created": len(chunks),
                "embeddings_generated": len(embeddings),
                "success": True,
                "message": f"Successfully indexed {len(chunks)} chunks"
            }
            
        except Exception as e:
            raise RAGPipelineError(f"Failed to index content item: {str(e)}")
    
    async def index_content_batch(
        self,
        content_items: List[ContentItem],
        chunk_size: int = 1200,
        chunk_overlap: int = 200
    ) -> Dict:
        """
        Index multiple content items in batch
        
        Args:
            content_items: List of content items to index
            chunk_size: Size of text chunks
            chunk_overlap: Overlap between chunks
            
        Returns:
            Dictionary with batch indexing results
        """
        try:
            results = []
            total_chunks = 0
            total_embeddings = 0
            failed_items = []
            
            for content_item in content_items:
                try:
                    result = await self.index_content_item(
                        content_item,
                        chunk_size=chunk_size,
                        chunk_overlap=chunk_overlap
                    )
                    results.append(result)
                    total_chunks += result["chunks_created"]
                    total_embeddings += result["embeddings_generated"]
                except Exception as e:
                    failed_items.append({
                        "content_id": content_item.id,
                        "error": str(e)
                    })
            
            return {
                "total_items": len(content_items),
                "successful_items": len(results),
                "failed_items": len(failed_items),
                "total_chunks": total_chunks,
                "total_embeddings": total_embeddings,
                "failures": failed_items,
                "success": len(failed_items) == 0
            }
            
        except Exception as e:
            raise RAGPipelineError(f"Failed to index content batch: {str(e)}")
    
    async def reindex_content(
        self,
        content_id: str,
        content_item: ContentItem,
        chunk_size: int = 1200,
        chunk_overlap: int = 200
    ) -> Dict:
        """
        Reindex existing content (delete old chunks and create new ones)
        
        Args:
            content_id: ID of content to reindex
            content_item: Updated content item
            chunk_size: Size of text chunks
            chunk_overlap: Overlap between chunks
            
        Returns:
            Dictionary with reindexing results
        """
        try:
            # Step 1: Delete existing chunks for this content
            await self.vector_db_service.delete_by_filter(
                filters={"content_id": content_id}
            )
            
            # Step 2: Index the new content
            result = await self.index_content_item(
                content_item,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap
            )
            
            result["reindexed"] = True
            return result
            
        except Exception as e:
            raise RAGPipelineError(f"Failed to reindex content: {str(e)}")
    
    async def delete_content_index(self, content_id: str) -> Dict:
        """
        Delete all indexed chunks for a content item
        
        Args:
            content_id: ID of content to delete from index
            
        Returns:
            Dictionary with deletion results
        """
        try:
            result = await self.vector_db_service.delete_by_filter(
                filters={"content_id": content_id}
            )
            
            return {
                "content_id": content_id,
                "success": True,
                "message": "Content deleted from index"
            }
            
        except Exception as e:
            raise RAGPipelineError(f"Failed to delete content index: {str(e)}")


# Global instance
content_indexer = ContentIndexer()
