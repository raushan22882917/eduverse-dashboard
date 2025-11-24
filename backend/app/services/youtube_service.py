"""YouTube API integration service"""

from typing import List, Optional, Dict, Any
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable
)
import logging

from app.config import settings
from app.utils.exceptions import APIException

logger = logging.getLogger(__name__)


class YouTubeService:
    """Service for interacting with YouTube Data API v3"""
    
    def __init__(self):
        """Initialize YouTube API client"""
        self.youtube = build('youtube', 'v3', developerKey=settings.youtube_api_key)
    
    async def get_video_metadata(self, youtube_id: str) -> Dict[str, Any]:
        """
        Fetch video metadata from YouTube API
        
        Args:
            youtube_id: YouTube video ID
            
        Returns:
            Dictionary containing video metadata
            
        Raises:
            APIException: If video not found or API error occurs
        """
        try:
            request = self.youtube.videos().list(
                part='snippet,contentDetails,statistics',
                id=youtube_id
            )
            response = request.execute()
            
            if not response.get('items'):
                raise APIException(
                    status_code=404,
                    error_code="VIDEO_NOT_FOUND",
                    message=f"Video with ID {youtube_id} not found"
                )
            
            video = response['items'][0]
            snippet = video.get('snippet', {})
            content_details = video.get('contentDetails', {})
            
            # Parse duration from ISO 8601 format (PT#H#M#S)
            duration_seconds = self._parse_duration(content_details.get('duration', 'PT0S'))
            
            return {
                'title': snippet.get('title', ''),
                'channel_name': snippet.get('channelTitle', ''),
                'duration_seconds': duration_seconds,
                'description': snippet.get('description', ''),
                'published_at': snippet.get('publishedAt', ''),
                'thumbnail_url': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                'view_count': int(video.get('statistics', {}).get('viewCount', 0)),
                'like_count': int(video.get('statistics', {}).get('likeCount', 0))
            }
            
        except HttpError as e:
            logger.error(f"YouTube API error for video {youtube_id}: {str(e)}")
            raise APIException(
                status_code=500,
                error_code="YOUTUBE_API_ERROR",
                message=f"Failed to fetch video metadata: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error fetching video metadata: {str(e)}")
            raise APIException(
                status_code=500,
                error_code="YOUTUBE_SERVICE_ERROR",
                message=f"Unexpected error: {str(e)}"
            )
    
    async def get_video_transcript(self, youtube_id: str, languages: List[str] = None) -> Optional[str]:
        """
        Fetch video transcript/captions using youtube-transcript-api
        
        Args:
            youtube_id: YouTube video ID
            languages: List of language codes to try (default: ['en', 'hi'])
            
        Returns:
            Transcript text as a single string, or None if not available
        """
        if languages is None:
            languages = ['en', 'hi']  # English and Hindi
        
        try:
            # Try to get transcript in preferred languages
            transcript_list = YouTubeTranscriptApi.list_transcripts(youtube_id)
            
            # Try manual captions first
            try:
                transcript = transcript_list.find_manually_created_transcript(languages)
            except NoTranscriptFound:
                # Fall back to auto-generated captions
                try:
                    transcript = transcript_list.find_generated_transcript(languages)
                except NoTranscriptFound:
                    logger.warning(f"No transcript found for video {youtube_id} in languages {languages}")
                    return None
            
            # Fetch and format transcript
            transcript_data = transcript.fetch()
            transcript_text = ' '.join([entry['text'] for entry in transcript_data])
            
            return transcript_text
            
        except TranscriptsDisabled:
            logger.warning(f"Transcripts disabled for video {youtube_id}")
            return None
        except VideoUnavailable:
            logger.error(f"Video {youtube_id} is unavailable")
            raise APIException(
                status_code=404,
                error_code="VIDEO_UNAVAILABLE",
                message=f"Video {youtube_id} is unavailable"
            )
        except Exception as e:
            logger.error(f"Error fetching transcript for video {youtube_id}: {str(e)}")
            return None
    
    async def get_transcript_with_timestamps(
        self, 
        youtube_id: str, 
        languages: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch video transcript with timestamps
        
        Args:
            youtube_id: YouTube video ID
            languages: List of language codes to try
            
        Returns:
            List of transcript entries with timestamps
        """
        if languages is None:
            languages = ['en', 'hi']
        
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(youtube_id)
            
            # Try manual captions first
            try:
                transcript = transcript_list.find_manually_created_transcript(languages)
            except NoTranscriptFound:
                try:
                    transcript = transcript_list.find_generated_transcript(languages)
                except NoTranscriptFound:
                    logger.warning(f"No transcript found for video {youtube_id}")
                    return []
            
            # Fetch transcript with timestamps
            transcript_data = transcript.fetch()
            
            # Format: [{'time': seconds, 'text': 'transcript text', 'duration': seconds}]
            formatted_transcript = [
                {
                    'time': int(entry['start']),
                    'text': entry['text'],
                    'duration': entry['duration']
                }
                for entry in transcript_data
            ]
            
            return formatted_transcript
            
        except Exception as e:
            logger.error(f"Error fetching transcript with timestamps: {str(e)}")
            return []
    
    def _parse_duration(self, duration_str: str) -> int:
        """
        Parse ISO 8601 duration format (PT#H#M#S) to seconds
        
        Args:
            duration_str: Duration string in ISO 8601 format
            
        Returns:
            Duration in seconds
        """
        import re
        
        # Remove PT prefix
        duration_str = duration_str.replace('PT', '')
        
        # Extract hours, minutes, seconds
        hours = 0
        minutes = 0
        seconds = 0
        
        hours_match = re.search(r'(\d+)H', duration_str)
        if hours_match:
            hours = int(hours_match.group(1))
        
        minutes_match = re.search(r'(\d+)M', duration_str)
        if minutes_match:
            minutes = int(minutes_match.group(1))
        
        seconds_match = re.search(r'(\d+)S', duration_str)
        if seconds_match:
            seconds = int(seconds_match.group(1))
        
        return hours * 3600 + minutes * 60 + seconds
    
    async def search_videos(
        self, 
        query: str, 
        max_results: int = 10,
        order: str = 'relevance'
    ) -> List[Dict[str, Any]]:
        """
        Search for videos on YouTube
        
        Args:
            query: Search query
            max_results: Maximum number of results to return
            order: Sort order (relevance, date, rating, viewCount)
            
        Returns:
            List of video metadata dictionaries
        """
        try:
            request = self.youtube.search().list(
                part='snippet',
                q=query,
                type='video',
                maxResults=max_results,
                order=order,
                relevanceLanguage='en',
                safeSearch='strict'
            )
            response = request.execute()
            
            videos = []
            for item in response.get('items', []):
                video_id = item['id']['videoId']
                snippet = item['snippet']
                
                videos.append({
                    'youtube_id': video_id,
                    'title': snippet.get('title', ''),
                    'channel_name': snippet.get('channelTitle', ''),
                    'description': snippet.get('description', ''),
                    'published_at': snippet.get('publishedAt', ''),
                    'thumbnail_url': snippet.get('thumbnails', {}).get('high', {}).get('url', '')
                })
            
            return videos
            
        except HttpError as e:
            logger.error(f"YouTube search error: {str(e)}")
            raise APIException(
                status_code=500,
                error_code="YOUTUBE_SEARCH_ERROR",
                message=f"Failed to search videos: {str(e)}"
            )


# Global service instance
youtube_service = YouTubeService()
