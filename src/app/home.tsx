import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Calorie Tracker
            </h1>
            <p className="text-gray-600 mb-8">
              AI-powered nutrition tracking with OpenAI GPT-4o
            </p>
            
            <div className="space-y-4">
              <Link
                href="/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </Link>
              
              <Link
                href="/register"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Account
              </Link>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-sm font-medium text-gray-900 mb-2">📸 Photo Analysis</h3>
                <p className="text-xs text-gray-600">
                  Snap a photo of your meal for instant AI nutrition estimates
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-sm font-medium text-gray-900 mb-2">🤖 GPT-4o Powered</h3>
                <p className="text-xs text-gray-600">
                  Advanced AI analysis for accurate calorie and macro tracking
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-sm font-medium text-gray-900 mb-2">📊 Progress Tracking</h3>
                <p className="text-xs text-gray-600">
                  Monitor your daily nutrition goals and progress over time
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
