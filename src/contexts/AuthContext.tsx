"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClientComponentClient } from "@/lib/supabase";
import {
  categorizeAuthError,
  logAuthError,
  logAuthSuccess,
  retryAuthOperation,
  createErrorContext,
} from "@/lib/error-handler";

export type UserType = "planner" | "vendor" | "viewer" | null;

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  user_type: UserType;
  onboarding_completed: boolean;
  avatar_url?: string | null;
  business_name?: string | null;
  location_preference?: string | null;
  created_at: string;
  _cachedAt?: number; // Timestamp when cached
}

// Cache configuration
const CACHE_KEY = "momentmoi_auth_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PROFILE_CACHE_KEY = "momentmoi_profile_cache";
const PROFILE_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface AuthCache {
  user: any;
  session: any;
  profile: UserProfile | null;
  userType: UserType;
  timestamp: number;
}

// Cache utilities
const getAuthCache = (): AuthCache | null => {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cache: AuthCache = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - cache.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cache;
  } catch (error) {
    console.error("Error reading auth cache:", error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const setAuthCache = (data: Partial<AuthCache>) => {
  if (typeof window === "undefined") return;

  try {
    const cache: AuthCache = {
      user: data.user || null,
      session: data.session || null,
      profile: data.profile || null,
      userType: data.userType || null,
      timestamp: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error("Error setting auth cache:", error);
  }
};

const clearAuthCache = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(PROFILE_CACHE_KEY);
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  userType: UserType;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    userData: any
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Fetch user profile from database with caching
  const fetchUserProfile = async (
    userId: string,
    forceRefresh = false
  ): Promise<UserProfile | null> => {
    try {
      console.log(
        "🔍 AuthContext - Fetching user profile for:",
        userId,
        forceRefresh ? "(forced refresh)" : ""
      );

      // Check cache first unless force refresh is requested
      if (!forceRefresh && typeof window !== "undefined") {
        try {
          const cachedProfile = localStorage.getItem(PROFILE_CACHE_KEY);
          if (cachedProfile) {
            const { profile, timestamp } = JSON.parse(cachedProfile);
            const now = Date.now();

            // Use cached profile if it's still fresh
            if (
              now - timestamp < PROFILE_CACHE_DURATION &&
              profile.id === userId
            ) {
              console.log("✅ AuthContext - Using cached profile");
              return { ...profile, _cachedAt: timestamp };
            }
          }
        } catch (cacheError) {
          console.warn("Error reading profile cache:", cacheError);
        }
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("❌ AuthContext - Error fetching profile:", error);

        // If profile doesn't exist, return null (will be handled by onboarding)
        if (error.code === "PGRST116") {
          console.log("ℹ️ AuthContext - Profile doesn't exist yet");
          return null;
        }

        throw error;
      }

      const profile = profileData as UserProfile;
      console.log("✅ AuthContext - Profile fetched successfully:", {
        userType: profile.user_type,
        onboardingCompleted: profile.onboarding_completed,
        email: profile.email,
      });

      // Cache the profile for future use
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            PROFILE_CACHE_KEY,
            JSON.stringify({
              profile,
              timestamp: Date.now(),
            })
          );
        } catch (cacheError) {
          console.warn("Error caching profile:", cacheError);
        }
      }

      return profile;
    } catch (error) {
      console.error("💥 AuthContext - Error in fetchUserProfile:", error);
      return null;
    }
  };

  // Update profile and userType state
  const updateProfileState = (newProfile: UserProfile | null) => {
    setProfile(newProfile);
    setUserType(newProfile?.user_type || null);
  };

  useEffect(() => {
    // Get initial session and profile with caching
    const getInitialSession = async () => {
      console.log("🔐 AuthContext - Getting initial session");

      // First, try to load from cache for instant UI
      const cachedAuth = getAuthCache();
      if (cachedAuth) {
        console.log("⚡ AuthContext - Loading from cache for instant UI");
        setSession(cachedAuth.session);
        setUser(cachedAuth.user);
        updateProfileState(cachedAuth.profile);
        setLoading(false); // Set loading to false immediately with cached data
      } else {
        setLoading(true); // Only show loading if no cache
      }

      // Always fetch fresh data in background
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);

      // If we have a user, fetch their profile (will use cache if available)
      if (session?.user) {
        console.log("👤 AuthContext - User authenticated, fetching profile");
        const userProfile = await fetchUserProfile(session.user.id);
        updateProfileState(userProfile);

        // Update cache with fresh data
        setAuthCache({
          user: session.user,
          session,
          profile: userProfile,
          userType: userProfile?.user_type || null,
        });
      } else {
        console.log("👤 AuthContext - No authenticated user");
        updateProfileState(null);
        clearAuthCache(); // Clear cache if no user
      }

      setLoading(false);
      console.log(
        "✅ AuthContext - Initial session and profile loading complete"
      );
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 AuthContext - Auth state change:", event);

      setSession(session);
      setUser(session?.user ?? null);

      // Handle profile based on auth event
      if (session?.user) {
        console.log("👤 AuthContext - User authenticated, fetching profile");
        const userProfile = await fetchUserProfile(session.user.id);
        updateProfileState(userProfile);

        // Update cache
        setAuthCache({
          user: session.user,
          session,
          profile: userProfile,
          userType: userProfile?.user_type || null,
        });
      } else {
        console.log("👤 AuthContext - User signed out, clearing profile");
        updateProfileState(null);
        clearAuthCache(); // Clear cache on sign out
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    const userDataForLogging = {
      email,
      userType: "unknown", // We'll get this from the user profile after signin
    };

    const errorContext = createErrorContext("AuthContext", "signin");

    try {
      console.log("🔐 Attempting user signin:", {
        email: email.split("@")[0] + "@***",
        timestamp: new Date().toISOString(),
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Log successful signin and refresh profile
      if (data.user) {
        const userType = data.user.user_metadata?.user_type || "unknown";

        logAuthSuccess(
          "signin",
          {
            ...userDataForLogging,
            userId: data.user.id,
            userType,
          },
          {
            lastSignInAt: data.user.last_sign_in_at,
            emailConfirmed: data.user.email_confirmed_at !== null,
            userMetadata: data.user.user_metadata,
          }
        );

        console.log("✅ User signed in successfully, refreshing profile", {
          userId: data.user.id,
          email: email.split("@")[0] + "@***",
          userType,
          lastSignInAt: data.user.last_sign_in_at,
        });

        // Refresh profile data after signin
        const userProfile = await fetchUserProfile(data.user.id);
        updateProfileState(userProfile);
      }

      return { error: null };
    } catch (error: any) {
      // Enhanced error logging with categorization
      const authError = categorizeAuthError(
        error,
        "signin",
        userDataForLogging
      );
      logAuthError(authError, {
        context: errorContext,
        signinAttempt: {
          email: email.split("@")[0] + "@***",
          hasPassword: !!password,
        },
        supabaseError: {
          message: error?.message,
          status: error?.status,
          code: error?.code,
        },
      });

      // Return categorized error with user-friendly message
      return {
        error: {
          ...authError,
          originalMessage: error?.message,
        },
      };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const userDataForLogging = {
      email,
      userType: userData?.user_type,
      fullName: userData?.full_name,
    };

    const errorContext = createErrorContext("AuthContext", "signup");

    try {
      // Use retry mechanism for signup operation
      const result = await retryAuthOperation(
        async () => {
          console.log("🔐 Attempting user signup:", {
            email: email.split("@")[0] + "@***",
            userType: userData?.user_type,
            timestamp: new Date().toISOString(),
          });

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: userData,
            },
          });

          if (error) {
            throw error;
          }

          return { data, error: null };
        },
        "signup",
        userDataForLogging,
        2, // maxRetries
        1000 // delay
      );

      // Log successful signup
      if (result.data?.user) {
        logAuthSuccess(
          "signup",
          {
            ...userDataForLogging,
            userId: result.data.user.id,
          },
          {
            confirmedAt: result.data.user.email_confirmed_at,
            createdAt: result.data.user.created_at,
            hasProfileTrigger: true, // Database trigger should create profile
          }
        );

        console.log(
          "✅ User created successfully, profile should be created by database trigger",
          {
            userId: result.data.user.id,
            email: email.split("@")[0] + "@***",
            userType: userData?.user_type,
          }
        );
      }

      return result;
    } catch (error: any) {
      // Enhanced error logging with categorization
      const authError = categorizeAuthError(
        error,
        "signup",
        userDataForLogging
      );
      logAuthError(authError, {
        context: errorContext,
        signupAttempt: {
          email: email.split("@")[0] + "@***",
          userType: userData?.user_type,
          hasPassword: !!password,
          passwordLength: password?.length,
        },
        supabaseError: {
          message: error?.message,
          status: error?.status,
          code: error?.code,
        },
      });

      // Return categorized error with user-friendly message
      return {
        error: {
          ...authError,
          originalMessage: error?.message, // Keep original for debugging
        },
      };
    }
  };

  const signOut = async () => {
    const errorContext = createErrorContext("AuthContext", "signout");
    const currentUserId = user?.id;
    const currentUserType = user?.user_metadata?.user_type;

    try {
      console.log("🔐 Attempting user signout:", {
        userId: currentUserId,
        email: user?.email ? user.email.split("@")[0] + "@***" : undefined,
        userType: currentUserType,
        timestamp: new Date().toISOString(),
      });

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Clear all caches on signout
      clearAuthCache();

      // Log successful signout
      logAuthSuccess(
        "signout",
        {
          userId: currentUserId,
          email: user?.email,
          userType: currentUserType,
        },
        {
          sessionEndedAt: new Date().toISOString(),
          cacheCleared: true,
        }
      );

      console.log("✅ User signed out successfully", {
        userId: currentUserId,
        userType: currentUserType,
        cacheCleared: true,
      });
    } catch (error: any) {
      // Enhanced error logging with categorization
      const authError = categorizeAuthError(error, "signout", {
        userId: currentUserId,
        email: user?.email,
        userType: currentUserType,
      });

      logAuthError(authError, {
        context: errorContext,
        signoutAttempt: {
          userId: currentUserId,
          userType: currentUserType,
        },
        supabaseError: {
          message: error?.message,
          status: error?.status,
          code: error?.code,
        },
      });

      // For signout, we don't throw the error to avoid blocking the UI
      // but we still log it for debugging
      console.error("Error during signout (logged):", authError.userMessage);
    }
  };

  const resetPassword = async (email: string) => {
    const userDataForLogging = { email };
    const errorContext = createErrorContext("AuthContext", "reset_password");

    try {
      console.log("🔐 Attempting password reset:", {
        email: email.split("@")[0] + "@***",
        timestamp: new Date().toISOString(),
      });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      // Log successful password reset request
      logAuthSuccess("reset_password", userDataForLogging, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
        emailSentAt: new Date().toISOString(),
      });

      console.log("✅ Password reset email sent successfully", {
        email: email.split("@")[0] + "@***",
      });

      return { error: null };
    } catch (error: any) {
      // Enhanced error logging with categorization
      const authError = categorizeAuthError(
        error,
        "reset_password",
        userDataForLogging
      );
      logAuthError(authError, {
        context: errorContext,
        resetAttempt: {
          email: email.split("@")[0] + "@***",
        },
        supabaseError: {
          message: error?.message,
          status: error?.status,
          code: error?.code,
        },
      });

      // Return categorized error with user-friendly message
      return {
        error: {
          ...authError,
          originalMessage: error?.message,
        },
      };
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user?.id) {
      console.log("🔄 AuthContext - Refreshing profile for user:", user.id);
      const userProfile = await fetchUserProfile(user.id, true); // Force refresh
      updateProfileState(userProfile);

      // Update cache with fresh data
      setAuthCache({
        user,
        session,
        profile: userProfile,
        userType: userProfile?.user_type || null,
      });
    }
  };

  const value = {
    user,
    session,
    profile,
    userType,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
