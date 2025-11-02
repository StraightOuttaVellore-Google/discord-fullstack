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
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

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
  const [selectedServer, setSelectedServer] = useState(null)
  const [selectedChannel, setSelectedChannel] = useState(null)
  const wsRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [token, setToken] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Server and channel data from API
  const [servers, setServers] = useState({})
  const [channels, setChannels] = useState({})
  const [isLoadingServers, setIsLoadingServers] = useState(false)
  const [isLoadingChannels, setIsLoadingChannels] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Check for existing token on mount
  useEffect(() => {
    // First, check if token is passed in URL query parameter (from main app)
    const urlParams = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get('token')
    
    if (tokenFromUrl) {
      // Store token in localStorage for this origin
      localStorage.setItem('access_token', tokenFromUrl)
      setToken(tokenFromUrl)
      setIsAuthenticated(true)
      fetchUserServers(tokenFromUrl)
      
      // Clean up URL to remove token query parameter
      window.history.replaceState({}, document.title, window.location.pathname)
    } else {
      // Fall back to checking localStorage (for page refresh or direct navigation)
      const storedToken = localStorage.getItem('access_token')
      
      if (storedToken) {
        setToken(storedToken)
        setIsAuthenticated(true)
        fetchUserServers(storedToken)
      } else {
        // Try to get token from parent window if in iframe
        try {
          if (window.parent && window.parent !== window) {
            const parentToken = window.parent.localStorage?.getItem('access_token')
            if (parentToken) {
              localStorage.setItem('access_token', parentToken)
              setToken(parentToken)
              setIsAuthenticated(true)
              fetchUserServers(parentToken)
            }
          }
        } catch (e) {
          // Could not access parent window
        }
      }
    }
  }, [])

  // Fetch user's accessible servers
  const fetchUserServers = async (authToken) => {
    setIsLoadingServers(true)
    try {
      const response = await fetch(`${API_BASE_URL}/chat/servers`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          setErrorMessage('Session expired. Please login again.')
          setIsAuthenticated(false)
          localStorage.removeItem('access_token')
          return
        }
        throw new Error('Failed to fetch servers')
      }
      
      const data = await response.json()
      
      // Extract servers array from response
      const serversData = data.servers || []
      
      // Convert array to object keyed by ID
      const serversObj = {}
      serversData.forEach(server => {
        serversObj[server.id] = server
      })
      
      setServers(serversObj)
      
      // Check if there's a stored server selection from sessionStorage
      const storedServerId = sessionStorage.getItem('selectedServerId')
      let serverToSelect = null
      
      if (storedServerId && serversObj[storedServerId]) {
        // Use the stored server if it exists
        serverToSelect = storedServerId
        sessionStorage.removeItem('selectedServerId') // Clear after use
      } else if (serversData.length > 0) {
        // Otherwise select first server
        serverToSelect = serversData[0].id
      }
      
      if (serverToSelect) {
        setSelectedServer(serverToSelect)
        fetchServerChannels(serverToSelect, authToken)
      }
    } catch (error) {
      console.error('Error fetching servers:', error)
      setErrorMessage('Failed to load servers')
    } finally {
      setIsLoadingServers(false)
    }
  }

  // Fetch channels for a server
  const fetchServerChannels = async (serverId, authToken = token) => {
    setIsLoadingChannels(true)
    try {
      const response = await fetch(`${API_BASE_URL}/chat/servers/${serverId}/channels`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch channels')
      }
      
      const data = await response.json()
      
      // Extract channels array from response
      const channelsData = data.channels || []
      
      setChannels(prev => ({
        ...prev,
        [serverId]: channelsData
      }))
      
      // Check if there's a stored channel selection from sessionStorage
      const storedChannelId = sessionStorage.getItem('selectedChannelId')
      let channelToSelect = null
      
      if (storedChannelId) {
        const matchingChannel = channelsData.find(ch => ch.id === storedChannelId)
        if (matchingChannel) {
          channelToSelect = storedChannelId
          sessionStorage.removeItem('selectedChannelId') // Clear after use
        }
      }
      
      // If no stored channel, select first text channel
      if (!channelToSelect) {
        const firstTextChannel = channelsData.find(ch => ch.type === 'text')
        if (firstTextChannel) {
          channelToSelect = firstTextChannel.id
        }
      }
      
      if (channelToSelect) {
        setSelectedChannel(channelToSelect)
        fetchChannelMessages(serverId, channelToSelect, authToken)
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
      setErrorMessage('Failed to load channels')
    } finally {
      setIsLoadingChannels(false)
    }
  }

  // Fetch message history for a channel
  const fetchChannelMessages = async (serverId, channelId, authToken = token) => {
    setIsLoadingMessages(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/servers/${serverId}/channels/${channelId}/messages?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      
      const data = await response.json()
      
      // Extract messages array from response
      const messagesData = data.messages || []
      const channelKey = `${serverId}-${channelId}`
      
      setMessages(prev => ({
        ...prev,
        [channelKey]: messagesData
      }))
    } catch (error) {
      console.error('Error fetching messages:', error)
      setErrorMessage('Failed to load messages')
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // Initialize WebSocket connection
  const connectWebSocket = () => {
    if (!token) {
      console.error('No token available for WebSocket connection')
      return
    }

    const ws = new WebSocket(`${WS_BASE_URL}/chat/ws?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      console.log('WebSocket connected')
    }

    ws.onclose = () => {
      setIsConnected(false)
      console.log('WebSocket disconnected')
      
      // Attempt reconnection after 3 seconds
      setTimeout(() => {
        if (isAuthenticated && token) {
          console.log('Attempting to reconnect...')
          connectWebSocket()
        }
      }, 3000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setErrorMessage('Connection error')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }
  }

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data) => {
    const { type } = data

    switch (type) {
      case 'connected':
        console.log('Connected as:', data.username)
        setUsername(data.username)
        setHasJoined(true)
        break

      case 'new_message':
        const channelKey = `${data.serverId}-${data.channelId}`
        setMessages(prev => ({
          ...prev,
          [channelKey]: [...(prev[channelKey] || []), data]
        }))
        break

      case 'typing_start':
        if (data.username !== username) {
          setTypingUsers(prev => {
            if (!prev.includes(data.username)) {
              return [...prev, data.username]
            }
            return prev
          })
        }
        break

      case 'typing_stop':
        setTypingUsers(prev => prev.filter(u => u !== data.username))
        break

      case 'servers_data':
        setServers(data.servers)
        break

      case 'error':
        setErrorMessage(data.message)
        setTimeout(() => setErrorMessage(''), 5000)
        break

      default:
        console.log('Unknown message type:', type, data)
    }
  }

  // Connect WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated && token && !wsRef.current) {
      connectWebSocket()
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [isAuthenticated, token])

  const sendMessage = () => {
    if (newMessage.trim() && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (!selectedServer || !selectedChannel) {
        setErrorMessage('Please select a server and channel')
        setTimeout(() => setErrorMessage(''), 3000)
        return
      }

      wsRef.current.send(JSON.stringify({
        type: 'send_message',
        serverId: selectedServer,
        channelId: selectedChannel,
        text: newMessage
      }))
      
      setNewMessage('')
      
      // Clear typing state
      if (isTyping) {
        setIsTyping(false)
        wsRef.current.send(JSON.stringify({
          type: 'typing_stop',
          serverId: selectedServer,
          channelId: selectedChannel
        }))
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    
    // If user starts typing and wasn't typing before
    if (e.target.value && !isTyping) {
      setIsTyping(true)
      wsRef.current.send(JSON.stringify({
        type: 'typing_start',
        serverId: selectedServer,
        channelId: selectedChannel
      }))
    }
    
    // If user clears the input completely
    if (!e.target.value && isTyping) {
      setIsTyping(false)
      wsRef.current.send(JSON.stringify({
        type: 'typing_stop',
        serverId: selectedServer,
        channelId: selectedChannel
      }))
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      return
    }
    
    // Reset timeout for typing indicator
    if (e.target.value && isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'typing_stop',
            serverId: selectedServer,
            channelId: selectedChannel
          }))
        }
        typingTimeoutRef.current = null
      }, 2000)
    }
  }

  const handleServerChange = (serverId) => {
    setSelectedServer(serverId)
    setSelectedChannel(null)
    if (!channels[serverId]) {
      fetchServerChannels(serverId)
    } else {
      const firstTextChannel = channels[serverId].find(ch => ch.type === 'text')
      if (firstTextChannel) {
        setSelectedChannel(firstTextChannel.id)
        fetchChannelMessages(serverId, firstTextChannel.id)
      }
    }
  }

  const handleChannelChange = (channelId) => {
    setSelectedChannel(channelId)
    if (selectedServer) {
      fetchChannelMessages(selectedServer, channelId)
    }
  }

  // Show authentication required message if no token
  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-background text-foreground flex items-center justify-center">
        <div className="w-full max-w-md p-8 text-center">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              NeuroDiscord
            </h1>
            <p className="text-muted-foreground">Please login through the main application</p>
          </div>
          
          {errorMessage && (
            <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md mb-4">
              {errorMessage}
            </div>
          )}
          
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
    )
  }

  const currentChannelKey = selectedServer && selectedChannel ? `${selectedServer}-${selectedChannel}` : null
  const currentMessages = currentChannelKey ? (messages[currentChannelKey] || []) : []
  const currentServer = selectedServer ? servers[selectedServer] : null
  const currentChannels = selectedServer ? (channels[selectedServer] || []) : []
  const currentChannel = currentChannels.find(c => c.id === selectedChannel)
  
  const serverList = Object.values(servers)

  return (
    <div className="h-screen bg-background text-foreground flex">
      {/* Server Sidebar */}
      <div className="w-16 bg-sidebar border-r border-border flex flex-col items-center py-3 space-y-2">
        {isLoadingServers ? (
          <div className="w-12 h-12 rounded-2xl neuro-server-icon flex items-center justify-center">
            <div className="animate-spin">⏳</div>
          </div>
        ) : (
          serverList.map((server) => (
            <Button
              key={server.id}
              variant="ghost"
              size="icon"
              onClick={() => handleServerChange(server.id)}
              className={`w-12 h-12 rounded-2xl neuro-server-icon flex items-center justify-center text-lg transition-all duration-200 ${
                selectedServer === server.id ? 'active rounded-xl' : 'hover:rounded-xl'
              }`}
              title={server.name}
            >
              {server.icon}
            </Button>
          ))
        )}
        
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
            <h1 className="text-lg font-semibold truncate">{currentServer?.name || 'Select Server'}</h1>
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
            
            {isLoadingChannels ? (
              <div className="text-sm text-muted-foreground">Loading channels...</div>
            ) : (
              <div className="space-y-1">
                {currentChannels
                  .filter(channel => channel.type === 'text')
                  .map((channel) => (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    onClick={() => handleChannelChange(channel.id)}
                    className={`w-full justify-start px-2 py-1.5 h-auto text-sm neuro-channel-item ${
                      selectedChannel === channel.id ? 'active' : ''
                    }`}
                  >
                    <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{channel.name}</span>
                  </Button>
                ))}
              </div>
            )}

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
            <h2 className="text-lg font-semibold">{currentChannel?.name || 'Select Channel'}</h2>
            <div className="text-sm text-muted-foreground ml-2">
              {currentChannels.filter(c => c.type === 'text').length} text channels
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-4 bg-destructive/10 border-l-4 border-destructive text-destructive">
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoadingMessages ? (
            <div className="text-center text-muted-foreground py-8">
              Loading messages...
            </div>
          ) : currentMessages.length === 0 ? (
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
                placeholder={currentChannel ? `Message #${currentChannel.name}` : 'Select a channel'}
                className="neuro-input"
                disabled={!isConnected || !selectedChannel}
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !isConnected || !selectedChannel}
              className="neuro-send-button"
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Members Sidebar - Can be populated from server members API */}
      <div className="w-60 bg-card border-l border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Members
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-sm text-muted-foreground text-center">
            Member list coming soon
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
