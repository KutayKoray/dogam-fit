'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { User, Scale, Ruler, Calendar, Target, Activity, TrendingDown, TrendingUp, Minus, Save, ArrowLeft, Beef, Wheat, Droplet } from 'lucide-react';

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    height: '',
    weight: '',
    gender: 'male',
    targetWeight: '',
    activityLevel: 'moderate',
  });

  useEffect(() => {
    // Set token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      apiClient.setToken(token);
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        apiClient.setToken(token);
      }
      const data = await apiClient.getProfile();
      setProfile(data);
      setFormData({
        name: data.name || '',
        age: data.age?.toString() || '',
        height: data.height?.toString() || '',
        weight: data.weight?.toString() || '',
        gender: data.gender || 'male',
        targetWeight: data.targetWeight?.toString() || '',
        activityLevel: data.activityLevel || 'moderate',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (token) {
        apiClient.setToken(token);
      }
      const data = await apiClient.updateProfile(formData);
      setProfile(data);
      showNotification('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showNotification('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getBMIColor = (bmi: number | null) => {
    if (!bmi) return 'text-gray-500';
    if (bmi < 18.5) return 'text-blue-600';
    if (bmi < 25) return 'text-green-600';
    if (bmi < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWeightGoalIcon = () => {
    if (!formData.weight || !formData.targetWeight) return <Minus className="w-5 h-5" />;
    const current = parseFloat(formData.weight);
    const target = parseFloat(formData.targetWeight);
    if (current > target) return <TrendingDown className="w-5 h-5" />;
    if (current < target) return <TrendingUp className="w-5 h-5" />;
    return <Minus className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/dashboard"
              className="inline-flex items-center text-indigo-600 active:text-indigo-700 font-medium transition-colors p-2 -ml-2 rounded-lg active:bg-indigo-50"
            >
              <ArrowLeft className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              My Profile
            </h1>
            <div className="w-8 sm:w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-base"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Age
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-base"
                  placeholder="25"
                  min="1"
                  max="120"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 text-base"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <Activity className="w-4 h-4 inline mr-1" />
                  Activity Level
                </label>
                <select
                  value={formData.activityLevel}
                  onChange={(e) => setFormData({...formData, activityLevel: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                >
                  <option value="sedentary">Sedentary (Little/no exercise)</option>
                  <option value="light">Light (1-3 days/week)</option>
                  <option value="moderate">Moderate (3-5 days/week)</option>
                  <option value="active">Active (6-7 days/week)</option>
                  <option value="very_active">Very Active (Physical job)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Body Measurements */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Body Measurements</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <Ruler className="w-4 h-4 inline mr-1" />
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  placeholder="175"
                  step="0.1"
                  min="50"
                  max="250"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <Scale className="w-4 h-4 inline mr-1" />
                  Current Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  placeholder="70"
                  step="0.1"
                  min="20"
                  max="300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  Target Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.targetWeight}
                  onChange={(e) => setFormData({...formData, targetWeight: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  placeholder="65"
                  step="0.1"
                  min="20"
                  max="300"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          {profile?.bmi && (
            <>
              {/* BMI Card */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="text-sm font-medium text-white/80 mb-2">Body Mass Index (BMI)</h3>
                <p className={`text-4xl font-bold mb-2`}>
                  {profile.bmi}
                </p>
                <p className="text-white/90 font-medium">{profile.bmiCategory}</p>
                <div className="mt-4 bg-white/20 rounded-lg p-3 text-sm">
                  <p className="text-white/80">BMI Categories:</p>
                  <p className="text-white/70">{'<'} 18.5: Underweight</p>
                  <p className="text-white/70">18.5 - 24.9: Normal</p>
                  <p className="text-white/70">25 - 29.9: Overweight</p>
                  <p className="text-white/70">≥ 30: Obese</p>
                </div>
              </div>

              {/* Calorie Breakdown */}
              {profile.maintenanceCalories && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Maintenance Calories */}
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <Minus className="w-5 h-5" />
                      <h3 className="text-sm font-medium text-white/80">Maintenance</h3>
                    </div>
                    <p className="text-3xl font-bold mb-2">
                      {profile.maintenanceCalories}
                    </p>
                    <p className="text-white/90 text-sm font-medium">Calories to maintain weight</p>
                    <div className="mt-3 bg-white/20 rounded-lg p-2 text-xs">
                      <p className="text-white/90">
                        Your TDEE (Total Daily Energy Expenditure)
                      </p>
                    </div>
                  </div>

                  {/* Adjustment */}
                  {profile.adjustmentType !== 'maintenance' && (
                    <div className={`bg-gradient-to-br ${
                      profile.adjustmentType === 'deficit' 
                        ? 'from-yellow-500 to-orange-500' 
                        : 'from-purple-500 to-pink-500'
                    } rounded-2xl p-6 text-white shadow-xl`}>
                      <div className="flex items-center space-x-2 mb-2">
                        {profile.adjustmentType === 'deficit' ? (
                          <TrendingDown className="w-5 h-5" />
                        ) : (
                          <TrendingUp className="w-5 h-5" />
                        )}
                        <h3 className="text-sm font-medium text-white/80">
                          {profile.adjustmentType === 'deficit' ? 'Deficit' : 'Surplus'}
                        </h3>
                      </div>
                      <p className="text-3xl font-bold mb-2">
                        {profile.calorieAdjustment > 0 ? '+' : ''}{profile.calorieAdjustment}
                      </p>
                      <p className="text-white/90 text-sm font-medium">
                        {profile.adjustmentType === 'deficit' ? 'To lose weight' : 'To gain weight'}
                      </p>
                      <div className="mt-3 bg-white/20 rounded-lg p-2 text-xs">
                        <p className="text-white/90">
                          {profile.adjustmentType === 'deficit' 
                            ? 'Safe weight loss: ~0.5kg/week' 
                            : 'Healthy weight gain: ~0.3kg/week'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Recommended Calories */}
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      {getWeightGoalIcon()}
                      <h3 className="text-sm font-medium text-white/80">Daily Goal</h3>
                    </div>
                    <p className="text-3xl font-bold mb-2">
                      {profile.recommendedCalories}
                    </p>
                    <p className="text-white/90 text-sm font-medium mb-3">
                      {profile.adjustmentType === 'deficit' 
                        ? 'For weight loss' 
                        : profile.adjustmentType === 'surplus'
                        ? 'For weight gain'
                        : 'For maintenance'}
                    </p>

                    {/* Daily Macros */}
                    {profile.macros && (
                      <div className="mt-3 bg-white/20 rounded-lg p-3 space-y-2">
                        <p className="text-white/90 text-xs font-semibold mb-2">Daily Macros:</p>
                        
                        {/* Protein */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <Beef className="w-3 h-3" />
                            <span className="text-white/90">Protein</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-white">{profile.macros.protein.grams}g</span>
                            <span className="text-white/70 ml-1">({profile.macros.protein.percentage}%)</span>
                          </div>
                        </div>

                        {/* Carbs */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <Wheat className="w-3 h-3" />
                            <span className="text-white/90">Carbs</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-white">{profile.macros.carbs.grams}g</span>
                            <span className="text-white/70 ml-1">({profile.macros.carbs.percentage}%)</span>
                          </div>
                        </div>

                        {/* Fat */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <Droplet className="w-3 h-3" />
                            <span className="text-white/90">Fat</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-white">{profile.macros.fat.grams}g</span>
                            <span className="text-white/70 ml-1">({profile.macros.fat.percentage}%)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end sticky bottom-0 sm:static bg-gradient-to-t from-white via-white to-transparent sm:bg-none pt-4 pb-2 sm:pb-0 -mx-3 sm:mx-0 px-3 sm:px-0">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg active:shadow-md sm:hover:shadow-xl transform active:scale-95 sm:hover:scale-105 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-8 sm:right-8 sm:left-auto z-50 animate-slide-up">
          <div className={`rounded-xl shadow-2xl p-4 flex items-center space-x-3 ${
            toastType === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
              : 'bg-gradient-to-r from-red-500 to-pink-500'
          } text-white max-w-md mx-auto sm:mx-0`}>
            {toastType === 'success' ? (
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            <p className="font-medium text-sm sm:text-base">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(ProfilePage);
