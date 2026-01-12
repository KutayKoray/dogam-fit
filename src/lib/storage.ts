// Safe storage wrapper for iOS 18.2 compatibility
class SafeStorage {
  private storage: Storage | null = null;
  private memoryFallback: Map<string, string> = new Map();

  constructor() {
    if (typeof window === 'undefined') return;

    // Try localStorage first
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      this.storage = localStorage;
    } catch (e) {
      console.warn('localStorage not available, trying sessionStorage');
      
      // Try sessionStorage as fallback
      try {
        const test = '__storage_test__';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        this.storage = sessionStorage;
      } catch (e2) {
        console.warn('sessionStorage not available, using memory fallback');
        // Use memory fallback (will be lost on page refresh)
      }
    }
  }

  getItem(key: string): string | null {
    try {
      if (this.storage) {
        return this.storage.getItem(key);
      }
      return this.memoryFallback.get(key) || null;
    } catch (e) {
      console.error('Failed to get item:', e);
      return this.memoryFallback.get(key) || null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (this.storage) {
        this.storage.setItem(key, value);
      }
      this.memoryFallback.set(key, value);
    } catch (e) {
      console.error('Failed to set item:', e);
      this.memoryFallback.set(key, value);
    }
  }

  removeItem(key: string): void {
    try {
      if (this.storage) {
        this.storage.removeItem(key);
      }
      this.memoryFallback.delete(key);
    } catch (e) {
      console.error('Failed to remove item:', e);
      this.memoryFallback.delete(key);
    }
  }
}

export const safeStorage = new SafeStorage();
