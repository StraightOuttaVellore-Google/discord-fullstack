# Migration Guide: Flask to FastAPI

This guide explains how to use the migrated chat application that now runs on FastAPI with WebSocket support.

## Prerequisites

- FastAPI backend running (typically on `http://localhost:8000`)
- PostgreSQL database configured
- User authentication token from the main application

## Backend Setup

### 1. Database Migrations

The chat models will be automatically created when the FastAPI application starts. The following tables will be created:

- `chatserver` - Stores chat servers
- `chatchannel` - Stores channels within servers
- `chatmessage` - Stores all messages
- `servermembership` - Stores user memberships in servers

### 2. Seed Initial Data

To populate the database with sample servers and channels for testing:

```bash
cd backend
python seed_chat_data.py
```

This will create:
- 3 sample servers (General Discussion, Gaming Hub, Work & Projects)
- Multiple text and voice channels
- Add all existing users as members

### 3. Start the Backend

```bash
cd backend
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`

## Frontend Setup

### 1. Environment Variables

Create a `.env` file in `Neumorphic Discord/` directory:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

For production, update these to your production URLs.

### 2. Install Dependencies

```bash
cd "Neumorphic Discord"
npm install
```

### 3. Start the Frontend

```bash
npm run dev
```

## Authentication

The chat application now requires JWT authentication. The token should be stored in `localStorage` with the key `access_token`.

### How it works:

1. User logs in through the main application
2. JWT token is stored in `localStorage.setItem('access_token', token)`
3. Chat application reads the token from localStorage
4. Token is used for:
   - REST API calls (Authorization header)
   - WebSocket connection (query parameter)

### Integration with Main App

To integrate with your main application:

```javascript
// After successful login in your main app
localStorage.setItem('access_token', response.access_token)

// Then navigate to or render the chat component
// The chat will automatically pick up the token
```

## API Endpoints

### REST Endpoints

All endpoints require `Authorization: Bearer <token>` header.

- `GET /chat/servers` - Get user's accessible servers
- `POST /chat/servers` - Create a new server
- `GET /chat/servers/{server_id}/channels` - Get server channels
- `POST /chat/servers/{server_id}/channels` - Create a channel (admin only)
- `GET /chat/servers/{server_id}/channels/{channel_id}/messages` - Get message history
- `POST /chat/servers/{server_id}/members` - Add member to server (admin only)
- `DELETE /chat/servers/{server_id}/members/{user_id}` - Remove member (admin only)

### WebSocket Endpoint

- `WS /chat/ws?token=<jwt_token>` - Real-time chat connection

#### WebSocket Events (Client → Server)

```javascript
// Send message
ws.send(JSON.stringify({
  type: 'send_message',
  serverId: 'server-uuid',
  channelId: 'channel-uuid',
  text: 'message text'
}))

// Typing indicators
ws.send(JSON.stringify({
  type: 'typing_start',
  serverId: 'server-uuid',
  channelId: 'channel-uuid'
}))

ws.send(JSON.stringify({
  type: 'typing_stop',
  serverId: 'server-uuid',
  channelId: 'channel-uuid'
}))
```

#### WebSocket Events (Server → Client)

```javascript
// Connected confirmation
{ type: 'connected', message: '...', user_id: '...', username: '...' }

// New message
{ type: 'new_message', id: '...', user: '...', text: '...', timestamp: '...', serverId: '...', channelId: '...' }

// Typing indicators
{ type: 'typing_start', username: '...', serverId: '...', channelId: '...' }
{ type: 'typing_stop', username: '...', serverId: '...', channelId: '...' }

// Errors
{ type: 'error', message: 'error message' }
```

## Key Changes from Flask/Socket.IO

### Backend

1. **Framework**: Flask → FastAPI
2. **Real-time**: Socket.IO → Native WebSocket
3. **Database**: In-memory → PostgreSQL with SQLModel
4. **Authentication**: Custom → JWT with existing TokenDep
5. **Session Management**: Dictionary → Database-backed

### Frontend

1. **WebSocket Library**: socket.io-client → Native WebSocket API
2. **Connection**: `io()` → `new WebSocket()`
3. **Event Handling**: `socket.on()` → `ws.onmessage` with JSON parsing
4. **Emitting**: `socket.emit()` → `ws.send(JSON.stringify())`
5. **Data Fetching**: Hardcoded → REST API calls
6. **Authentication**: Manual username → JWT token from main app

## Permissions

Users can only:
- See servers they are members of
- Send messages in servers they belong to
- Read message history from their accessible channels

Admins can:
- Create channels in their servers
- Add/remove members
- Manage server settings

## Troubleshooting

### WebSocket Connection Failed

- Check if backend is running
- Verify token is valid and not expired
- Check browser console for errors
- Ensure CORS is properly configured

### Messages Not Appearing

- Check if user is a member of the server
- Verify WebSocket connection is active (green indicator)
- Check browser console for permission errors

### Session Expired

- Token expires based on `ACCESS_TOKEN_EXPIRE_MINUTES` setting
- User needs to re-login through main application
- Old token will be cleared from localStorage

## Production Considerations

1. **CORS**: Update `allow_origins` in `backend/main.py` to specific domains
2. **WebSocket URLs**: Use `wss://` for secure WebSocket connections
3. **Rate Limiting**: Add rate limiting for message sending
4. **Message Retention**: Consider archiving old messages
5. **File Uploads**: Implement file/image upload support
6. **Notifications**: Add push notifications for new messages
7. **Read Receipts**: Track message read status
8. **User Presence**: Show online/offline status

## Next Steps

1. Test with multiple users
2. Add more servers and channels as needed
3. Customize UI to match main application theme
4. Implement additional features (reactions, threads, etc.)
5. Set up monitoring and logging
6. Configure backup strategies for chat data

