#!/bin/bash

# Deployment script for Vercel
echo "Starting deployment process..."

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Seed the database (only if needed)
if [ "$SEED_DATABASE" = "true" ]; then
    echo "Seeding database..."
    npm run db:seed
fi

# Build the application
echo "Building Next.js application..."
npm run build

echo "Deployment completed successfully!" 