# Quick Start Guide - Video Calling App

Get up and running in 15 minutes!

## 1. MongoDB Atlas Setup (5 minutes)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up and create an account
3. Create a new project called "video-calling"
4. Create a free cluster
5. Create a database user (remember the username & password)
6. Add your IP to the whitelist (use 0.0.0.0/0 for development)
7. Get your connection string (copy it)

Your connection string will look like:
```
mongodb+srv://username:password@cluster0.abcdef.mongodb.net/video_calling?retryWrites=true&w=majority
```

## 2. Backend Setup (5 minutes)

### Create backend folder structure
```bash
mkdir backend
cd backend
npm init -y
npm install express socket.io mongodb dotenv jsonwebtoken bcryptjs cors
npm install -D typescript ts-node @types/express @types/node @types/jsonwebtoken @types/bcryptjs
npx tsc --init
mkdir -p src/config src/routes src/sockets src/middleware src/types
```

### Add scripts to package.json
```json
"scripts": {
  "dev": "ts-node src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js"
}
```

### Create .env file
```env
MONGODB_URI=your_connection_string_here
JWT_SECRET=openssl_rand_base64_32_output_here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Generate JWT secret:
```bash
openssl rand -base64 32
```

### Copy backend files

Copy these files to your `src/` folder:
- All files from `backend-code/` in the BACKEND_CODE section
  - `config-db.ts` → `config/db.ts`
  - `types-index.ts` → `types/index.ts`
  - `middleware-auth.ts` → `middleware/auth.ts`
  - `routes-auth.ts` → `routes/auth.ts`
  - `routes-users.ts` → `routes/users.ts`
  - `routes-calls.ts` → `routes/calls.ts`
  - `routes-messages.ts` → `routes/messages.ts`
  - `sockets-signaling.ts` → `sockets/signaling.ts`
  - `sockets-chat.ts` → `sockets/chat.ts`
  - `server.ts` → `server.ts`

### Run backend
```bash
npm run dev
```

You should see:
```
[Server] Running on http://localhost:5000
[DB] Connected to MongoDB successfully
```

## 3. Frontend Setup (5 minutes)

The frontend is already set up in this project. Just add dependencies and create .env file.

### Install dependencies (if not already done)
```bash
pnpm install socket.io-client swr js-cookie
```

### Create .env.local file
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Run frontend
```bash
pnpm dev
```

You should see:
```
  ▲ Next.js 16.2.6
  - Local:        http://localhost:3000
```

## 4. Test the App (2 minutes)

### Browser 1: Create Account
1. Go to http://localhost:3000
2. Sign up with:
   - Email: user1@test.com
   - Username: user1
   - Display Name: User One
   - Password: test123456

### Browser 2: Create Account
1. Open http://localhost:3000 in another browser/incognito
2. Sign up with:
   - Email: user2@test.com
   - Username: user2
   - Display Name: User Two
   - Password: test123456

### Make a Call
1. In Browser 1, refresh to see user2 online
2. Click the call button next to "User Two"
3. In Browser 2, accept the incoming call
4. Video call starts!

## File Structure Created

```
frontend/
├── app/
│   ├── page.tsx (redirects to login/dashboard)
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── dashboard/page.tsx
│   ├── call/[callId]/page.tsx
│   ├── history/page.tsx
│   └── layout.tsx (updated with AuthProvider)
├── components/
│   ├── ProtectedRoute.tsx (guards auth pages)
│   ├── UserList.tsx (shows online users)
│   ├── VideoCall.tsx (main video component)
│   └── ui/button.tsx (existing)
├── context/
│   └── AuthContext.tsx (auth state)
├── lib/
│   ├── socket.ts (Socket.io setup)
│   └── webrtc.ts (WebRTC helpers)
├── .env.local (your config)
└── package.json (updated with deps)

backend/
├── src/
│   ├── config/db.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── calls.ts
│   │   └── messages.ts
│   ├── sockets/
│   │   ├── signaling.ts
│   │   └── chat.ts
│   ├── middleware/auth.ts
│   ├── types/index.ts
│   └── server.ts
├── .env
├── tsconfig.json
└── package.json
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `context/AuthContext.tsx` | Login/signup state & auth functions |
| `lib/socket.ts` | Socket.io initialization & event names |
| `lib/webrtc.ts` | WebRTC peer connection setup |
| `components/VideoCall.tsx` | Video call UI & controls |
| `app/dashboard/page.tsx` | Main dashboard with user list |
| `backend/src/server.ts` | Express + Socket.io server |

## Common Issues

**Can't connect to backend?**
- Is backend running on port 5000? (`npm run dev`)
- Is NEXT_PUBLIC_API_URL set correctly?

**MongoDB connection error?**
- Check MONGODB_URI in .env
- Is IP whitelist set in MongoDB Atlas?
- Are username/password correct?

**No video showing?**
- Check browser console for errors
- Allow camera permissions when asked
- Try https://webrtc.github.io/samples/web/content/getusermedia/gum/ to test

**Other users not showing up?**
- Both browsers need to be logged in
- Check that both are accessing http://localhost:3000

## Next Steps

1. Deploy backend to Railway/Heroku
2. Deploy frontend to Vercel
3. Add screen sharing
4. Add call recording
5. Add notifications
6. Customize styling

## Documentation

- **Setup Guide**: See SETUP_GUIDE.md for detailed setup
- **Full README**: See README_VIDEO_CALL.md for all features
- **API Docs**: Endpoints documented in backend code

## Support

Having issues?

1. Check if both services are running
2. Look at browser console and server terminal for errors
3. Verify MongoDB Atlas is accessible
4. Test with sample credentials provided
5. Review documentation files

---

**You're all set! Your video calling app is ready to use!**

Start calling in 3 steps:
1. Create two accounts
2. Login to both in different browsers
3. Click to call!
