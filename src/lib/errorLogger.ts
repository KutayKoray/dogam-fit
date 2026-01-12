// Simple error logger for production debugging
export function logError(error: Error, context?: Record<string, any>) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    timestamp: new Date().toISOString(),
  };

  // Log to console
  console.error('Error logged:', errorData);

  // Send to backend for logging (optional)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    try {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).catch(() => {
        // Silently fail if logging fails
      });
    } catch {
      // Ignore logging errors
    }
  }

  return errorData;
}
