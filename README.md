# NeuroChat - Neumorphic Discord-Style Chat Application

A modern, full-stack chat application inspired by Discord, featuring neumorphic design principles and real-time communication capabilities.

## 🌟 Features

### Core Features
- **Discord-Style Interface**: Three-panel layout with servers, channels, and chat areas
- **Real-time Messaging**: Instant message delivery using WebSocket technology
- **Neumorphic Design**: Soft UI with tactile shadows and gradients
- **Light/Dark Modes**: Seamless theme switching with adaptive neumorphic effects
- **Channel System**: Organized text and voice channels within servers
- **User Management**: Online status indicators and user profiles
- **Typing Indicators**: Real-time typing status for active users

### Design Highlights
- **Soft Shadows**: Subtle depth effects using rgba shadows
- **Gradient Backgrounds**: Linear gradients for enhanced visual appeal
- **Smooth Animations**: Cubic-bezier transitions for fluid interactions
- **Responsive Layout**: Mobile-first design with desktop optimization
- **Accessibility**: High contrast ratios and keyboard navigation

## 🚀 Technology Stack

### Frontend
- **React 19** - Modern React with latest features
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Socket.IO Client** - Real-time communication
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icon library

### Backend
- **Flask** - Python web framework
- **Socket.IO** - Real-time WebSocket communication
- **SQLite** - Lightweight database for development
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── button.jsx
│   │       └── input.jsx
│   ├── lib/
│   │   └── utils.js
│   ├── App.jsx
│   ├── App.css
│   └── design_concept.md
├── main.py
├── package.json
├── index.html
└── todo.md
```

## 🎨 Design System

### Color Palette
- **Primary**: #6366f1 (Indigo) - Interactive elements
- **Background Light**: #f0f0f3 - Soft off-white base
- **Background Dark**: #1a1a1d - Deep charcoal base
- **Text Light**: #2d2d30 - Dark grey for readability
- **Text Dark**: #e5e5e8 - Light grey for contrast

### Neumorphic Shadows
- **Light Mode**: `rgba(163, 177, 198, 0.6)` for depth
- **Dark Mode**: `rgba(0, 0, 0, 0.4)` for contrast
- **Interactive States**: Different intensities for hover, active, and focus

### Typography
- **Headings**: Inter font family (600-700 weight)
- **Body Text**: Inter font family (400-500 weight)
- **Scale**: 12px, 14px, 16px, 18px, 24px, 32px

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- npm or pnpm

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Install Python dependencies
pip install flask flask-socketio flask-cors

# Start the server
python main.py
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5001

## 🎯 Usage

1. **Join Chat**: Enter your username to join the chat
2. **Select Server**: Click on server icons in the left sidebar
3. **Choose Channel**: Select text or voice channels from the middle panel
4. **Send Messages**: Type in the message input and press Enter
5. **Switch Themes**: Use the theme toggle button

## 🔧 Key Components

### Neumorphic Elements
- `.neuro-button` - Raised button with soft shadows
- `.neuro-card` - Card component with depth
- `.neuro-input` - Inset input field
- `.neuro-message` - Message bubbles with gradients
- `.neuro-server-icon` - Server selection buttons

### Interactive Features
- **Hover Effects**: Subtle lift animations
- **Active States**: Inset shadows for pressed elements
- **Focus States**: Glowing borders for accessibility
- **Transitions**: Smooth cubic-bezier animations

## 🌐 API Endpoints

### WebSocket Events
- `join_chat` - Join the chat with username
- `send_message` - Send a message to a channel
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `update_status` - Update user status

### REST Endpoints
- `GET /api/servers` - Get all servers
- `GET /api/servers/{id}/channels` - Get server channels
- `GET /api/channels/{id}/messages` - Get channel messages

## 🎨 Design Philosophy

### Neumorphism Principles
1. **Soft Depth**: Elements appear to float above or sink into the background
2. **Monochromatic Palette**: Limited color scheme with subtle variations
3. **Ambient Lighting**: Shadows mimic natural light interaction
4. **Tactile Feedback**: Visual design evokes physical interaction

### Minimalism Principles
1. **Clean Layouts**: Ample whitespace for breathing room
2. **Essential Elements**: Only necessary components for functionality
3. **Consistent Design**: Uniform patterns and interactions
4. **Intuitive Navigation**: Clear and simple user flows

## 🚧 Future Enhancements

### Phase 3: Advanced Features
- [ ] Message reactions and emoji picker
- [ ] File upload and sharing
- [ ] Voice channel integration
- [ ] Notification system
- [ ] Search functionality

### Phase 4: Polish & Optimization
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Accessibility improvements
- [ ] Testing and bug fixes
- [ ] Production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Discord for UI/UX inspiration
- Neumorphism design community
- React and Flask communities
- Open source contributors

---

**NeuroChat** - Where modern design meets real-time communication 🚀
