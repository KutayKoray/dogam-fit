const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(email: string, password: string, name?: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  // Meal endpoints
  async getMeals(params?: { startDate?: string; endDate?: string; limit?: number }) {
    const searchParams = new URLSearchParams(params as any).toString();
    return this.request(`/meals${searchParams ? `?${searchParams}` : ''}`);
  }

  async createMeal(mealData: any) {
    return this.request('/meals', {
      method: 'POST',
      body: JSON.stringify(mealData),
    });
  }

  async updateMeal(id: string, mealData: any) {
    return this.request(`/meals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mealData),
    });
  }

  async deleteMeal(id: string) {
    return this.request(`/meals/${id}`, {
      method: 'DELETE',
    });
  }

  async analyzeNutrition(image?: File, description?: string) {
    const formData = new FormData();
    if (image) formData.append('image', image);
    if (description) formData.append('description', description);

    const url = `${this.baseURL}/meals/analyze`;
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async quickAnalyze(description: string) {
    return this.request('/ai/quick-analyze', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  // Goal endpoints
  async getGoals() {
    return this.request('/goals');
  }

  async createGoal(goalData: any) {
    return this.request('/goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
  }

  async updateGoal(id: string, goalData: any) {
    return this.request(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goalData),
    });
  }

  // Profile endpoints
  async getProfile() {
    return this.request('/profile');
  }

  async updateProfile(profileData: any) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Connection endpoints (Family Sharing)
  async getConnections() {
    return this.request('/connections');
  }

  async getPendingRequests() {
    return this.request('/connections/pending');
  }

  async sendConnectionRequest(email: string) {
    return this.request('/connections/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async acceptConnection(connectionId: string) {
    return this.request(`/connections/accept/${connectionId}`, {
      method: 'POST',
    });
  }

  async rejectConnection(connectionId: string) {
    return this.request(`/connections/reject/${connectionId}`, {
      method: 'POST',
    });
  }

  async removeConnection(connectionId: string) {
    return this.request(`/connections/${connectionId}`, {
      method: 'DELETE',
    });
  }

  async getFriendMeals(friendId: string) {
    return this.request(`/connections/${friendId}/meals`);
  }

  async toggleSharing(enabled: boolean) {
    return this.request('/connections/sharing', {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  }
}

export const apiClient = new ApiClient();
