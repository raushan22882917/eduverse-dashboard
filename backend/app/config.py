"""Application configuration management"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Supabase Configuration
    supabase_url: str
    supabase_key: str
    supabase_service_key: str
    
    # Google Cloud Configuration
    google_cloud_project: str
    google_application_credentials: str
    
    # Gemini API
    gemini_api_key: str
    
    # Wolfram Alpha API
    wolfram_app_id: str
    
    # YouTube Data API
    youtube_api_key: str
    
    # Vertex AI Configuration
    vertex_ai_location: str = "us-central1"
    vertex_ai_embedding_model: str = "text-embedding-004"
    
    # Pinecone Configuration
    pinecone_api_key: str
    pinecone_environment: str
    pinecone_index_name: str = "class12-learning"
    
    # Redis Configuration
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""
    
    # Application Configuration
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://localhost:8080"
    
    # Rate Limiting
    rate_limit_per_minute: int = 100
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
