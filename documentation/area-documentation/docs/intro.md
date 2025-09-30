---
sidebar_position: 1
---

# AREA - Action REAction Platform

## Project Overview

The AREA (Action - REAction) is a comprehensive automation platform that enables users to create seamless integrations between different services. Users can set up automations by selecting an **Action** from one service (e.g., "new commit pushed to GitHub") and defining a **Reaction** on another service (e.g., "send notification to Discord").

The platform consists of three main components:
- **Web Application**: A modern Next.js frontend for desktop users
- **Mobile Application**: A Flutter-based mobile app for iOS and Android
- **Backend API**: A TypeScript Express server with PostgreSQL database

![Area logo](/img/base-logo.png)

## Architecture

### Tech Stack
- **Frontend Web**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Frontend Mobile**: Flutter 3.9+, Dart
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT tokens, OAuth (GitHub)
- **Deployment**: Docker, Docker Compose
- **API Documentation**: Swagger/OpenAPI

### Services Integration
The platform supports various external services through OAuth and webhook integrations:
- GitHub (repositories, commits, issues)
- Email notifications (SMTP)
- Discord (coming soon)
- Spotify (coming soon)

## Prerequisites

Before setting up the project, ensure you have the following installed:

### Required Software
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Docker** and **Docker Compose**
- **PostgreSQL** (if running without Docker)
- **Flutter SDK** (v3.9+) for mobile development
- **Git**

### Development Tools (Recommended)
- **VS Code** with extensions:
  - TypeScript and JavaScript Language Features
  - Flutter and Dart extensions
  - Docker extension
  - PostgreSQL extension

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/cafe-sur-cour/AREA.git
cd AREA
```

### 2. Environment Configuration

Create a `.env` file in the `deployment/` directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=area_user
DB_PASSWORD=area_password
DB_NAME=area_db

# Backend Configuration
NODE_PORT=3001
BACKEND_URL=http://localhost:3001
SESSION_SECRET=your-super-secret-session-key

# Frontend Configuration
NEXT_PORT=3000
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# GitHub OAuth (required for GitHub integration)
SERVICE_GITHUB_CLIENT_ID=your-github-client-id
SERVICE_GITHUB_CLIENT_SECRET=your-github-client-secret
SERVICE_GITHUB_REDIRECT_URI=http://localhost:3001/auth/github/callback
SERVICE_GITHUB_API_BASE_URL=https://api.github.com
SERVICE_GITHUB_AUTH_BASE_URL=https://github.com

# Webhook Configuration
WEBHOOK_BASE_URL=http://localhost:3001

# Docker Environment
DOCKER_ENV=false
```

### 3. Installation Methods

#### Option A: Docker (Recommended)
```bash
# Navigate to deployment directory
cd deployment

# Start all services
docker-compose up --build

# Check if services are running
docker-compose ps
```

:::tip My tip

Always use docker up --build so that all of the volumes re-buildt

:::

#### Option B: Manual Setup

**Backend Setup:**
```bash
cd backend
npm install
npm run build
npm run dev
```

**Frontend Web Setup:**
```bash
cd web
npm install
npm run dev
```

**Mobile Setup:**
```bash
cd mobile
flutter pub get
flutter run
```

**Database Setup:**
```bash
# Install PostgreSQL and create database
createdb area_db

# Run database initialization scripts
psql -d area_db -f database/init-postgres.sh
```

## Running the Project

### Using Docker
```bash
cd 'root of the repositorie'
docker-compose up --build
```

Access the applications:
- **Web App**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **AdminJS** : http://localhost:3000/admin

### Manual Development Mode
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Web Frontend
cd web && npm run dev

# Terminal 3 - Mobile (optional)
cd mobile && flutter run
```

### Building for Production
```bash
# Backend
cd backend && npm run build && npm start

# Web Frontend
cd web && npm run build && npm start

# Mobile APK
cd mobile && flutter build apk
```

## Development Scripts

The project includes helpful scripts in the `scripts/` directory:

```bash
# Code quality
./scripts/backend-linter.sh    # Run ESLint on backend
./scripts/frontend-linter.sh   # Run ESLint on frontend

# Mobile development
./scripts/runMobileDebug.sh     # Run mobile app in debug mode
./scripts/runMobileRelease.sh   # Run mobile app in release mode
./scripts/buildMobileApk.sh     # Build APK for Android

# Dependency management
python scripts/modules_update.py  # Update all dependencies
```

## Testing

```bash
# Backend tests
cd backend
npm test                # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage

# Frontend tests
cd web
npm test

# Mobile tests
cd mobile
flutter test
```

## Style Guide

Our design system follows a modern, clean aesthetic with consistent branding across all platforms.

![Area Brand Style Guide](/img/Area-Brand-Style-Guide.png)

### Design Principles
- **Consistency**: Unified design language across web and mobile
- **Accessibility**: WCAG 2.1 AA compliant
- **Responsiveness**: Mobile-first design approach
- **Performance**: Optimized for fast loading and smooth interactions

## Application Screenshots

### Web Application
*Screenshots of the web application will be added here*

### Mobile Application
*Screenshots of the mobile application will be added here*

## API Documentation

The backend provides a comprehensive REST API documented with Swagger. Once the backend is running, you can access the interactive API documentation at:

**http://localhost:3001/api-docs**

### Key API Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `GET /services` - List available services
- `POST /webhooks` - Create automation workflows
- `GET /user/profile` - User profile management

## Troubleshooting

### Common Issues

**Database Connection Error:**
- Ensure PostgreSQL is running
- Verify database credentials in `.env`
- Check if database exists

**Port Already in Use:**
- Change ports in `.env` file
- Kill existing processes: `lsof -ti:3000 | xargs kill -9`

**Mobile Build Issues:**
- Run `flutter clean && flutter pub get`
- Ensure Flutter SDK is properly installed
- Check Android Studio/Xcode setup

**Docker Issues:**
- Ensure Docker daemon is running
- Run `docker-compose down` and `docker-compose up --build`

### Getting Help

- Check the [Contributing Guide](../HOWTOCONTRIBUTE.md)
- Review the [Services Architecture](../services/SERVICES_ARCHITECTURE.md)
- Open an issue on GitHub

## Next Steps

After successfully setting up the project:

1. **Explore the API**: Visit the Swagger documentation
2. **Set up OAuth**: Configure GitHub OAuth for service integrations
3. **Create Automations**: Test the platform by creating your first automation
4. **Development**: Check the contributing guide for development workflows

---

*For detailed development guidelines and contribution instructions, please refer to the [How to Contribute](../HOWTOCONTRIBUTE.md) documentation.*
