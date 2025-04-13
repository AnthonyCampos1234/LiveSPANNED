import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '@/lib/supabase';
import { authService } from '@/services/authService';
import { toast } from '@/components/ui/use-toast';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUserData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  refreshUserData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to reload user data (exposed to be called from outside)
  const refreshUserData = async () => {
    setLoading(true);
    const { user, error } = await authService.getCurrentUser();
    
    if (user) {
      setUser(user);
      console.log('User data refreshed, balance:', user.balance);
    } else if (error && error.message !== 'Session not found') {
      console.error('Auth error:', error);
      toast({
        title: 'Authentication Error',
        description: error.message,
        variant: 'destructive',
      });
    }
    
    setLoading(false);
  };

  // Initial load of user data
  useEffect(() => {
    refreshUserData();
    
    // Set up periodic refresh every 30 seconds to keep balance up to date
    const refreshInterval = setInterval(() => {
      if (user) {
        refreshUserData();
      }
    }, 30000);
    
    return () => clearInterval(refreshInterval);
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const { user: freshUser } = await authService.getCurrentUser();
        setUser(freshUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Sign up
  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    const { user, error } = await authService.signUp(email, password, username);
    
    if (error) {
      toast({
        title: 'Sign Up Failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } else {
      toast({
        title: 'Sign Up Successful',
        description: 'Your account has been created successfully!',
      });
      setUser(user);
    }
    
    setLoading(false);
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { user, error } = await authService.signIn(email, password);
    
    if (error) {
      toast({
        title: 'Sign In Failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } else {
      toast({
        title: 'Welcome Back',
        description: `You're now signed in as ${user?.username || email}`,
      });
      setUser(user);
    }
    
    setLoading(false);
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    const { error } = await authService.signOut();
    
    if (error) {
      toast({
        title: 'Sign Out Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out',
      });
      setUser(null);
    }
    
    setLoading(false);
  };

  // Update profile
  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    setLoading(true);
    const { user: updatedUser, error } = await authService.updateProfile(user.id, updates);
    
    if (error) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
      setUser(updatedUser);
    }
    
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Missing import for supabase
import { supabase } from '@/lib/supabase';
