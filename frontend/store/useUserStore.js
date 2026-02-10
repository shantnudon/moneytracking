import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setError: (error) => set({ error }),

      reset: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        }),

      markTourCompleted: (tourKey) => {
        const currentUser = get().user;
        if (currentUser) {
          const completedTours = currentUser.completedTours || [];
          if (!completedTours.includes(tourKey)) {
            set({
              user: {
                ...currentUser,
                completedTours: [...completedTours, tourKey],
              },
            });
          }
        }
      },

      restartTours: (tourKey = null) => {
        const currentUser = get().user;
        if (currentUser) {
          const completedTours = currentUser.completedTours || [];
          set({
            user: {
              ...currentUser,
              completedTours: tourKey
                ? completedTours.filter((k) => k !== tourKey)
                : [],
            },
          });
        }
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
