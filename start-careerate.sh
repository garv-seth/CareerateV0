#!/bin/bash

# Start CAREERATE AI DevOps Platform
echo "🚀 Starting CAREERATE AI DevOps Platform..."

# Start backend in background
echo "Starting backend server..."
cd backend
npx ts-node src/simple-server.ts &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
cd ../frontend
npx vite dev --host 0.0.0.0 --port 3000 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo "✅ CAREERATE Platform is running:"
echo "   Backend:  http://localhost:8081"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running and handle cleanup
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM

wait