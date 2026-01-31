import type { UserInfo } from "@/types/auth";

const USER_KEY = "cosmic_user_info";

export const storageStore = {
  setUser(user: UserInfo) {
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  getUser(): UserInfo | null {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem(USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  },

  clearUser() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_KEY);
    }
  },
};
