# Eduverse Dashboard - AI-Powered Educational Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3+-61dafb.svg)](https://reactjs.org/)

> An intelligent, AI-driven educational platform featuring autonomous AI tutoring agents, RAG-powered content retrieval, and adaptive learning systems for students and educators.

## 🌟 Overview

Eduverse Dashboard is a comprehensive educational technology platform that leverages cutting-edge AI and machine learning to provide personalized learning experiences. The platform addresses multiple **Galuxium Nexus focus domains**:

- **🤖 Autonomous AI Agents**: Intelligent tutoring agents that provide 24/7 personalized assistance
- **📚 Social Good Solutions**: Democratizing quality education through AI-powered learning tools
- **⚡ Developer Productivity Tools**: Advanced teacher tools for content creation, analytics, and student management

## ✨ Key Features

### 🎓 For Students

- **AI Tutoring System**: Multi-modal AI tutor supporting text, voice, and image inputs
- **Doubt Solver**: Instant resolution of academic queries with RAG-powered responses
- **Adaptive Learning**: Personalized micro-plans and learning paths based on performance
- **Homework Assistant**: Graduated hints system that guides without giving direct answers
- **Exam & Quiz System**: Comprehensive assessment tools with real-time feedback
- **Content Library**: Access to NCERT materials, PYQs, and curated educational content
- **Progress Tracking**: Detailed analytics and performance insights
- **Multi-language Support**: Translation and tutoring in 8+ languages

### 👨‍🏫 For Teachers

- **AI-Powered Content Creation**: Generate educational content using AI
- **Student Analytics**: Comprehensive performance tracking and insights
- **Exam & Quiz Management**: Create and manage assessments with AI assistance
- **Classroom Management**: Monitor student progress and engagement
- **Content Library Management**: Upload, organize, and manage educational materials
- **AI Tutor Monitoring**: Track and analyze student-AI interactions

### 🏫 For Administrators

- **User Management**: Comprehensive user administration
- **School Management**: Multi-school support and management
- **Analytics Dashboard**: System-wide analytics and insights
- **Content Management**: Centralized content administration
- **Notification System**: Broadcast announcements and updates

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18.3+ with TypeScript
- Vite for build tooling
- Tailwind CSS + shadcn/ui for styling
- React Router for navigation
- TanStack Query for data fetching
- Supabase for authentication and real-time features

**Backend:**
- FastAPI (Python 3.11+)
- Google Cloud Platform services:
  - Vertex AI for embeddings and LLM
  - Gemini API for content generation
  - Cloud Vision API for OCR
  - Cloud Speech API for voice transcription
  - Cloud Translate API for translations
- Supabase (PostgreSQL) for database
- Pinecone/Vertex AI Vector Search for vector storage
- Wolfram Alpha API for mathematical verification

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/TypeScript)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Student UI   │  │ Teacher UI   │  │ Admin UI     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (FastAPI)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ RAG Service  │  │ AI Tutoring  │  │ Content Mgmt │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Vertex AI    │  │ Supabase     │  │ Wolfram Alpha│
│ (Embeddings) │  │ (Database)   │  │ (Math)       │
└──────────────┘  └──────────────┘  └──────────────┘
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11 or higher
- **Google Cloud SDK** (for GCP services)
- **Supabase** account and project
- **Service account JSON** file for Google Cloud authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/eduverse-dashboard.git
   cd eduverse-dashboard
   ```

2. **Frontend Setup**
   ```bash
   npm install
   ```

3. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Environment Configuration**

   Create a `.env` file in the `backend` directory:
   ```env
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   
   # Google Cloud
   GOOGLE_CLOUD_PROJECT=your_project_id
   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
   GEMINI_API_KEY=your_gemini_api_key
   
   # Vector Database
   PINECONE_API_KEY=your_pinecone_key
   PINECONE_ENVIRONMENT=your_environment
   
   # External APIs
   WOLFRAM_APP_ID=your_wolfram_app_id
   YOUTUBE_API_KEY=your_youtube_api_key
   
   # App Configuration
   APP_ENV=development
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

   Create a `.env` file in the root directory for frontend:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:8000
   ```

5. **Database Setup**

   Run Supabase migrations:
   ```bash
   # Apply migrations (see supabase/migrations/)
   # Use Supabase CLI or dashboard
   ```

6. **Start Development Servers**

   **Backend:**
   ```bash
   cd backend
   python -m app.main
   # Or: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   **Frontend:**
   ```bash
   npm run dev
   ```

   The application will be available at:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 📖 Documentation

- [Backend API Documentation](./backend/README.md)
- [AI Features Documentation](./docs/AI_FEATURES.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Quick Start Guide](./docs/QUICK_START.md)

## 🤖 AI Features Deep Dive

### 1. RAG (Retrieval-Augmented Generation) Pipeline

The platform implements a sophisticated RAG system that:
- Generates embeddings using Vertex AI
- Retrieves relevant content chunks from NCERT, PYQs, and video transcripts
- Provides source citations and confidence scores
- Supports semantic search across educational content

### 2. Autonomous AI Tutoring Agents

- **Multi-modal Input**: Text, voice, and image support
- **Context-Aware Responses**: Maintains conversation context across sessions
- **Subject Classification**: Automatically identifies subject and concepts
- **Mathematical Verification**: Integrates Wolfram Alpha for step-by-step solutions
- **Multi-language Support**: Translates and responds in 8+ languages

### 3. Adaptive Learning System

- **Personalized Micro-plans**: Daily 15-minute learning sessions
- **Performance-Based Adaptation**: Adjusts difficulty based on student performance
- **Mastery Tracking**: Tracks proficiency across topics and subjects
- **Progress Analytics**: Detailed insights into learning patterns

### 4. Content Intelligence

- **Automated Content Indexing**: Processes PDFs, videos, and text
- **Vector Embeddings**: Creates searchable vector representations
- **Content Recommendations**: Suggests relevant materials based on learning progress

## 📁 Project Structure

```
eduverse-dashboard/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/         # Pydantic models and schemas
│   │   ├── routers/        # API route handlers
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Utility functions
│   ├── requirements.txt    # Python dependencies
│   └── README.md           # Backend documentation
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── contexts/          # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and API client
│   └── types/              # TypeScript type definitions
├── supabase/              # Database migrations
│   └── migrations/        # SQL migration files
└── README.md              # This file
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests (if configured)
npm test
```

## 🚢 Deployment

### Backend Deployment (Google Cloud Run)

1. Build Docker image:
   ```bash
   docker build -t eduverse-api ./backend
   ```

2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy eduverse-api --image eduverse-api
   ```

### Frontend Deployment

The frontend can be deployed to:
- Vercel
- Netlify
- Cloudflare Pages
- Any static hosting service

```bash
npm run build
# Deploy the dist/ directory
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Google Cloud Platform for AI/ML services
- Supabase for backend infrastructure
- The open-source community for amazing tools and libraries

## 📧 Contact

For questions, issues, or contributions, please open an issue on GitHub.

---

**Built with ❤️ for the future of education**

