#!/bin/bash

# RentRoll AI Optimizer - Quick Start Script
# This script sets up and starts the development environment

set -e

echo "🚀 RentRoll AI Optimizer - Quick Start"
echo "======================================"

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

if ! command -v poetry &> /dev/null; then
    echo "❌ Poetry is required but not installed. Install with: pip install poetry"
    exit 1
fi

echo "✅ All prerequisites found"

# Set up BigQuery (optional)
if command -v bq &> /dev/null; then
    echo "🗄️  Setting up BigQuery..."
    read -p "Do you want to run the BigQuery setup? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        bq query --use_legacy_sql=false < sql/setup_bigquery.sql
        echo "✅ BigQuery setup completed"
    fi
else
    echo "⚠️  BigQuery CLI not found. You can set up BigQuery manually later."
fi

# Start backend
echo "🔧 Setting up backend..."
cd backend

if [ ! -f ".venv/pyvenv.cfg" ]; then
    echo "📦 Installing backend dependencies..."
    poetry install
fi

echo "🔥 Starting backend server..."
poetry run python dev.py &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

cd ..

# Start frontend
echo "🎨 Setting up frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo "🔥 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

cd ..

# Show information
echo ""
echo "🎉 RentRoll AI Optimizer is starting up!"
echo ""
echo "📊 Frontend:     http://localhost:3000"
echo "🔌 Backend API:  http://localhost:8000"
echo "📖 API Docs:     http://localhost:8000/docs"
echo "🏥 Health Check: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo ""; echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ All services stopped"; exit 0' INT

# Keep script running
wait 