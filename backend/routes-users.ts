import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from './config-db';
import { authMiddleware } from './middleware-auth';
import { User, OnlineUser } from './types-index';

const router = Router();

// Store online users in memory (in production, use Redis)
export const onlineUsers = new Map<string, OnlineUser>();

router.get('/search', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const db = getDB();
    const usersCollection = db.collection<User>('users');

    const users = await usersCollection
      .find(
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { displayName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
          ],
        },
        { projection: { password: 0 } }
      )
      .limit(10)
      .toArray();

    return res.status(200).json({
      success: true,
      users: users.map((user) => ({
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        email: user.email,
      })),
    });
  } catch (error) {
    console.error('[Users] Search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/online', authMiddleware, async (req: Request, res: Response) => {
  try {
    const onlineUsersList = Array.from(onlineUsers.values());

    return res.status(200).json({
      success: true,
      users: onlineUsersList,
      count: onlineUsersList.length,
    });
  } catch (error) {
    console.error('[Users] Get online users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get online users',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate ObjectId
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const db = getDB();
    const usersCollection = db.collection<User>('users');

    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('[Users] Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { displayName, avatar } = req.body;
    const userId = req.userId;

    if (!displayName) {
      return res.status(400).json({
        success: false,
        message: 'Display name is required',
      });
    }

    const db = getDB();
    const usersCollection = db.collection<User>('users');

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      {
        $set: {
          displayName,
          avatar: avatar || `https://ui-avatars.com/api/?name=${displayName}&background=random`,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after', projection: { password: 0 } }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: result,
    });
  } catch (error) {
    console.error('[Users] Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
