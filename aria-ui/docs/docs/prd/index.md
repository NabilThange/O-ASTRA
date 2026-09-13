---
sidebar_position: 1
title: Product Requirements Document
---

## Overview

Aria (formerly Bytebot) is an open-source AI Desktop Agent powered by Google Gemini 2.0. It's an AI that has its own computer to complete tasks for you. Unlike browser-only agents or traditional RPA tools, Aria comes with a full virtual desktop where it can use any application, download and organize files, log into websites, read and process documents, and complete complex multi-step workflows across different programs.

Aria was adapted for the Google Gemini Live Agent Challenge and competes in the UI Navigator category, where the agent sees screens, understands UI context, and executes actions autonomously.

## Goals

- Provide complete task autonomy through a full desktop environment
- Enable AI to process documents and files with its own file system
- Support real applications beyond web interfaces (desktop apps, CLI tools, etc.)
- Offer natural language task creation with live desktop viewing
- Deliver a self-hosted solution for data privacy and full control
- Demonstrate advanced multimodal capabilities using Google Gemini 2.0

## Target Users

- Developers building automation workflows
- Teams needing business process automation (invoice processing, data synchronization, report generation)
- QA engineers for automated UI testing
- Researchers conducting competitive analysis and data gathering
- Anyone needing to automate complex multi-step tasks across different applications

## Core Features

- **Virtual Desktop**: Complete Ubuntu Linux environment with pre-installed applications (Firefox, VS Code, etc.)
- **AI Agent**: NestJS service that coordinates AI and desktop actions using Google Gemini 2.0
- **Task Interface**: Next.js web UI for task creation and management
- **Natural Language Tasks**: Describe what you need done in plain English
- **File Uploads**: Drop files onto tasks for the agent to process
- **Live Desktop View**: Watch the agent work in real-time via noVNC
- **Takeover Mode**: Take manual control when needed
- **Computer Use Tools**: 15+ tools for mouse, keyboard, screenshots, file operations
- **Vision Capabilities**: Gemini analyzes screenshots to understand UI context
- **Real-time Streaming**: WebSocket + VNC for live desktop interaction
- **Password Manager Support**: Install 1Password, Bitwarden, etc. for automatic authentication
- **Persistent Environment**: Installed programs stay available for future tasks
- **REST APIs**: Programmatic task creation and desktop control

## Non-Goals

- Browser-only automation (Aria provides a full desktop environment)
- Cloud-only deployment (designed for self-hosting)
- Platform restrictions on AI usage (use your own API keys)
- Limited to specific applications (can use any desktop software)

## Tech Stack

### Frontend
- **Framework**: Next.js 15+ (React 19)
- **Language**: TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **Real-time**: Socket.io client, react-vnc for desktop viewing
- **State Management**: React hooks
- **Animation**: GSAP, Motion

### Backend
- **Framework**: NestJS 11
- **Language**: TypeScript (Node.js 20)
- **AI SDK**: @google/genai v1.8.0 (Google Gemini 2.0)
- **Database ORM**: Prisma
- **Real-time**: Socket.io, WebSockets
- **Authentication**: Firebase Admin SDK

### Database
- **Primary**: PostgreSQL (via Docker)
- **Future**: Firestore migration planned for GCP deployment

### Infrastructure
- **Desktop Environment**: Ubuntu 22.04 with XFCE
- **VNC Server**: noVNC for browser-based desktop access
- **Containerization**: Docker, Docker Compose
- **Deployment**: Self-hosted (Docker), Railway, Google Cloud Run (planned)

### AI Models
- Gemini 2.5 Flash-Lite (default, free tier)
- Gemini 2.5 Flash
- Gemini 2.5 Pro
- Extended thinking budget: 24,576 tokens
