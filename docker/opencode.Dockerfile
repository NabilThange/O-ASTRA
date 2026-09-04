FROM node:20-alpine

WORKDIR /app

# Install OpenCode CLI and create dummy xdg-open for headless container
RUN npm install -g opencode-ai || true && \
    printf '#!/bin/sh\nexit 0\n' > /usr/local/bin/xdg-open && \
    chmod +x /usr/local/bin/xdg-open

# Copy configuration, instructions, skills and MCP server
COPY opencode.json ./opencode.json
COPY AGENTS.md ./AGENTS.md
COPY .opencode /app/.opencode
COPY packages/mcp-bytebot-desktop /app/packages/mcp-bytebot-desktop

EXPOSE 4096

ENV OPENCODE_DISABLE_CLAUDE_CODE=true

CMD ["opencode", "web", "--port", "4096", "--hostname", "0.0.0.0"]
