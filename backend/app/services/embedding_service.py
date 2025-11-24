"""Embedding generation service using Vertex AI"""

import asyncio
from typing import List, Optional
from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel
import numpy as np
from app.config import settings
from app.utils.exceptions import EmbeddingGenerationError


class EmbeddingService:
    """Service for generating embeddings using Vertex AI"""
    
    def __init__(self):
        """Initialize Vertex AI and embedding model"""
        aiplatform.init(
            project=settings.google_cloud_project,
            location=settings.vertex_ai_location
        )
        self.model_name = settings.vertex_ai_embedding_model
        self.model = None
        self._initialized = False
    
    async def initialize(self):
        """Initialize the embedding model"""
        if not self._initialized:
            try:
                self.model = TextEmbeddingModel.from_pretrained(self.model_name)
                self._initialized = True
            except Exception as e:
                raise EmbeddingGenerationError(f"Failed to initialize embedding model: {str(e)}")
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text
        
        Args:
            text: Input text to embed
            
        Returns:
            List of floats representing the embedding vector
        """
        if not self._initialized:
            await self.initialize()
        
        try:
            embeddings = self.model.get_embeddings([text])
            return embeddings[0].values
        except Exception as e:
            raise EmbeddingGenerationError(f"Failed to generate embedding: {str(e)}")
    
    async def generate_embeddings_batch(
        self, 
        texts: List[str], 
        batch_size: int = 10
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batches
        
        Args:
            texts: List of input texts to embed
            batch_size: Number of texts to process in each batch
            
        Returns:
            List of embedding vectors
        """
        if not self._initialized:
            await self.initialize()
        
        all_embeddings = []
        
        try:
            # Process in batches
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                embeddings = self.model.get_embeddings(batch)
                all_embeddings.extend([emb.values for emb in embeddings])
                
                # Small delay to avoid rate limiting
                if i + batch_size < len(texts):
                    await asyncio.sleep(0.1)
            
            return all_embeddings
        except Exception as e:
            raise EmbeddingGenerationError(f"Failed to generate batch embeddings: {str(e)}")
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings from this model"""
        # text-embedding-004 produces 768-dimensional embeddings
        return 768
    
    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors
        
        Args:
            vec1: First vector
            vec2: Second vector
            
        Returns:
            Cosine similarity score (0-1)
        """
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        
        dot_product = np.dot(v1, v2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        
        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0
        
        similarity = dot_product / (norm_v1 * norm_v2)
        return float(similarity)


# Global instance
embedding_service = EmbeddingService()
