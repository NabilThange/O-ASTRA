# BYTEBOT LOCAL SETUP GUIDE

## System Requirements
- Docker Desktop (already installed ✓)
- 4GB+ RAM available
- Git (for cloning the repository)
- At least one AI API key (see options below)

---

## QUICK START (Recommended Method)

### 1. Clone the Repository
```bash
git clone https://github.com/bytebot-ai/bytebot.git
cd bytebot
```

### 2. Configure Environment Variables
Create a `.env` file in the `docker/` directory:

```bash
# Choose ONE AI provider:

# Option A: Anthropic Claude (recommended)
echo "ANTHROPIC_API_KEY=sk-ant-your_key_here" > docker/.env

# Option B: OpenAI GPT
echo "OPENAI_API_KEY=sk-your_key_here" > docker/.env

# Option C: Google Gemini
echo "GEMINI_API_KEY=your_key_here" > docker/.env

# Option D: FREE - GroqCloud (fast, free tier)
echo "OPENAI_COMPATIBLE_BASE_URL=https://api.groq.com/openai/v1" >> docker/.env
echo "OPENAI_COMPATIBLE_API_KEY=gsk_your_groq_key_here" >> docker/.env
echo "OPENAI_COMPATIBLE_MODELS=llama-3.3-70b-versatile,llama-3.1-8b-instant" >> docker/.env
```

### 3. Start All Services with Docker
```bash
docker-compose -f docker/docker-compose.yml up -d
```

This single command starts 4 containers:
- **bytebot-desktop**: Virtual Ubuntu desktop environment
- **postgres**: PostgreSQL database
- **bytebot-agent**: AI agent backend (NestJS)
- **bytebot-ui**: Web interface (Next.js)

### 4. Access the Application
- **Main UI**: http://localhost:9992 (create and manage tasks)
- **Desktop VNC**: http://localhost:9990/vnc (direct desktop access)
- **Agent API**: http://localhost:9991 (REST API)
- **Desktop API**: http://localhost:9990/computer-use (low-level control)

**First startup takes 2-3 minutes** to download images (~4GB total).

---

## DEVELOPMENT SETUP (For Contributors)

If you want to modify the code and run services locally:

### 1. Prerequisites
- Node.js 20.x
- npm
- Docker Desktop

### 2. Start Infrastructure Only
```bash
# Start just the desktop and database containers
docker-compose -f docker/docker-compose.development.yml up -d
```

### 3. Install Dependencies

**For the Agent (Backend):**
```bash
cd packages/bytebot-agent
npm install
npm run prisma:dev  # Setup database
```

**For the UI (Frontend):**
```bash
cd packages/bytebot-ui
npm install
```

**For Shared Library:**
```bash
cd packages/shared
npm install
npm run build
```

### 4. Run Backend (Agent)
```bash
cd packages/bytebot-agent

# Set environment variables
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bytebotdb"
export BYTEBOT_DESKTOP_BASE_URL="http://localhost:9990"
export ANTHROPIC_API_KEY="sk-ant-your_key_here"
# OR: export OPENAI_API_KEY="sk-your_key_here"
# OR: export GEMINI_API_KEY="your_key_here"

# Start in development mode (auto-reload)
npm run start:dev

# Or start in production mode
npm run start:prod
```

The agent runs on **port 9991**.

### 5. Run Frontend (UI)
```bash
cd packages/bytebot-ui

# Set environment variables
export BYTEBOT_AGENT_BASE_URL="http://localhost:9991"
export BYTEBOT_DESKTOP_VNC_URL="http://localhost:9990/websockify"

# Start in development mode
npm run dev

# Or build and start production
npm run build
npm run start
```

The UI runs on **port 9992**.

---

## DOCKER COMMANDS REFERENCE

### View Logs
```bash
# All services
docker-compose -f docker/docker-compose.yml logs -f

# Specific service
docker-compose -f docker/docker-compose.yml logs -f bytebot-agent
docker-compose -f docker/docker-compose.yml logs -f bytebot-ui
docker-compose -f docker/docker-compose.yml logs -f bytebot-desktop
```

### Stop Services
```bash
docker-compose -f docker/docker-compose.yml down
```

