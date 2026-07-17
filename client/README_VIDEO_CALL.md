# Video Calling Application

A full-stack, real-time video calling application built with Next.js 16, Express.js, WebRTC, Socket.io, and MongoDB. Connect with anyone, anywhere, in real-time.

## Features

### Core Functionality
- **User Authentication** - Secure registration and login with JWT tokens
- **One-on-One Video Calls** - High-quality peer-to-peer video calling
- **Group Video Calls** - Connect with multiple users simultaneously
- **Real-time Chat** - Send and receive messages during calls
- **Call History** - Track all your calls with timestamps and duration
- **Online Presence** - See who's available to call in real-time
- **User Profiles** - Custom display names and avatars

### Technical Features
- **WebRTC P2P** - Peer-to-peer video/audio streaming
- **Socket.io Signaling** - Real-time signaling for call establishment
- **JWT Authentication** - Secure token-based auth system
- **MongoDB Atlas** - Cloud-hosted NoSQL database
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Error Handling** - Comprehensive error management and logging

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io Client** - Real-time communication
- **SWR** - Data fetching and caching

### Backend
- **Express.js** - Node.js web framework
- **TypeScript** - Type-safe JavaScript
- **Socket.io** - WebSocket library
- **MongoDB** - NoSQL database
- **JWT** - JSON Web Tokens for auth
- **bcryptjs** - Password hashing

### Infrastructure
- **MongoDB Atlas** - Cloud database hosting
- **Vercel** - Frontend deployment (optional)
- **Railway/Heroku** - Backend deployment (optional)

## Project Structure

```
├── Frontend (Next.js)
│   ├── app/
│   │   ├── login/              # Login page
│   │   ├── signup/             # Registration page
│   │   ├── dashboard/          # Main dashboard with user list
│   │   ├── call/[callId]/      # Video call interface
│   │   └── history/            # Call history page
│   ├── components/
│   │   ├── VideoCall.tsx       # Main video call component
│   │   ├── UserList.tsx        # Online users list
│   │   ├── ProtectedRoute.tsx  # Auth protection wrapper
│   │   └── ui/                 # UI components
│   ├── context/
│   │   └── AuthContext.tsx     # Auth state management
│   ├── lib/
│   │   ├── socket.ts           # Socket.io setup
│   │   └── webrtc.ts           # WebRTC utilities
│   └── .env.local              # Frontend environment variables
│
└── Backend (Express.js)
    ├── src/
    │   ├── config/
    │   │   └── db.ts           # MongoDB connection
    │   ├── routes/
    │   │   ├── auth.ts         # Auth endpoints
    │   │   ├── users.ts        # User endpoints
    │   │   ├── calls.ts        # Call endpoints
    │   │   └── messages.ts     # Message endpoints
    │   ├── sockets/
    │   │   ├── signaling.ts    # WebRTC signaling handlers
    │   │   └── chat.ts         # Chat handlers
    │   ├── middleware/
    │   │   └── auth.ts         # JWT middleware
    │   ├── types/
    │   │   └── index.ts        # TypeScript interfaces
    │   └── server.ts           # Express server setup
    ├── .env                    # Backend environment variables
    └── package.json
```

## Quick Start

### Prerequisites
- Node.js 16+
- npm/pnpm/yarn
- MongoDB Atlas account

### 1. Clone or Download the Code

```bash
# Download the project files from v0
unzip video-call-app.zip
cd video-call-app
```

### 2. Setup Backend

```bash
mkdir backend
cd backend

# Copy backend files from backend-code/
# - server.ts
# - config/db.ts
# - routes/auth.ts, routes/users.ts, routes/calls.ts, routes/messages.ts
# - sockets/signaling.ts, sockets/chat.ts
# - middleware/auth.ts
# - types/index.ts

# Install dependencies
npm install express socket.io mongodb dotenv jsonwebtoken bcryptjs cors
npm install -D typescript ts-node @types/express @types/node @types/jsonwebtoken @types/bcryptjs

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start backend
npm run dev
```

Backend runs on: `http://localhost:5000`

### 3. Setup Frontend

```bash
cd ../frontend

# Install remaining dependencies
pnpm install socket.io-client swr js-cookie

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Start frontend
pnpm dev
```

Frontend runs on: `http://localhost:3000`

### 4. Test the Application

1. Open http://localhost:3000 in browser
2. Create two accounts
3. Log in with both accounts (use two browser windows)
4. Click on a user to call them
5. Accept the call
6. Video call will start
7. Use controls to mute/unmute audio/video
8. Click hang up to end call

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login to account
- `GET /api/auth/me` - Get current user (requires auth)

### Users
- `GET /api/users/search?query=text` - Search users
- `GET /api/users/online` - Get online users
- `GET /api/users/:userId` - Get specific user
- `PUT /api/users/profile` - Update profile (requires auth)

