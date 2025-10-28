# AREA

## Project Overview

The AREA (Action - REAction) is a platform designed to create automations between different services.
Users can create an automation by selecting an Action from a service (e.g. the music changed in Spotify) and a Reaction to that (e.g. send a message on Discord).

If you want more information about the project dependencies to start the project or architectural questions, please refer to the `README.md` in the Documentation folder.
If you want to learn how to contribute to the project, please refer to the `HOWTOCONTRIBUTE.md` in the Documentation folder.

### Context and Objectives

The goal of this platform is to:

- Simplify the creation of automations between multiple online services without requiring programming skills.
- Provide a modular and extensible system where developers can easily integrate new services and actions/reactions.
- Enhance productivity and connectivity by allowing users to link their favorite tools (e.g. GitHub, Slack, Google, Spotify) in meaningful ways.
- Offer a user-friendly interface for building, monitoring, and managing automations (called "Areas").
- Encourage collaboration and open-source contributions to expand the ecosystem of supported services.

### Target Audience

The platform targets:

- **End users** who want to automate repetitive tasks between different applications (e.g. automatically post to Slack when a GitHub PR is merged).
- **Developers** interested in integrating new services or extending the platform with custom Actions and Reactions.
- **Teams and organizations** looking to streamline workflows and improve efficiency through cross-platform automation.
- **Students and educators** who want to explore practical applications of APIs, event-driven systems, and automation logic.


## Features

# Actions and Reactions

|   **Service**  |               **Action**               |               **Reaction**                |
|----------------|----------------------------------------|-------------------------------------------|
|   **GitHub**   |                                        |                                           |
|                | Push on a repository                   | Create an issueon a repositorie           |
|                | Pull request opened on a repository    | Add a comment on a repositorie            |
|                | Pull request merged on a repository    |                                           |
|   **Slack**    |                                        |                                           |
|                | New message in a specific channel      | Send a message to a chanel                |
|                | New direct private message             | Add a reaction to the last message        |
|                | Creation of a channel                  | Send a direct Message to a user           |
|                | Reaction added to a message            | Pin the last message                      |
|  **Spotify**   |                                        |                                           |
|                | The track has changed                  | Skip the current track                    |
|                | Music started                          | Pause/Resume Playing of a track           |
|                | Music was paused                       | Add a song to a playlist                  |
|                | New song added to the likes            | Play a specific track                     |
|                |                                        | Set the volume to a specifica amount      |
|   **Google**   |                                        |                                           |
|                | An email was sent to a specific person | Send a email to a specific person         |
|                | A calendar was created                 | Create a Calendar                         |
|                | Creation of a Google Doc               | Create a google Doc                       |
|                | Document added to the Drive            | Add a document to google drive            |
|   **Twitch**   |                                        |                                           |
|                |                                        | Update the description of the chanel      |
|                |                                        | Ban a specific user                       |
|                |                                        | Unban a user                              |
|   **Timer**    |                                        |                                           |
|                | Every day at X hour                    |                                           |
|                | Every day at X minutes                 |                                           |
|   **Microsoft**|                                        |                                           |
|                | Profile Picture Changed                |                                           |
|   **GitLab**   |                                        |                                           |
|                | GitLab Push                            | Create GitLab Issue                       |
|                | GitLab Merge Request Opened            | Add GitLab Comment                        |
|                | GitLab Merge Request Merged            | Create GitLab Merge Request               |
|                | GitLab Issue Opened                    | Set GitLab Project Visibility             |



## Technologies

- **Web Frontend:** Tailwind, NextJS
- **Mobile Frontend:** Flutter 3.35.7
- **Backend:** TypeScript Express
- **Database:** Postgres
- **Other tools:** Docker, Github Actions CI/CD

## Linter
To make sure our code is up to standard we use a linter and prettier, in the folder scripts you can find different script to run those command on either the backend or the web part of the project.

```
./scripts/backend-linter.sh
./scripts/frontend-linter.sh
```

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
