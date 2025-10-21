# How to Contribute to AREA

This file should serve as a practical guide for extending the project's functionality. It must detail the process for adding new elements such as services, actions, reactions, or other core features. Your documentation should enable others to easily set up the development environment, understand how to use and extend the application, and contribute effectively to the project.

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

## Adding Services, Actions, and Reactions

For detailed information about the services architecture and how to implement new services with actions and reactions, see the [Services Architecture Documentation](./services/SERVICES_ARCHITECTURE.md).

## Adding Webhook Support

For information about implementing webhook-based actions for external services, see the "Webhook Integration" section in the [Services Architecture Documentation](./services/SERVICES_ARCHITECTURE.md).
