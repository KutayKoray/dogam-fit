'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Flame, Beef, Wheat, Droplet, Clock, Calendar, TrendingUp, Target, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { format, parseISO, startOfDay, subDays } from 'date-fns';

interface FriendProgressPageProps {
  params: {
    friendId: string;
  };
}

function FriendProgressPage({ params }: FriendProgressPageProps) {
  const [friend, setFriend] = useState<any>(null);
  const [meals, setMeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState(7); // Last 7 days

  useEffect(() => {
    fetchFriendData();
  }, [params.friendId, dateRange]);

  const fetchFriendData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (token) {
        apiClient.setToken(token);
      }

      // Get friend info from connections list
      const connections = await apiClient.getConnections();
      const friendData = connections.find((c: any) => c.friendId === params.friendId);
      
      if (!friendData) {
        setError('Friend not found');
        setIsLoading(false);
        return;
      }

      setFriend(friendData);

      // Get friend's meals
      const mealsData = await apiClient.getFriendMeals(params.friendId);
      
      // Filter by date range on client side
      const cutoffDate = subDays(new Date(), dateRange);
      const filteredMeals = mealsData.filter((meal: any) => 
        parseISO(meal.loggedAt) >= cutoffDate
      );
      
      setMeals(filteredMeals);
    } catch (error: any) {
      console.error('Failed to fetch friend data:', error);
      setError(error.message || 'Failed to load friend data');
    } finally {
      setIsLoading(false);
    }
  };

  // Group meals by date
  const mealsByDate = meals.reduce((acc: any, meal: any) => {
    const date = format(parseISO(meal.loggedAt), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(meal);
    return acc;
  }, {});

  // Calculate daily totals
  const dailyStats = Object.entries(mealsByDate).map(([date, dateMeals]: [string, any]) => {
    const stats = dateMeals.reduce((acc: any, meal: any) => ({
      calories: acc.calories + (meal.confirmedCalories || meal.aiCalories || 0),
      protein: acc.protein + (meal.confirmedProtein || meal.aiProtein || 0),
      carbs: acc.carbs + (meal.confirmedCarbohydrates || meal.aiCarbohydrates || 0),
      fat: acc.fat + (meal.confirmedFat || meal.aiFat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    return { date, ...stats, meals: dateMeals };
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Calculate averages
  const averages = dailyStats.length > 0 ? {
    calories: Math.round(dailyStats.reduce((sum, day) => sum + day.calories, 0) / dailyStats.length),
    protein: Math.round(dailyStats.reduce((sum, day) => sum + day.protein, 0) / dailyStats.length),
    carbs: Math.round(dailyStats.reduce((sum, day) => sum + day.carbs, 0) / dailyStats.length),
    fat: Math.round(dailyStats.reduce((sum, day) => sum + day.fat, 0) / dailyStats.length),
  } : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/friends"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Friends
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/friends"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Friends
          </Link>
          <div className="flex items-center space-x-3">
            <Logo className="w-8 h-8 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900">DogamFit</h1>
          </div>
        </div>

        {/* Friend Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {friend?.name?.charAt(0).toUpperCase() || friend?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{friend?.name || 'Friend'}</h2>
              <p className="text-gray-600">{friend?.email}</p>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  dateRange === days
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last {days} days
              </button>
            ))}
          </div>
        </div>

        {/* Averages */}
        {averages && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-gray-900">Daily Averages</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-gray-600">Calories</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{averages.calories}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Beef className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-600">Protein</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{averages.protein}g</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Wheat className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-600">Carbs</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{averages.carbs}g</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Droplet className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-gray-600">Fat</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{averages.fat}g</p>
              </div>
            </div>
          </div>
        )}

        {/* Daily Breakdown */}
        <div className="space-y-4">
          {dailyStats.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No meals logged in the selected period</p>
            </div>
          ) : (
            dailyStats.map((day) => (
              <div key={day.date} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Day Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-white" />
                      <h3 className="text-lg font-bold text-white">
                        {format(parseISO(day.date), 'EEEE, MMMM d, yyyy')}
                      </h3>
                    </div>
                    <span className="text-sm text-white/80">{day.meals.length} meals</span>
                  </div>
                  <div className="flex items-center space-x-4 mt-3 text-sm text-white/90">
                    <span className="flex items-center">
                      <Flame className="w-4 h-4 mr-1" />
                      {Math.round(day.calories)} cal
                    </span>
                    <span className="flex items-center">
                      <Beef className="w-4 h-4 mr-1" />
                      {Math.round(day.protein)}g
                    </span>
                    <span className="flex items-center">
                      <Wheat className="w-4 h-4 mr-1" />
                      {Math.round(day.carbs)}g
                    </span>
                    <span className="flex items-center">
                      <Droplet className="w-4 h-4 mr-1" />
                      {Math.round(day.fat)}g
                    </span>
                  </div>
                </div>

                {/* Meals List */}
                <div className="divide-y divide-gray-200">
                  {day.meals.map((meal: any) => (
                    <div key={meal.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {format(parseISO(meal.loggedAt), 'h:mm a')}
                            </span>
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                              {meal.mealType}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">{meal.name}</h4>
                          {meal.description && (
                            <p className="text-sm text-gray-600 mb-2">{meal.description}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <p className="text-lg font-bold text-gray-900">
                              {meal.confirmedCalories || meal.aiCalories || 0}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-gray-600">
                            <span className="flex items-center">
                              <Beef className="w-3 h-3 mr-1 text-blue-500" />
                              {((meal.confirmedProtein || meal.aiProtein) || 0).toFixed(1)}g
                            </span>
                            <span className="flex items-center">
                              <Wheat className="w-3 h-3 mr-1 text-green-500" />
                              {((meal.confirmedCarbohydrates || meal.aiCarbohydrates) || 0).toFixed(1)}g
                            </span>
                            <span className="flex items-center">
                              <Droplet className="w-3 h-3 mr-1 text-amber-500" />
                              {((meal.confirmedFat || meal.aiFat) || 0).toFixed(1)}g
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(FriendProgressPage);
