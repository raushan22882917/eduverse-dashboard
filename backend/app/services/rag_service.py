"""RAG (Retrieval-Augmented Generation) service"""

from typing import List, Optional, Dict
import google.generativeai as genai
from langchain_core.prompts import PromptTemplate
from app.config import settings
from app.models.rag import RAGQuery, RAGResponse, RAGContext
from app.services.embedding_service import embedding_service
from app.services.vector_db_service import vector_db_service
from app.utils.exceptions import RAGPipelineError


class RAGService:
    """Service for RAG pipeline operations"""
    
    def __init__(self):
        """Initialize RAG service"""
        self.embedding_service = embedding_service
        self.vector_db_service = vector_db_service
        self._gemini_initialized = False
        
        # Prompt template for RAG
        self.prompt_template = PromptTemplate(
            input_variables=["context", "query"],
            template="""You are an expert tutor for Class 12 students in India. Use the following context from NCERT textbooks and educational materials to answer the student's question.

Context:
{context}

Student's Question: {query}

Instructions:
1. Provide a clear, accurate answer based on the context provided
2. Use simple language appropriate for Class 12 students
3. Include relevant examples or explanations
4. If the context doesn't contain enough information, acknowledge this
5. Cite the sources used in your answer

Answer:"""
        )
    
    def _initialize_gemini(self):
        """Initialize Gemini API"""
        if not self._gemini_initialized:
            genai.configure(api_key=settings.gemini_api_key)
            self._gemini_initialized = True
    
    async def query(
        self,
        query: RAGQuery
    ) -> RAGResponse:
        """
        Process a RAG query
        
        Args:
            query: RAG query object
            
        Returns:
            RAG response with generated text and sources
        """
        try:
            # Step 1: Generate query embedding
            query_embedding = await self.embedding_service.generate_embedding(
                query.query
            )
            
            # Step 2: Build filters if subject is specified
            filters = query.filters.copy() if query.filters else {}
            if query.subject:
                filters["subject"] = query.subject.value
            
            # Step 3: Retrieve similar content chunks
            search_results = await self.vector_db_service.query_similar(
                query_vector=query_embedding,
                top_k=query.top_k,
                filters=filters if filters else None
            )
            
            # Step 4: Check if we have sufficient confidence
            if not search_results:
                return RAGResponse(
                    query=query.query,
                    generated_text="I couldn't find relevant information in the available content. Please try rephrasing your question or ask about a different topic.",
                    contexts=[],
                    confidence=0.0,
                    sources=[],
                    metadata={"reason": "no_results"}
                )
            
            # Calculate average confidence
            avg_confidence = sum(r.similarity_score for r in search_results) / len(search_results)
            
            # Step 5: Check confidence threshold
            if avg_confidence < query.confidence_threshold:
                return RAGResponse(
                    query=query.query,
                    generated_text=f"I found some related content, but I'm not confident enough (confidence: {avg_confidence:.2%}) to provide an accurate answer. Could you please rephrase your question or provide more context?",
                    contexts=[],
                    confidence=avg_confidence,
                    sources=[],
                    metadata={"reason": "low_confidence", "threshold": query.confidence_threshold}
                )
            
            # Step 6: Build context from retrieved chunks
            contexts = []
            context_text_parts = []
            sources = []
            
            for idx, result in enumerate(search_results):
                # Create RAGContext object
                rag_context = RAGContext(
                    chunk_id=result.chunk_id,
                    content_id=result.content_id,
                    text=result.text,
                    similarity_score=result.similarity_score,
                    metadata=result.metadata,
                    source_type=result.metadata.get("type", "unknown"),
                    subject=query.subject
                )
                contexts.append(rag_context)
                
                # Build context text
                context_text_parts.append(
                    f"[Source {idx + 1}] ({result.metadata.get('type', 'content')} - "
                    f"{result.metadata.get('chapter', 'N/A')})\n{result.text}"
                )
                
                # Build sources list
                sources.append({
                    "id": result.content_id,
                    "type": result.metadata.get("type", "unknown"),
                    "subject": result.metadata.get("subject", ""),
                    "chapter": result.metadata.get("chapter", ""),
                    "similarity": result.similarity_score
                })
            
            context_text = "\n\n".join(context_text_parts)
            
            # Step 7: Generate response using Gemini
            self._initialize_gemini()
            
            prompt = self.prompt_template.format(
                context=context_text,
                query=query.query
            )
            
            model = genai.GenerativeModel('gemini-1.5-pro')
            response = model.generate_content(prompt)
            
            generated_text = response.text if response.text else "I couldn't generate a response. Please try again."
            
            # Step 8: Return RAG response
            return RAGResponse(
                query=query.query,
                generated_text=generated_text,
                contexts=contexts,
                confidence=avg_confidence,
                sources=sources,
                metadata={
                    "model": "gemini-1.5-pro",
                    "chunks_retrieved": len(search_results)
                }
            )
            
        except Exception as e:
            raise RAGPipelineError(f"Failed to process RAG query: {str(e)}")
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a text
        
        Args:
            text: Input text
            
        Returns:
            Embedding vector
        """
        try:
            return await self.embedding_service.generate_embedding(text)
        except Exception as e:
            raise RAGPipelineError(f"Failed to generate embedding: {str(e)}")
    
    async def find_similar_content(
        self,
        text: str,
        top_k: int = 5,
        filters: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Find similar content to given text
        
        Args:
            text: Input text to find similar content for
            top_k: Number of results to return
            filters: Optional metadata filters
            
        Returns:
            List of similar content items
        """
        try:
            # Generate embedding for input text
            embedding = await self.embedding_service.generate_embedding(text)
            
            # Search for similar vectors
            results = await self.vector_db_service.query_similar(
                query_vector=embedding,
                top_k=top_k,
                filters=filters
            )
            
            # Convert to dict format
            return [
                {
                    "content_id": r.content_id,
                    "chunk_id": r.chunk_id,
                    "text": r.text,
                    "similarity_score": r.similarity_score,
                    "metadata": r.metadata
                }
                for r in results
            ]
            
        except Exception as e:
            raise RAGPipelineError(f"Failed to find similar content: {str(e)}")


# Global instance
rag_service = RAGService()
