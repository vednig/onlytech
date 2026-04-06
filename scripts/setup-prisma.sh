#!/bin/bash

set -e

echo "Setting up Prisma and database..."

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Run migrations to create the database schema
echo "Running database migrations..."
npx prisma migrate deploy

# Seed the database with sample incidents
echo "Seeding database with sample incidents..."
node scripts/seed.js

echo "Database setup complete!"
