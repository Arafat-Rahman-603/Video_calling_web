# Video Calling Backend Setup Guide

This guide will help you set up the Express backend for the video calling application.

## Prerequisites
- Node.js (v16+)
- npm, yarn, or pnpm
- MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)

## Step 1: Create Backend Repository

```bash
mkdir video-call-backend
cd video-call-backend
git init
npm init -y
```

## Step 2: Install Dependencies

```bash
npm install express socket.io mongodb dotenv jsonwebtoken bcryptjs cors
npm install -D typescript ts-node @types/express @types/node @types/jsonwebtoken @types/bcryptjs
```

## Step 3: Initialize TypeScript

```bash
npx tsc --init
```

Then update `tsconfig.json`:
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
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

## Step 4: Create Project Structure

```bash
mkdir -p src/config src/routes src/sockets src/middleware src/types
```

## Step 5: Environment Variables

Create `.env` file in the root:
```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Step 6: MongoDB Atlas Setup

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new project
4. Create a cluster
5. Create a database user (note the username and password)
6. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/video_calling?retryWrites=true&w=majority`
7. Add your local IP to the IP whitelist (or use 0.0.0.0 for development)

## Step 7: Copy Backend Files

Copy all the files from the backend code provided below into your `src/` directory.

## Step 8: Run Development Server

```bash
npm run dev
```

Server should start on http://localhost:5000

## Step 9: Build for Production

```bash
npm run build
```

This will compile TypeScript to JavaScript in the `dist/` folder.

## Deployment

### Option 1: Deploy to Railway
```bash
railway init
railway add
railway up
```

### Option 2: Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Option 3: Deploy to EC2 or Self-hosted
1. Install Node.js on your server
2. Clone the repository
3. Run `npm install && npm run build`
4. Use PM2 to keep the app running: `npm install -g pm2 && pm2 start dist/server.js`
5. Setup a reverse proxy with Nginx
6. Add SSL with Let's Encrypt

## Next Steps
Once the backend is running, follow the frontend setup guide in the main README.
