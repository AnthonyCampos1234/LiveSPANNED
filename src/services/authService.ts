import { supabase, User } from '@/lib/supabase';

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, username: string): Promise<{ user: User | null; error: any }> {
    // Store username in user metadata to avoid RLS issues with profile creation
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: username, // Also store as full_name for flexibility
        }
      }
    });

    if (error) {
      return { user: null, error };
    }
    
    // No direct profile creation - instead, create a simulated user object
    // that contains the expected data structure but doesn't require database insertion
    if (data.user) {
      // Using the user data we already have + adding balance
      const simulatedUser: User = {
        id: data.user.id,
        email: email,
        username: username,
        balance: 1000, // Default starting balance
        created_at: new Date().toISOString(),
      };
      
      return { user: simulatedUser, error: null };
    }

    return { user: null, error: { message: 'User creation failed' } };
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: User | null; error: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error };
    }

    // Try to get user profile if it exists
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // If we successfully got profile data, use it
      if (!profileError && profileData) {
        return { user: profileData as User, error: null };
      }
    } catch (profileErr) {
      console.log('Profile fetch error (expected for first-time users):', profileErr);
    }

    // If we don't have a profile yet, use auth metadata
    const username = data.user.user_metadata.username || email.split('@')[0];
    
    // Create a simulated user object from auth data
    const simulatedUser: User = {
      id: data.user.id,
      email: email,
      username: username,
      balance: 1000, // Default balance
      created_at: new Date().toISOString(),
    };
    
    return { user: simulatedUser, error: null };
  },

  // Sign out
  async signOut(): Promise<{ error: any }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user with profile data
  async getCurrentUser(): Promise<{ user: User | null; error: any }> {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      return { user: null, error: sessionError };
    }
    
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionData.session.user.id)
      .single();
      
    if (userError) {
      return { user: null, error: userError };
    }
    
    return { user: userData as User, error: null };
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<User>): Promise<{ user: User | null; error: any }> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
      
    return { user: data as User, error };
  },
};
