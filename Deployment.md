# Deploy Script Documentation

## Overview

This script automates the process of updating a Git repository and redeploying Docker containers. It ensures safety checks for local changes and avoids unnecessary Docker restarts if the repository is already up-to-date.

---

## Script Location

```bash
~/Desktop/deployScript.sh
```

Make sure the script is executable:

```bash
chmod +x ~/Desktop/deployScript.sh
```

---

## Requirements

* **Git** installed and available in your PATH.
* **Docker** and **Docker Compose** installed.
* The repository to deploy must exist at `~/Desktop/AREA` with a `deployment/` folder containing the `docker-compose.yml` file.

---

## Usage

```bash
bash deployScript.sh
```

The script performs the following steps:

1. Detects the script's directory.
2. Checks if the repository exists (`AREA_DIR/.git`).
3. Checks for **local uncommitted changes**:

   * If local changes exist, the script stops and instructs the user to commit or stash them.
4. Pulls the latest changes from Git.
5. If the repository is already up-to-date, the script stops.
6. If new changes were pulled:

   * Navigates to `deployment/`.
   * Stops Docker containers and removes volumes (`docker compose down -v`).
   * Rebuilds and starts Docker containers (`docker compose up --build -d`).

---

## Script Breakdown

```bash
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AREA_DIR="$SCRIPT_DIR/AREA"

echo "🔄 Checking repository in: $AREA_DIR"

if [ ! -d "$AREA_DIR/.git" ]; then
    echo "❌ Error: $AREA_DIR is not a Git repository."
    exit 1
fi

cd "$AREA_DIR" || exit 1

if ! git diff-index --quiet HEAD --; then
    echo "❌ Local changes detected. Please commit or stash them before running the script."
    exit 1
fi

PULL_OUTPUT=$(git pull)

if [[ "$PULL_OUTPUT" == "Already up to date."* ]]; then
    echo "✅ Repository already up-to-date."
    exit 0
fi

DEPLOY_DIR="$AREA_DIR/deployment"
if [ -d "$DEPLOY_DIR" ]; then
    echo "🐳 Restarting Docker containers..."
    cd "$DEPLOY_DIR" || exit 1
    docker compose down -v
    docker compose up --build -d
else
    echo "❌ Error: $DEPLOY_DIR not existing"
    exit 1
fi

echo "✅ Successfully deployed!"
```

---

## Notes

* The script uses `set -e` to **stop execution on any error**.
* The script checks for **uncommitted local changes** to avoid overwriting work.
* Docker commands are executed **only if new commits were pulled**.
* Make sure your user has permission to run Docker commands without `sudo`.

---

## Optional Enhancements

* Add logging to a file.
* Send notifications on deployment success/failure.
* Support multiple repositories in one script.
* Handle branch selection or tags.
