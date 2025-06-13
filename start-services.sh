#!/bin/bash

echo "🚀 Starting CAREERATE AI DevOps Platform..."

# Kill any existing processes on these ports
echo "Cleaning up existing processes..."
pkill -f "vite dev" 2>/dev/null || true
pkill -f "ts-node src/server.ts" 2>/dev/null || true
sleep 2

# Start backend server
echo "📡 Starting backend server on port 8081..."
cd backend
npx ts-node src/server.ts &
BACKEND_PID=$!
cd ..

# Wait for backend to initialize
echo "Waiting for backend to start..."
sleep 5

# Start frontend server
echo "🌐 Starting frontend server on port 3000..."
cd frontend
npx vite dev --host 0.0.0.0 --port 3000 &
FRONTEND_PID=$!
cd ..

# Wait for services to fully start
sleep 3

echo ""
echo "✅ CAREERATE Platform is running:"
echo "   🖥️  Frontend:     http://localhost:3000"
echo "   🔧 Backend API:  http://localhost:8081"
echo "   ❤️  Health Check: http://localhost:8081/health"
echo ""
echo "📝 To stop services: Ctrl+C or run 'pkill -f \"vite dev\"; pkill -f \"ts-node\"'"
echo ""

# Keep script running and handle shutdown
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait for user to stop
wait