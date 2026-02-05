import axios, { AxiosRequestConfig } from "axios";
import { cookieStore, storageStore } from "@/store";

// Public API instance (no auth interceptors)
export const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach the Access Token
api.interceptors.request.use(
  (config) => {
    const token = cookieStore.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for auth endpoints themselves
    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?.url?.includes("/auth/register");

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      // Global Error Handling for Upgrade/Network Issues
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/server-error")
      ) {
        // Redirect on 5xx errors or network errors (no response)
        if (
          (!error.response || error.response.status >= 500) &&
          error.code !== "ERR_CANCELED"
        ) {
          window.location.href = "/server-error";
        }
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = cookieStore.getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { "Content-Type": "application/json" } },
      );

      const { access_token, refresh_token } = data;
      cookieStore.setTokens(access_token, refresh_token);
      processQueue(null, access_token);

      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      cookieStore.clearTokens();
      storageStore.clearUser();
      // Only redirect if the request didn't explicitly opt-out
      // Note: Custom config properties like skipAuthRedirect might be stripped by Axios in error.config,
      // so we also check the URL for endpoints that should fail gracefully.
      const shouldSkipRedirect =
        (originalRequest as AxiosRequestConfig & { skipAuthRedirect?: boolean })
          .skipAuthRedirect ||
        originalRequest?.url?.includes("/users/me") ||
        (typeof window !== "undefined" &&
          (window.location.pathname.includes("/room/") ||
            window.location.pathname.includes("/join")));

      if (typeof window !== "undefined" && !shouldSkipRedirect) {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
