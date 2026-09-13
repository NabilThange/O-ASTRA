---
sidebar_position: 5
title: Docker — Database
---

## Overview

Aria uses PostgreSQL as its primary database, running in a Docker container for easy setup and isolation. The database stores tasks, messages, sessions, and other application data.

**Database**: PostgreSQL  
**Container Name**: aria-postgres  
**Port**: 5432

## Starting the Database Container

Navigate to the docker directory:

```bash
cd docker
```

Start the PostgreSQL container:

```bash
docker-compose -f docker-compose.yml up postgres -d
```

The `-d` flag runs the container in detached mode (background).

**Verify it's running:**

```bash
docker ps | grep aria-postgres
```

You should see output like:

```
aria-postgres   postgres:15   Up 2 minutes   0.0.0.0:5432->5432/tcp
```

## Connection String

The database is accessible at:

```
postgresql://postgres:postgres@localhost:5432/ariadb
```

**Connection details:**
- **Host**: localhost
- **Port**: 5432
- **Username**: postgres
- **Password**: postgres
- **Database**: ariadb

This connection string should be set in `packages/aria-agent/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ariadb
```

## Running Migrations

After starting the database, run Prisma migrations to create the schema:

```bash
cd packages/aria-agent
npx prisma migrate deploy
npx prisma generate
```

This creates all necessary tables (tasks, messages, sessions, etc.).

## Inspecting the Database

### Using psql (CLI)

Connect to the database using psql:

```bash
docker exec -it aria-postgres psql -U postgres -d ariadb
```

Common psql commands:

```sql
-- List all tables
\dt

-- Describe a table
\d tasks

-- Query data
SELECT * FROM tasks;

-- Exit
\q
```

### Using pgAdmin (GUI)

1. Download [pgAdmin](https://www.pgadmin.org/download/)
2. Create a new server connection:
   - Host: localhost
   - Port: 5432
   - Username: postgres
   - Password: postgres
   - Database: ariadb

### Using Prisma Studio

Prisma provides a visual database browser:

```bash
cd packages/aria-agent
npx prisma studio
```

This opens a web interface at http://localhost:5555 where you can view and edit data.

## Stopping & Resetting

### Stop the database container

```bash
docker stop aria-postgres
```

### Start it again

```bash
docker start aria-postgres
```

### Remove the container (keeps data)

```bash
docker stop aria-postgres
docker rm aria-postgres
```

### Wipe the database (delete all data)

```bash
# Stop and remove container
docker stop aria-postgres
docker rm aria-postgres

# Remove the volume (this deletes all data!)
docker volume rm docker_postgres-data

# Start fresh
cd docker
docker-compose -f docker-compose.yml up postgres -d

# Re-run migrations
cd ../packages/aria-agent
npx prisma migrate deploy
```

## Docker Compose Configuration

The PostgreSQL service is defined in `docker/docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:15
    container_name: aria-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ariadb
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

## Troubleshooting

### Error: Port 5432 already in use

**Problem**: Another PostgreSQL instance is running.

**Solution**:
```bash
# Find what's using the port
lsof -i :5432

# Stop the conflicting service
# On macOS with Homebrew:
brew services stop postgresql

# Or kill the process
kill -9 [PID]
```

### Error: Connection refused

**Problem**: Container isn't running or not ready yet.

**Solution**:
```bash
# Check if container is running
docker ps | grep aria-postgres

# Check logs
docker logs aria-postgres

# Wait 10 seconds for startup
sleep 10

# Restart if needed
docker restart aria-postgres
```

### Error: Database does not exist

**Problem**: The `ariadb` database wasn't created.

**Solution**:
```bash
# Connect to postgres
docker exec -it aria-postgres psql -U postgres

# Create database
CREATE DATABASE ariadb;

# Exit
\q

# Run migrations
cd packages/aria-agent
npx prisma migrate deploy
```

### Error: Migration failed

**Problem**: Schema changes conflict with existing data.

**Solution**:
```bash
# Reset the database (WARNING: deletes all data)
cd packages/aria-agent
npx prisma migrate reset

# Or manually fix the migration
npx prisma migrate resolve --rolled-back [migration_name]
```

## Backup & Restore

### Create a backup

```bash
docker exec aria-postgres pg_dump -U postgres ariadb > backup.sql
```

### Restore from backup

```bash
cat backup.sql | docker exec -i aria-postgres psql -U postgres -d ariadb
```

## Future: Firestore Migration

For Google Cloud deployment, the plan is to migrate from PostgreSQL to Firestore:

- **Firestore**: NoSQL document database
- **Free Tier**: 1 GB storage, 50K reads/day, 20K writes/day
- **Benefits**: Native GCP integration, serverless, auto-scaling

> ⚠️ TODO: Document Firestore migration process
