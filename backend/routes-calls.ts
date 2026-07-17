import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from './config-db';
import { authMiddleware } from './middleware-auth';
import { Call, CallHistory } from './types-index';

const router = Router();

router.post('/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { receiverId, type } = req.body;
    const initiatorId = req.userId;

    if (!receiverId || !type) {
      return res.status(400).json({
        success: false,
        message: 'receiverId and type are required',
      });
    }

    if (!['one-on-one', 'group'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid call type',
      });
    }

    const db = getDB();
    const callsCollection = db.collection<Call>('calls');

    const newCall: Call = {
      initiatorId,
      receiverId: type === 'one-on-one' ? receiverId : undefined,
      groupMembers: type === 'group' ? [initiatorId, receiverId] : undefined,
      startTime: new Date(),
      type,
      createdAt: new Date(),
    };

    const result = await callsCollection.insertOne(newCall);

    return res.status(201).json({
      success: true,
      message: 'Call created',
      callId: result.insertedId.toString(),
      call: newCall,
    });
  } catch (error) {
    console.error('[Calls] Create call error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create call',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/:callId/end', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { callId } = req.params;
    const userId = req.userId;

    if (!ObjectId.isValid(callId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid call ID',
      });
    }

    const db = getDB();
    const callsCollection = db.collection<Call>('calls');
    const historyCollection = db.collection<CallHistory>('call_history');

    // Get the call
    const call = await callsCollection.findOne({ _id: new ObjectId(callId) });
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    // Calculate duration
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - call.startTime.getTime()) / 1000);

    // Update call
    await callsCollection.updateOne(
      { _id: new ObjectId(callId) },
      {
        $set: {
          endTime,
          duration,
        },
      }
    );

    // Save to call history
    const historyEntry: CallHistory = {
      userId,
      otherUserId: call.type === 'one-on-one' ? call.receiverId : undefined,
      groupMembers: call.groupMembers,
      callId,
      duration,
      timestamp: endTime,
      type: call.type,
    };

    await historyCollection.insertOne(historyEntry);

    return res.status(200).json({
      success: true,
      message: 'Call ended',
      duration,
    });
  } catch (error) {
    console.error('[Calls] End call error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to end call',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { limit = 50, skip = 0 } = req.query;

    const db = getDB();
    const historyCollection = db.collection<CallHistory>('call_history');

    const calls = await historyCollection
      .find({ userId })
      .sort({ timestamp: -1 })
      .skip(parseInt(skip as string) || 0)
      .limit(parseInt(limit as string) || 50)
      .toArray();

    const total = await historyCollection.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      calls,
      total,
      limit: parseInt(limit as string) || 50,
      skip: parseInt(skip as string) || 0,
    });
  } catch (error) {
    console.error('[Calls] Get history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get call history',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:callId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { callId } = req.params;

    if (!ObjectId.isValid(callId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid call ID',
      });
    }

    const db = getDB();
    const callsCollection = db.collection<Call>('calls');

    const call = await callsCollection.findOne({ _id: new ObjectId(callId) });

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    return res.status(200).json({
      success: true,
      call,
    });
  } catch (error) {
    console.error('[Calls] Get call error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get call',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
