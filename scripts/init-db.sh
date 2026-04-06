#!/bin/bash

# Initialize Prisma and push schema to database
echo "Setting up Prisma..."
npx prisma generate

echo "Pushing schema to database..."
npx prisma db push

echo "Seeding database with sample data..."
npx ts-node scripts/seed.ts

echo "Database setup complete!"
