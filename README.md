<p align="center">✨ <strong>GameJam: Collaborative AI-Powered Game Development</strong> ✨</p>

---

# Welcome to GameJam 🎮

GameJam is a **Discord Activity** that enables collaborative p5.js game development with AI assistance. Built with **[Robo.js](https://robojs.dev)**, GameJam allows you and your friends to create games together in real-time by chatting with an AI assistant that generates code based on your ideas.

_Ready to create games with friends?_

## Table of Contents

- [Welcome to GameJam 🎮](#welcome-to-GameJam-)
	- [Table of Contents](#table-of-contents)
	- [What is GameJam?](#what-is-GameJam)
	- [Key Features](#key-features)
		- [1. Collaborative Game Development](#1-collaborative-game-development)
		- [2. AI-Powered Code Generation](#2-ai-powered-code-generation)
		- [3. Interactive Game Editor](#3-interactive-game-editor)
		- [4. Game Library](#4-game-library)
	- [Getting Started](#getting-started)
	- [Development Guide](#development-guide)
		- [Frontend Development 🛠️](#frontend-development-️)
		- [Backend Development 🛠️](#backend-development-️)
	- [Project Structure 📁](#project-structure-)
	- [Ecosystem](#ecosystem)
	- [Hosting](#hosting)

## What is GameJam?

GameJam (Game Forge) is a collaborative game development environment embedded directly within Discord. It allows you and your friends to work together to create p5.js games by chatting with an AI assistant. The AI helps generate code based on your requests, and everyone in the Discord channel can contribute ideas, see the game in real-time, and modify it together.

## Key Features

### 1. Collaborative Game Development
- Multiple Discord users can join the same session
- Everyone can chat with the AI to suggest game features or modifications
- When multiple people send messages in quick succession, the AI intelligently combines their ideas
- Real-time synchronization ensures everyone sees the same game and chat

### 2. AI-Powered Code Generation
- Built-in AI assistant (using Mistral AI or Claude) that understands p5.js
- The AI generates complete, runnable game code based on natural language requests
- Example prompts like "Create a simple platformer game" or "Add a scoring system"
- The AI explains the code it generates to help users learn

### 3. Interactive Game Editor
- Split interface with code editor, game preview, and chat
- Real-time game preview that updates as code changes
- Code editor with syntax highlighting for JavaScript
- Ability to manually edit code if desired

### 4. Game Library
- Save your games to a library for later use
- Load previously created games
- Games are stored in Supabase with metadata like title, description, and author

## Getting Started

Run development mode with:

```bash
npm run dev
```

> **Notes:** A free Cloudflare tunnel is included for easy testing. You can copy and paste it into activity's **[URL mapping](https://robojs.dev/discord-activities/proxy#url-mapping)** to test things out.

- [🔰 **Discord Activities Guide:** New to Discord Activities? Start here!](https://robojs.dev/discord-activities)
- [🎮 **p5.js Documentation:** Learn more about the p5.js library](https://p5js.org/reference/)

## Development Guide

### Frontend Development 🛠️

The frontend code is located in the `/src/app` and `/src/components` folders:

- `src/app/Activity.tsx`: Main activity component
- `src/components/GameInterface.tsx`: Main game interface with code editor, preview, and chat
- `src/components/P5Sketch.tsx`: p5.js integration component
- `src/components/ChatInterface.tsx`: Chat UI component

The application uses React with TypeScript and is styled with Tailwind CSS.

### Backend Development 🛠️

The backend code is in the `/src/api` folder:

- `src/api/chat.ts`: Handles AI integration with Mistral/Claude
- `src/api/games.ts`: Manages game saving and loading
- `src/hooks/useAIChat.ts`: Hook for AI chat functionality
- `src/hooks/useTypingIndicator.ts`: Hook for collaborative typing indicators

The backend uses Robo.js server and integrates with AI services and Supabase for storage.

## Project Structure 📁

- `/src/app`: Frontend React components
- `/src/api`: Backend API endpoints
- `/src/components`: UI components
- `/src/hooks`: Custom React hooks
- `/src/utils`: Utility functions
- `/src/lib`: Library code
- `/src/app/sketches`: Example p5.js sketches

## Ecosystem

GameJam is built with **Robo.js**, giving you access to a growing ecosystem of **[plugins](https://robojs.dev/plugins/directory)**, **[templates](https://robojs.dev/templates/overview)**, and **[tools](https://robojs.dev/cli/overview)**.

Key plugins used in GameJam:

```bash
@robojs/server - For API endpoints
@robojs/sync - For real-time state synchronization
```

- [🔌 **Robo Plugins:** Add features to your Robo seamlessly.](https://robojs.dev/plugins/install)
- [🔌 **Creating Plugins:** Make your own plugins for Robo.js.](https://robojs.dev/plugins/create)

## Hosting

You can host GameJam on any platform that supports **Node.js**, or run [`robo deploy`](https://robojs.dev/cli/robo#distributing) to host on **[RoboPlay](https://roboplay.dev)** - a hosting platform optimized for **Robo.js**.

```bash
npm run deploy
```

- [🚀 **RoboPlay:** Deploy with as little as one command.](https://robojs.dev/hosting/roboplay)
- [🛠️ **Self-Hosting:** Learn how to host and maintain it yourself.](https://robojs.dev/hosting/overview)
# game-jam
