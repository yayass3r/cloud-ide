import { create } from 'zustand';

export type AppView = 'landing' | 'login' | 'register' | 'dashboard' | 'ide' | 'profile' | 'admin' | 'portfolio' | 'new-project' | 'forgot-password';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  bio?: string | null;
  role: string;
  skills?: string;
  githubUrl?: string | null;
  isFrozen: boolean;
  isOnline: boolean;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  template: string;
  files: Record<string, string>;
  isPublic: boolean;
  isDeployed: boolean;
  deployUrl?: string | null;
  previewUrl?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProject extends Project {
  user: { id: string; name: string; avatar: string | null } | null;
  _count?: { deployments: number };
}

interface AppState {
  // Navigation
  currentView: AppView;

  // Auth
  user: User | null;
  token: string | null;

  // Project
  currentProject: Project | null;
  projects: Project[];

  // UI
  sidebarOpen: boolean;
  aiChatOpen: boolean;

  // Theme
  theme: 'light' | 'dark';

  // Actions
  navigate: (view: AppView) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  selectProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  toggleSidebar: () => void;
  toggleAiChat: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // API helper
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  getAuthHeaders: () => Record<string, string>;
}

const STORAGE_KEY_USER = 'codeStudio_user';
const STORAGE_KEY_TOKEN = 'codeStudio_token';

function loadFromStorage(key: string): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
}

function saveToStorage(key: string, value: string | null) {
  if (typeof window !== 'undefined') {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentView: 'landing',
  user: null,
  token: null,
  currentProject: null,
  projects: [],
  sidebarOpen: true,
  aiChatOpen: false,
  theme: 'dark',

  // Actions
  navigate: (view) => set({ currentView: view }),

  setUser: (user) => {
    set({ user });
    if (user) {
      saveToStorage(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      // Clear localStorage when user is set to null
      saveToStorage(STORAGE_KEY_USER, null);
    }
  },

  setToken: (token) => {
    set({ token });
    saveToStorage(STORAGE_KEY_TOKEN, token);
  },

  logout: () => {
    set({
      user: null,
      token: null,
      currentProject: null,
      projects: [],
      currentView: 'landing',
      sidebarOpen: true,
      aiChatOpen: false,
    });
    saveToStorage(STORAGE_KEY_USER, null);
    saveToStorage(STORAGE_KEY_TOKEN, null);
  },

  selectProject: (project) => set({ currentProject: project }),

  setProjects: (projects) => set({ projects }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleAiChat: () => set((state) => ({ aiChatOpen: !state.aiChatOpen })),

  setTheme: (theme) => set({ theme }),

  /**
   * Get authorization headers including the JWT token
   */
  getAuthHeaders: () => {
    const token = get().token;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  /**
   * Wrapper around fetch that automatically includes the JWT token
   * in the Authorization header for all API requests.
   */
  apiFetch: async (url: string, options: RequestInit = {}) => {
    const token = get().token;
    const headers = new Headers(options.headers || {});

    // Set Content-Type if body is JSON and not already set
    if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Add Authorization header if token exists
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(url, {
      ...options,
      headers,
    });
  },
}));

/**
 * Initialize auth state from localStorage on the client side.
 * Call this once in the root component's useEffect.
 */
export function initAuthFromStorage() {
  const userJson = loadFromStorage(STORAGE_KEY_USER);
  const token = loadFromStorage(STORAGE_KEY_TOKEN);

  if (userJson && token) {
    try {
      const user = JSON.parse(userJson);
      useAppStore.setState({ user, token });
    } catch {
      // Invalid stored data — clear it
      saveToStorage(STORAGE_KEY_USER, null);
      saveToStorage(STORAGE_KEY_TOKEN, null);
    }
  } else if (userJson && !token) {
    // Have user but no token — clear user too (need to re-login)
    saveToStorage(STORAGE_KEY_USER, null);
  }
}
