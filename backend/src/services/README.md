# AREA Services Architecture

This document describes the modular architecture for implementing services with
actions and reactions in the AREA backend.

## Overview

The AREA platform allows users to create automation workflows by connecting
actions (triggers) to reactions (responses). Services are the building blocks
that provide these actions and reactions.

## Architecture Components

### 1. Service Interface

Each service implements the `Service` interface defined in
`src/types/service.ts`. A service represents an external platform or system.

### 2. Service Registry

The `ServiceRegistry` manages all registered services and provides methods to:

- Register/unregister services
- Find actions and reactions by type
- Validate action/reaction types

### 3. Service Loader

The `ServiceLoader` dynamically loads services from the `src/services/services/`
directory at startup.

### 4. Reaction Executor Registry

The `ReactionExecutorRegistry` manages reaction executors that implement the
actual execution logic for reactions.

## How to Add a New Service

### 1. Create Service Directory

Create a new directory under `src/services/services/` with your service name:

```
src/services/services/
└── your-service/
    └── index.ts
```

### 2. Implement the Service

Create `index.ts` that exports a `Service` object as default with actions and
reactions definitions.

### 3. Define Actions and Reactions

Actions define triggers with input schemas, reactions define responses with
output schemas. Both include configuration schemas and metadata.

### 4. Implement Reaction Execution Logic

Each service that provides reactions must also provide an executor that
implements `ReactionExecutor`. The executor handles the actual API calls and
logic for each reaction type.

### 5. Export Both Service and Executor

```typescript
export default myService;
export { myExecutor as executor };
```

## Type Validation

The architecture enforces type validation:

- Action types must follow `service.action` format
- Reaction types must follow `service.reaction` format
- Unknown action/reaction types are logged as warnings

## Best Practices

1. **Modularity**: Keep each service in its own directory
2. **Validation**: Always validate input/output schemas
3. **Error Handling**: Implement proper error handling in execution logic
4. **Documentation**: Document all fields and their purposes
5. **Testing**: Test services independently before integration
6. **Security**: Never log sensitive configuration data

## Integration with Execution Service

The `ExecutionService` automatically validates action and reaction types against
registered services and uses the appropriate executor for reaction execution.
