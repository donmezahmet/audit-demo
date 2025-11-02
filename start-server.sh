#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Add local Node.js to PATH if it exists (for development)
if [ -d "$PWD/node-v20.11.0-darwin-x64/bin" ]; then
  export PATH=$PWD/node-v20.11.0-darwin-x64/bin:$PATH
fi

# Set environment variables from env file if it exists (for development)
if [ -f "env" ]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip empty lines and comments
    if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
      export "$line"
    fi
  done < env
fi

echo "Starting server..."
export NODE_ENV=production
node server.js
