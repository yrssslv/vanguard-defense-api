# Vanguard Defense API

A real-time resource monitoring and target engagement tracking system. This project serves as the backend for a situational awareness dashboard, managing the complete data lifecycle from field operator reporting to administrative verification and automated AI analysis.

## Core Features

- **Report Management**: Full engagement report lifecycle (creation, moderation, confirmation). Database transactions ensure data integrity during real-time statistics updates.
- **Geospatial Intelligence (PostGIS)**: Storage and processing of target coordinates. Supports spatial queries to filter events based on specific front-line sectors.
- **Real-time Synchronization**: Instant dashboard updates via WebSockets (Socket.io) using a Redis adapter for horizontal scalability.
- **AI Analytics**: Google Gemini integration for automated briefing generation. The AI analyzes daily datasets to identify operational trends and key successes.
- **Background Processing**: BullMQ-powered queues for priority target notifications and heavy report generation without blocking the main event loop.

## Tech Stack

- **Core**: NestJS, TypeScript (Strict Mode).
- **Database**: PostgreSQL with PostGIS extension.
- **ORM**: Prisma.
- **Caching & Queues**: Redis, BullMQ.
- **AI**: Google Gemini SDK.
- **API Documentation**: Swagger / OpenAPI 3.0.
- **Testing**: Jest (Unit & Integration).

## Role-Based Access Control (RBAC)

1. **Operator**: Responsible for submitting engagement reports, including target types, weapon systems used, and exact coordinates.
2. **Administrator**: Verifies incoming data, manages target technical directories, and ensures statistical accuracy.
3. **Viewer**: Read-only access to dashboards, subscription to "high-value target" alerts, and access to AI-generated summaries.

## Architecture

The application follows Clean Architecture and SOLID principles. The logic is decoupled into independent modules, allowing for seamless transitions between notification providers (e.g., switching from Email to Telegram) or AI models without affecting the core system. All critical endpoints are covered by integration tests and fully documented via Swagger.
