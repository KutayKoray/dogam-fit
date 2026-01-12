'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Flame, Beef, Wheat, Droplet, Clock, Calendar, TrendingUp, Target, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { format, parseISO, startOfDay, subDays } from 'date-fns';

interface FriendProgressPageProps {
  params: Promise<{
    friendId: string;
  }>;
}

function FriendProgressPage({ params }: FriendProgressPageProps) {
  const [friend, setFriend] = useState<any>(null);
  const [meals, setMeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState(7); // Last 7 days
  const [friendId, setFriendId] = useState<string>('');
  const [showChart, setShowChart] = useState(false);
  const [analyticsMetric, setAnalyticsMetric] = useState<'calories' | 'protein' | 'carbs' | 'fat'>('calories');
  const [analyticsRange, setAnalyticsRange] = useState<'week' | 'month'>('week');
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  useEffect(() => {
    // Unwrap params promise
    params.then((p) => {
      setFriendId(p.friendId);
    });
  }, [params]);

  useEffect(() => {
    if (friendId) {
      fetchFriendData();
    }
  }, [friendId, dateRange]);

  const fetchFriendData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Use safeStorage for iOS compatibility
      const { safeStorage } = await import('@/lib/storage');
      const token = safeStorage.getItem('token');
      if (token) {
        apiClient.setToken(token);
      }

      console.log('Fetching friend data for ID:', friendId);

      // Try to get friend's meals directly first
      let mealsData;
      try {
        mealsData = await apiClient.getFriendMeals(friendId);
        console.log('Friend meals fetched successfully:', mealsData.length, 'meals');
      } catch (mealsError: any) {
        console.error('Failed to fetch friend meals:', mealsError);
        // If meals fetch fails, it might be because friend doesn't exist or sharing is disabled
        setError('Unable to view this friend\'s data. They may have disabled sharing.');
        setIsLoading(false);
        return;
      }

      // Get friend info from connections list for display
      let friendData;
      try {
        const connections = await apiClient.getConnections();
        console.log('Connections fetched:', connections);
        
        // Try to find by friendId
        friendData = connections.find((c: any) => c.friendId === friendId);
        
        if (!friendData) {
          console.warn('Friend not found by friendId, creating fallback data');
          // Create a fallback friend object if not found in connections
          // This can happen if the connection was just accepted
          friendData = {
            friendId: friendId,
            name: 'Friend',
            email: 'Loading...',
          };
        }
      } catch (connectionsError) {
        console.error('Failed to fetch connections:', connectionsError);
        // Use fallback data
        friendData = {
          friendId: friendId,
          name: 'Friend',
          email: 'Loading...',
        };
      }

      setFriend(friendData);
      
      // Filter by date range on client side
      const cutoffDate = subDays(new Date(), dateRange);
      const filteredMeals = mealsData.filter((meal: any) => 
        parseISO(meal.loggedAt) >= cutoffDate
      );
      
      console.log('Filtered meals:', filteredMeals.length, 'meals in last', dateRange, 'days');
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
              <span className="text-xs text-gray-500">(Click to view chart)</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => {
                  setAnalyticsMetric('calories');
                  setShowChart(true);
                }}
                className="bg-orange-50 rounded-lg p-4 hover:bg-orange-100 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-gray-600">Calories</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{averages.calories}</p>
              </button>
              <button
                onClick={() => {
                  setAnalyticsMetric('protein');
                  setShowChart(true);
                }}
                className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Beef className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-600">Protein</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{averages.protein}g</p>
              </button>
              <button
                onClick={() => {
                  setAnalyticsMetric('carbs');
                  setShowChart(true);
                }}
                className="bg-green-50 rounded-lg p-4 hover:bg-green-100 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Wheat className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-600">Carbs</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{averages.carbs}g</p>
              </button>
              <button
                onClick={() => {
                  setAnalyticsMetric('fat');
                  setShowChart(true);
                }}
                className="bg-amber-50 rounded-lg p-4 hover:bg-amber-100 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Droplet className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-gray-600">Fat</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{averages.fat}g</p>
              </button>
            </div>
          </div>
        )}

        {/* Chart Modal */}
        {showChart && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowChart(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 capitalize">
                    {analyticsMetric} Trend
                  </h2>
                  <button
                    onClick={() => setShowChart(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Range Toggle */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setAnalyticsRange('week')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      analyticsRange === 'week'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setAnalyticsRange('month')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      analyticsRange === 'month'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {(() => {
                  const days = analyticsRange === 'week' ? 7 : 30;
                  const data: { date: string; value: number }[] = [];
                  
                  // Generate data for the selected range
                  for (let i = days - 1; i >= 0; i--) {
                    const date = subDays(new Date(), i);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayMeals = mealsByDate[dateStr] || [];
                    
                    let value = 0;
                    if (analyticsMetric === 'calories') {
                      value = dayMeals.reduce((sum: number, meal: any) => 
                        sum + (meal.confirmedCalories || meal.aiCalories || 0), 0);
                    } else if (analyticsMetric === 'protein') {
                      value = dayMeals.reduce((sum: number, meal: any) => 
                        sum + (meal.confirmedProtein || meal.aiProtein || 0), 0);
                    } else if (analyticsMetric === 'carbs') {
                      value = dayMeals.reduce((sum: number, meal: any) => 
                        sum + (meal.confirmedCarbohydrates || meal.aiCarbohydrates || 0), 0);
                    } else if (analyticsMetric === 'fat') {
                      value = dayMeals.reduce((sum: number, meal: any) => 
                        sum + (meal.confirmedFat || meal.aiFat || 0), 0);
                    }
                    
                    data.push({
                      date: format(date, 'MMM d'),
                      value: analyticsMetric === 'calories' ? Math.round(value) : parseFloat(value.toFixed(1))
                    });
                  }
                  
                  const actualMaxValue = Math.max(...data.map(d => d.value), 1);
                  const maxValue = actualMaxValue * 1.15;
                  const avgValue = data.reduce((sum, d) => sum + d.value, 0) / data.length;
                  
                  return (
                    <>
                      {/* Stats Summary */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-6">
                        <div className="bg-white rounded-lg p-2 sm:p-3 text-center border border-gray-200">
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Average</p>
                          <p className="text-sm sm:text-lg font-bold text-gray-900">
                            {analyticsMetric === 'calories' ? Math.round(avgValue) : avgValue.toFixed(1)}
                            {analyticsMetric === 'calories' ? '' : 'g'}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-2 sm:p-3 text-center border border-gray-200">
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Highest</p>
                          <p className="text-sm sm:text-lg font-bold text-gray-900">
                            {analyticsMetric === 'calories' ? Math.round(actualMaxValue) : actualMaxValue.toFixed(1)}
                            {analyticsMetric === 'calories' ? '' : 'g'}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-2 sm:p-3 text-center border border-gray-200">
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Total Days</p>
                          <p className="text-sm sm:text-lg font-bold text-gray-900">{days}</p>
                        </div>
                      </div>

                      {/* Line Chart */}
                      <div className="relative w-full bg-gray-50 rounded-lg p-2 sm:p-4 overflow-hidden border border-gray-200">
                        <div className="flex">
                          {/* Y Axis Labels */}
                          <div className="flex flex-col justify-between text-[10px] sm:text-xs text-gray-600 font-medium pr-1 sm:pr-2" style={{ height: '200px' }}>
                            <span>{Math.round(maxValue)}</span>
                            <span>{Math.round(maxValue * 0.75)}</span>
                            <span>{Math.round(maxValue * 0.5)}</span>
                            <span>{Math.round(maxValue * 0.25)}</span>
                            <span>0</span>
                          </div>

                          {/* Chart Area */}
                          <div className="flex-1 relative" style={{ height: '200px' }}>
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                              {[0, 1, 2, 3, 4].map((i) => (
                                <div key={i} className="border-t border-gray-300 w-full"></div>
                              ))}
                            </div>

                            {/* Line and Dots */}
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                              {/* Line Path */}
                              <path
                                d={data.map((item, index) => {
                                  const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 95;
                                  const y = 100 - ((item.value / maxValue) * 100);
                                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                                }).join(' ')}
                                fill="none"
                                stroke={
                                  analyticsMetric === 'calories' ? '#f97316' :
                                  analyticsMetric === 'protein' ? '#3b82f6' :
                                  analyticsMetric === 'carbs' ? '#10b981' :
                                  '#f59e0b'
                                }
                                strokeWidth="1.5"
                                vectorEffect="non-scaling-stroke"
                                className="transition-all duration-500"
                              />
                              
                              {/* Dots with hover areas */}
                              {data.map((item, index) => {
                                const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 95;
                                const y = 100 - ((item.value / maxValue) * 100);
                                return (
                                  <g key={index}>
                                    {/* Invisible larger circle for easier hovering */}
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r="3"
                                      fill="transparent"
                                      className="cursor-pointer"
                                      onMouseEnter={() => setHoveredPoint({index, x, y, date: item.date, value: item.value})}
                                      onMouseLeave={() => setHoveredPoint(null)}
                                    />
                                    {/* Visible dot */}
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r="0.8"
                                      fill="white"
                                      stroke={
                                        analyticsMetric === 'calories' ? '#f97316' :
                                        analyticsMetric === 'protein' ? '#3b82f6' :
                                        analyticsMetric === 'carbs' ? '#10b981' :
                                        '#f59e0b'
                                      }
                                      strokeWidth="1.2"
                                      vectorEffect="non-scaling-stroke"
                                      className="transition-all duration-500 pointer-events-none"
                                    />
                                  </g>
                                );
                              })}
                            </svg>

                            {/* Hover Tooltip */}
                            {hoveredPoint && (() => {
                              const showBelow = hoveredPoint.y < 30;
                              return (
                                <div
                                  className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm font-medium pointer-events-none z-10"
                                  style={{
                                    left: `${hoveredPoint.x}%`,
                                    top: `${hoveredPoint.y}%`,
                                    transform: showBelow ? 'translate(-50%, 20%)' : 'translate(-50%, -120%)'
                                  }}
                                >
                                  <div className="text-center">
                                    <div className="text-xs text-gray-300">{hoveredPoint.date}</div>
                                    <div className="font-bold">
                                      {hoveredPoint.value}{analyticsMetric === 'calories' ? '' : 'g'}
                                    </div>
                                  </div>
                                  {/* Arrow */}
                                  {showBelow ? (
                                    <div 
                                      className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-full"
                                      style={{
                                        width: 0,
                                        height: 0,
                                        borderLeft: '6px solid transparent',
                                        borderRight: '6px solid transparent',
                                        borderBottom: '6px solid #111827'
                                      }}
                                    />
                                  ) : (
                                    <div 
                                      className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full"
                                      style={{
                                        width: 0,
                                        height: 0,
                                        borderLeft: '6px solid transparent',
                                        borderRight: '6px solid transparent',
                                        borderTop: '6px solid #111827'
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* X Axis Labels */}
                        <div className="flex justify-between mt-2 text-[10px] sm:text-xs text-gray-600 font-medium pl-8 sm:pl-10">
                          {data.filter((_, i) => {
                            if (analyticsRange === 'week') return true;
                            return i % 5 === 0 || i === data.length - 1;
                          }).map((item, i) => (
                            <span key={i}>{item.date}</span>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
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
