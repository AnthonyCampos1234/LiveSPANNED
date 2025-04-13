import { supabase, BettingQuestion, BettingOption, UserBet, UserFavorite, Notification } from '@/lib/supabase';

export const bettingService = {
  // Get all active betting questions with their options
  async getActiveBettingQuestions(): Promise<{ questions: BettingQuestion[]; error: any }> {
    try {
      console.log('Fetching active betting questions from Supabase...');
      
      const { data, error } = await supabase
        .from('betting_questions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching betting questions:', error);
        return { questions: [], error };
      }
      
      if (!data || data.length === 0) {
        console.log('No active betting questions found');
        return { questions: [], error: null };
      }
      
      console.log('Successfully fetched betting questions, count:', data.length);
      
      // Get options for all questions
      const questions = [...data] as BettingQuestion[];
      
      // If there are no questions, return early
      if (questions.length === 0) {
        return { questions, error: null };
      }
      
      // Get all options for these questions in one query
      const questionIds = questions.map(q => q.id);
      console.log('Fetching options for question IDs:', questionIds);
      
      const { data: optionsData, error: optionsError } = await supabase
        .from('betting_options')
        .select('*')
        .in('question_id', questionIds);
      
      if (optionsError) {
        console.error('Error fetching betting options:', optionsError);
        return { questions, error: optionsError };
      }
      
      if (!optionsData || optionsData.length === 0) {
        console.log('No options found for these questions');
      } else {
        console.log('Successfully fetched betting options, count:', optionsData.length);
        
        // Assign options to their respective questions
        for (const question of questions) {
          question.options = optionsData.filter(
            option => option.question_id === question.id
          ) as BettingOption[];
        }
      }
      
      return { questions, error: null };
    } catch (err) {
      console.error('Unexpected error in getActiveBettingQuestions:', err);
      return { questions: [], error: err };
    }
  },

  // Get a specific betting question with its options
  async getBettingQuestionWithOptions(questionId: string): Promise<{ 
    question: BettingQuestion | null; 
    options: BettingOption[]; 
    error: any 
  }> {
    // Get the question
    const { data: questionData, error: questionError } = await supabase
      .from('betting_questions')
      .select('*')
      .eq('id', questionId)
      .single();
      
    if (questionError) {
      return { question: null, options: [], error: questionError };
    }
    
    // Get the options for this question
    const { data: optionsData, error: optionsError } = await supabase
      .from('betting_options')
      .select('*')
      .eq('question_id', questionId)
      .order('created_at');
      
    if (optionsError) {
      return { question: questionData as BettingQuestion, options: [], error: optionsError };
    }
    
    return { 
      question: questionData as BettingQuestion, 
      options: optionsData as BettingOption[],
      error: null
    };
  },

  // Place a bet
  async placeBet(userId: string, questionId: string, optionId: string, amount: number): Promise<{ bet: UserBet | null; error: any }> {
    console.log(`Placing bet: user=${userId}, question=${questionId}, option=${optionId}, amount=${amount}`);
    
    // Check if this is a local question (not in Supabase)
    // Local questions have a 'local-' prefix in their IDs
    const isLocalQuestion = questionId.startsWith('local-');
    
    if (isLocalQuestion) {
      console.log('This is a locally generated question. Using local bet handling.');
      // For local questions, don't try to interact with the database at all
      // These will be handled at the app level in BettingContext
      
      // Create a mock bet response
      const mockBet: UserBet = {
        id: `local-${Date.now()}`,
        user_id: userId,
        question_id: questionId,
        option_id: optionId,
        amount: amount,
        potential_payout: amount * 2.0, // Use standard 2.0 odds for local bets
        is_settled: false,
        created_at: new Date().toISOString()
      };
      
      return { bet: mockBet, error: null };
    }
    
    // For database questions, continue with the normal flow
    console.log('Placing database bet, checking option details...');
    let odds = 2.0;
    
    try {
      // Get the selected option to calculate potential payout
      const { data: optionData, error: optionError } = await supabase
        .from('betting_options')
        .select('*')
        .eq('id', optionId)
        .single();
          
      if (optionError) {
        console.error('Error fetching option data:', optionError);
        return { bet: null, error: optionError };
      } else if (optionData) {
        odds = (optionData as BettingOption).odds;
        console.log(`Found option with odds: ${odds}`);
      }
    } catch (err) {
      console.error('Error in odds calculation:', err);
      return { bet: null, error: err };
    }
      
    // For database bets only - local bets are handled above and return early
    // Calculate potential payout with the odds we determined
    const potentialPayout = amount * odds;
    console.log(`Calculated potential payout: ${potentialPayout} (${amount} x ${odds})`);
    
    // Begin a transaction to update user balance and create bet
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user balance:', userError);
      return { bet: null, error: userError };
    }
    
    const currentBalance = (userData as any).balance;
    
    if (currentBalance < amount) {
      console.error(`Insufficient funds: balance ${currentBalance}, bet amount ${amount}`);
      return { bet: null, error: { message: 'Insufficient funds' } };
    }
    
    // Update user balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ balance: currentBalance - amount })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating user balance:', updateError);
      return { bet: null, error: updateError };
    }
    
    // Create the bet record in the database
    try {
      console.log('Creating bet record in database...');
      const { data: betData, error: betError } = await supabase
        .from('user_bets')
        .insert({
          user_id: userId,
          question_id: questionId,
          option_id: optionId,
          amount,
          potential_payout: potentialPayout,
          is_settled: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (betError) {
        console.error('Error creating bet:', betError);
        // Rollback the balance change if bet creation fails
        console.log('Rolling back balance change...');
        await supabase
          .from('profiles')
          .update({ balance: currentBalance })
          .eq('id', userId);
          
        return { bet: null, error: betError };
      }
      
      console.log('Successfully placed bet:', betData);
      return { bet: betData as UserBet, error: null };
    } catch (err) {
      console.error('Unexpected error in bet creation:', err);
      // Rollback the balance change
      console.log('Rolling back balance change due to unexpected error...');
      await supabase
        .from('profiles')
        .update({ balance: currentBalance })
        .eq('id', userId);
      
      return { bet: null, error: err };
    }

  },

  // Get user's bets
  async getUserBets(userId: string): Promise<{ bets: UserBet[]; error: any }> {
    try {
      console.log(`Fetching bets for user: ${userId}`);
      const { data, error } = await supabase
        .from('user_bets')
        .select(`
          *,
          betting_questions(*),
          betting_options(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching user bets:', error);
      } else {
        console.log(`Successfully fetched ${data?.length || 0} bets from database`);
      }
      
      return { bets: data as UserBet[] || [], error };
    } catch (err) {
      console.error('Unexpected error fetching user bets:', err);
      return { bets: [], error: err };
    }
  },

  // Toggle favorite status for a betting question
  async toggleFavorite(userId: string, questionId: string): Promise<{ isFavorite: boolean; error: any }> {
    // Check if already favorited
    const { data: existingData, error: checkError } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle();
      
    if (checkError) {
      return { isFavorite: false, error: checkError };
    }
    
    let isFavorite = false;
    let error = null;
    
    if (existingData) {
      // Remove from favorites
      const { error: removeError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', existingData.id);
      
      error = removeError;
      isFavorite = false;
    } else {
      // Add to favorites
      const { error: addError } = await supabase
        .from('user_favorites')
        .insert({
          user_id: userId,
          question_id: questionId,
          created_at: new Date().toISOString()
        });
      
      error = addError;
      isFavorite = true;
    }
    
    return { isFavorite, error };
  },

  // Get user's favorite betting questions
  async getUserFavorites(userId: string): Promise<{ favorites: BettingQuestion[]; error: any }> {
    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        question_id,
        betting_questions:betting_questions!inner(*)
      `)
      .eq('user_id', userId);
      
    if (error) {
      return { favorites: [], error };
    }
    
    // First convert the complex nested structure to an array of simple objects
    const favorites = data.map(item => {
      // We need to cast the item to any to access the nested structure
      const question = (item as any).betting_questions;
      
      // Ensure type safety by including all required properties
      return {
        id: question.id,
        question: question.question,
        time_remaining: question.time_remaining,
        start_time: question.start_time,
        end_time: question.end_time,
        is_active: question.is_active,
        is_hot: question.is_hot,
        created_at: question.created_at,
        options: question.options
      } as BettingQuestion;
    });
    
    return { favorites, error: null };
  },

  // Toggle notification settings for a betting question
  async toggleNotification(userId: string, questionId: string): Promise<{ isEnabled: boolean; error: any }> {
    // Check if notification setting exists
    const { data: existingData, error: checkError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle();
      
    if (checkError) {
      return { isEnabled: false, error: checkError };
    }
    
    let isEnabled = false;
    let error = null;
    
    if (existingData) {
      // Update existing notification setting
      const newEnabledState = !existingData.enabled;
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ enabled: newEnabledState })
        .eq('id', existingData.id);
      
      error = updateError;
      isEnabled = newEnabledState;
    } else {
      // Create new notification setting (enabled by default)
      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          question_id: questionId,
          enabled: true,
          created_at: new Date().toISOString()
        });
      
      error = insertError;
      isEnabled = true;
    }
    
    return { isEnabled, error };
  },

  // Get user's notification settings
  async getUserNotifications(userId: string): Promise<{ notifications: Notification[]; error: any }> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('enabled', true);
      
    return { notifications: data as Notification[] || [], error };
  }
};
