"""Translation service using Google Cloud Translation API"""

from typing import List, Optional
from google.cloud import translate_v2 as translate
from app.config import settings
from app.utils.exceptions import APIException


class TranslationService:
    """Service for multilingual support using Google Cloud Translation API"""
    
    def __init__(self):
        """Initialize translation service"""
        try:
            self.client = translate.Client()
        except Exception as e:
            raise APIException(
                code="TRANSLATION_INIT_ERROR",
                message=f"Failed to initialize translation service: {str(e)}",
                status_code=500
            )
    
    def translate_text(
        self,
        text: str,
        target_language: str = "en",
        source_language: Optional[str] = None
    ) -> str:
        """
        Translate text to target language
        
        Args:
            text: Text to translate
            target_language: Target language code (e.g., 'hi', 'en', 'es')
            source_language: Source language code (auto-detect if None)
        
        Returns:
            Translated text
        """
        try:
            if source_language:
                result = self.client.translate(
                    text,
                    target_language=target_language,
                    source_language=source_language
                )
            else:
                result = self.client.translate(
                    text,
                    target_language=target_language
                )
            return result['translatedText']
        except Exception as e:
            raise APIException(
                code="TRANSLATION_ERROR",
                message=f"Translation failed: {str(e)}",
                status_code=500
            )
    
    def translate_batch(
        self,
        texts: List[str],
        target_language: str = "en",
        source_language: Optional[str] = None
    ) -> List[str]:
        """
        Translate multiple texts to target language
        
        Args:
            texts: List of texts to translate
            target_language: Target language code
            source_language: Source language code (auto-detect if None)
        
        Returns:
            List of translated texts
        """
        try:
            if source_language:
                results = self.client.translate(
                    texts,
                    target_language=target_language,
                    source_language=source_language
                )
            else:
                results = self.client.translate(
                    texts,
                    target_language=target_language
                )
            return [result['translatedText'] for result in results]
        except Exception as e:
            raise APIException(
                code="TRANSLATION_ERROR",
                message=f"Batch translation failed: {str(e)}",
                status_code=500
            )
    
    def detect_language(self, text: str) -> dict:
        """
        Detect the language of text
        
        Args:
            text: Text to detect language for
        
        Returns:
            Dictionary with 'language' and 'confidence' keys
        """
        try:
            result = self.client.detect_language(text)
            return {
                'language': result['language'],
                'confidence': result['confidence']
            }
        except Exception as e:
            raise APIException(
                code="LANGUAGE_DETECTION_ERROR",
                message=f"Language detection failed: {str(e)}",
                status_code=500
            )
    
    def get_supported_languages(self) -> List[dict]:
        """
        Get list of supported languages
        
        Returns:
            List of dictionaries with language codes and names
        """
        try:
            languages = self.client.get_languages()
            return languages
        except Exception as e:
            raise APIException(
                code="LANGUAGES_FETCH_ERROR",
                message=f"Failed to fetch supported languages: {str(e)}",
                status_code=500
            )

