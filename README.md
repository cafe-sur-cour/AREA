# AREA

## Project Overview

The AREA (Action - REAction) is a platform designed to create automations between different services.
The users can create an automation by selecting an Action from a service (e.g. the music changed in Spotify) and a reaction to that (e.g. send a message on Discord).

### Context and Objectives

The goal of this platform is to:

-

### Target Audience

The platform targets:

-

## Features

-

## Technologies

- **Web Frontend:**
- **Mobile Frontend:**
- **Backend:**
- **Database:**
- **Other tools:** Docker, Github Actions CI/CD

## Linter
To make sure our code is up to standard we use a linter and prettier, in the folder scripts you can find different script to run those command on either the backend or the web part of the project.

```
./scripts/backend-linter.sh
./scripts/frontend-linter.sh
```

## Commit Guidelines

This project follows the **Conventional Commit Message Guidelines**, which help maintain a clear and consistent Git history. The format is:

```
<type> (<scope>): <content>
```

### Common Types

- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- refactor: Code changes that neither fix a bug nor add a feature
- test: Adding or correcting tests
- upt


## 🛠️ Git Commands Reference

### 🔄 Commit Management

**Modify commit message (before push):**
```bash
git commit --amend -m "New commit message"
```

**Modify commit message (after push):**
```bash
git commit --amend -m "New commit message"
git push --force
```

### 📂 File Management

**Unstage accidentally added file (not yet pushed):**
```bash
git restore --staged <file>
```

**Remove file from commit (after commit):**
```bash
git reset --soft HEAD~1
git restore --staged file-to-remove.txt
git commit -m "New commit message (without the file)"
```

---

## 🚀 Docker

### 🧪 Docker commands

**First contenerization, launch this command:**
```bash
docker compose -f deployment/docker-compose.yml up --build -d # Build image using deployment/docker-compose.yml and up services
```

**Useful commands:**
```bash
docker compose -f deployment/docker-compose.yml up -d # Up services without building image
docker compose -f deployment/docker-compose.yml down # Down services
docker compose -f deployment/docker-compose.yml down -v # Down services and remove all volumes
docker exec -it postgres_db psql -U postgres -d mydb
```
