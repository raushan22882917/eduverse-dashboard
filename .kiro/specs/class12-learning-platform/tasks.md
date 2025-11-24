# Implementation Plan

- [x] 1. Set up backend infrastructure and configuration
  - Initialize Python FastAPI project with virtual environment (venv or poetry)
  - Set up environment variables for API keys (Gemini, Wolfram, YouTube, Vertex AI)
  - Configure Google Cloud SDK and authentication (service account JSON)
  - Install dependencies (fastapi, uvicorn, supabase-py, google-cloud-aiplatform, langchain)
  - Create basic FastAPI app with CORS middleware and routers
  - Set up project structure (app/, models/, services/, routers/, utils/)
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [x] 2. Set up database schemas and models
  - [x] 2.1 Create Supabase database tables
    - Create topics table with subject, chapter, name, order_index
    - Create content table for NCERT, PYQ, HOTS content with embedding_id
    - Create pyqs table with subject, year, question, solution, marks
    - Create hots_questions table with subject, topic_id, question, solution
    - Create test_sessions table for exam tracking
    - Create videos table with youtube_id, title, transcript, timestamps
    - Create progress table for mastery scores and streaks
    - Create microplans table for daily learning plans
    - _Requirements: 7.5, 10.1, 10.2, 14.1, 6.1, 8.1_ 
  
  - [x] 2.2 Define Pydantic models and schemas
    - Create Subject enum (mathematics, physics, chemistry, biology)
    - Create ContentItem, PYQ, HOTSQuestion Pydantic models
    - Create MasteryScore, Progress, MicroPlan models
    - Create ExamSet, TestSession models
    - Create DoubtQuery, DoubtResponse, WolframStep models
    - Create RAGContext, EmbeddingVector models
    - _Requirements: 6.1, 7.1, 9.1, 14.1, 14.2, 3.4, 4.1_

- [x] 3. Develop RAG pipeline for content retrieval
  - [x] 3.1 Set up vector database and embeddings
    - Configure Pinecone Python client or Vertex AI Matching Engine
    - Create Python script to chunk NCERT content into paragraphs (200-300 words) using LangChain TextSplitter
    - Implement embedding generation using Vertex AI text-embedding-004 model
    - Index content chunks with metadata (subject, chapter, topic, type)
    - Create utility functions for batch embedding generation with async processing
    - _Requirements: 4.1, 4.2, 10.5_
  
  - [x] 3.2 Build RAG service endpoints
    - Create POST /rag/query FastAPI endpoint for processing queries
    - Implement query embedding generation with Vertex AI using google-cloud-aiplatform
    - Add vector similarity search to retrieve top 5 chunks using numpy cosine similarity
    - Build prompt construction with retrieved context for Gemini using LangChain PromptTemplate
    - Integrate Gemini API (gemini-1.5-pro) using google-generativeai library
    - Add source citations and confidence scoring (cosine similarity)
    - Implement fallback logic when confidence < 70%
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4. Create doubt solver with multi-modal input
  - [x] 4.1 Implement text doubt processing
    - Create POST /doubt/text FastAPI endpoint with async handler
    - Add subject and concept classification using Gemini
    - Integrate with RAG service for content retrieval
    - Compose response with NCERT summary, solved example, PYQ, HOTS
    - Store doubt history in Supabase using supabase-py client
    - _Requirements: 3.1, 3.4_
  
  - [x] 4.2 Add image and voice input support
    - Create POST /doubt/image endpoint with file upload using FastAPI UploadFile
    - Integrate Google Cloud Vision API using google-cloud-vision library for OCR
    - Create POST /doubt/voice endpoint with audio file upload
    - Integrate Google Speech-to-Text API using google-cloud-speech library
    - Extract text from image/voice and process as text doubt
    - Handle image preprocessing using Pillow (rotation, contrast adjustment)
    - _Requirements: 3.2, 3.3_
  
  - [x] 4.3 Integrate Wolfram Alpha for math verification
    - Add Wolfram|Alpha API client using wolframalpha Python library
    - Detect numerical questions using regex patterns (equations, integrals, derivatives)
    - Send math problems to Wolfram API with step-by-step parameter
    - Parse Wolfram XML/JSON response using xmltodict and format solutions
    - Implement fallback to Gemini if Wolfram unavailable
    - Add Redis caching for common math queries using redis-py
    - _Requirements: 3.5, 13.1, 13.2, 13.4, 13.5_

- [ ] 5. Build homework assistant with graduated hints
  - [x] 5.1 Create homework session management
    - Create POST /homework/start FastAPI endpoint to initiate session
    - Implement hint generation logic using Gemini (3 levels: basic, detailed, solution)
    - Create POST /homework/attempt endpoint for answer submission
    - Add answer evaluation with Wolfram verification for numerical answers
    - Track attempts and reveal solution after 3 attempts
    - Store homework sessions in Supabase database
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Implement daily micro-plan generation
  - [x] 6.1 Create micro-plan generation logic
    - Build FastAPI endpoint POST /microplan/generate with user_id parameter
    - Implement algorithm to select 1 concept summary, 2 PYQs, 1 HOTS, 1 quiz
    - Add adaptive selection based on student mastery scores from database
    - Implement spaced repetition scheduling using SM-2 algorithm (use sm2 Python library)
    - Store generated micro-plans in database with completion tracking
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 7. Implement exam mode with timed tests
  - [x] 7.1 Create exam set management
    - Build FastAPI endpoint GET /exam/sets with query params for subject/year filtering
    - Create Pydantic models for exam set data structure with questions, duration, marks
    - Create Python script to seed database with sample PYQ sets for all subjects (2015-2024)
    - _Requirements: 7.1_
  
  - [x] 7.2 Build timed test functionality
    - Create POST /exam/start endpoint to begin test session with timestamp
    - Create PUT /exam/answer endpoint for saving answers during test
    - Create POST /exam/submit endpoint for final submission
    - Implement answer evaluation using Gemini for subjective answers
    - Calculate score with marking rubric and store in database
    - Create GET /exam/results/{exam_id} endpoint for test results
    - Create GET /exam/history endpoint for performance trends with user_id query param
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [x] 8. Develop video assistant with YouTube integration
  - [x] 8.1 Set up YouTube API integration
    - Configure YouTube Data API v3 using google-api-python-client library
    - Create FastAPI endpoint POST /videos/curate for adding videos by admin
    - Implement video metadata fetching (title, duration, channel) using YouTube API
    - Add caption/transcript fetching using youtube-transcript-api library
    - Index video transcripts into RAG pipeline with timestamps
    - Create GET /videos/topic/{topic_id} endpoint to fetch videos by topic
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 10.3_

