# 📚 Project 3 API Documentation Index

Welcome to the API documentation for Project 3. The documentation is organized by module to make it easier to find the information you need.

## 🏗️ Core & System
- [System Architecture & Flows](file:///home/nathakon/project/project-3/docs/architecture.api.md) - Overall system design, Auth flow, and QR Code flow.
- [Database Schema](file:///home/nathakon/project/project-3/docs/architecture.api.md#🗄️-database-schema-prisma) - Information about Prisma models and relationships.
- [**Next.js Integration Guide**](file:///home/nathakon/project/project-3/docs/nextjs-guide.md) - How to use this API with a Next.js frontend.

## 🔐 Authentication
- [Auth API](file:///home/nathakon/project/project-3/docs/auth.api.md) - Login, Logout, and User identity endpoints.

## 📷 Attendance & QR Code
- [QR Code API](file:///home/nathakon/project/project-3/docs/qrcode.api.md) - Token generation, scanning, and check-in/out actions.
- [History API](file:///home/nathakon/project/project-3/docs/history.api.md) - Student check-in history.

## 📊 Monitoring
- [Dashboard API](file:///home/nathakon/project/project-3/docs/dashboard.api.md) - Attendance statistics and monitoring.

## 👥 Management (🚧 WIP)
- [Users API](file:///home/nathakon/project/project-3/docs/users.api.md) - User management endpoints.
- [Rooms API](file:///home/nathakon/project/project-3/docs/rooms.api.md) - Room management endpoints.

---

### Base URL
`http://localhost:3000/api`

### Authentication Method
Uses **Session Cookie** (`connect.sid`). Ensure `withCredentials: true` is set in your frontend requests.
