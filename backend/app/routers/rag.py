"""RAG pipeline endpoints"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.models.rag import (
    RAGQuery,
    RAGResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    SimilaritySearchRequest,
    SimilaritySearchResult
)
from app.models.base import BaseResponse
from app.services.rag_service import rag_service
from app.services.embedding_service import embedding_service
from app.services.vector_db_service import vector_db_service
from app.utils.exceptions import RAGPipelineError, EmbeddingGenerationError, VectorDBError

router = APIRouter(prefix="/rag", tags=["RAG Pipeline"])


@router.post("/query", response_model=RAGResponse)
async def process_rag_query(query: RAGQuery):
    """
    Process a RAG query to retrieve relevant content and generate a response
    
    Args:
        query: RAG query with text, subject, and parameters
        
    Returns:
        RAG response with generated text, contexts, and sources
    """
    try:
        response = await rag_service.query(query)
        return response
    except RAGPipelineError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process RAG query: {str(e)}"
        )


@router.post("/embed", response_model=EmbeddingResponse)
async def generate_embeddings(request: EmbeddingRequest):
    """
    Generate embeddings for one or more texts
    
    Args:
        request: Embedding request with texts and parameters
        
    Returns:
        Embedding response with vectors
    """
    try:
        # Initialize embedding service if needed
        if not embedding_service._initialized:
            await embedding_service.initialize()
        
        # Generate embeddings
        embeddings = await embedding_service.generate_embeddings_batch(
            texts=request.texts,
            batch_size=request.batch_size
        )
        
        return EmbeddingResponse(
            embeddings=embeddings,
            dimension=embedding_service.get_embedding_dimension(),
            model_name=request.model_name,
            count=len(embeddings)
        )
    except EmbeddingGenerationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate embeddings: {str(e)}"
        )


@router.post("/similar", response_model=List[SimilaritySearchResult])
async def find_similar_vectors(request: SimilaritySearchRequest):
    """
    Find similar vectors in the vector database
    
    Args:
        request: Similarity search request with query vector and parameters
        
    Returns:
        List of similar content chunks
    """
    try:
        # Initialize vector DB if needed
        if not vector_db_service._initialized:
            await vector_db_service.initialize()
        
        # Build filters
        filters = request.filters or {}
        if request.subject:
            filters["subject"] = request.subject.value
        
        # Search for similar vectors
        results = await vector_db_service.query_similar(
            query_vector=request.query_vector,
            top_k=request.top_k,
            filters=filters if filters else None
        )
        
        return results
    except VectorDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to find similar vectors: {str(e)}"
        )


@router.get("/stats", response_model=dict)
async def get_vector_db_stats():
    """
    Get vector database statistics
    
    Returns:
        Dictionary with index statistics
    """
    try:
        # Initialize vector DB if needed
        if not vector_db_service._initialized:
            await vector_db_service.initialize()
        
        stats = await vector_db_service.get_index_stats()
        return stats
    except VectorDBError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get vector DB stats: {str(e)}"
        )


@router.post("/initialize", response_model=BaseResponse)
async def initialize_rag_services():
    """
    Initialize RAG services (embedding service and vector database)
    
    Returns:
        Success response
    """
    try:
        # Initialize embedding service
        await embedding_service.initialize()
        
        # Initialize vector database
        await vector_db_service.initialize()
        
        return BaseResponse(
            success=True,
            message="RAG services initialized successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize RAG services: {str(e)}"
        )
