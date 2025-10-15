import os
import sys
from flask import Flask, send_from_directory, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from datetime import datetime
import uuid

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes
CORS(app, origins="*")

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Database setup removed for simplicity

# Store connected users and their data
connected_users = {}
user_sessions = {}

# Define server memberships - which users can access which servers
server_memberships = {
    '1': ['alice', 'bob', 'charlie', 'diana'],  # My Server
    '2': ['alice', 'charlie', 'eve'],           # Gaming
    '3': ['bob', 'diana', 'frank']              # Work
}

# Define user roles in servers (optional: admin, member, etc.)
user_roles = {
    '1': {'alice': 'admin', 'bob': 'member', 'charlie': 'member', 'diana': 'member'},
    '2': {'alice': 'admin', 'charlie': 'member', 'eve': 'member'},
    '3': {'bob': 'admin', 'diana': 'member', 'frank': 'member'}
}
servers = {
    '1': {
        'id': '1',
        'name': 'My Server',
        'icon': '🏠',
        'channels': [
            {'id': 'general', 'name': 'general', 'type': 'text'},
            {'id': 'random', 'name': 'random', 'type': 'text'},
            {'id': 'announcements', 'name': 'announcements', 'type': 'text'}
        ]
    },
    '2': {
        'id': '2',
        'name': 'Gaming',
        'icon': '🎮',
        'channels': [
            {'id': 'general', 'name': 'general', 'type': 'text'},
            {'id': 'game-chat', 'name': 'game-chat', 'type': 'text'},
            {'id': 'voice-general', 'name': 'Voice General', 'type': 'voice'}
        ]
    },
    '3': {
        'id': '3',
        'name': 'Work',
        'icon': '💼',
        'channels': [
            {'id': 'general', 'name': 'general', 'type': 'text'},
            {'id': 'projects', 'name': 'projects', 'type': 'text'},
            {'id': 'meeting-room', 'name': 'Meeting Room', 'type': 'voice'}
        ]
    }
}

# Store messages per server-channel combination
channel_messages = {}

# Store typing users per channel
typing_users = {}

# Helper functions for permission checking
def user_has_server_access(username, server_id):
    """Check if user has access to a specific server"""
    return username.lower() in [member.lower() for member in server_memberships.get(server_id, [])]

def get_user_accessible_servers(username):
    """Get list of servers that user can access"""
    accessible_servers = {}
    for server_id, members in server_memberships.items():
        if username.lower() in [member.lower() for member in members]:
            accessible_servers[server_id] = servers[server_id]
    return accessible_servers

def user_can_send_message(username, server_id, channel_id):
    """Check if user can send messages to a specific server/channel"""
    return user_has_server_access(username, server_id)

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')
    emit('user_connected', {'message': 'Connected to server'})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')
    # Remove user from connected users if they were registered
    user_to_remove = None
    for username, data in connected_users.items():
        if data['sid'] == request.sid:
            user_to_remove = username
            break
    
    if user_to_remove:
        del connected_users[user_to_remove]
        emit('user_left', {'username': user_to_remove}, broadcast=True)
        emit('users_update', {'users': list(connected_users.keys())}, broadcast=True)

@socketio.on('join_chat')
def handle_join_chat(data):
    username = data['username']
    
    # Get user's accessible servers
    accessible_servers = get_user_accessible_servers(username)
    
    if not accessible_servers:
        emit('error', {'message': 'You do not have access to any servers'}, room=request.sid)
        return
    
    # Set default server to first accessible server
    default_server_id = list(accessible_servers.keys())[0]
    
    connected_users[username] = {
        'sid': request.sid,
        'status': 'online',
        'current_channel': 'general',
        'current_server': default_server_id
    }
    
    # Join the user to the default server-channel room
    room_name = f"{default_server_id}-general"
    join_room(room_name)
    
    # Notify all users about the new user
    emit('user_joined', {'username': username}, broadcast=True)
    emit('users_update', {'users': list(connected_users.keys())}, broadcast=True)
    emit('servers_data', {'servers': accessible_servers}, room=request.sid)
    emit('user_permissions', {'accessible_servers': list(accessible_servers.keys())}, room=request.sid)
    
    print(f'User {username} joined the chat with access to servers: {list(accessible_servers.keys())}')

