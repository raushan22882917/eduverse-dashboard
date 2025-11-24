"""Vector database service using Pinecone"""

from typing import List, Dict, Optional
from pinecone import Pinecone, ServerlessSpec
import uuid
from app.config import settings
from app.models.rag import SimilaritySearchResult
from app.utils.exceptions import VectorDBError


class VectorDBService:
    """Service for managing vector database operations with Pinecone"""
    
    def __init__(self):
        """Initialize Pinecone client"""
        self.pc = Pinecone(api_key=settings.pinecone_api_key)
        self.index_name = settings.pinecone_index_name
        self.index = None
        self._initialized = False
    
    async def initialize(self):
        """Initialize or connect to Pinecone index"""
        if not self._initialized:
            try:
                # Check if index exists
                existing_indexes = self.pc.list_indexes()
                
                if self.index_name not in [idx.name for idx in existing_indexes]:
                    # Create index if it doesn't exist
                    self.pc.create_index(
                        name=self.index_name,
                        dimension=768,  # text-embedding-004 dimension
                        metric="cosine",
                        spec=ServerlessSpec(
                            cloud="aws",
                            region=settings.pinecone_environment
                        )
                    )
                
                # Connect to index
                self.index = self.pc.Index(self.index_name)
                self._initialized = True
            except Exception as e:
                raise VectorDBError(f"Failed to initialize vector database: {str(e)}")
    
    async def upsert_vectors(
        self,
        vectors: List[tuple],  # List of (id, vector, metadata)
        namespace: str = ""
    ) -> Dict:
        """
        Upsert vectors into the index
        
        Args:
            vectors: List of tuples (id, vector, metadata)
            namespace: Optional namespace for organizing vectors
            
        Returns:
            Upsert response
        """
        if not self._initialized:
            await self.initialize()
        
        try:
            response = self.index.upsert(
                vectors=vectors,
                namespace=namespace
            )
            return response
        except Exception as e:
            raise VectorDBError(f"Failed to upsert vectors: {str(e)}")
    
    async def query_similar(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filters: Optional[Dict] = None,
        namespace: str = ""
    ) -> List[SimilaritySearchResult]:
        """
        Query for similar vectors
        
        Args:
            query_vector: Query embedding vector
            top_k: Number of results to return
            filters: Optional metadata filters
            namespace: Optional namespace to query
            
        Returns:
            List of similarity search results
        """
        if not self._initialized:
            await self.initialize()
        
        try:
            query_params = {
                "vector": query_vector,
                "top_k": top_k,
                "include_metadata": True,
                "namespace": namespace
            }
            
            if filters:
                query_params["filter"] = filters
            
            response = self.index.query(**query_params)
            
            # Convert to SimilaritySearchResult objects
            results = []
            for match in response.matches:
                metadata = match.metadata or {}
                results.append(
                    SimilaritySearchResult(
                        content_id=metadata.get("content_id", ""),
                        chunk_id=match.id,
                        similarity_score=float(match.score),
                        text=metadata.get("text", ""),
                        metadata=metadata
                    )
                )
            
            return results
        except Exception as e:
            raise VectorDBError(f"Failed to query similar vectors: {str(e)}")
    
    async def delete_vectors(
        self,
        ids: List[str],
        namespace: str = ""
    ) -> Dict:
        """
        Delete vectors by IDs
        
        Args:
            ids: List of vector IDs to delete
            namespace: Optional namespace
            
        Returns:
            Delete response
        """
        if not self._initialized:
            await self.initialize()
        
        try:
            response = self.index.delete(
                ids=ids,
                namespace=namespace
            )
            return response
        except Exception as e:
            raise VectorDBError(f"Failed to delete vectors: {str(e)}")
    
    async def delete_by_filter(
        self,
        filters: Dict,
        namespace: str = ""
    ) -> Dict:
        """
        Delete vectors by metadata filter
        
        Args:
            filters: Metadata filters
            namespace: Optional namespace
            
        Returns:
            Delete response
        """
        if not self._initialized:
            await self.initialize()
        
        try:
            response = self.index.delete(
                filter=filters,
                namespace=namespace
            )
            return response
        except Exception as e:
            raise VectorDBError(f"Failed to delete by filter: {str(e)}")
    
    async def get_index_stats(self) -> Dict:
        """Get index statistics"""
        if not self._initialized:
            await self.initialize()
        
        try:
            stats = self.index.describe_index_stats()
            return stats
        except Exception as e:
            raise VectorDBError(f"Failed to get index stats: {str(e)}")


# Global instance
vector_db_service = VectorDBService()
