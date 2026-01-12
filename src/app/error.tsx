'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { logError } from '@/lib/errorLogger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error with context
    logError(error, {
      digest: error.digest,
      component: 'ErrorBoundary',
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Oops! Something went wrong
        </h1>
        
        <p className="text-gray-600 mb-6">
          We encountered an error while loading this page. Please try again.
        </p>

        {/* Always show error details for debugging */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left max-h-64 overflow-y-auto">
          <p className="text-xs font-semibold text-red-900 mb-2">Error Details:</p>
          <p className="text-xs text-red-800 font-mono break-all mb-3">
            {error.message}
          </p>
          {error.stack && (
            <>
              <p className="text-xs font-semibold text-red-900 mb-2">Stack Trace:</p>
              <pre className="text-xs text-red-700 whitespace-pre-wrap break-all">
                {error.stack}
              </pre>
            </>
          )}
          <button
            onClick={() => {
              const errorText = `Error: ${error.message}\n\nStack: ${error.stack || 'N/A'}\n\nUser Agent: ${navigator.userAgent}\n\nURL: ${window.location.href}`;
              navigator.clipboard.writeText(errorText).then(() => {
                alert('Error details copied to clipboard!');
              }).catch(() => {
                alert('Failed to copy. Please screenshot this page.');
              });
            }}
            className="mt-3 text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            Copy Error Details
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 border border-gray-200 font-medium"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
