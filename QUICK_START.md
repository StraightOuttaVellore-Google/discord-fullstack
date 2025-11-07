# Quick Start Guide - Discord Chat App

## ✅ Fixed Issues
- **Dependency conflicts resolved**: Removed unused `react-day-picker` and downgraded `date-fns` to v3.6.0
- **Configuration verified**: App connects to FastAPI backend on port 8000
- **Port configured**: App runs on port 3000 automatically

## 🚀 How to Run

### 1. Start the Backend (FastAPI)
Make sure your FastAPI backend is running on port 8000:
```bash
cd ../backend_working_voiceagent/google-hackathon-backend-5b3907c4ed9eb19dbaa08b898a42a4ee1ea5e5fe/
uvicorn main:app --reload --port 8000
```

### 2. Start the Discord Chat Frontend
In this directory:
```bash
npm run dev
```

The app will automatically start on **http://localhost:3000**

## 🔗 Integration with Main App

The chat app is automatically integrated with your main frontend app:

1. **From Main App**: Click "Open Chat" or navigate to Community section
2. **Token Passing**: The main app passes the JWT token via URL parameter
3. **Auto-connection**: The chat app automatically:
   - Extracts the token from the URL
   - Connects to backend WebSocket at `ws://localhost:8000/chat/ws`
   - Loads user's accessible servers and channels
   - Establishes real-time messaging

## 📡 API Configuration

The app is configured to connect to:
- **API Base URL**: `http://localhost:8000` (default)
- **WebSocket URL**: `ws://localhost:8000/chat/ws`

These can be overridden with environment variables:
```bash
export VITE_API_URL=http://localhost:8000
export VITE_WS_URL=ws://localhost:8000
```

**Note**: Usually you don't need to set these - defaults are correct!

## ✅ Verification

1. **Backend health**: `curl http://localhost:8000/`
2. **Frontend running**: Open http://localhost:3000 in browser
3. **With token**: `http://localhost:3000?token=YOUR_JWT_TOKEN`

## 🎯 Features

- ✅ Real-time messaging via WebSocket
- ✅ Multiple servers and channels
- ✅ JWT authentication
- ✅ Typing indicators
- ✅ Dark/Light mode
- ✅ Neumorphic Discord-style UI

## 📝 Notes

- The old Flask backend (`main.py` in this folder) is **not used** anymore
- All chat functionality is handled by FastAPI backend on port 8000
- The app requires authentication - login through main app first

