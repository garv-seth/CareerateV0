#!/bin/bash

# CAREERATE Development Server Startup Script
echo "Starting CAREERATE AI DevOps Platform..."

# Function to cleanup processes on exit
cleanup() {
    echo "Shutting down services..."
    pkill -f "ts-node src/server.ts" 2>/dev/null
    pkill -f "vite dev" 2>/dev/null
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Clear any existing processes
pkill -f "ts-node src/server.ts" 2>/dev/null || true
pkill -f "vite dev" 2>/dev/null || true
sleep 2

# Start backend server
echo "Starting backend server on port 8081..."
cd backend
PORT=8081 npx ts-node src/server.ts &
BACKEND_PID=$!
cd ..

# Wait for backend to initialize
sleep 5

# Start frontend development server
echo "Starting frontend server on port 3000..."
cd frontend
VITE_API_URL=http://localhost:8081 npx vite dev --host 0.0.0.0 --port 3000 &
FRONTEND_PID=$!
cd ..

# Wait for services to start
sleep 3

echo ""
echo "CAREERATE Platform is running:"
echo "  Frontend:    http://localhost:3000"
echo "  Backend API: http://localhost:8081"
echo "  Health:      http://localhost:8081/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running
wait $BACKEND_PID $FRONTEND_PID