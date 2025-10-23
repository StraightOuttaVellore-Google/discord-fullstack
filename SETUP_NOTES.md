# Setup Notes - Discord Fullstack

## Current Status

### Architecture Mismatch Detected

The repository has a **frontend-backend incompatibility**:

**Frontend (App.jsx)**:
- Uses native WebSocket API (`new WebSocket()`)
- Expects FastAPI endpoints: `/chat/servers`, `/chat/ws?token=`
- Requires JWT authentication from main application
- Configured for `http://localhost:8000` and `ws://localhost:8000`

**Backend (main.py)**:
- Uses Flask + Socket.IO (not native WebSocket)
- Has simple endpoints without `/chat/` prefix
- Runs on port 5001
- Simple username-based authentication

### Migration Context

According to `MIGRATION_GUIDE.md`, this project was migrated from Flask/Socket.IO to FastAPI, but the current repository only contains the old Flask backend. The frontend has been updated for FastAPI, creating the mismatch.

## Solutions

### Option 1: Use Original Socket.IO Frontend (Recommended for Quick Start)

The repository likely had an older version of `App.jsx` that worked with Socket.IO. To run the current Flask backend:

1. Backend runs on port 5001
2. Need to revert frontend to use socket.io-client library
3. Simple username-based authentication

### Option 2: Implement FastAPI Backend (As per Migration Guide)

Follow the migration guide to create a FastAPI backend with:
- Native WebSocket support
- PostgreSQL database
- JWT authentication integration
- Runs on port 8000

### Option 3: Adapt Flask Backend

Update Flask backend to match frontend expectations:
- Change port to 8000
- Add JWT authentication
- Add `/chat/` prefix to routes
- Note: Socket.IO vs WebSocket issue remains

## Dependencies Installed

✅ Python packages installed (Flask, Flask-SocketIO, etc.)
✅ Node packages installed (with --legacy-peer-deps flag)

## Quick Start (Attempting with Current Setup)

### Terminal 1 - Backend:
```bash
cd discord-fullstack
python main.py
```

### Terminal 2 - Frontend:
```bash
cd discord-fullstack
npm run dev
```

**Note**: Frontend will try to connect to `http://localhost:8000` but backend runs on `5001`. Connection will fail unless environment variables are configured.

## Environment Variables Needed

Create `.env` or `.env.local` file:
```env
VITE_API_URL=http://localhost:5001
VITE_WS_URL=ws://localhost:5001
```

However, even with this, Socket.IO vs WebSocket incompatibility will cause issues.

## Recommended Next Steps

1. Check if there's a FastAPI backend available elsewhere in the project
2. Or revert frontend to socket.io-client version
3. Or implement FastAPI backend as per migration guide
4. Or adapt Flask to use native WebSocket instead of Socket.IO