@socketio.on('send_message')
def handle_message(data):
    username = data['user']
    server_id = data.get('serverId', '1')
    channel_id = data.get('channelId', 'general')
    
    if username not in connected_users:
        emit('error', {'message': 'User not connected'}, room=request.sid)
        return
    
    # Check if user has permission to send message to this server/channel
    if not user_can_send_message(username, server_id, channel_id):
        emit('error', {'message': f'You do not have permission to send messages in this server/channel'}, room=request.sid)
        print(f'Permission denied: {username} tried to send message to {server_id}-{channel_id}')
        return
    
    message_data = {
        'id': str(uuid.uuid4()),
        'user': username,
        'text': data['text'],
        'timestamp': datetime.now().strftime('%I:%M %p'),
        'serverId': server_id,
        'channelId': channel_id
    }
    
    # Store message in server-channel combination
    channel_key = f"{server_id}-{channel_id}"
    if channel_key not in channel_messages:
        channel_messages[channel_key] = []
    channel_messages[channel_key].append(message_data)
    
    # Broadcast message only to users who have access to this server
    # For now, broadcast to all connected clients, but in production you'd filter by server access
    emit('new_message', message_data, broadcast=True)
    print(f'Message from {username} in {server_id}-{channel_id}: {data["text"]}')

@socketio.on('get_users')
def handle_get_users():
    emit('users_update', {'users': list(connected_users.keys())})

@socketio.on('get_messages')
def handle_get_messages(data):
    server_id = data.get('serverId', '1')
    channel_id = data.get('channelId', 'general')
    channel_key = f"{server_id}-{channel_id}"
    messages = channel_messages.get(channel_key, [])
    emit('messages_history', {'messages': messages, 'serverId': server_id, 'channelId': channel_id})

@socketio.on('typing_start')
def handle_typing_start(data):
    username = data['username']
    server_id = data.get('serverId', '1')
    channel_id = data.get('channelId', 'general')
    channel_key = f"{server_id}-{channel_id}"
    
    if channel_key not in typing_users:
        typing_users[channel_key] = set()
    
    typing_users[channel_key].add(username)
    emit('typing_start', {'username': username, 'serverId': server_id, 'channelId': channel_id}, broadcast=True)

@socketio.on('typing_stop')
def handle_typing_stop(data):
    username = data['username']
    server_id = data.get('serverId', '1')
    channel_id = data.get('channelId', 'general')
    channel_key = f"{server_id}-{channel_id}"
    
    if channel_key in typing_users:
        typing_users[channel_key].discard(username)
        if not typing_users[channel_key]:
            del typing_users[channel_key]
    
    emit('typing_stop', {'username': username, 'serverId': server_id, 'channelId': channel_id}, broadcast=True)

@socketio.on('update_status')
def handle_update_status(data):
    username = data['username']
    status = data['status']
    
    if username in connected_users:
        connected_users[username]['status'] = status
        emit('user_status_update', {'username': username, 'status': status}, broadcast=True)

@app.route('/api/servers', methods=['GET'])
def get_servers():
    return jsonify({'servers': servers})

@app.route('/api/servers/<string:server_id>/channels', methods=['GET'])
def get_server_channels(server_id):
    if server_id in servers:
        return jsonify({'channels': servers[server_id]['channels']})
    return jsonify({'error': 'Server not found'}), 404

@app.route('/api/servers/<string:server_id>/channels/<string:channel_id>/messages', methods=['GET'])
def get_channel_messages(server_id, channel_id):
    channel_key = f"{server_id}-{channel_id}"
    messages = channel_messages.get(channel_key, [])
    return jsonify({'messages': messages})

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)

