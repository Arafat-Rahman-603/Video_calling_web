import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from './config-db';
import { authMiddleware } from './middleware-auth';
import { ChatMessage } from './types-index';

const router = Router();

router.post('/send', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { receiverId, content, callId } = req.body;
    const senderId = req.userId;

    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: 'receiverId and content are required',
      });
    }

    const db = getDB();
    const messagesCollection = db.collection<ChatMessage>('chat_messages');

    const message: ChatMessage = {
      senderId,
      receiverId,
      content,
      timestamp: new Date(),
      callId,
    };

    const result = await messagesCollection.insertOne(message);

    return res.status(201).json({
      success: true,
      message: 'Message sent',
      messageId: result.insertedId.toString(),
      data: message,
    });
  } catch (error) {
    console.error('[Messages] Send error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/conversation/:otherId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { otherId } = req.params;
    const userId = req.userId;
    const { limit = 50, skip = 0 } = req.query;

    if (!ObjectId.isValid(otherId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const db = getDB();
    const messagesCollection = db.collection<ChatMessage>('chat_messages');

    const messages = await messagesCollection
      .find(
        {
          $or: [
            { senderId: userId, receiverId: otherId },
            { senderId: otherId, receiverId: userId },
          ],
        }
      )
      .sort({ timestamp: -1 })
      .skip(parseInt(skip as string) || 0)
      .limit(parseInt(limit as string) || 50)
      .toArray();

    const total = await messagesCollection.countDocuments({
      $or: [
        { senderId: userId, receiverId: otherId },
        { senderId: otherId, receiverId: userId },
      ],
    });

    return res.status(200).json({
      success: true,
      messages: messages.reverse(),
      total,
      limit: parseInt(limit as string) || 50,
      skip: parseInt(skip as string) || 0,
    });
  } catch (error) {
    console.error('[Messages] Get conversation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get conversation',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/call/:callId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { callId } = req.params;

    if (!ObjectId.isValid(callId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid call ID',
      });
    }

    const db = getDB();
    const messagesCollection = db.collection<ChatMessage>('chat_messages');

    const messages = await messagesCollection
      .find({ callId })
      .sort({ timestamp: 1 })
      .toArray();

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('[Messages] Get call messages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get call messages',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
