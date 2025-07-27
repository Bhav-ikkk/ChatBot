# AI Chatbot SaaS Platform

A comprehensive AI chatbot platform with Ollama and HuggingFace integration, built with FastAPI and Next.js.

## Features

- 🤖 AI chatbot with Ollama and HuggingFace support
- 🔑 API key management with rate limiting
- 💳 Subscription system with Stripe integration
- 👥 User registration and authentication
- 🛡️ Admin dashboard for user management
- 📊 Analytics and usage tracking
- 🌐 Embeddable widget for websites
- 🚀 Scalable architecture with Redis caching

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis
- Ollama (for local LLM)

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd ai-chatbot-saas
\`\`\`

2. Set up environment variables:
\`\`\`bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp .env.example .env.local
# Edit .env.local with your configuration
\`\`\`

3. Start with Docker Compose:
\`\`\`bash
docker-compose up -d
\`\`\`

4. Initialize the database:
\`\`\`bash
docker-compose exec backend python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine)"
\`\`\`

5. Pull Ollama models:
\`\`\`bash
docker-compose exec ollama ollama pull llama2
docker-compose exec ollama ollama pull mistral
\`\`\`

### Manual Setup

#### Backend Setup

1. Install dependencies:
\`\`\`bash
cd backend
pip install -r requirements.txt
\`\`\`

2. Set up PostgreSQL and Redis

3. Run the backend:
\`\`\`bash
uvicorn main:app --reload
\`\`\`

#### Frontend Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

## API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### API Keys

- `GET /api/keys` - Get user's API keys
- `POST /api/keys` - Create new API key
- `DELETE /api/keys/{key_id}` - Delete API key

### Chat

- `POST /api/chat` - Send message to chatbot
  - Headers: `X-API-Key: your_api_key`
  - Body: `{"message": "Hello", "model": "ollama:llama2"}`

### Admin

- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/{user_id}/limit` - Update user limits
- `GET /api/admin/analytics` - Get platform analytics

## Widget Integration

Generate an embeddable widget from the dashboard and add it to any website:

\`\`\`html
<script>
  (function() {
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/widget.js';
    script.onload = function() {
      window.ChatbotWidget.init({
        apiKey: 'your_api_key',
        apiUrl: 'https://your-api-domain.com'
      });
    };
    document.head.appendChild(script);
  })();
</script>
\`\`\`

## Deployment

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Railway/Render (Backend)

1. Connect your GitHub repository
2. Set environment variables
3. Deploy

### Self-hosted

Use the provided Docker Compose configuration for self-hosting.

## Configuration

### Environment Variables

#### Backend (.env)
\`\`\`
DATABASE_URL=postgresql://user:password@localhost/chatbot_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
STRIPE_SECRET_KEY=sk_test_your_stripe_key
OLLAMA_URL=http://localhost:11434
\`\`\`

#### Frontend (.env.local)
\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:8000
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
