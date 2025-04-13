import { supabase } from '@/lib/supabase';
import { BettingQuestion, BettingOption, UserBet } from '@/lib/supabase';
// Removed unused uuid import

// Type definition for callback function when in local-only mode
export type ExpiredQuestionsCallback = (questions: BettingQuestion[]) => Promise<void>;

// Function to calculate outcomes for expired questions
export const calculateOutcomes = async (
  localOnly: boolean = false,
  localCallback?: ExpiredQuestionsCallback
): Promise<void> => {
  try {
    // Get expired questions that are still active
    const now = new Date();
    
    let expiredQuestions: BettingQuestion[] = [];
    
    if (!localOnly) {
      // Get from Supabase
      const { data, error } = await supabase
        .from('betting_questions')
        .select('*, options:betting_options(*)')
        .eq('is_active', true)
        .lt('end_time', now.toISOString());
        
      if (error) throw error;
      expiredQuestions = data || [];
      
      // Process each expired question
      for (const question of expiredQuestions) {
        await determineWinnerAndProcessBets(question, localOnly);
      }
      
      console.log(`Successfully processed outcomes for ${expiredQuestions.length} expired questions.`);
    } else if (localCallback) {
      // In local-only mode, call the callback with the empty array
      // The app will be responsible for providing the questions
      await localCallback(expiredQuestions);
    } else {
      console.warn('Local-only mode requires a callback function');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error calculating outcomes:', error.message);
    } else {
      console.error('Unknown error calculating outcomes');
    }
    throw error; // Re-throw to allow calling code to handle the error
  }
};

// Determine winner and process bets for a question
export const determineWinnerAndProcessBets = async (
  question: BettingQuestion, 
  localOnly: boolean = false
): Promise<BettingOption | null> => {
  try {
    // Make sure the question has options
    if (!question.options || question.options.length === 0) {
      console.warn(`Question ${question.id} has no options to determine a winner.`);
      return null;
    }
    
    // Identify the type of question (local or database)
    const isLocalQuestion = question.id.startsWith('local-');
    let questionSource = 'database';
    
    if (isLocalQuestion) {
      if (question.id.includes('local-openai')) {
        questionSource = 'local-openai';
      } else if (question.id.includes('local-mock')) {
        questionSource = 'local-mock';
      } else {
        questionSource = 'local-scheduler';
      }
    }
    
    console.log(`Determining winner for ${questionSource} question: ${question.id}`);
    
    // Randomly select a winner from the options
    const winningIndex = Math.floor(Math.random() * question.options.length);
    const winningOption = question.options[winningIndex];
    
    if (!winningOption) {
      console.warn(`Failed to select winning option for question ${question.id}.`);
      return null;
    }
    
    // Local-only mode just returns the winner without updating database
    if (localOnly || isLocalQuestion) {
      console.log(`${questionSource} question: determined winner for question ${question.id} (${winningOption.text}).`);
      return winningOption;
    }
    
    console.log(`Determined winner for question "${question.question}": ${winningOption.text}`);
    
    if (!localOnly) {
      // Update the question to be inactive
      const { error: questionUpdateError } = await supabase
        .from('betting_questions')
        .update({ is_active: false })
        .eq('id', question.id);
        
      if (questionUpdateError) throw questionUpdateError;
      
      // Mark the winning option
      const { error: optionUpdateError } = await supabase
        .from('betting_options')
        .update({ is_winner: true })
        .eq('id', winningOption.id);
        
      if (optionUpdateError) throw optionUpdateError;
      
      // Mark all other options as losers
      const { error: otherOptionsUpdateError } = await supabase
        .from('betting_options')
        .update({ is_winner: false })
        .eq('question_id', question.id)
        .neq('id', winningOption.id);
        
      if (otherOptionsUpdateError) throw otherOptionsUpdateError;
      
      // Process bets for this question
      await processBetsForQuestion(question.id, winningOption.id, winningOption.odds);
    }
    
    return winningOption;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error determining winner for question ${question.id}:`, error.message);
    } else {
      console.error(`Unknown error determining winner for question ${question.id}`);
    }
    return null;
  }
};

// Process all bets for a question
export const processBetsForQuestion = async (
  questionId: string, 
  winningOptionId: string, 
  winningOdds: number
): Promise<void> => {
  try {
    // Get all bets for this question
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('question_id', questionId);
      
    if (betsError) throw betsError;
    
    if (!bets || bets.length === 0) {
      console.log(`No bets found for question ${questionId}`);
      return;
    }
    
    // Process each bet
    for (const bet of bets) {
      // Use the simulateLocalBetOutcome function to calculate the outcome
      const { newStatus, payout } = simulateLocalBetOutcome(bet, winningOptionId, winningOdds);
      
      // Update bet status
      const { error: betUpdateError } = await supabase
        .from('bets')
        .update({ 
          status: newStatus,
          payout: payout
        })
        .eq('id', bet.id);
        
      if (betUpdateError) throw betUpdateError;
      
      // If bet won, update user balance
      if (newStatus === 'won' && payout > 0) {
        const { error: profileError } = await supabase.rpc('add_to_balance', {
          user_id: bet.user_id,
          amount: payout
        });
        
        if (profileError) {
          console.error(`Failed to update balance for user ${bet.user_id}:`, profileError);
        } else {
          console.log(`Updated balance for user ${bet.user_id} with winnings of $${payout}`);
        }
      }
    }
    
    console.log(`Successfully processed ${bets.length} bets for question ${questionId}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error processing bets for question ${questionId}:`, error.message);
    } else {
      console.error(`Unknown error processing bets for question ${questionId}`);
    }
    throw error; // Re-throw to allow calling code to handle the error
  }
};

// Function to simulate/create a bet result locally
export const simulateLocalBetOutcome = (
  bet: UserBet,
  winningOptionId: string,
  winningOdds: number
): { newStatus: 'won' | 'lost'; payout: number } => {
  const isWinningBet = bet.option_id === winningOptionId;
  const newStatus = isWinningBet ? 'won' : 'lost';
  const payout = isWinningBet ? Math.round(bet.amount * winningOdds * 100) / 100 : 0;
  
  return { newStatus, payout };
};