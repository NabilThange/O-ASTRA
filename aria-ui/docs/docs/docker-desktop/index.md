---
sidebar_position: 6
title: Docker Desktop
---

## Prerequisites

**Docker Desktop** is required to run Aria's containerized services.

- **Download**: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- **Supported OS**: Windows, macOS, Linux
- **Minimum Requirements**: 4 GB RAM, 20 GB disk space

Make sure Docker Desktop is running before starting any containers (look for the green icon in your system tray).

## Running the Full Stack

Aria uses Docker Compose to orchestrate multiple services. There are two main compose files:

### 1. Core Services (Database + Desktop)

Start PostgreSQL and the Aria Desktop:

```bash
cd docker

# Start PostgreSQL
docker-compose -f docker-compose.yml up postgres -d

# Build Aria Desktop (first time only, takes 5-10 minutes)
docker-compose -f docker-compose.core.yml build aria-desktop

# Start Aria Desktop
docker-compose -f docker-compose.core.yml up aria-desktop -d
```

### 2. Development Mode (All Services)

To run everything in Docker (including backend and frontend):

```bash
cd docker
docker-compose -f docker-compose.development.yml up -d
```

> **Note**: For local development, it's recommended to run backend and frontend outside Docker for faster iteration and hot reload.

## Services Overview

When running the full stack, these containers are created:

| Service | Container Name | Port | Purpose |
|---------|---------------|------|---------|
| **PostgreSQL** | aria-postgres | 5432 | Database for tasks, messages, sessions |
| **Aria Desktop** | aria-desktop | 9990 | Ubuntu desktop with XFCE, Firefox, VS Code, noVNC |
| **Aria Agent** | aria-agent | 9991 | NestJS backend API (optional in Docker) |
| **Aria UI** | aria-ui | 9992 | Next.js frontend (optional in Docker) |

### Aria Desktop (ariad)

The desktop container provides:
- **Ubuntu 22.04** with XFCE desktop environment
- **noVNC** for browser-based desktop access
- **Pre-installed apps**: Firefox, VS Code, file manager, terminal
- **Computer-use API**: REST endpoints for mouse, keyboard, screenshots
- **VNC Server**: For real-time desktop viewing

## Common Commands

### View running containers

```bash
docker ps
```

### View all containers (including stopped)

```bash
docker ps -a
```

### Check container logs

```bash
# View logs
docker logs aria-desktop

# Follow logs in real-time
docker logs -f aria-desktop

# Last 50 lines
docker logs aria-desktop --tail 50
```

### Stop containers

```bash
# Stop specific container
docker stop aria-desktop

# Stop all containers
docker stop $(docker ps -q)
```

### Start containers

```bash
docker start aria-desktop
docker start aria-postgres
```

### Restart containers

```bash
docker restart aria-desktop
docker restart aria-postgres
```

### Remove containers

```bash
# Stop and remove
docker stop aria-desktop
docker rm aria-desktop

# Force remove (even if running)
docker rm -f aria-desktop
```

### Execute commands inside a container

```bash
# Open a bash shell
docker exec -it aria-desktop bash

# Run a single command
docker exec aria-desktop ls /home/ubuntu
```

### View container resource usage

```bash
docker stats
```

### Clean up unused resources

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a
```

## Troubleshooting

### Issue: Port conflicts

**Problem**: Port already in use (5432, 9990, 9991, 9992).

**Solution**:
```bash
# Find what's using the port
lsof -i :9990

# Kill the process
kill -9 [PID]

# Or change the port in docker-compose.yml
```

### Issue: Container crashes immediately

**Problem**: Container starts then stops.

**Solution**:
```bash
# Check logs for errors
docker logs aria-desktop

# Common causes:
# - Missing environment variables
# - Port conflicts
# - Insufficient resources
```

### Issue: Desktop not accessible

**Problem**: Can't connect to http://localhost:9990

**Solution**:
```bash
# Check if container is running
docker ps | grep aria-desktop

# Check logs
docker logs aria-desktop --tail 50

# Restart container
docker restart aria-desktop

# Wait 15 seconds for startup
sleep 15

# Try accessing again
```

### Issue: Out of disk space

**Problem**: Docker runs out of space.

**Solution**:
```bash
# Check disk usage
docker system df

# Clean up
docker system prune -a --volumes

# This removes:
# - Stopped containers
# - Unused networks
# - Dangling images
# - Build cache
# - Unused volumes
```

### Issue: Container build fails

**Problem**: `docker-compose build` fails.

**Solution**:
```bash
# Clear build cache
docker builder prune

# Rebuild without cache
docker-compose -f docker-compose.core.yml build --no-cache aria-desktop
```

### Issue: Volume permission errors

**Problem**: Permission denied when accessing volumes.

**Solution**:
```bash
# On Linux, fix volume permissions
sudo chown -R $USER:$USER ./volumes

# Or run container as root (not recommended)
docker exec -u root -it aria-desktop bash
```

## Docker Compose Files

### docker-compose.yml

Basic services (PostgreSQL only):

```yaml
services:
  postgres:
    image: postgres:15
    container_name: aria-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ariadb
```

### docker-compose.core.yml

Core services (PostgreSQL + Desktop):

```yaml
services:
  postgres:
    # ... (same as above)

  aria-desktop:
    build:
      context: ..
      dockerfile: docker/aria-desktop.Dockerfile
    container_name: aria-desktop
    ports:
      - "9990:9990"
    environment:
      DISPLAY: :99
```

### docker-compose.development.yml

Full stack for development (all services):

> ⚠️ TODO: Add details about development compose file

## Performance Tips

### Allocate more resources to Docker

1. Open Docker Desktop
2. Go to Settings → Resources
3. Increase:
   - **CPUs**: 4+ recommended
   - **Memory**: 8 GB+ recommended
   - **Disk**: 50 GB+ recommended

### Use BuildKit for faster builds

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build with BuildKit
docker-compose build
```

### Cache dependencies

The Dockerfiles are optimized to cache npm dependencies, so rebuilds are faster.

## Accessing the Desktop

Once aria-desktop is running, access it via:

- **noVNC Web Interface**: http://localhost:9990
- **VNC Client**: vnc://localhost:5900 (if exposed)
- **API**: http://localhost:9990/computer-use

The desktop view is also embedded in the Aria UI at http://localhost:9992 (Desktop tab).
