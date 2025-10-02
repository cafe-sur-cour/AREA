# AREA

## Project Overview

The AREA (Action - REAction) is a platform designed to create automations between different services.
The users can create an automation by selecting an Action from a service (e.g. the music changed in Spotify) and a reaction to that (e.g. send a message on Discord).

If you want more information about the project about dependecies to start the project or architectural questions please refer to the README.md in the Documentation folder, if you want to learn how to contribute to the project please refer to the HOWTOCONTRIBUTE.md in the documentation folder.

### Context and Objectives

The goal of this platform is to:

-

### Target Audience

The platform targets:

-

## Features

-

## Technologies

- **Web Frontend:** Tailwind, NextJS
- **Mobile Frontend:** Flutter
- **Backend:** TypeScript Express
- **Database:** Postgres
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
- upt: Updating an element that is not a refactor
- rm: Remove a line of code or a file from the repo
- memo: Add a new documentation element

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

### Overall

**Description**

`docker-compose.yml` is stored in the subfolder `deployment/`. It describes every docker services of our project :

- **server**: to launch the application server on port *8080*
- **client_mobile**: to build the mobile client
- **client_web**: to launch the web client on port *8081*

The *client_web* depends on *client_mobile* **and** *server* .

**Up**

Validation of the integrity of our images will be done when launching the `docker-compose up` command.

Upping services will follow these points:

- The services **client_mobile** and **client_web** will share a common volume
- The **client_mobile** service will edit the associated binary and put it on the common volume with the **client_web**
- The **server** service will run by exposing the port **8080**
- The **server** service will respond to the request `http://localhost:8080/about.json`
- The **client_web** service will run by exposing the port **8081**
- The **client_web** service will respond to one of the following queries:
- `http://localhost:8081/client.apk` to provide the Android version of mobile client

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
docker exec -it postgres_db psql -U postgres -d area-db # Access our db
```


## Documentation 🦕

The documentation of the project is currently handled by a docusaurus instace.

To run it :
```bash
cd documentation/area-documentation/
npm start
```
Then you can find the documentation at http://localhost:3000/
