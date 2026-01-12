'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Users, UserPlus, Check, X, Trash2, Eye, EyeOff, Loader2, Mail, Calendar } from 'lucide-react';
import Logo from '@/components/Logo';
import { format } from 'date-fns';

function FriendsPage() {
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sharingEnabled, setSharingEnabled] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        apiClient.setToken(token);
      }

      const [friendsData, pendingData, profileData] = await Promise.all([
        apiClient.getConnections(),
        apiClient.getPendingRequests(),
        apiClient.getProfile(),
      ]);

      setFriends(friendsData);
      setPendingRequests(pendingData);
      setSharingEnabled(profileData.sharingEnabled ?? true);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendRequest = async () => {
    if (!newFriendEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    setIsSending(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.sendConnectionRequest(newFriendEmail);
      setSuccess('Connection request sent!');
      setNewFriendEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to send request');
    } finally {
      setIsSending(false);
    }
  };

  const acceptRequest = async (connectionId: string) => {
    try {
      await apiClient.acceptConnection(connectionId);
      setSuccess('Friend added!');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to accept request');
    }
  };

  const rejectRequest = async (connectionId: string) => {
    try {
      await apiClient.rejectConnection(connectionId);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to reject request');
    }
  };

  const removeFriend = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    try {
      await apiClient.removeConnection(connectionId);
      setSuccess('Friend removed');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to remove friend');
    }
  };

  const toggleSharing = async () => {
    try {
      await apiClient.toggleSharing(!sharingEnabled);
      setSharingEnabled(!sharingEnabled);
      setSuccess(sharingEnabled ? 'Sharing disabled' : 'Sharing enabled');
    } catch (err: any) {
      setError(err.message || 'Failed to update sharing settings');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="inline-flex items-center text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Logo className="w-6 h-6 text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Friends</h1>
                <p className="text-xs text-gray-500">Share your progress</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Data Sharing Toggle */}
          <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {sharingEnabled ? (
                  <Eye className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">Data Sharing</h3>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    {sharingEnabled ? 'Friends can see your meals' : 'Your data is private'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleSharing}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-3 ${
                  sharingEnabled ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    sharingEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Add Friend */}
          <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex items-center space-x-3 mb-3 sm:mb-4">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Add Friend</h2>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <input
                type="email"
                placeholder="Enter friend's email"
                value={newFriendEmail}
                onChange={(e) => setNewFriendEmail(e.target.value)}
                className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-sm sm:text-base"
              />
              <button
                onClick={sendRequest}
                disabled={isSending}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-semibold text-sm sm:text-base"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send'}
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-green-600">
              {success}
            </div>
          )}

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-200">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Pending Requests ({pendingRequests.length})</h2>
              <div className="space-y-2 sm:space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-lg sm:text-xl font-bold text-white">
                          {request.from.name?.charAt(0).toUpperCase() || request.from.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{request.from.name || request.from.email}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{request.from.email}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2 w-full sm:w-auto">
                      <button
                        onClick={() => acceptRequest(request.id)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => rejectRequest(request.id)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-200">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
              My Friends ({friends.length})
            </h2>
            {friends.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-500">No friends yet. Add someone to get started!</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3 mb-3 sm:mb-0 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-lg sm:text-xl font-bold text-white">
                          {friend.name?.charAt(0).toUpperCase() || friend.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{friend.name || friend.email}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{friend.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Connected {new Date(friend.connectedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2 w-full sm:w-auto">
                      <Link
                        href={`/friends/${friend.friendId}`}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-medium text-sm flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Progress</span>
                      </Link>
                      <button
                        onClick={() => removeFriend(friend.id)}
                        className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove friend"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(FriendsPage);
