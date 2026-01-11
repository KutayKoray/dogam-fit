'use client';

import { withAuth } from '@/components/withAuth';
import { useState, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Upload, X, Sparkles, ArrowLeft, Flame, Beef, Wheat, Droplet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

function AddMealPage() {
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [confirmedValues, setConfirmedValues] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const router = useRouter();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeMeal = async () => {
    if (!description && !image) {
      setError('Please provide either a description or image');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      let analysis;
      if (image) {
        const response = await apiClient.analyzeNutrition(image, description);
        analysis = response.data;
      } else {
        const response = await apiClient.quickAnalyze(description);
        analysis = response.data;
      }

      setAiAnalysis(analysis);
      setConfirmedValues({
        calories: analysis.estimatedCalories.toString(),
        protein: analysis.estimatedProtein.toString(),
        carbs: analysis.estimatedCarbohydrates.toString(),
        fat: analysis.estimatedFat.toString(),
      });
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveMeal = async () => {
    if (!aiAnalysis) {
      setError('Please analyze the meal first');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const mealData = {
        name: aiAnalysis.foodItems.join(', '),
        description,
        mealType,
        imageUrl: image ? image.name : null,
        aiCalories: aiAnalysis.estimatedCalories,
        aiProtein: aiAnalysis.estimatedProtein,
        aiCarbohydrates: aiAnalysis.estimatedCarbohydrates,
        aiFat: aiAnalysis.estimatedFat,
        aiConfidence: aiAnalysis.confidence,
        aiNotes: aiAnalysis.notes,
        confirmedCalories: confirmedValues.calories ? parseInt(confirmedValues.calories) : null,
        confirmedProtein: confirmedValues.protein ? parseFloat(confirmedValues.protein) : null,
        confirmedCarbohydrates: confirmedValues.carbs ? parseFloat(confirmedValues.carbs) : null,
        confirmedFat: confirmedValues.fat ? parseFloat(confirmedValues.fat) : null,
      };

      await apiClient.createMeal(mealData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save meal');
    } finally {
      setIsSaving(false);
    }
  };

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
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Add New Meal</h1>
                <p className="text-xs text-gray-500">AI-powered nutrition analysis</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Food Photo</h2>
                <p className="text-sm text-gray-500">Upload an image for AI analysis (optional)</p>
              </div>
            </div>
            
            {imagePreview ? (
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Food preview"
                  className="w-full h-80 object-cover rounded-2xl shadow-lg"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-3 shadow-lg hover:bg-red-600 transform hover:scale-110 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-indigo-300 rounded-2xl p-12 text-center bg-gradient-to-br from-indigo-50 to-purple-50 hover:border-indigo-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Choose Image
                </label>
                <p className="mt-4 text-sm text-gray-600">
                  or drag and drop your food photo here
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  PNG, JPG up to 10MB
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Meal Description</h2>
                <p className="text-sm text-gray-500">Describe what you ate in detail</p>
              </div>
            </div>
            <textarea
              rows={5}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
              placeholder="Example: '1 portion grilled chicken breast with brown rice and steamed broccoli'
              
Tip: Be specific about portions and cooking methods for better accuracy!"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Meal Type */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Meal Type</h2>
                <p className="text-sm text-gray-500">When did you eat this?</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`px-6 py-4 rounded-xl font-semibold capitalize transition-all duration-200 ${
                    mealType === type
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <div className="flex justify-center">
            <button
              onClick={analyzeMeal}
              disabled={isAnalyzing || (!description && !image)}
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-semibold text-lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform" />
                  Analyze with AI
                </>
              )}
            </button>
          </div>

          {/* AI Analysis Results */}
          {aiAnalysis && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl shadow-xl border-2 border-green-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">AI Analysis Complete!</h2>
                  <p className="text-sm text-gray-600">Review and edit the values below</p>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl mb-6 border border-green-200">
                <div className="flex items-start space-x-3 mb-3">
                  <Sparkles className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Detected Foods:
                    </p>
                    <p className="text-gray-700">{aiAnalysis.foodItems.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Confidence: <strong className="text-green-600">{Math.round(aiAnalysis.confidence * 100)}%</strong>
                    </span>
                  </div>
                  {aiAnalysis.notes && (
                    <p className="text-xs text-gray-500 italic">
                      {aiAnalysis.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    ✏️
                  </span>
                  Edit Nutritional Values
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Calories */}
                  <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border-2 border-orange-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <label className="text-sm font-bold text-gray-900">
                        Calories
                      </label>
                    </div>
                    <input
                      type="number"
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg font-semibold text-gray-900"
                      value={confirmedValues.calories}
                      onChange={(e) => setConfirmedValues({...confirmedValues, calories: e.target.value})}
                    />
                  </div>

                  {/* Protein */}
                  <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border-2 border-blue-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Beef className="w-5 h-5 text-blue-500" />
                      <label className="text-sm font-bold text-gray-900">
                        Protein (g)
                      </label>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold text-gray-900"
                      value={confirmedValues.protein}
                      onChange={(e) => setConfirmedValues({...confirmedValues, protein: e.target.value})}
                    />
                  </div>

                  {/* Carbs */}
                  <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border-2 border-amber-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Wheat className="w-5 h-5 text-amber-500" />
                      <label className="text-sm font-bold text-gray-900">
                        Carbohydrates (g)
                      </label>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg font-semibold text-gray-900"
                      value={confirmedValues.carbs}
                      onChange={(e) => setConfirmedValues({...confirmedValues, carbs: e.target.value})}
                    />
                  </div>

                  {/* Fat */}
                  <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border-2 border-purple-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Droplet className="w-5 h-5 text-purple-500" />
                      <label className="text-sm font-bold text-gray-900">
                        Fat (g)
                      </label>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold text-gray-900"
                      value={confirmedValues.fat}
                      onChange={(e) => setConfirmedValues({...confirmedValues, fat: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={saveMeal}
                  disabled={isSaving}
                  className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-semibold text-lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Saving Meal...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                      Save Meal
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex items-start space-x-3 shadow-lg">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default withAuth(AddMealPage);