### Calls
- `POST /api/calls/create` - Create new call
- `POST /api/calls/:callId/end` - End a call
- `GET /api/calls/history` - Get call history (requires auth)
- `GET /api/calls/:callId` - Get call details

### Messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/conversation/:userId` - Get chat history
- `GET /api/messages/call/:callId` - Get in-call messages

## Socket.io Events

### Signaling
```javascript
// Emit
socket.emit('user-online', userData)
socket.emit('call-initiate', { to, from, fromUser, callId })
socket.emit('call-accept', { to, from, callId })
socket.emit('call-reject', { to, from, reason })
socket.emit('offer', { from, to, data: RTCSessionDescription })
socket.emit('answer', { from, to, data: RTCSessionDescription })
socket.emit('ice-candidate', { from, to, data: RTCIceCandidate })
socket.emit('call-end', { from, to, callId })

// Listen
socket.on('incoming-call', (data) => {})
socket.on('call-accepted', (data) => {})
socket.on('call-rejected', (data) => {})
socket.on('offer', (data) => {})
socket.on('answer', (data) => {})
socket.on('ice-candidate', (data) => {})
socket.on('call-ended', (data) => {})
```

### Chat
```javascript
// Emit
socket.emit('send-message', { to, content, callId })
socket.emit('typing', { to, isTyping })
socket.emit('load-conversation', { withUserId })

// Listen
socket.on('receive-message', (data) => {})
socket.on('user-typing', (data) => {})
socket.on('conversation-loaded', (data) => {})
```

## Configuration

### Environment Variables

**Backend (.env)**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/video_calling
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### MongoDB Collections

```javascript
// users
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  username: String,
  displayName: String,
  avatar: String,
  createdAt: Date,
  updatedAt: Date
}

// calls
{
  _id: ObjectId,
  initiatorId: String,
  receiverId: String,
  groupMembers: [String],
  startTime: Date,
  endTime: Date,
  duration: Number,
  type: 'one-on-one' | 'group',
  createdAt: Date
}

// chat_messages
{
  _id: ObjectId,
  senderId: String,
  receiverId: String,
  content: String,
  timestamp: Date,
  callId: String
}

// call_history
{
  _id: ObjectId,
  userId: String,
  otherUserId: String,
  groupMembers: [String],
  callId: String,
  duration: Number,
  timestamp: Date,
  type: 'one-on-one' | 'group'
}
```

## Deployment

### Deploy Backend
- Railway: Recommended (easiest setup)
- Heroku: Classic choice (limited free tier)
- Vercel: Requires serverless adaptation
- AWS/Azure/GCP: Full control, more complex

### Deploy Frontend
- Vercel: One-click deployment (recommended)
- Netlify: Simple and fast
- GitHub Pages: Static hosting only

See SETUP_GUIDE.md for detailed deployment instructions.

## Performance Tips

1. **Use STUN/TURN servers** for better connectivity
2. **Compress videos** before streaming for lower bandwidth
3. **Enable database indexing** for faster queries
4. **Use Redis** for session caching in production
5. **Implement call quality monitoring**
6. **Add error recovery** for dropped connections

## Security Considerations

1. **HTTPS/WSS** - Always use secure connections in production
2. **Input Validation** - Validate all user inputs
3. **Rate Limiting** - Prevent abuse and brute force attacks
4. **CORS** - Configure properly for your domains
5. **Password Hashing** - Using bcryptjs with proper salt rounds
6. **Token Expiry** - JWT tokens expire after 7 days
7. **Database Access** - Use IP whitelisting in MongoDB Atlas

## Troubleshooting

### Camera/Microphone Not Working
1. Check browser permissions
2. Test at https://webrtc.github.io/samples/web/content/getusermedia/gum/
3. Ensure HTTPS in production

### Video Call Quality Issues
1. Check internet speed
2. Reduce video resolution
3. Use wired connection
4. Close other bandwidth-heavy apps

### Connection Issues
1. Verify MongoDB connection
2. Check CORS settings
3. Ensure both services are running
4. Check browser console for errors

### WebSocket Connection Failed
1. Verify backend is running on correct port
2. Check firewall settings
3. Ensure NEXT_PUBLIC_API_URL is correct
4. Check backend logs

## Future Enhancements

- Screen sharing capability
- Call recording
- Text-based translation
- Noise cancellation
- HD video quality options
- Meeting scheduling
- Call transcription
- Multi-participant support (>2 users)
- Push notifications

## License

MIT License - feel free to use for personal or commercial projects

## Support

For issues, questions, or feature requests:
1. Check the SETUP_GUIDE.md for common issues
2. Review browser console and backend logs
3. Test with sample credentials
4. Verify all environment variables are set correctly

## Credits

Built with modern web technologies and best practices in real-time communication.

---

**Ready to build? Start with the SETUP_GUIDE.md for step-by-step instructions!**
