import { create } from 'zustand';

export type AppView = 'landing' | 'login' | 'register' | 'dashboard' | 'ide' | 'profile' | 'admin' | 'portfolio' | 'new-project';

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
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  template: string;
  files: string;
  isPublic: boolean;
  isDeployed: boolean;
  deployUrl?: string | null;
  previewUrl?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  // Navigation
  currentView: AppView;

  // Auth
  user: User | null;

  // Project
  currentProject: Project | null;

  // UI
  sidebarOpen: boolean;
  aiChatOpen: boolean;

  // Theme
  theme: 'light' | 'dark';

  // Actions
  navigate: (view: AppView) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  selectProject: (project: Project | null) => void;
  toggleSidebar: () => void;
  toggleAiChat: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  currentView: 'landing',
  user: null,
  currentProject: null,
  sidebarOpen: true,
  aiChatOpen: false,
  theme: 'dark',

  // Actions
  navigate: (view) => set({ currentView: view }),

  setUser: (user) => set({ user }),

  logout: () => {
    set({
      user: null,
      currentProject: null,
      currentView: 'landing',
      sidebarOpen: true,
      aiChatOpen: false,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('codeStudio_user');
    }
  },

  selectProject: (project) => set({ currentProject: project }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleAiChat: () => set((state) => ({ aiChatOpen: !state.aiChatOpen })),

  setTheme: (theme) => set({ theme }),
}));
