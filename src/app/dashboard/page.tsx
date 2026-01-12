'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus, Flame, Beef, Wheat, Droplet, TrendingUp, Clock, Sparkles, LogOut, ChevronDown, ChevronUp, Edit2, Trash2, Save, X, Loader2, User, Menu, Users } from 'lucide-react';

function DashboardPage() {
  const [meals, setMeals] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [todayStats, setTodayStats] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set(['today']));
  const [editingMeal, setEditingMeal] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null);
  const [quickAddValues, setQuickAddValues] = useState({
    description: '',
    mealType: 'lunch',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });
  const [isAnalyzingQuick, setIsAnalyzingQuick] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsMetric, setAnalyticsMetric] = useState<'calories' | 'protein' | 'carbs' | 'fat'>('calories');
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'week' | 'month'>('week');
  const [hoveredPoint, setHoveredPoint] = useState<{index: number, x: number, y: number, date: string, value: number} | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Set token from localStorage
      const token = localStorage.getItem('token');
      if (token) {
        apiClient.setToken(token);
      }

      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      const [mealsData, goalsData, profileData] = await Promise.all([
        apiClient.getMeals({
          startDate: sevenDaysAgo.toISOString(),
          endDate: endOfToday.toISOString(),
          limit: 200,
        }),
        apiClient.getGoals(),
        apiClient.getProfile(),
      ]);

      setMeals(mealsData);
      setGoals(goalsData);
      setProfile(profileData);

      // Calculate today's stats
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));
      
      const todayMeals = mealsData.filter((meal: any) => {
        const mealDate = new Date(meal.loggedAt);
        return mealDate >= todayStart && mealDate <= todayEnd;
      });

      const stats = todayMeals.reduce(
        (acc: any, meal: any) => {
          const calories = meal.confirmedCalories || meal.aiCalories || 0;
          const protein = meal.confirmedProtein || meal.aiProtein || 0;
          const carbs = meal.confirmedCarbohydrates || meal.aiCarbohydrates || 0;
          const fat = meal.confirmedFat || meal.aiFat || 0;

          return {
            calories: acc.calories + calories,
            protein: acc.protein + protein,
            carbs: acc.carbs + carbs,
            fat: acc.fat + fat,
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      setTodayStats(stats);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDate = (dateKey: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const startEdit = (meal: any) => {
    setEditingMeal(meal.id);
    setEditValues({
      calories: meal.confirmedCalories || meal.aiCalories || 0,
      protein: meal.confirmedProtein || meal.aiProtein || 0,
      carbs: meal.confirmedCarbohydrates || meal.aiCarbohydrates || 0,
      fat: meal.confirmedFat || meal.aiFat || 0,
      description: meal.description || '',
      mealType: meal.mealType,
    });
  };

  const cancelEdit = () => {
    setEditingMeal(null);
    setEditValues({});
  };

  const saveMeal = async (mealId: string) => {
    try {
      await apiClient.updateMeal(mealId, {
        confirmedCalories: parseInt(editValues.calories),
        confirmedProtein: parseFloat(editValues.protein),
        confirmedCarbohydrates: parseFloat(editValues.carbs),
        confirmedFat: parseFloat(editValues.fat),
        description: editValues.description,
        mealType: editValues.mealType,
      });
      setEditingMeal(null);
      setEditValues({});
      fetchData();
    } catch (error) {
      console.error('Failed to update meal:', error);
      alert('Failed to update meal');
    }
  };

  const openDeleteModal = (mealId: string) => {
    setDeletingMealId(mealId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setDeletingMealId(null);
    setShowDeleteModal(false);
  };

  const confirmDelete = async () => {
    if (!deletingMealId) return;
    
    try {
      await apiClient.deleteMeal(deletingMealId);
      closeDeleteModal();
      fetchData();
    } catch (error) {
      console.error('Failed to delete meal:', error);
      alert('Failed to delete meal');
    }
  };

  const openQuickAddModal = (dateKey: string) => {
    setQuickAddDate(dateKey);
    setShowQuickAddModal(true);
    setQuickAddValues({
      description: '',
      mealType: 'lunch',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
    });
  };

  const closeQuickAddModal = () => {
    setQuickAddDate(null);
    setShowQuickAddModal(false);
    setIsAnalyzingQuick(false);
    setQuickAddValues({
      description: '',
      mealType: 'lunch',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
    });
  };

  const analyzeQuickMeal = async () => {
    if (!quickAddValues.description) {
      alert('Please enter a meal description');
      return;
    }

    setIsAnalyzingQuick(true);
    try {
      const response = await apiClient.quickAnalyze(quickAddValues.description);
      const analysis = response.data;
      
      setQuickAddValues({
        ...quickAddValues,
        calories: analysis.estimatedCalories.toString(),
        protein: analysis.estimatedProtein.toString(),
        carbs: analysis.estimatedCarbohydrates.toString(),
        fat: analysis.estimatedFat.toString(),
      });
    } catch (error) {
      console.error('Failed to analyze meal:', error);
      alert('Failed to analyze meal. Please enter values manually.');
    } finally {
      setIsAnalyzingQuick(false);
    }
  };

  const quickAddMeal = async () => {
    if (!quickAddDate) return;
    
    try {
      // Calculate the date for the meal
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      
      let mealDate: Date;
      if (quickAddDate === 'today') {
        mealDate = new Date();
      } else if (quickAddDate === 'yesterday') {
        mealDate = new Date(today);
        mealDate.setDate(mealDate.getDate() - 1);
      } else {
        mealDate = new Date(quickAddDate);
      }
      mealDate.setHours(12, 0, 0, 0);

      const mealData = {
        name: quickAddValues.description.substring(0, 50) || 'Manual Entry',
        description: quickAddValues.description,
        mealType: quickAddValues.mealType,
        loggedAt: mealDate.toISOString(),
        confirmedCalories: quickAddValues.calories ? parseInt(quickAddValues.calories) : 0,
        confirmedProtein: quickAddValues.protein ? parseFloat(quickAddValues.protein) : 0,
        confirmedCarbohydrates: quickAddValues.carbs ? parseFloat(quickAddValues.carbs) : 0,
        confirmedFat: quickAddValues.fat ? parseFloat(quickAddValues.fat) : 0,
      };

      await apiClient.createMeal(mealData);
      closeQuickAddModal();
      fetchData();
    } catch (error) {
      console.error('Failed to add meal:', error);
      alert('Failed to add meal');
    }
  };

  // Group meals by date - always show last 7 days
  const groupMealsByDate = () => {
    const groups: { [key: string]: any[] } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create entries for last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      let dateKey: string;
      if (i === 0) {
        dateKey = 'today';
      } else if (i === 1) {
        dateKey = 'yesterday';
      } else {
        dateKey = format(date, 'yyyy-MM-dd');
      }
      
      groups[dateKey] = [];
    }

    // Add meals to their respective dates
    meals.forEach(meal => {
      const mealDate = new Date(meal.loggedAt);
      mealDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today.getTime() - mealDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays < 7) {
        let dateKey: string;
        if (diffDays === 0) {
          dateKey = 'today';
        } else if (diffDays === 1) {
          dateKey = 'yesterday';
        } else {
          dateKey = format(mealDate, 'yyyy-MM-dd');
        }
        
        if (groups[dateKey]) {
          groups[dateKey].push(meal);
        }
      }
    });

    return groups;
  };

  const getDateLabel = (dateKey: string) => {
    if (dateKey === 'today') return 'Today';
    if (dateKey === 'yesterday') return 'Yesterday';
    return format(new Date(dateKey), 'MMMM d, yyyy');
  };

  const formatTurkeyTime = (dateString: string) => {
    const date = new Date(dateString);
    // Turkey is UTC+3
    const turkeyOffset = 3 * 60; // minutes
    const localOffset = date.getTimezoneOffset();
    const totalOffset = turkeyOffset + localOffset;
    const turkeyDate = new Date(date.getTime() + totalOffset * 60 * 1000);
    return format(turkeyDate, 'HH:mm');
  };

  const openAnalytics = (metric: 'calories' | 'protein' | 'carbs' | 'fat') => {
    setAnalyticsMetric(metric);
    setAnalyticsTimeframe('week');
    setShowAnalytics(true);
  };

  const closeAnalytics = () => {
    setShowAnalytics(false);
  };

  const getDayStats = (meals: any[]) => {
    return meals.reduce(
      (acc, meal) => {
        const calories = meal.confirmedCalories || meal.aiCalories || 0;
        const protein = meal.confirmedProtein || meal.aiProtein || 0;
        const carbs = meal.confirmedCarbohydrates || meal.aiCarbohydrates || 0;
        const fat = meal.confirmedFat || meal.aiFat || 0;
        return {
          calories: acc.calories + calories,
          protein: acc.protein + protein,
          carbs: acc.carbs + carbs,
          fat: acc.fat + fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const currentGoal = goals[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
          <p className="text-gray-600">Loading your nutrition data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">NutriTrack</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Welcome, {user?.name || user?.email}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-3">
              <Link
                href="/profile"
                className="inline-flex items-center px-4 py-2 text-gray-700 bg-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 border border-gray-200 font-medium"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
              <Link
                href="/friends"
                className="inline-flex items-center px-4 py-2 text-gray-700 bg-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 border border-gray-200 font-medium"
              >
                <Users className="w-4 h-4 mr-2" />
                Friends
              </Link>
              <Link
                href="/add-meal"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Meal
              </Link>
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 text-gray-700 bg-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 border border-gray-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Mobile Menu */}
          <div className={`md:hidden border-t border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="py-4 space-y-2">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                <User className="w-5 h-5 mr-3" />
                Profile
              </Link>
              <Link
                href="/friends"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                <Users className="w-5 h-5 mr-3" />
                Friends
              </Link>
              <Link
                href="/add-meal"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md font-medium"
              >
                <Plus className="w-5 h-5 mr-3" />
                Add Meal
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center px-4 py-3 text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Today's Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {/* Calories Card */}
          <button
            onClick={() => openAnalytics('calories')}
            className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl active:shadow-lg transform active:scale-95 sm:hover:scale-105 transition-all duration-200 text-left w-full cursor-pointer min-h-[140px] sm:min-h-0"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/70" />
            </div>
            <h3 className="text-sm font-medium text-white/80 mb-1">Calories</h3>
            <p className="text-3xl font-bold text-white">
              {Math.round(todayStats.calories)}
              {profile?.recommendedCalories && (
                <span className="text-lg font-normal text-white/70 ml-1">
                  / {profile.recommendedCalories}
                </span>
              )}
            </p>
            {profile?.recommendedCalories && (
              <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((todayStats.calories / profile.recommendedCalories) * 100, 100)}%` }}
                ></div>
              </div>
            )}
          </button>

          {/* Protein Card */}
          <button
            onClick={() => openAnalytics('protein')}
            className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl active:shadow-lg transform active:scale-95 sm:hover:scale-105 transition-all duration-200 text-left w-full cursor-pointer min-h-[140px] sm:min-h-0"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Beef className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/70" />
            </div>
            <h3 className="text-sm font-medium text-white/80 mb-1">Protein</h3>
            <p className="text-3xl font-bold text-white">
              {Math.round(todayStats.protein)}g
              {profile?.macros?.protein && (
                <span className="text-lg font-normal text-white/70 ml-1">
                  / {profile.macros.protein.grams}g
                </span>
              )}
            </p>
            {profile?.macros?.protein && (
              <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((todayStats.protein / profile.macros.protein.grams) * 100, 100)}%` }}
                ></div>
              </div>
            )}
          </button>

          {/* Carbs Card */}
          <button
            onClick={() => openAnalytics('carbs')}
            className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl active:shadow-lg transform active:scale-95 sm:hover:scale-105 transition-all duration-200 text-left w-full cursor-pointer min-h-[140px] sm:min-h-0"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Wheat className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/70" />
            </div>
            <h3 className="text-sm font-medium text-white/80 mb-1">Carbs</h3>
            <p className="text-3xl font-bold text-white">
              {Math.round(todayStats.carbs)}g
              {profile?.macros?.carbs && (
                <span className="text-lg font-normal text-white/70 ml-1">
                  / {profile.macros.carbs.grams}g
                </span>
              )}
            </p>
            {profile?.macros?.carbs && (
              <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((todayStats.carbs / profile.macros.carbs.grams) * 100, 100)}%` }}
                ></div>
              </div>
            )}
          </button>

          {/* Fat Card */}
          <button
            onClick={() => openAnalytics('fat')}
            className="bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl active:shadow-lg transform active:scale-95 sm:hover:scale-105 transition-all duration-200 text-left w-full cursor-pointer min-h-[140px] sm:min-h-0"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/70" />
            </div>
            <h3 className="text-sm font-medium text-white/80 mb-1">Fat</h3>
            <p className="text-3xl font-bold text-white">
              {Math.round(todayStats.fat)}g
              {profile?.macros?.fat && (
                <span className="text-lg font-normal text-white/70 ml-1">
                  / {profile.macros.fat.grams}g
                </span>
              )}
            </p>
            {profile?.macros?.fat && (
              <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((todayStats.fat / profile.macros.fat.grams) * 100, 100)}%` }}
                ></div>
              </div>
            )}
          </button>
        </div>

        {/* Meal History by Date */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Meal History</h2>
              </div>
              <span className="text-sm font-medium text-gray-500">{meals.length} total meals</span>
            </div>
          </div>

          {meals.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">No meals logged yet</p>
              <Link 
                href="/add-meal" 
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add your first meal
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {Object.entries(groupMealsByDate()).map(([dateKey, dateMeals]) => {
                const isExpanded = expandedDates.has(dateKey);
                const dayStats = getDayStats(dateMeals);
                
                return (
                  <div key={dateKey} className="border-b border-gray-200 last:border-b-0">
                    {/* Date Header - Accordion Toggle */}
                    <button
                      onClick={() => toggleDate(dateKey)}
                      className="w-full px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between active:bg-gray-50 transition-colors gap-3 sm:gap-0"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          dateKey === 'today' ? 'bg-gradient-to-br from-indigo-500 to-purple-500' :
                          dateKey === 'yesterday' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                          'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left flex-1">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900">{getDateLabel(dateKey)}</h3>
                          <p className="text-xs sm:text-sm text-gray-500">{dateMeals.length} meals</p>
                        </div>
                        <div className="sm:hidden">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 sm:space-x-6 w-full sm:w-auto">
                        {/* Day Summary with Goals */}
                        <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm flex-wrap gap-y-1">
                          <div className="flex items-center space-x-0.5 sm:space-x-1">
                            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
                            <span className="font-semibold text-gray-900">{Math.round(dayStats.calories)}</span>
                            {profile?.recommendedCalories && (
                              <span className="text-gray-400 text-[10px] sm:text-xs">/ {profile.recommendedCalories}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-0.5 sm:space-x-1">
                            <Beef className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                            <span className="text-gray-600">{Math.round(dayStats.protein)}g</span>
                            {profile?.macros?.protein && (
                              <span className="text-gray-400 text-[10px] sm:text-xs">/ {profile.macros.protein.grams}g</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-0.5 sm:space-x-1">
                            <Wheat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                            <span className="text-gray-600">{Math.round(dayStats.carbs)}g</span>
                            {profile?.macros?.carbs && (
                              <span className="text-gray-400 text-[10px] sm:text-xs">/ {profile.macros.carbs.grams}g</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-0.5 sm:space-x-1">
                            <Droplet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                            <span className="text-gray-600">{Math.round(dayStats.fat)}g</span>
                            {profile?.macros?.fat && (
                              <span className="text-gray-400 text-[10px] sm:text-xs">/ {profile.macros.fat.grams}g</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="hidden sm:block">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Meals List */}
                    <div className={`bg-gray-50 overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                        {/* Quick Add Button */}
                        <div className="px-6 py-3 border-b border-gray-200">
                          <button
                            onClick={() => openQuickAddModal(dateKey)}
                            className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Meal for {getDateLabel(dateKey)}
                          </button>
                        </div>
                        
                        <div className="divide-y divide-gray-200">
                        {dateMeals.map((meal) => (
                          <div key={meal.id} className="px-6 py-4">
                            {editingMeal === meal.id ? (
                              /* Edit Mode */
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-900 mb-1">Calories</label>
                                    <input
                                      type="number"
                                      value={editValues.calories}
                                      onChange={(e) => setEditValues({...editValues, calories: e.target.value})}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-900 mb-1">Protein (g)</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={editValues.protein}
                                      onChange={(e) => setEditValues({...editValues, protein: e.target.value})}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-900 mb-1">Carbs (g)</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={editValues.carbs}
                                      onChange={(e) => setEditValues({...editValues, carbs: e.target.value})}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-900 mb-1">Fat (g)</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={editValues.fat}
                                      onChange={(e) => setEditValues({...editValues, fat: e.target.value})}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-900 mb-1">Description</label>
                                  <textarea
                                    value={editValues.description}
                                    onChange={(e) => setEditValues({...editValues, description: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                                    rows={2}
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => saveMeal(meal.id)}
                                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* View Mode */
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-lg capitalize">
                                      {meal.mealType}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {format(new Date(meal.loggedAt), 'h:mm a')}
                                    </span>
                                  </div>
                                  <h3 className="text-base font-semibold text-gray-900 mb-1">{meal.name}</h3>
                                  {meal.description && (
                                    <p className="text-sm text-gray-600">{meal.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4 ml-4">
                                  <div className="text-right">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Flame className="w-4 h-4 text-orange-500" />
                                      <p className="text-lg font-bold text-gray-900">
                                        {meal.confirmedCalories || meal.aiCalories}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                                      <span className="flex items-center">
                                        <Beef className="w-3 h-3 mr-1 text-blue-500" />
                                        {(meal.confirmedProtein || meal.aiProtein).toFixed(1)}g
                                      </span>
                                      <span className="flex items-center">
                                        <Wheat className="w-3 h-3 mr-1 text-green-500" />
                                        {(meal.confirmedCarbohydrates || meal.aiCarbohydrates).toFixed(1)}g
                                      </span>
                                      <span className="flex items-center">
                                        <Droplet className="w-3 h-3 mr-1 text-amber-500" />
                                        {(meal.confirmedFat || meal.aiFat).toFixed(1)}g
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col space-y-2">
                                    <button
                                      onClick={() => startEdit(meal)}
                                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                      title="Edit meal"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => openDeleteModal(meal.id)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Delete meal"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Delete Meal</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this meal? All nutritional data will be permanently removed.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Meal Modal */}
      {showQuickAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Add Meal</h3>
                  <p className="text-sm text-gray-500">{quickAddDate && getDateLabel(quickAddDate)}</p>
                </div>
              </div>
              <button
                onClick={closeQuickAddModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Meal Description
                </label>
                <textarea
                  value={quickAddValues.description}
                  onChange={(e) => setQuickAddValues({...quickAddValues, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  rows={3}
                  placeholder="e.g., 1 portion grilled chicken with rice"
                />
                <button
                  onClick={analyzeQuickMeal}
                  disabled={isAnalyzingQuick || !quickAddValues.description}
                  className="mt-2 w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzingQuick ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>

              {/* Meal Type */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Meal Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setQuickAddValues({...quickAddValues, mealType: type})}
                      className={`px-3 py-2 rounded-lg font-medium capitalize text-sm transition-all ${
                        quickAddValues.mealType === type
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nutrition Values */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    <Flame className="w-4 h-4 inline mr-1 text-orange-500" />
                    Calories
                  </label>
                  <input
                    type="number"
                    value={quickAddValues.calories}
                    onChange={(e) => setQuickAddValues({...quickAddValues, calories: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    <Beef className="w-4 h-4 inline mr-1 text-blue-500" />
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={quickAddValues.protein}
                    onChange={(e) => setQuickAddValues({...quickAddValues, protein: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    <Wheat className="w-4 h-4 inline mr-1 text-amber-500" />
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={quickAddValues.carbs}
                    onChange={(e) => setQuickAddValues({...quickAddValues, carbs: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    <Droplet className="w-4 h-4 inline mr-1 text-purple-500" />
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={quickAddValues.fat}
                    onChange={(e) => setQuickAddValues({...quickAddValues, fat: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={closeQuickAddModal}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={quickAddMeal}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Add Meal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl rounded-b-none sm:rounded-2xl shadow-2xl max-w-4xl w-full p-4 sm:p-6 transform transition-all max-h-[92vh] sm:max-h-[85vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                  analyticsMetric === 'calories' ? 'bg-gradient-to-br from-orange-500 to-red-500' :
                  analyticsMetric === 'protein' ? 'bg-gradient-to-br from-blue-500 to-indigo-500' :
                  analyticsMetric === 'carbs' ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                  'bg-gradient-to-br from-amber-500 to-yellow-500'
                }`}>
                  {analyticsMetric === 'calories' && <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                  {analyticsMetric === 'protein' && <Beef className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                  {analyticsMetric === 'carbs' && <Wheat className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                  {analyticsMetric === 'fat' && <Droplet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 capitalize">{analyticsMetric} Analytics</h3>
                  <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Track your progress over time</p>
                </div>
              </div>
              <button
                onClick={closeAnalytics}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Timeframe Toggle */}
            <div className="flex space-x-2 mb-4 sm:mb-6">
              <button
                onClick={() => setAnalyticsTimeframe('week')}
                className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg font-medium transition-all text-sm sm:text-base active:scale-95 ${
                  analyticsTimeframe === 'week'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setAnalyticsTimeframe('month')}
                className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg font-medium transition-all text-sm sm:text-base active:scale-95 ${
                  analyticsTimeframe === 'month'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                }`}
              >
                Last 30 Days
              </button>
            </div>

            {/* Graph */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 sm:p-6 mb-3 sm:mb-4">
              {(() => {
                const days = analyticsTimeframe === 'week' ? 7 : 30;
                const today = new Date();
                const data = [];
                
                for (let i = days - 1; i >= 0; i--) {
                  const date = new Date(today);
                  date.setDate(date.getDate() - i);
                  date.setHours(0, 0, 0, 0);
                  
                  const endDate = new Date(date);
                  endDate.setHours(23, 59, 59, 999);
                  
                  const dayMeals = meals.filter(meal => {
                    const mealDate = new Date(meal.loggedAt);
                    return mealDate >= date && mealDate <= endDate;
                  });
                  
                  const value = dayMeals.reduce((sum, meal) => {
                    if (analyticsMetric === 'calories') {
                      return sum + (meal.confirmedCalories || meal.aiCalories || 0);
                    } else if (analyticsMetric === 'protein') {
                      return sum + (meal.confirmedProtein || meal.aiProtein || 0);
                    } else if (analyticsMetric === 'carbs') {
                      return sum + (meal.confirmedCarbohydrates || meal.aiCarbohydrates || 0);
                    } else {
                      return sum + (meal.confirmedFat || meal.aiFat || 0);
                    }
                  }, 0);
                  
                  data.push({
                    date: format(date, 'MMM d'),
                    value: analyticsMetric === 'calories' ? Math.round(value) : parseFloat(value.toFixed(1))
                  });
                }
                
                const actualMaxValue = Math.max(...data.map(d => d.value), 1);
                
                // Get goal value based on metric
                let goalValue = null;
                if (profile) {
                  if (analyticsMetric === 'calories') {
                    goalValue = profile.recommendedCalories;
                  } else if (analyticsMetric === 'protein' && profile.macros?.protein) {
                    goalValue = profile.macros.protein.grams;
                  } else if (analyticsMetric === 'carbs' && profile.macros?.carbs) {
                    goalValue = profile.macros.carbs.grams;
                  } else if (analyticsMetric === 'fat' && profile.macros?.fat) {
                    goalValue = profile.macros.fat.grams;
                  }
                }
                
                // Adjust maxValue to include goal if it's higher
                const maxValue = Math.max(actualMaxValue, goalValue || 0) * 1.15; // Add 15% padding at top
                const avgValue = data.reduce((sum, d) => sum + d.value, 0) / data.length;
                
                return (
                  <>
                    {/* Stats Summary */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-6">
                      <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Average</p>
                        <p className="text-sm sm:text-lg font-bold text-gray-900">
                          {analyticsMetric === 'calories' ? Math.round(avgValue) : avgValue.toFixed(1)}
                          {analyticsMetric === 'calories' ? '' : 'g'}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Highest</p>
                        <p className="text-sm sm:text-lg font-bold text-gray-900">
                          {analyticsMetric === 'calories' ? Math.round(actualMaxValue) : actualMaxValue.toFixed(1)}
                          {analyticsMetric === 'calories' ? '' : 'g'}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Total Days</p>
                        <p className="text-sm sm:text-lg font-bold text-gray-900">{days}</p>
                      </div>
                    </div>

                    {/* Line Chart */}
                    <div className="relative w-full bg-white rounded-lg p-2 sm:p-4 overflow-hidden">
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
                              <div key={i} className="border-t border-gray-200 w-full"></div>
                            ))}
                          </div>

                          {/* Line and Dots */}
                          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Goal Line */}
                            {goalValue && (
                              <line
                                x1="0"
                                y1={100 - ((goalValue / maxValue) * 100)}
                                x2="100"
                                y2={100 - ((goalValue / maxValue) * 100)}
                                stroke="#9ca3af"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                                vectorEffect="non-scaling-stroke"
                                className="opacity-60"
                              />
                            )}
                            
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

                          {/* Goal Line Label */}
                          {goalValue && (
                            <div
                              className="absolute right-2 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium pointer-events-none"
                              style={{
                                top: `${100 - ((goalValue / maxValue) * 100)}%`,
                                transform: 'translateY(-50%)'
                              }}
                            >
                              Goal: {Math.round(goalValue)}{analyticsMetric === 'calories' ? '' : 'g'}
                            </div>
                          )}

                          {/* Hover Tooltip */}
                          {hoveredPoint && (() => {
                            // If point is in top 30% of chart, show tooltip below
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
                                  // Arrow pointing up (tooltip below point)
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
                                  // Arrow pointing down (tooltip above point)
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
                      <div className="relative mt-3 pl-10 pr-2 pb-1">
                        <div className="relative w-full h-5">
                          {data.map((item, index) => {
                            // Show every nth label to avoid crowding
                            const showLabel = analyticsTimeframe === 'week' ? true : index % 5 === 0 || index === data.length - 1;
                            const position = data.length === 1 ? 50 : (index / (data.length - 1)) * 95;
                            return (
                              <span 
                                key={index} 
                                className={`absolute text-[10px] sm:text-xs text-gray-600 font-medium transform -translate-x-1/2 top-0 ${showLabel ? '' : 'invisible'}`}
                                style={{ left: `${position}%` }}
                              >
                                {item.date}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <button
              onClick={closeAnalytics}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(DashboardPage);
