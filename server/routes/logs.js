import express from 'express';

const router = express.Router();

// Simple error logging endpoint (no auth required for error logs)
router.post('/error', async (req, res) => {
  try {
    const { message, stack, context, userAgent, url, timestamp } = req.body;
    
    // Log to console (Railway/Vercel logs will capture this)
    console.error('CLIENT ERROR:', {
      timestamp,
      message,
      url,
      userAgent,
      context,
      stack: stack?.substring(0, 500), // Limit stack trace length
    });
    
    res.status(200).json({ logged: true });
  } catch (error) {
    console.error('Failed to log client error:', error);
    res.status(500).json({ error: 'Failed to log error' });
  }
});

export default router;
