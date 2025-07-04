#!/bin/bash

# Exit on any error
set -e

echo "Starting application setup..."

# Run database migrations
echo "Running database migrations..."
pnpm run db:push

# Start the application
echo "Starting the application..."
exec pnpm run start 