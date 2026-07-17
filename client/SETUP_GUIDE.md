# Video Calling Application - Complete Setup Guide

This guide will help you set up and run the complete video calling application with both frontend and backend.

## Project Structure

```
video-call-app/
├── video-call-frontend/      (Next.js 16 application)
│   ├── app/
│   ├── components/
│   ├── context/
│   ├── lib/
│   └── .env.local
│
└── video-call-backend/       (Express.js application)
    ├── src/
    │   ├── config/
    │   ├── routes/
    │   ├── sockets/
    │   ├── middleware/
    │   ├── types/
    │   └── server.ts
    └── .env
```

## Prerequisites

- Node.js 16+ installed
- npm, yarn, pnpm, or bun
- MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)
- Git (optional, for version control)

## Step-by-Step Setup

### 1. Backend Setup

#### 1.1 Create Backend Directory

```bash
mkdir video-call-backend
cd video-call-backend
```

#### 1.2 Initialize Node Project

```bash
npm init -y
```

#### 1.3 Install Dependencies

```bash
npm install express socket.io mongodb dotenv jsonwebtoken bcryptjs cors
npm install -D typescript ts-node @types/express @types/node @types/jsonwebtoken @types/bcryptjs
```

#### 1.4 Initialize TypeScript

```bash
npx tsc --init
```

Update `tsconfig.json` with:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

#### 1.5 Create Project Structure

```bash
mkdir -p src/config src/routes src/sockets src/middleware src/types
```

#### 1.6 Copy Backend Files

Copy all files from the backend code section provided:
- `config/db.ts` → `src/config/db.ts`
- `types/index.ts` → `src/types/index.ts`
- `middleware/auth.ts` → `src/middleware/auth.ts`
- `routes/auth.ts` → `src/routes/auth.ts`
- `routes/users.ts` → `src/routes/users.ts`
- `routes/calls.ts` → `src/routes/calls.ts`
- `routes/messages.ts` → `src/routes/messages.ts`
- `sockets/signaling.ts` → `src/sockets/signaling.ts`
- `sockets/chat.ts` → `src/sockets/chat.ts`
- `server.ts` → `src/server.ts`

#### 1.7 Create .env File

Create `.env` in the backend root:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/video_calling?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Generate a strong JWT secret:
```bash
openssl rand -base64 32
```

#### 1.8 Update package.json Scripts

```json
{
  "scripts": {
    "dev": "ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "type-check": "tsc --noEmit"
  }
}
```

#### 1.9 Start Backend

```bash
npm run dev
```

Backend should start on `http://localhost:5000`

---

### 2. Frontend Setup

#### 2.1 Frontend is Already Set Up

The frontend is already in your Next.js project. You just need to install the remaining dependencies and create the .env file.

#### 2.2 Install Frontend Dependencies (if not already done)

```bash
cd /path/to/frontend
pnpm install socket.io-client swr js-cookie
```

#### 2.3 Create .env.local File

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### 2.4 Start Frontend Development Server

```bash
pnpm dev
```

Frontend should start on `http://localhost:3000`

---

### 3. MongoDB Atlas Setup

#### 3.1 Create MongoDB Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Sign Up" and create an account
3. Verify your email

#### 3.2 Create a Project

1. Click "Create a project"
2. Name it "video-calling"
3. Click "Create project"

#### 3.3 Create a Cluster

1. Click "Build a Database"
2. Select "Free" tier
3. Choose your preferred cloud provider and region
4. Click "Create Cluster"
5. Wait for cluster to be ready (2-3 minutes)

#### 3.4 Create Database User

1. Go to "Database Access"
2. Click "Add New Database User"
3. Create username and password (note these!)
4. Set "Database User Privileges" to "Atlas Administrator"
5. Click "Add User"

#### 3.5 Add IP Whitelist

1. Go to "Network Access"
2. Click "Add IP Address"
3. For development, you can use "0.0.0.0/0" (allows all IPs - not recommended for production)
4. For production, add your specific server IP
5. Click "Confirm"

#### 3.6 Get Connection String

1. Go to "Databases"
2. Click "Connect" on your cluster
3. Choose "Drivers"
4. Copy the connection string
5. Replace `<username>` and `<password>` with your database user credentials
6. Replace `<database>` with "video_calling"

Example:
```
mongodb+srv://videocall_user:MySecurePassword123@cluster0.abcdef.mongodb.net/video_calling?retryWrites=true&w=majority
```

---

### 4. Testing the Application

#### 4.1 Create Test Users

1. Go to http://localhost:3000
2. You'll be redirected to login
3. Click "Sign up" to create an account
4. Fill in the form:
   - Email: test1@example.com
   - Username: testuser1
   - Display Name: Test User 1
   - Password: password123
5. Create another account for testing:
   - Email: test2@example.com
   - Username: testuser2
   - Display Name: Test User 2

#### 4.2 Test Video Calling

