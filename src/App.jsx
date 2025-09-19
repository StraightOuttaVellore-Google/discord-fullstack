import React, { useState, useEffect, useRef } from 'react'
import { 
  Send, 
  Moon, 
  Sun, 
  Users, 
  MessageCircle,
  Hash,
  Plus,
  Settings,
  Volume2
} from 'lucide-react'
import io from 'socket.io-client'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [messages, setMessages] = useState({})
  const [newMessage, setNewMessage] = useState('')
  const [username, setUsername] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [users, setUsers] = useState([])
  const [hasJoined, setHasJoined] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [selectedServer, setSelectedServer] = useState('1')
  const [selectedChannel, setSelectedChannel] = useState('general')
  const socketRef = useRef(null)

  // Mock data for servers and channels
  const [servers] = useState([
    { id: '1', name: 'My Server', icon: '🏠' },
    { id: '2', name: 'Gaming', icon: '🎮' },
    { id: '3', name: 'Work', icon: '💼' },
  ])

  const [channels] = useState({
    '1': [
      { id: 'general', name: 'general', type: 'text' },
      { id: 'random', name: 'random', type: 'text' },
      { id: 'announcements', name: 'announcements', type: 'text' },
    ],
    '2': [
      { id: 'general', name: 'general', type: 'text' },
      { id: 'game-chat', name: 'game-chat', type: 'text' },
      { id: 'voice-general', name: 'Voice General', type: 'voice' },
    ],
    '3': [
      { id: 'general', name: 'general', type: 'text' },
      { id: 'projects', name: 'projects', type: 'text' },
      { id: 'meeting-room', name: 'Meeting Room', type: 'voice' },
    ],
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    // Initialize socket connection
    const backendUrl = import.meta.env.VITE_SOCKET_URL || `http://${window.location.hostname}:5001`
    socketRef.current = io(backendUrl, { transports: ['websocket', 'polling'] })

    socketRef.current.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to server')
    })

    socketRef.current.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from server')
    })

    socketRef.current.on('new_message', (messageData) => {
      const channelKey = `${messageData.serverId}-${messageData.channelId}`
      setMessages(prev => ({
        ...prev,
        [channelKey]: [...(prev[channelKey] || []), messageData]
      }))
    })

    socketRef.current.on('users_update', (data) => {
      setUsers(data.users)
    })

    socketRef.current.on('user_joined', (data) => {
      console.log(`${data.username} joined the chat`)
    })

    socketRef.current.on('user_left', (data) => {
      console.log(`${data.username} left the chat`)
    })

    socketRef.current.on('typing_start', (data) => {
      setTypingUsers(prev => [...prev.filter(u => u !== data.username), data.username])
    })

    socketRef.current.on('typing_stop', (data) => {
      setTypingUsers(prev => prev.filter(u => u !== data.username))
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const joinChat = () => {
    if (username.trim() && socketRef.current) {
      socketRef.current.emit('join_chat', { username })
      setHasJoined(true)
    }
  }

  const sendMessage = () => {
    if (newMessage.trim() && socketRef.current && hasJoined) {
      socketRef.current.emit('send_message', {
        user: username,
        text: newMessage,
        serverId: selectedServer,
        channelId: selectedChannel
      })
      setNewMessage('')
    }
  }

  const currentChannelKey = `${selectedServer}-${selectedChannel}`
  const currentMessages = messages[currentChannelKey] || []
  const currentServer = servers.find(s => s.id === selectedServer)
  const currentChannels = channels[selectedServer] || []
  const currentChannel = currentChannels.find(c => c.id === selectedChannel)

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (!hasJoined) {
        joinChat()
      } else {
        sendMessage()
      }
    }
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)
    
    if (e.target.value && !isTyping) {
      setIsTyping(true)
      socketRef.current.emit('typing_start', { username })
    } else if (!e.target.value && isTyping) {
      setIsTyping(false)
      socketRef.current.emit('typing_stop', { username })
    }
  }


  if (!hasJoined) {
    return (
      <div className="h-screen bg-background text-foreground flex items-center justify-center">
        <div className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              NeuroDiscord
            </h1>
            <p className="text-muted-foreground">Enter your username to join the servers</p>
          </div>
          
          <div className="space-y-6">
            <div className="neuro-input-container">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your username..."
                className="neuro-input text-center text-lg"
              />
            </div>
            
            <Button
              onClick={joinChat}
              disabled={!username.trim() || !isConnected}
              className="w-full neuro-send-button text-lg py-3"
            >
              {isConnected ? 'Join Servers' : 'Connecting...'}
            </Button>
            
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="neuro-button"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background text-foreground flex">
      {/* Server Sidebar */}
      <div className="w-16 bg-sidebar border-r border-border flex flex-col items-center py-3 space-y-2">
        {servers.map((server) => (
          <Button
            key={server.id}
            variant="ghost"
            size="icon"
            onClick={() => setSelectedServer(server.id)}
            className={`w-12 h-12 rounded-2xl neuro-server-icon flex items-center justify-center text-lg transition-all duration-200 ${
              selectedServer === server.id ? 'active rounded-xl' : 'hover:rounded-xl'
            }`}
            title={server.name}
          >
            {server.icon}
          </Button>
        ))}
        
        <div className="flex-1" />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDarkMode(!darkMode)}
          className="w-12 h-12 rounded-2xl neuro-server-icon flex items-center justify-center"
          title="Toggle Theme"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Channels Sidebar */}
      <div className="w-60 bg-card border-r border-border flex flex-col">
        {/* Server Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold truncate">{currentServer?.name}</h1>
            <Button variant="ghost" size="sm" className="neuro-button">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2">
            <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs ${
              isConnected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Text Channels
              </h3>
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-1">
              {currentChannels
                .filter(channel => channel.type === 'text')
                .map((channel) => (
                <Button
                  key={channel.id}
                  variant="ghost"
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`w-full justify-start px-2 py-1.5 h-auto text-sm neuro-channel-item ${
                    selectedChannel === channel.id ? 'active' : ''
                  }`}
                >
                  <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{channel.name}</span>
                </Button>
              ))}
            </div>

            {currentChannels.some(channel => channel.type === 'voice') && (
              <>
                <div className="mt-6 mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Voice Channels
                  </h3>
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="space-y-1">
                  {currentChannels
                    .filter(channel => channel.type === 'voice')
                    .map((channel) => (
                    <Button
                      key={channel.id}
                      variant="ghost"
                      className="w-full justify-start px-2 py-1.5 h-auto text-sm neuro-channel-item"
                    >
                      <Volume2 className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{channel.name}</span>
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded-md neuro-card">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium">{username[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{username}</div>
              <div className="text-xs text-muted-foreground">Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{currentChannel?.name}</h2>
            <div className="text-sm text-muted-foreground ml-2">
              {currentChannels.filter(c => c.type === 'text').length} text channels
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Welcome to #{currentChannel?.name}!</p>
              <p className="text-sm mt-1">This is the start of the #{currentChannel?.name} channel.</p>
            </div>
          ) : (
            currentMessages.map((message) => (
              <div key={message.id} className="group">
                <div className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/20 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium">{message.user[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-medium">{message.user}</span>
                      <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                    </div>
                    <div className="text-sm">{message.text}</div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm px-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex gap-3">
            <div className="flex-1 neuro-input-container">
              <Input
                value={newMessage}
                onChange={handleTyping}
                onKeyPress={handleKeyPress}
                placeholder={`Message #${currentChannel?.name}`}
                className="neuro-input"
                disabled={!isConnected}
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !isConnected}
              className="neuro-send-button"
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Members Sidebar */}
      <div className="w-60 bg-card border-l border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Members — {users.length}
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center relative">
                  <span className="text-sm font-medium">{user[0]?.toUpperCase()}</span>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{user}</div>
                  <div className="text-xs text-muted-foreground">Online</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App