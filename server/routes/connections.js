import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all connections (friends) for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get connections where user is either initiator or receiver and status is accepted
    const connections = await prisma.userConnection.findMany({
      where: {
        OR: [
          { initiatorId: userId, status: 'accepted' },
          { receiverId: userId, status: 'accepted' }
        ]
      },
      include: {
        initiator: {
          select: {
            id: true,
            email: true,
            name: true,
            sharingEnabled: true
          }
        },
        receiver: {
          select: {
            id: true,
            email: true,
            name: true,
            sharingEnabled: true
          }
        }
      }
    });

    // Format the response to show the friend (not the current user)
    const friends = connections.map(conn => {
      const friend = conn.initiatorId === userId ? conn.receiver : conn.initiator;
      return {
        id: conn.id,
        friendId: friend.id,
        email: friend.email,
        name: friend.name,
        sharingEnabled: friend.sharingEnabled,
        connectedAt: conn.createdAt
      };
    });

    res.json(friends);
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

// Get pending connection requests
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const pendingRequests = await prisma.userConnection.findMany({
      where: {
        receiverId: userId,
        status: 'pending'
      },
      include: {
        initiator: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    res.json(pendingRequests.map(req => ({
      id: req.id,
      from: req.initiator,
      createdAt: req.createdAt
    })));
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// Send connection request
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.id === userId) {
      return res.status(400).json({ error: 'Cannot connect with yourself' });
    }

    // Check if connection already exists
    const existingConnection = await prisma.userConnection.findFirst({
      where: {
        OR: [
          { initiatorId: userId, receiverId: targetUser.id },
          { initiatorId: targetUser.id, receiverId: userId }
        ]
      }
    });

    if (existingConnection) {
      return res.status(400).json({ error: 'Connection already exists or pending' });
    }

    // Create connection request
    const connection = await prisma.userConnection.create({
      data: {
        initiatorId: userId,
        receiverId: targetUser.id,
        status: 'pending'
      },
      include: {
        receiver: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    res.json({
      message: 'Connection request sent',
      connection: {
        id: connection.id,
        to: connection.receiver,
        status: connection.status
      }
    });
  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({ error: 'Failed to send connection request' });
  }
});

// Accept connection request
router.post('/accept/:connectionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { connectionId } = req.params;

    const connection = await prisma.userConnection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    if (connection.receiverId !== userId) {
      return res.status(403).json({ error: 'Not authorized to accept this request' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    const updatedConnection = await prisma.userConnection.update({
      where: { id: connectionId },
      data: { status: 'accepted' },
      include: {
        initiator: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    res.json({
      message: 'Connection accepted',
      friend: updatedConnection.initiator
    });
  } catch (error) {
    console.error('Accept connection error:', error);
    res.status(500).json({ error: 'Failed to accept connection' });
  }
});

// Reject connection request
router.post('/reject/:connectionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { connectionId } = req.params;

    const connection = await prisma.userConnection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    if (connection.receiverId !== userId) {
      return res.status(403).json({ error: 'Not authorized to reject this request' });
    }

    await prisma.userConnection.delete({
      where: { id: connectionId }
    });

    res.json({ message: 'Connection request rejected' });
  } catch (error) {
    console.error('Reject connection error:', error);
    res.status(500).json({ error: 'Failed to reject connection' });
  }
});

// Remove connection (unfriend)
router.delete('/:connectionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { connectionId } = req.params;

    const connection = await prisma.userConnection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Check if user is part of this connection
    if (connection.initiatorId !== userId && connection.receiverId !== userId) {
      return res.status(403).json({ error: 'Not authorized to remove this connection' });
    }

    await prisma.userConnection.delete({
      where: { id: connectionId }
    });

    res.json({ message: 'Connection removed' });
  } catch (error) {
    console.error('Remove connection error:', error);
    res.status(500).json({ error: 'Failed to remove connection' });
  }
});

// Get friend's meals (shared data)
router.get('/:friendId/meals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;

    // Verify connection exists and is accepted
    const connection = await prisma.userConnection.findFirst({
      where: {
        OR: [
          { initiatorId: userId, receiverId: friendId, status: 'accepted' },
          { initiatorId: friendId, receiverId: userId, status: 'accepted' }
        ]
      }
    });

    if (!connection) {
      return res.status(403).json({ error: 'Not connected with this user' });
    }

    // Check if friend has sharing enabled
    const friend = await prisma.user.findUnique({
      where: { id: friendId },
      select: { sharingEnabled: true, name: true, email: true }
    });

    if (!friend.sharingEnabled) {
      return res.status(403).json({ error: 'User has disabled sharing' });
    }

    // Get friend's meals from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const meals = await prisma.meal.findMany({
      where: {
        userId: friendId,
        loggedAt: {
          gte: sevenDaysAgo
        }
      },
      orderBy: {
        loggedAt: 'desc'
      }
    });

    res.json({
      friend: {
        id: friendId,
        name: friend.name,
        email: friend.email
      },
      meals
    });
  } catch (error) {
    console.error('Get friend meals error:', error);
    res.status(500).json({ error: 'Failed to fetch friend meals' });
  }
});

// Toggle sharing setting
router.patch('/sharing', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { enabled } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { sharingEnabled: enabled },
      select: {
        id: true,
        email: true,
        name: true,
        sharingEnabled: true
      }
    });

    res.json({
      message: 'Sharing settings updated',
      user
    });
  } catch (error) {
    console.error('Toggle sharing error:', error);
    res.status(500).json({ error: 'Failed to update sharing settings' });
  }
});

export default router;