1. Log in with the first account
2. Open another browser window/tab (or incognito) and log in with the second account
3. Click on the online user to initiate a call
4. Accept the call in the other browser
5. You should see video from both users
6. Test audio/video toggles and end call button

---

## Key Features

### Authentication
- Email and password registration
- JWT token-based login
- Secure password hashing with bcryptjs
- Token stored in cookies

### User Management
- Search users by username, display name, or email
- View online users in real-time
- User profiles with avatars

### Video Calling
- One-on-one video calls using WebRTC
- Real-time audio and video streaming
- Peer-to-peer connection with ICE candidates
- Audio/video mute controls
- Call duration tracking

### Chat & Messaging
- In-call text chat
- Message history
- Typing indicators

### Call History
- Store call records with duration
- View call history page
- Call metadata (duration, timestamp, type)

---

## Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| MONGODB_URI | MongoDB Atlas connection string | mongodb+srv://user:pass@cluster... |
| JWT_SECRET | Secret key for JWT signing | openssl rand -base64 32 |
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development / production |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |

### Frontend (.env.local)

| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:5000 |

---

## Common Issues & Troubleshooting

### Connection Refused on localhost:5000
- Backend is not running
- Run `npm run dev` in the backend directory
- Check if port 5000 is already in use

### MongoDB Connection Error
- Check MONGODB_URI in .env
- Verify IP whitelist includes your machine
- Check database user credentials

### Can't see online users
- Both backend and frontend must be running
- Check browser console for errors
- Verify Socket.io connection in browser DevTools

### Video/Audio not working
- Check browser permissions for camera/microphone
- Try https://webrtc.github.io/samples/web/content/getusermedia/gum/ to test
- Ensure CORS is configured correctly

### Call quality issues
- Check internet connection speed
- Reduce video resolution in browser settings
- Use 5GHz WiFi instead of 2.4GHz for better performance

---

## Production Deployment

### Backend Deployment Options

#### Option 1: Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway add
railway up
```

#### Option 2: Heroku
```bash
npm install -g heroku-cli
heroku login
heroku create your-app-name
git push heroku main
```

#### Option 3: Vercel (with serverless adaptation)
Note: WebSocket support requires a paid plan on Vercel

#### Option 4: Self-hosted (AWS EC2, DigitalOcean, etc.)
1. Install Node.js on server
2. Clone repository
3. Install dependencies
4. Set environment variables
5. Run `npm run build && npm start`
6. Use PM2 for process management

### Frontend Deployment

#### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

#### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

---

## Performance Optimization

### For Production

1. **Enable HTTPS/WSS** - WebRTC requires secure connections
2. **Use STUN/TURN servers** - Add additional STUN servers in webrtc.ts
3. **Database indexing** - Indexes are created automatically
4. **Redis for session management** - Consider for scaling
5. **Load balancing** - Use nginx or similar for multiple backend instances
6. **CDN for static files** - Serve frontend assets via CDN

---

## API Documentation

### Authentication Routes

#### POST /api/auth/register
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "displayName": "Display Name"
}
```

#### POST /api/auth/login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET /api/auth/me
Headers: `Authorization: Bearer <token>`

### User Routes

#### GET /api/users/search?query=searchterm
#### GET /api/users/online
#### GET /api/users/:userId
#### PUT /api/users/profile

### Call Routes

#### POST /api/calls/create
#### POST /api/calls/:callId/end
#### GET /api/calls/history
#### GET /api/calls/:callId

### Message Routes

#### POST /api/messages/send
#### GET /api/messages/conversation/:otherId
#### GET /api/messages/call/:callId

---

## Socket.io Events

### Signaling Events
- `user-online` - User comes online
- `user-list-updated` - Online users list updated
- `call-initiate` - Send call request
- `incoming-call` - Receive incoming call
- `call-accept` - Accept call
- `call-accepted` - Call accepted confirmation
- `call-reject` - Reject call
- `call-rejected` - Call rejected confirmation
- `offer` - WebRTC offer
- `answer` - WebRTC answer
- `ice-candidate` - ICE candidate
- `call-end` - End call
- `call-ended` - Call ended notification

### Chat Events
- `send-message` - Send message
- `receive-message` - Receive message
- `typing` - Typing indicator
- `user-typing` - User typing notification
- `load-conversation` - Load message history
- `conversation-loaded` - Conversation history loaded

---

## Support & Resources

- WebRTC Documentation: https://webrtc.org/
- Socket.io Documentation: https://socket.io/docs/
- MongoDB Documentation: https://docs.mongodb.com/
- Express Documentation: https://expressjs.com/
- Next.js Documentation: https://nextjs.org/docs

---

## Next Steps

1. Customize the UI/branding
2. Add user profile editing
3. Implement group video calls
4. Add screen sharing
5. Implement call recording
6. Add push notifications
7. Deploy to production

Good luck with your video calling application!
