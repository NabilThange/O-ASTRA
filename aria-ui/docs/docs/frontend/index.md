---
sidebar_position: 3
title: Frontend — How to Start
---

## Prerequisites

- **Node.js**: Version 18 or higher ([Download here](https://nodejs.org/))
- **npm**: Comes with Node.js
- **Docker Desktop**: Required for backend and database ([Download here](https://www.docker.com/products/docker-desktop))

## Installation

Navigate to the frontend package directory:

```bash
cd packages/aria-ui
```

Install dependencies:

```bash
npm install
```

## Running the Dev Server

Start the development server:

```bash
npm run dev
```

The frontend will be available at:

```
http://localhost:9992
```

**Expected output:**
```
Ready on http://localhost:9992
```

## Environment Variables

Create a `.env` file in `packages/aria-ui/` with the following variables:

```env
# Backend API URL
ARIA_AGENT_BASE_URL=http://localhost:9991

# Desktop VNC WebSocket URL
ARIA_DESKTOP_VNC_URL=ws://localhost:9990/websockify

# Public API URL (used by client-side code)
NEXT_PUBLIC_API_URL=http://localhost:9991
```

### Variable Descriptions

- **ARIA_AGENT_BASE_URL**: URL of the backend API (aria-agent service)
- **ARIA_DESKTOP_VNC_URL**: WebSocket URL for the desktop VNC connection
- **NEXT_PUBLIC_API_URL**: Public-facing API URL accessible from the browser

## Folder Structure

```
packages/aria-ui/
├── src/
│   ├── app/              # Next.js app directory (pages, layouts)
│   ├── components/       # React components
│   ├── lib/              # Utility functions and helpers
│   └── styles/           # CSS and styling files
├── public/               # Static assets
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── next.config.js        # Next.js configuration
└── server.ts             # Custom Express server for proxying
```

## Key Files

### package.json

Defines the project dependencies and scripts:

- **Dependencies**: Next.js 15+, React 19, Socket.io client, react-vnc, Radix UI, Tailwind CSS
- **Scripts**:
  - `npm run dev`: Start development server with custom Express server
  - `npm run build`: Build for production
  - `npm run start`: Start production server
  - `npm run lint`: Run ESLint

### server.ts

Custom Express server that:
- Proxies API requests to the backend (aria-agent)
- Handles WebSocket connections for real-time updates
- Serves the Next.js application

### next.config.js

Next.js configuration including:
- Transpilation of shared packages
- Environment variable handling
- Build optimizations

### tailwind.config.ts

Tailwind CSS configuration with:
- Custom color schemes
- Component styling
- Dark mode support

## Development Workflow

1. **Start Docker services** (Terminal 1):
   ```bash
   cd docker
   docker-compose -f docker-compose.yml up postgres -d
   docker-compose -f docker-compose.core.yml up aria-desktop -d
   ```

2. **Start backend** (Terminal 2):
   ```bash
   cd packages/aria-agent
   npm run start:dev
   ```

3. **Start frontend** (Terminal 3):
   ```bash
   cd packages/aria-ui
   npm run dev
   ```

4. **Open browser**: Navigate to http://localhost:9992

## Troubleshooting

### Error: ECONNREFUSED on port 9991

**Problem**: The UI can't connect to the backend.

**Solution**: Make sure the backend (aria-agent) is running and shows "Listening on port 9991"

### Error: Module not found

**Problem**: Dependencies are missing or outdated.

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: Port 9992 already in use

**Problem**: Another process is using port 9992.

**Solution**:
```bash
# Find the process
lsof -i :9992

# Kill it
kill -9 [PID]

# Or change the port in server.ts
```

### Desktop tab not loading

**Problem**: VNC connection fails.

**Solution**:
1. Check if aria-desktop is running: `docker ps | grep aria-desktop`
2. Verify ARIA_DESKTOP_VNC_URL in .env
3. Restart aria-desktop: `docker restart aria-desktop`

## Building for Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## Additional Notes

- The frontend uses a custom Express server (`server.ts`) instead of the default Next.js server for better control over proxying and WebSocket handling
- Hot module replacement (HMR) is enabled in development mode
- The shared package (`@bytebot/shared`) is automatically built before starting the dev server
