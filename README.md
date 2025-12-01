# Eduverse Dashboard - AI-Powered Educational Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3+-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com/)

> An intelligent, AI-driven educational platform featuring autonomous AI tutoring agents, RAG-powered content retrieval, and adaptive learning systems for students and educators.

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [AI Features](#-ai-features)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)
- [Contact](#-contact)

## 🌟 Overview

Eduverse Dashboard is a comprehensive educational technology platform that leverages cutting-edge AI and machine learning to provide personalized learning experiences. The platform addresses multiple **Galuxium Nexus focus domains**:

- **🤖 Autonomous AI Agents**: Intelligent tutoring agents that provide 24/7 personalized assistance
- **📚 Social Good Solutions**: Democratizing quality education through AI-powered learning tools
- **⚡ Developer Productivity Tools**: Advanced teacher tools for content creation, analytics, and student management

### Key Highlights

- ✅ **Production Ready**: Fully functional platform with comprehensive error handling
- ✅ **Multi-modal AI**: Supports text, voice, and image inputs
- ✅ **RAG-Powered**: Retrieval-Augmented Generation for accurate, source-backed responses
- ✅ **Adaptive Learning**: Personalized learning paths based on performance
- ✅ **Multi-language**: Support for 8+ languages
- ✅ **Open Source**: MIT licensed for community contribution

## ✨ Key Features

### 🎓 For Students

- **AI Tutoring System**
  - Multi-modal AI tutor supporting text, voice, and image inputs
  - Context-aware conversations with session history
  - Subject classification and concept detection
  - Mathematical problem solving with Wolfram Alpha integration
  - Multi-language support (8+ languages)

- **Doubt Solver**
  - Instant resolution of academic queries
  - RAG-powered responses with source citations
  - Confidence scores for answers
  - Support for text, voice, and image queries

- **Adaptive Learning**
  - Personalized micro-plans (15-minute daily sessions)
  - Performance-based difficulty adjustment
  - Mastery tracking across topics and subjects
  - Learning gap identification

- **Homework Assistant**
  - Graduated hints system (guides without giving direct answers)
  - Attempt evaluation and feedback
  - Progress tracking per homework session

- **Exam & Quiz System**
  - Comprehensive assessment tools
  - Real-time feedback and results
  - Exam history and performance analytics
  - PYQ (Previous Year Questions) practice

- **Content Library**
  - Access to NCERT materials
  - PYQs and curated educational content
  - Video transcripts and searchable content
  - Downloadable study materials

- **Progress Tracking**
  - Detailed analytics and performance insights
  - Subject-wise progress visualization
  - Achievement system
  - Time spent tracking

### 👨‍🏫 For Teachers

- **AI-Powered Content Creation**
  - Generate educational content using AI
  - Automated content indexing and embedding
  - Bulk content upload and management

- **Student Analytics**
  - Comprehensive performance tracking
  - Learning pattern insights
  - Subject-wise analytics
  - Individual student profiles

- **Exam & Quiz Management**
  - Create and manage assessments
  - AI-assisted question generation
  - Submission tracking and grading
  - Performance analytics

- **Classroom Management**
  - Monitor student progress and engagement
  - Track AI tutor interactions
  - Student performance dashboards

- **Content Library Management**
  - Upload, organize, and manage educational materials
  - Content categorization and tagging
  - Bulk operations and updates

- **AI Tutor Monitoring**
  - Track and analyze student-AI interactions
  - Monitor tutoring session quality
  - Identify learning gaps

### 🏫 For Administrators

- **User Management**
  - Comprehensive user administration
  - Role-based access control
  - User profile management

- **School Management**
  - Multi-school support and management
  - School-teacher-student relationships
  - School-specific analytics

- **Analytics Dashboard**
  - System-wide analytics and insights
  - Usage statistics
  - Performance metrics

- **Content Management**
  - Centralized content administration
  - Content approval and moderation
  - Bulk content operations

- **Notification System**
  - Broadcast announcements and updates
  - Role-specific notifications
  - Notification templates

## 🏗️ Tech Stack

### Frontend

- **Framework**: React 18.3+ with TypeScript
- **Build Tool**: Vite 5.4+
- **Styling**: Tailwind CSS 3.4+ with shadcn/ui components
- **Routing**: React Router v6.30+
- **State Management**: TanStack Query 5.83+
- **Form Handling**: React Hook Form 7.61+ with Zod validation
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Charts**: Recharts 2.15+
- **Markdown**: React Markdown with KaTeX for math rendering

### Backend

- **Framework**: FastAPI (Python 3.11+)
- **Database**: Supabase (PostgreSQL)
- **Vector Database**: Pinecone / Vertex AI Vector Search
- **Authentication**: Supabase Auth

### AI/ML Services

- **Google Cloud Platform**:
  - Vertex AI (embeddings and LLM)
  - Gemini API (content generation)
  - Cloud Vision API (OCR)
  - Cloud Speech API (voice transcription)
  - Cloud Translate API (translations)

- **External APIs**:
  - Wolfram Alpha API (mathematical verification)
  - YouTube Data API (video search)

### Infrastructure

- **Backend Hosting**: Google Cloud Run
- **Frontend Hosting**: Vercel / Netlify / Cloudflare Pages
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage

## 🏛️ Architecture

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

### Key Components

1. **Frontend Layer**: React SPA with role-based routing
2. **API Layer**: FastAPI RESTful API with comprehensive endpoints
3. **AI Services Layer**: Multiple autonomous agents for different tasks
4. **Data Layer**: Supabase PostgreSQL with vector search capabilities
5. **External Services**: Google Cloud AI services and third-party APIs

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
   cd ..
   ```

4. **Start Development Servers**

   **Backend:**
   ```bash
   cd backend
   source venv/bin/activate
   python -m app.main
   # Or: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   **Frontend:**
   ```bash
   npm run dev
   ```

   The application will be available at:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## ⚙️ Configuration

### Frontend Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id

# Backend API URL
VITE_API_BASE_URL=https://your-backend-url.run.app/api

# Optional: YouTube API Key
YOUTUBE_API_KEY=your_youtube_api_key
```

### Backend Environment Variables

Create a `backend/.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Cloud Configuration
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
CORS_ORIGINS=http://localhost:8080,http://localhost:5173
```

### Database Setup

Run Supabase migrations:

```bash
# Apply migrations using Supabase CLI or dashboard
# See supabase/migrations/ for database schema
```

## 📁 Project Structure

```
eduverse-dashboard/
├── src/                          # React frontend
│   ├── components/              # Reusable React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── AdminSidebar.tsx
│   │   ├── StudentSidebar.tsx
│   │   ├── TeacherSidebar.tsx
│   │   ├── ChatInterface.tsx
│   │   └── ...
│   ├── pages/                  # Page components
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── StudentDashboard.tsx
│   │   ├── TeacherDashboard.tsx
│   │   ├── EnhancedAITutor.tsx
│   │   └── ...
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-toast.ts
│   │   └── use-mobile.tsx
│   ├── lib/                    # Utilities and API client
│   │   ├── api.ts             # Comprehensive API client
│   │   ├── utils.ts           # Utility functions
│   │   └── index.ts
│   ├── integrations/           # Third-party integrations
│   │   └── supabase/
│   ├── types/                  # TypeScript type definitions
│   └── App.tsx                # Main app component
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── models/            # Pydantic models and schemas
│   │   ├── routers/           # API route handlers
│   │   ├── services/          # Business logic services
│   │   └── utils/             # Utility functions
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile            # Docker configuration
├── supabase/                  # Database migrations
│   └── migrations/           # SQL migration files
├── docs/                     # Documentation
│   ├── AI_FEATURES.md
│   ├── DEPLOYMENT.md
│   ├── QUICK_START.md
│   └── ...
├── public/                   # Static assets
├── package.json             # Frontend dependencies
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── README.md              # This file
```

## 📚 API Documentation

### Base URL

- **Development**: `http://localhost:8000/api`
- **Production**: `https://your-backend-url.run.app/api`

### Key Endpoints

#### Health Check
```
GET /api/health
```

#### AI Tutoring
```
POST   /api/ai-tutoring/sessions          # Create new session
GET    /api/ai-tutoring/sessions          # Get user sessions
POST   /api/ai-tutoring/sessions/message  # Send message
GET    /api/ai-tutoring/sessions/:id/messages  # Get messages
```

#### RAG (Content Retrieval)
```
POST   /api/rag/query          # Query with RAG
POST   /api/rag/embed         # Generate embeddings
POST   /api/rag/similar       # Find similar content
```

#### Doubt Solver
```
POST   /api/doubt/text        # Text-based doubt
POST   /api/doubt/image       # Image-based doubt
POST   /api/doubt/voice       # Voice-based doubt
```

#### Exams & Quizzes
```
GET    /api/exam/sets         # Get exam sets
POST   /api/exam/start        # Start exam
PUT    /api/exam/answer       # Save answer
POST   /api/exam/submit       # Submit exam
```

For complete API documentation, visit `/docs` when the backend is running.

## 🤖 AI Features

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

For detailed AI features documentation, see [docs/AI_FEATURES.md](./docs/AI_FEATURES.md).

## 🚢 Deployment

### Backend Deployment (Google Cloud Run)

1. **Build Docker Image**
   ```bash
   cd backend
   docker build -t gcr.io/YOUR_PROJECT_ID/eduverse-api:latest .
   ```

2. **Push to Container Registry**
   ```bash
   docker push gcr.io/YOUR_PROJECT_ID/eduverse-api:latest
   ```

3. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy eduverse-api \
     --image gcr.io/YOUR_PROJECT_ID/eduverse-api:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="SUPABASE_URL=...,GEMINI_API_KEY=..."
   ```

### Frontend Deployment

The frontend can be deployed to:
- **Vercel** (Recommended)
- **Netlify**
- **Cloudflare Pages**
- Any static hosting service

```bash
npm run build
# Deploy the dist/ directory
```

For detailed deployment instructions, see [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **Frontend**: ESLint + Prettier (configured)
- **Backend**: Black formatter + Pylint
- **TypeScript**: Strict mode enabled
- **Python**: Type hints required

## 🔧 Troubleshooting

### Common Issues

#### Backend Connection Errors

**Issue**: Frontend cannot connect to backend
- **Solution**: Check `VITE_API_BASE_URL` in `.env` file
- Verify backend is running on the correct port
- Check CORS configuration in backend

#### Supabase Authentication Errors

**Issue**: Authentication not working
- **Solution**: Verify Supabase credentials in `.env`
- Check Supabase project settings
- Ensure RLS policies are configured correctly

#### AI Service Errors

**Issue**: AI features not working
- **Solution**: Verify Google Cloud credentials
- Check API keys in backend `.env`
- Ensure service account has proper permissions

#### Build Errors

**Issue**: Frontend build fails
- **Solution**: Clear cache and rebuild
  ```bash
  rm -rf node_modules/.vite dist
  npm install
  npm run build
  ```

### Getting Help

- Check the [Quick Start Guide](./docs/QUICK_START.md)
- Review [AI Features Documentation](./docs/AI_FEATURES.md)
- See [Deployment Guide](./docs/DEPLOYMENT.md)
- Open an issue on GitHub

## 📖 Documentation

- [Quick Start Guide](./docs/QUICK_START.md) - Get started in 5 minutes
- [AI Features Documentation](./docs/AI_FEATURES.md) - Detailed AI capabilities
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment
- [Project Summary](./docs/PROJECT_SUMMARY.md) - Executive summary
- [Galuxium Nexus Alignment](./docs/GALUXIUM_NEXUS.md) - Focus domain details

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Cloud Platform** for AI/ML services
- **Supabase** for backend infrastructure
- **shadcn/ui** for beautiful UI components
- **The open-source community** for amazing tools and libraries

## 📧 Contact

For questions, issues, or contributions:
- **GitHub Issues**: [Open an issue](https://github.com/yourusername/eduverse-dashboard/issues)
- **Email**: [Your email]
- **Documentation**: See [docs/](./docs/) directory

## 🗺️ Roadmap

### Upcoming Features

- [ ] Advanced personalization with learning style detection
- [ ] Predictive analytics for exam performance
- [ ] Collaborative learning features
- [ ] AR/VR integration
- [ ] Mobile applications (iOS/Android)
- [ ] Offline mode support
- [ ] Advanced analytics dashboard

### Version History

- **v1.0.0** (Current): Initial release with core features
  - AI Tutoring System
  - RAG-powered content retrieval
  - Adaptive learning system
  - Multi-role support (Student, Teacher, Admin)

---

**Built with ❤️ for the future of education**

*Eduverse Dashboard - Empowering learners through AI*
