---
sidebar_position: 4
title: Backend
---

## Overview

The Aria backend (aria-agent) is a NestJS service that coordinates AI interactions with the desktop environment. It handles task management, communicates with Google Gemini 2.0 for AI capabilities, controls the desktop via computer-use tools, and manages real-time WebSocket connections.

**Framework**: NestJS 11  
**Language**: TypeScript (Node.js 20)  
**AI SDK**: @google/genai v1.8.0

## Prerequisites

- **Node.js**: Version 20 ([Download here](https://nodejs.org/))
- **npm**: Comes with Node.js
- **Docker Desktop**: For PostgreSQL database
- **Google API Key**: Get one at [Google AI Studio](https://aistudio.google.com/apikey)

## Installation & Setup

Navigate to the backend package directory:

```bash
cd packages/aria-agent
```

Install dependencies:

```bash
npm install
```

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

## Running the Backend

Start the development server:

```bash
npm run start:dev
```

**Expected output:**
```
[Nest] INFO [NestApplication] Nest application successfully started
[Nest] INFO Listening on port 9991
```

The backend API will be available at:

```
http://localhost:9991
```

## Environment Variables

Create a `.env` file in `packages/aria-agent/` with the following variables:

```env
# Database connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ariadb

# Google Gemini API key (REQUIRED)
GOOGLE_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here

# Desktop service URL
ARIA_DESKTOP_BASE_URL=http://localhost:9990

# Optional analytics endpoint
ARIA_ANALYTICS_ENDPOINT=
```

### Variable Descriptions

- **DATABASE_URL**: PostgreSQL connection string (format: `postgresql://user:password@host:port/database`)
- **GOOGLE_API_KEY**: Your Google Gemini API key from AI Studio
- **GEMINI_API_KEY**: Same as GOOGLE_API_KEY (used by some modules)
- **ARIA_DESKTOP_BASE_URL**: URL of the desktop service (ariad)
- **ARIA_ANALYTICS_ENDPOINT**: Optional endpoint for analytics tracking

## API Overview

The backend exposes several REST endpoints and WebSocket events:

### REST Endpoints

- **POST /tasks** — Create a new task
- **GET /tasks** — List all tasks
- **GET /tasks/:id** — Get task details
- **DELETE /tasks/:id** — Delete a task
- **POST /tasks/:id/messages** — Add a message to a task
- **GET /computer-use** — Desktop control endpoints

### WebSocket Events

- **task:created** — Emitted when a new task is created
- **task:updated** — Emitted when a task is updated
- **message:created** — Emitted when a new message is added
- **desktop:screenshot** — Desktop screenshot updates

> ⚠️ TODO: Add detailed API documentation with request/response examples

## Folder Structure

```
packages/aria-agent/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── tasks/                     # Task management module
│   ├── messages/                  # Message handling module
│   ├── computer-use/              # Desktop control tools
│   ├── gemini/                    # Gemini AI integration
│   ├── firebase/                  # Firebase/Firestore services
│   └── prisma/                    # Prisma database client
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Database migrations
├── .env                           # Environment variables
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
└── nest-cli.json                  # NestJS CLI configuration
```

## Key Technologies

### NestJS Framework
- Modular architecture with dependency injection
- Built-in support for WebSockets and REST APIs
- TypeScript-first with decorators

### Prisma ORM
- Type-safe database client
- Automatic migrations
- Schema-first approach

### Google GenAI SDK
- Direct integration with Gemini 2.0 models
- Multimodal support (text, images, vision)
- Function calling for tool use
- Extended thinking budget (24,576 tokens)

### Socket.io
- Real-time bidirectional communication
- Event-based messaging
- Room support for task isolation

### Firebase Admin SDK
- Authentication (planned)
- Firestore integration (planned for GCP deployment)

## Database Schema

The backend uses PostgreSQL with Prisma ORM. Key models:

- **Task**: Represents a user task with description, status, timestamps
- **Message**: Messages within a task (user input, AI responses)
- **Session**: Desktop session management
- **User**: User authentication (planned)

To view the schema:

```bash
cat prisma/schema.prisma
```

To create a new migration:

```bash
npx prisma migrate dev --name your_migration_name
```

## Development Scripts

```bash
# Start development server with hot reload
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm run test

# Run linter
npm run lint

# Format code
npm run format

# Prisma commands
npm run prisma:dev    # Generate client + run migrations
npm run prisma:prod   # Deploy migrations + generate client
```

## Troubleshooting

### Error: Database connection failed

**Problem**: Backend can't connect to PostgreSQL.

**Solution**:
1. Check if postgres is running: `docker ps | grep aria-postgres`
2. Restart if needed: `docker restart aria-postgres`
3. Verify DATABASE_URL in `.env`

### Error: API quota exceeded

**Problem**: Gemini API rate limits reached.

**Solution**:
- Free tier limits: 15 req/min, 1,500 req/day
- Monitor at: https://ai.dev/rate-limit
- Wait or upgrade to paid tier

### Error: Module not found

**Problem**: Dependencies are missing.

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

### Error: Port 9991 already in use

**Problem**: Another process is using port 9991.

**Solution**:
```bash
# Find the process
lsof -i :9991

# Kill it
kill -9 [PID]
```

## Production Deployment

For production deployment:

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Build the application
npm run build

# Start production server
npm run start:prod
```

> ⚠️ TODO: Add Google Cloud Run deployment instructions
