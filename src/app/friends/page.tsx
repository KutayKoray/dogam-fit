'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Users, UserPlus, Check, X, Trash2, Eye, EyeOff, Loader2, Mail, Calendar } from 'lucide-react';
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
                <Users className="w-6 h-6 text-white" />
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
          {/* Sharing Toggle */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {sharingEnabled ? (
                  <Eye className="w-5 h-5 text-green-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <h3 className="font-bold text-gray-900">Data Sharing</h3>
                  <p className="text-sm text-gray-500">
                    {sharingEnabled ? 'Friends can see your meals' : 'Your data is private'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleSharing}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">Add Friend</h2>
            </div>
            <div className="flex space-x-3">
              <input
                type="email"
                placeholder="Enter friend's email"
                value={newFriendEmail}
                onChange={(e) => setNewFriendEmail(e.target.value)}
                className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              />
              <button
                onClick={sendRequest}
                disabled={isSending}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-semibold"
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
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Requests</h2>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{request.from.name || request.from.email}</p>
                        <p className="text-sm text-gray-500">{request.from.email}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => acceptRequest(request.id)}
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => rejectRequest(request.id)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              My Friends ({friends.length})
            </h2>
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No friends yet. Add someone to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{friend.name || friend.email}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{friend.email}</span>
                          {!friend.sharingEnabled && (
                            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">Private</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {friend.sharingEnabled && (
                        <Link
                          href={`/friends/${friend.friendId}`}
                          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
                        >
                          View Progress
                        </Link>
                      )}
                      <button
                        onClick={() => removeFriend(friend.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
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
