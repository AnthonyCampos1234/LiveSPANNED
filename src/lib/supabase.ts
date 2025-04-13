import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our Supabase tables
export type User = {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  balance: number;
  created_at: string;
};

export type BettingQuestion = {
  id: string;
  question: string;
  time_remaining: number; // in seconds
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_hot: boolean;
  created_at: string;
  options?: BettingOption[]; // Added for UI convenience
};

export type BettingOption = {
  id: string;
  question_id: string;
  text: string;
  odds: number;
  is_winner: boolean | null;
  created_at: string;
};

export type UserBet = {
  id: string;
  user_id: string;
  question_id: string;
  option_id: string;
  amount: number;
  potential_payout: number;
  is_settled: boolean;
  created_at: string;
};

export type UserFavorite = {
  id: string;
  user_id: string;
  question_id: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  question_id: string;
  enabled: boolean;
  created_at: string;
};
