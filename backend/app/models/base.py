"""Base models and enums"""

from enum import Enum
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class Subject(str, Enum):
    """Subject enumeration for Class 12"""
    MATHEMATICS = "mathematics"
    PHYSICS = "physics"
    CHEMISTRY = "chemistry"
    BIOLOGY = "biology"


class BaseResponse(BaseModel):
    """Base response model"""
    success: bool = True
    message: Optional[str] = None
    timestamp: datetime = datetime.utcnow()


class ErrorResponse(BaseModel):
    """Error response model"""
    error: dict
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid input provided",
                    "details": {},
                    "retryable": False
                }
            }
        }