- [x] 9. Create HOTS question generator
  - [x] 9.1 Build question generation logic
    - Create POST /hots/generate FastAPI endpoint with topic_id parameter
    - Implement Gemini prompt for generating 2-3 case-based/application questions
    - Store generated HOTS questions in hots_questions table using Supabase
    - Associate questions with topics and difficulty level
    - Create GET /hots/topic/{topic_id} endpoint to fetch HOTS questions
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x] 9.2 Implement HOTS tracking
    - Create POST /hots/attempt endpoint for answer submission
    - Implement separate mastery tracking for HOTS questions
    - Add topper badge award logic (80% mastery) in progress calculation
    - Create GET /hots/performance/{user_id} endpoint for HOTS analytics
    - _Requirements: 9.4, 9.5_

- [x] 10. Build admin panel backend for content management
  - [x] 10.1 Create admin dashboard endpoints
    - Build GET /admin/dashboard FastAPI endpoint with aggregate metrics
    - Calculate active students count, average mastery score, completion rate using SQL queries
    - Implement student flagging logic (mastery < 50%) in query
    - Return flagged students list with alert details as Pydantic models
    - _Requirements: 11.1, 11.3_
  
  - [x] 10.2 Implement content upload and tagging
    - Build POST /content/upload endpoint with FastAPI UploadFile for NCERT/PYQ/HOTS content
    - Add metadata tagging (subject, chapter, topic, difficulty) using Pydantic models
    - Implement file upload handling for PDFs using PyPDF2 and text files
    - Trigger embedding generation and indexing on content save using background tasks
    - Create POST /content/reindex endpoint for re-indexing all content
    - Create GET /content/preview/{content_id} endpoint for RAG pipeline preview
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 10.3 Build student oversight endpoints
    - Create GET /admin/students endpoint with query params for filters (subject, mastery, activity)
    - Create GET /admin/students/{student_id} endpoint for detailed student profile
    - Implement POST /admin/export endpoint for CSV export using pandas library
    - Include topics completed, time spent, test scores in export
    - _Requirements: 11.2, 11.4, 11.5_

- [ ] 11. Implement progress tracking and analytics
  - [x] 11.1 Create progress endpoints
    - Create GET /progress/{user_id} FastAPI endpoint for fetching progress
    - Implement mastery score calculation (correct answers, time, difficulty) as Python function
    - Create PUT /progress endpoint to update mastery scores
    - Implement streak tracking logic with daily check-ins using datetime
    - Store progress data in Supabase progress table
    - _Requirements: 14.1, 14.2, 14.3, 14.5, 6.5_
  
  - [x] 11.2 Set up BigQuery analytics
    - Configure BigQuery dataset using google-cloud-bigquery library
    - Create tables for user events, test results, progress snapshots
    - Implement event logging from backend services using background tasks
    - Create GET /analytics/dashboard endpoint for admin metrics
    - Create GET /analytics/student/{student_id} endpoint for individual analytics
    - Implement GET /analytics/trends endpoint for performance trends
    - _Requirements: 15.5, 11.1, 11.5_

- [ ] 12. Implement offline content packs
  - [ ] 12.1 Create content pack generation
    - Build FastAPI endpoint POST /packs/generate for creating packs
    - Bundle NCERT chapters, PYQs, videos, transcripts into ZIP using zipfile library
    - Store packs in Google Cloud Storage using google-cloud-storage library with signed URLs
    - Create pack metadata with version, size, and content list
    - Create GET /packs/chapter/{chapter_id} endpoint to fetch pack info
    - _Requirements: 12.1, 12.2_

- [ ] 13. Implement security and API protection
  - [ ] 13.1 Add API security measures
    - Add rate limiting using slowapi library (100 req/min per user)
    - Store API keys securely in environment variables using python-dotenv
    - Implement request validation using Pydantic models
    - Add CORS middleware configuration for allowed origins
    - Set up custom exception handlers with proper HTTP status codes
    - _Requirements: 16.1_

- [ ]* 14. Testing and quality assurance
  - [ ]* 14.1 Write unit tests for critical components
    - Write pytest tests for RAG pipeline query processing
    - Test mastery score calculation logic
    - Test Gemini API integration with mocking
    - Test Wolfram API integration with mocking
    - _Requirements: All_
  
  - [ ]* 14.2 Write integration tests
    - Test end-to-end doubt solver flow using pytest-asyncio
    - Test exam mode from start to results
    - Test content upload and retrieval
    - Test BigQuery analytics logging
    - _Requirements: All_
