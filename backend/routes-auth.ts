import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getDB } from './config-db';
import { generateToken, authMiddleware } from './middleware-auth';
import { User, AuthResponse } from './types-index';

const router = Router();

router.post('/register', async (req: Request, res: Response<AuthResponse>) => {
  try {
    const { email, password, username, displayName } = req.body;

    // Validation
    if (!email || !password || !username || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'email, password, username, and displayName are required',
      });
    }

    const db = getDB();
    const usersCollection = db.collection<User>('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists',
        error: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser: User = {
      email,
      password: hashedPassword,
      username,
      displayName,
      avatar: `https://ui-avatars.com/api/?name=${displayName}&background=random`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    // Generate token
    const token = generateToken(result.insertedId.toString(), email, username);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { ...userWithoutPassword, _id: result.insertedId },
    });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/login', async (req: Request, res: Response<AuthResponse>) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'email and password are required',
      });
    }

    const db = getDB();
    const usersCollection = db.collection<User>('users');

    // Find user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'User not found',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'Incorrect password',
      });
    }

    // Generate token
    const token = generateToken(user._id!.toString(), user.email, user.username);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const usersCollection = db.collection<User>('users');

    const user = await usersCollection.findOne({
      _id: new ObjectId(req.userId),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('[Auth] Get me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