### Update to Latest Images
```bash
docker-compose -f docker/docker-compose.yml pull
docker-compose -f docker/docker-compose.yml up -d
```

### Reset Everything (Delete Data)
```bash
docker-compose -f docker/docker-compose.yml down -v
```

### Desktop Only (No AI Agent)
```bash
# Just run the virtual desktop
docker-compose -f docker/docker-compose.core.yml up -d
# Access at http://localhost:9990/vnc
```

### With LiteLLM Proxy (Multiple AI Providers)
```bash
docker-compose -f docker/docker-compose.proxy.yml up -d
```

---

## PROJECT ARCHITECTURE

```
bytebot/
├── packages/
│   ├── bytebot-agent/      # Backend (NestJS, port 9991)
│   │   ├── src/            # Agent logic, AI orchestration
│   │   ├── prisma/         # Database schema
│   │   └── package.json    # Node.js 20, Prisma, Anthropic SDK
│   │
│   ├── bytebot-ui/         # Frontend (Next.js 15, port 9992)
│   │   ├── src/            # React components, task interface
│   │   ├── server.ts       # Custom Express server
│   │   └── package.json    # React 19, Next.js, VNC client
│   │
│   ├── bytebotd/           # Desktop daemon (Node.js, port 9990)
│   │   ├── src/            # Desktop control API
│   │   ├── root/           # Ubuntu system files
│   │   └── Dockerfile      # Ubuntu 22.04 + XFCE4
│   │
│   ├── shared/             # Shared TypeScript types
│   │   └── src/            # Common interfaces
│   │
│   └── bytebot-llm-proxy/  # LiteLLM proxy (optional)
│
├── docker/                 # Docker configurations
│   ├── docker-compose.yml          # Full stack
│   ├── docker-compose.development.yml  # Dev mode
│   ├── docker-compose.core.yml     # Desktop only
│   ├── docker-compose.proxy.yml    # With LiteLLM
│   └── .env.example               # Environment template
│
└── docs/                   # Documentation (Mintlify)
```

---

## KEY TECHNOLOGIES

**Backend (bytebot-agent):**
- NestJS (Node.js framework)
- Prisma ORM + PostgreSQL
- Anthropic SDK / OpenAI SDK / Google Gemini SDK
- WebSockets (Socket.io)
- TypeScript

**Frontend (bytebot-ui):**
- Next.js 15 (React 19)
- TailwindCSS
- react-vnc (VNC client)
- Socket.io client
- TypeScript

**Desktop (bytebotd):**
- Ubuntu 22.04 LTS
- XFCE4 desktop environment
- noVNC (browser VNC client)
- Firefox, Thunderbird, VS Code, 1Password
- Node.js 20 (desktop control daemon)

---

## TESTING THE SETUP

Once everything is running, try these tasks in the UI:

1. **Simple test**: "Take a screenshot of the desktop"
2. **Web task**: "Open Firefox and search for weather"
3. **File task**: "Create a text file called test.txt"
4. **Complex task**: "Find the top 5 AI news stories and summarize them"

---

## TROUBLESHOOTING

**Container won't start:**
```bash
docker info  # Check Docker is running
docker-compose -f docker/docker-compose.yml logs
```

**Can't connect to UI:**
```bash
docker-compose -f docker/docker-compose.yml ps  # All should be "Up"
```

**Agent errors:**
```bash
cat docker/.env  # Verify API key is set
docker-compose -f docker/docker-compose.yml logs bytebot-agent
```

**Database issues:**
```bash
# Reset database
docker-compose -f docker/docker-compose.yml down -v
docker-compose -f docker/docker-compose.yml up -d
```

---

## PORTS SUMMARY

| Port | Service | Purpose |
|------|---------|---------|
| 9990 | bytebotd | Desktop control API + noVNC |
| 9991 | bytebot-agent | AI agent REST API |
| 9992 | bytebot-ui | Web interface |
| 5432 | postgres | Database (internal) |
| 4000 | llm-proxy | LiteLLM proxy (optional) |

---

## RECOMMENDED WORKFLOW

1. **For just using Bytebot**: Use Docker Compose (quickest)
2. **For development**: Use development compose file + run agent/ui locally
3. **For testing desktop only**: Use core compose file

This setup gives you a complete AI desktop agent running locally with full privacy and control!
