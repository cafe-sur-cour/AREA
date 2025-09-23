#! /bin/bash

#!/bin/bash

# Go to the backend folder
cd "$(dirname "$0")/../web" || exit 1

# Run lint
npm run lint

npm run format

npm run format:check
