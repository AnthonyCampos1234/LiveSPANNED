import React, { createContext, useState, useEffect, useContext } from 'react';
import { BettingQuestion, BettingOption, UserBet } from '@/lib/supabase';
import { bettingService } from '@/services/bettingService';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';
import BetResultModal from '@/components/BetResultModal';
import { questionScheduler } from '@/services/schedulerService';
import { authService } from '@/services/authService';

type BettingContextType = {
  questions: BettingQuestion[];
  userBets: UserBet[];
  favorites: string[];
  notifications: string[];
  loading: boolean;
  loadingBets: boolean;
  refreshQuestions: () => Promise<void>;
  refreshUserBets: () => Promise<void>;
  placeBet: (questionId: string, optionId: string, amount: number) => Promise<boolean>;
  toggleFavorite: (questionId: string) => Promise<void>;
  toggleNotification: (questionId: string) => Promise<void>;
  isFavorite: (questionId: string) => boolean;
  isNotificationEnabled: (questionId: string) => boolean;
};

const BettingContext = createContext<BettingContextType>({
  questions: [],
  userBets: [],
  favorites: [],
  notifications: [],
  loading: true,
  loadingBets: true,
  refreshQuestions: async () => {},
  refreshUserBets: async () => {},
  placeBet: async () => false,
  toggleFavorite: async () => {},
  toggleNotification: async () => {},
  isFavorite: () => false,
  isNotificationEnabled: () => false,
});

export const useBetting = () => useContext(BettingContext);

export const BettingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUserData } = useAuth();
  const [questions, setQuestions] = useState<BettingQuestion[]>([]);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [localBets, setLocalBets] = useState<UserBet[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBets, setLoadingBets] = useState(true);
  
  // Bet result modal state - critical for showing bet outcomes
  const [betResultModalOpen, setBetResultModalOpen] = useState(false);
  const [betResult, setBetResult] = useState<{
    win: boolean;
    amount: number;
    questionText: string;
    optionText: string;
    payout?: number;
  } | null>(null);
  
  // Used to ensure the modal renders properly
  const forceRender = useState({})[1];

  // Load questions
  const refreshQuestions = async () => {
    setLoading(true);
    console.log('Refreshing questions...');
    try {
      const { questions: fetchedQuestions, error } = await bettingService.getActiveBettingQuestions();
      
      if (error) {
        console.error('Error fetching questions:', error);
        // Use locally generated questions instead
        await useLocallyGeneratedQuestions();
      } else if (!fetchedQuestions || fetchedQuestions.length === 0) {
        console.log('No questions found in database. Using generated questions instead.');
        // Use locally generated questions if none in DB
        await useLocallyGeneratedQuestions();
      } else {
        console.log('Questions fetched successfully:', fetchedQuestions.length);
        setQuestions(fetchedQuestions);
      }
    } catch (err) {
      console.error('Unexpected error in refreshQuestions:', err);
      // Fallback to generated questions
      await useLocallyGeneratedQuestions();
    } finally {
      setLoading(false);
    }
  };
  
  // Generate and use local questions when DB has none
  const useLocallyGeneratedQuestions = async () => {
    try {
      console.log('Generating local questions immediately to avoid loading screen');
      
      // First, immediately generate and use mock questions to get past loading screen
      const immediateQuestions = questionScheduler.generateQuestionsImmediately();
      console.log('Using immediate mock questions:', immediateQuestions.length);
      
      // Set questions and force loading to false with timeout to ensure UI updates
      setQuestions(immediateQuestions);
      setLoading(false); // Force loading to false to exit loading screen
      
      // Extra timeout to ensure loading state is updated
      setTimeout(() => {
        console.log('Delayed loading false check - current loading state:', loading);
        setLoading(false); // Double ensure loading is false
      }, 500);
      
      // Then configure scheduler for future refreshes
      questionScheduler.setCallbacks({
        onQuestionsGenerated: (generatedQuestions) => {
          console.log('Using newly generated questions:', generatedQuestions.length);
          setQuestions(generatedQuestions);
          setLoading(false); // Ensure loading is false after questions are updated
        },
        onError: (error) => {
          console.error('Error generating questions:', error);
          setLoading(false); // Ensure loading is false even on error
          toast({
            title: 'Error',
            description: 'Failed to generate betting questions',
            variant: 'destructive',
          });
        }
      });
      
      // Start the scheduler if it's not already running
      questionScheduler.start();
    } catch (err) {
      console.error('Error setting up question generation:', err);
      
      // Even if there's an error, use mock questions to avoid loading screen
      const immediateQuestions = questionScheduler.generateQuestionsImmediately();
      setQuestions(immediateQuestions);
      setLoading(false);
      
      // Extra timeout to ensure loading state is updated
      setTimeout(() => {
        console.log('Error recovery - forcing loading false again');
        setLoading(false); // Double ensure loading is false
      }, 500);
      
      toast({
        title: 'Using Demo Questions',
        description: 'Using demo questions due to data loading issues',
        variant: 'default',
      });
    }
  };

  // Load user bets
  const refreshUserBets = async () => {
    if (!user) {
      setUserBets([]);
      setFavorites([]);
      setNotifications([]);
      setLoadingBets(false);
      return;
    }
    
    setLoadingBets(true);
    
    // Fetch user bets
    const { bets, error: betsError } = await bettingService.getUserBets(user.id);
    if (betsError) {
      console.error('Error fetching user bets:', betsError);
    } else {
      setUserBets(bets);
    }
    
    // Fetch user favorites
    const { favorites: favQuestions, error: favError } = await bettingService.getUserFavorites(user.id);
    if (favError) {
      console.error('Error fetching favorites:', favError);
    } else {
      setFavorites(favQuestions.map(q => q.id));
    }
    
    // Fetch user notifications
    const { notifications: userNotifications, error: notifError } = await bettingService.getUserNotifications(user.id);
    if (notifError) {
      console.error('Error fetching notifications:', notifError);
    } else {
      setNotifications(userNotifications.map(n => n.question_id));
    }
    
    setLoadingBets(false);
  };

  // Initial load
  useEffect(() => {
    // Start generating local questions immediately to prevent loading screen
    useLocallyGeneratedQuestions();
    
    // Also try to fetch from database in the background
    refreshQuestions();
    
    // Set up outcome calculation handlers
    questionScheduler.setCallbacks({
      onQuestionsGenerated: (generatedQuestions) => {
        console.log('New questions generated:', generatedQuestions.length);
        setQuestions(prevQuestions => {
          // Add new questions while keeping existing ones
          const existingIds = new Set(prevQuestions.map(q => q.id));
          const newQuestions = generatedQuestions.filter(q => !existingIds.has(q.id));
          return [...prevQuestions, ...newQuestions];
        });
      },
      onQuestionsExpired: (expiredQuestions) => {
        console.log('Questions expired:', expiredQuestions.length);
        // Update the questions to show as inactive
        setQuestions(prevQuestions => {
          return prevQuestions.map(q => {
            const expiredQ = expiredQuestions.find(eq => eq.id === q.id);
            if (expiredQ) {
              return { ...q, is_active: false };
            }
            return q;
          });
        });
      },
      onOutcomesCalculated: (processedQuestions, winners) => {
        console.log('⚡️ IMMEDIATE OUTCOME CALCULATION ⚡️ for questions:', processedQuestions.length);
        
        // URGENT FIX: Always force update the UI state first
        console.log(`🚨 OUTCOME CALCULATION TRIGGERED for ${processedQuestions.length} questions 🚨`);
        console.log('Question IDs:', JSON.stringify(processedQuestions.map(q => q.id)));
        console.log('Winners:', JSON.stringify(Object.keys(winners)));
        
        // Force flush any pending state updates
        forceRender({});
        
        // Always check local bets first since they are the most recent
        let showBetResultModal = false;
        let betResultData = null;
        
        // Check for user bets that need outcome notification
        if (user) {
          // CRITICAL: Create a clean merged list of all bets
          // Include both database bets and local bets to ensure we catch all user bets
          const allUserBets = [...userBets, ...localBets];
          console.log(`⚠️ CHECKING ALL USER BETS: ${allUserBets.length} total bets`);
          console.log('Local bets:', JSON.stringify(localBets.map(b => ({ id: b.id, question: b.question_id }))));
          
          // Loop through each processed question to check for matching bets
          for (const question of processedQuestions) {
            console.log(`Checking question: ${question.id} - ${question.question}`);
            
            // Find any bets the user placed on this specific question
            const matchingBets = allUserBets.filter(bet => bet.question_id === question.id);
            console.log(`Found ${matchingBets.length} bets for question ${question.id}`);
            
            if (matchingBets.length > 0) {
              // Use the most recent bet for this question
              const bet = matchingBets[matchingBets.length - 1];
              
              // Find selected option and winning option
              const selectedOption = question.options?.find(o => o.id === bet.option_id);
              const winningOptionId = winners[question.id]?.id;
              const winningOption = question.options?.find(o => o.id === winningOptionId);
              
              if (selectedOption && winningOption) {
                const win = selectedOption.id === winningOption.id;
                const payout = win ? bet.amount * (selectedOption.odds || 1) : 0;
                
                console.log(`🎰 BET RESULT FOUND! 🎰`);
                console.log(`- Question: ${question.question}`);
                console.log(`- Bet on: ${selectedOption.text} (odds: ${selectedOption.odds})`);
                console.log(`- Winner: ${winningOption.text}`);
                console.log(`- Result: ${win ? '✅ WIN' : '❌ LOSS'}, Amount: $${bet.amount}, Payout: $${payout}`);
                
                // Prepare bet result data for modal
                betResultData = {
                  win,
                  amount: bet.amount,
                  questionText: question.question,
                  optionText: selectedOption.text,
                  payout: win ? payout : undefined
                };
                
                showBetResultModal = true;
                
                // Break after finding the first bet with a result - we'll show one at a time
                break;
              }
            }
          }
        }
        
        // Now update questions with winners
        setQuestions(prevQuestions => {
          return prevQuestions.map(q => {
            if (winners[q.id]) {
              // Update the options to mark the winner
              return {
                ...q,
                is_active: false,
                options: q.options?.map(opt => ({
                  ...opt,
                  is_winner: winners[q.id]?.id === opt.id
                }))
              };
            }
            return q;
          });
        });
        
        // CRITICAL: Show bet result modal IMMEDIATELY if we have results
        if (showBetResultModal && betResultData) {
          console.log('🔴 DISPLAYING BET RESULT MODAL - URGENT PRIORITY 🔴');
          
          // Force bet result modal to open with direct state updates
          setBetResult(betResultData);
          setBetResultModalOpen(false); // Reset first to ensure state change is detected
          
          // Use multiple update cycles with increasing timeouts to maximize chances of modal showing
          setTimeout(() => {
            console.log('🔔 FORCING BET RESULT MODAL - ATTEMPT 1');
            setBetResultModalOpen(true);
            forceRender({}); // Force component to re-render
            
            // Add additional attempts with increasing delays
            setTimeout(() => {
              console.log('🔔 FORCING BET RESULT MODAL - ATTEMPT 2');
              setBetResultModalOpen(true);
              forceRender({});
              
              setTimeout(() => {
                console.log('🔔 FORCING BET RESULT MODAL - ATTEMPT 3');
                setBetResultModalOpen(true);
                forceRender({});
              }, 500);
            }, 250);
          }, 50);
        }
        
        // Refresh user bets to update statuses and potential winnings
        refreshUserBets();
        
        // Refresh user data to update balance after outcomes are calculated
        if (user) {
          refreshUserData();
        }
        
        // Show notification about outcome calculation only if we're not showing the modal
        // This prevents overwhelming the user with too many notifications
        if (!showBetResultModal) {
          toast({
            title: "Outcomes Calculated",
            description: `Results for ${processedQuestions.length} betting questions have been determined!`,
            variant: "default",
          });
        }
      },
      onError: (error) => {
        console.error('Error in question scheduler:', error);
        toast({
          title: 'Error',
          description: 'There was an error processing betting data',
          variant: 'destructive',
        });
      }
    });
  }, []);

  // Load user-specific data when user changes
  useEffect(() => {
    refreshUserBets();
  }, [user]);

  // Extract the checkLocalExpiredQuestions function to make it callable from event handlers
  const checkLocalExpiredQuestions = () => {
    console.log('🔍 FORCED LOCAL CHECK for expired questions with bets');
    const now = new Date();
    const expiredQuestions = questions.filter(q => 
      q.is_active && new Date(q.end_time) <= now
    );
    
    if (expiredQuestions.length > 0) {
      console.log(`Processing ${expiredQuestions.length} expired questions locally`);
      console.log('Question IDs:', expiredQuestions.map(q => q.id).join(', '));
      
      // Force modal display if user has placed bets on any expired questions
      const allUserBets = [...userBets, ...localBets];
      const expiredWithBets = expiredQuestions.filter(q => 
        allUserBets.some(bet => bet.question_id === q.id)
      );
      
      if (expiredWithBets.length > 0) {
        console.log(`🎲 Found ${expiredWithBets.length} expired questions with user bets!`);
        
        // Process outcomes for those questions
        const updatedQuestions = [...questions];
        const winners: Record<string, BettingOption> = {};
        
        expiredWithBets.forEach(question => {
          const qIndex = updatedQuestions.findIndex(q => q.id === question.id);
          if (qIndex === -1 || !updatedQuestions[qIndex].options) return;
          
          // Randomly select a winner
          const options = updatedQuestions[qIndex].options || [];
          const winnerIndex = Math.floor(Math.random() * options.length);
          const winningOption = options[winnerIndex];
          
          // Update the option to mark it as a winner
          updatedQuestions[qIndex].is_active = false;
          updatedQuestions[qIndex].options = options.map((opt, i) => ({
            ...opt,
            is_winner: i === winnerIndex
          }));
          
          winners[question.id] = winningOption;
          
          // Process any user bets for this question
          const userBetsForQuestion = allUserBets.filter(bet => bet.question_id === question.id);
          if (userBetsForQuestion.length > 0) {
            const latestBet = userBetsForQuestion[userBetsForQuestion.length - 1];
            const betOption = question.options?.find(o => o.id === latestBet.option_id);
            
            if (betOption) {
              const win = betOption.id === winningOption.id;
              const payout = win ? latestBet.amount * (betOption.odds || 1) : 0;
              
              // Set bet result data for showing the modal
              setBetResult({
                win,
                amount: latestBet.amount,
                questionText: question.question,
                optionText: betOption.text,
                payout: win ? payout : undefined
              });
              
              // Force modal to display
              setBetResultModalOpen(false);
              setTimeout(() => {
                setBetResultModalOpen(true);
                console.log('🛑 FORCED BET RESULT MODAL FROM LOCAL CHECK');
                
                // Force re-render to update UI
                forceRender({});
              }, 100);
            }
          }
        });
        
        // Update questions with outcome results
        setQuestions(updatedQuestions);
      }
    }
  };
  
  // CRITICAL: This local outcome checking is a backup in case the scheduler fails
  // Handle question expiration and outcome calculation - but only for local questions
  useEffect(() => {
    const checkExpiredQuestions = () => {
      console.log('🔎 Regular component check for expired questions');
      const now = new Date();
      const expiredQuestions = questions.filter(q => 
        q.is_active && new Date(q.end_time) <= now
      );
      
      if (expiredQuestions.length > 0) {
        console.log(`Processing ${expiredQuestions.length} expired questions`);
        
        // For each expired question, determine a winner (randomly for local questions)
        const updatedQuestions = [...questions];
        const winners: Record<string, BettingOption> = {};
        
        expiredQuestions.forEach(question => {
          // Find the question index
          const qIndex = updatedQuestions.findIndex(q => q.id === question.id);
          if (qIndex === -1 || !updatedQuestions[qIndex].options) return;
          
          // Randomly select a winner
          const options = updatedQuestions[qIndex].options || [];
          const winnerIndex = Math.floor(Math.random() * options.length);
          const winningOption = options[winnerIndex];
          
          // Update the option to mark it as a winner
          updatedQuestions[qIndex].is_active = false;
          updatedQuestions[qIndex].options = options.map((opt, i) => ({
            ...opt,
            is_winner: i === winnerIndex
          }));
          
          winners[question.id] = winningOption;
          
          // Process any local bets for this question
          processLocalBets(question.id, winningOption.id, winningOption.odds || 2.0);
        });
        
        // Update questions in state
        setQuestions(updatedQuestions);
        
        // Show a notification about the outcome
        if (expiredQuestions.length > 0) {
          toast({
            title: "Outcomes Calculated",
            description: `Results for ${expiredQuestions.length} betting questions have been determined!`,
          });
        }
      }
    };
    
    // Process local bets for a question with a winning option
    const processLocalBets = (questionId: string, winningOptionId: string, odds: number) => {
      setLocalBets(prev => {
        const updatedBets = prev.map(bet => {
          if (bet.question_id === questionId) {
            const isWinner = bet.option_id === winningOptionId;
            const payout = isWinner ? bet.amount * odds : 0;
            
            // If bet is a winner, update user balance
            if (isWinner && user) {
              // Update user balance with winnings
              const newBalance = user.balance + payout;
              authService.updateProfile(user.id, { balance: newBalance })
                .then(() => refreshUserData())
                .catch(err => console.error('Error updating balance:', err));
            }
            
            return {
              ...bet,
              is_settled: true
            };
          }
          return bet;
        });
        
        return updatedBets;
      });
    };
    
    // Check every 15 seconds
    const interval = setInterval(checkExpiredQuestions, 15000);
    return () => clearInterval(interval);
  }, [questions, user]);

  // Place a bet on a question
  const placeBet = async (questionId: string, optionId: string, amount: number): Promise<boolean> => {
    console.log(`Attempting to place bet: question=${questionId}, option=${optionId}, amount=${amount}`);
    
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to place bets',
        variant: 'destructive',
      });
      return false;
    }
    
    // Log question and option details to help debug bet outcomes
    const question = questions.find(q => q.id === questionId);
    if (question) {
      console.log(`Found question for bet: ${question.question} (${question.id})`);
      const option = question.options?.find(o => o.id === optionId);
      if (option) {
        console.log(`Selected option: ${option.text} (${option.id}) with odds ${option.odds}`);
      } else {
        console.warn(`Option not found: ${optionId} for question ${questionId}`);
      }
    } else {
      console.warn(`Question not found: ${questionId}`);
    }
    
    // Check if this is a locally generated question (frontend questions have 'local-' prefix)
    const isLocalQuestion = questionId.startsWith('local-');
    const isLocalOption = optionId.startsWith('local-');
    
    // Identify the specific type of local question
    let questionSource = 'database';
    if (isLocalQuestion) {
      if (questionId.includes('local-openai')) {
        questionSource = 'local-openai';
      } else if (questionId.includes('local-mock')) {
        questionSource = 'local-mock';
      } else {
        questionSource = 'local-scheduler';
      }
    }
    
    console.log(`Placing bet on ${questionSource} question: ${questionId}`);
    console.log(`Option ID: ${optionId} (${isLocalOption ? 'local' : 'database'})`);
    
    // Validate amount
    if (amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Bet amount must be greater than zero',
        variant: 'destructive',
      });
      return false;
    }
    
    // Check user balance
    if (user.balance < amount) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ${amount} credits but only have ${user.balance}`,
        variant: 'destructive',
      });
      return false;
    }
    
    // Process all questions that start with local- using our local betting system
    if (isLocalQuestion || isLocalOption) {
      // Handle locally (frontend) generated questions with local state
      try {
        // Get the question and option data
        const question = questions.find(q => q.id === questionId);
        if (!question) {
          toast({
            title: 'Bet Failed',
            description: 'Question not found',
            variant: 'destructive',
          });
          return false;
        }
        
        const option = question.options?.find(o => o.id === optionId);
        if (!option) {
          toast({
            title: 'Bet Failed',
            description: 'Option not found',
            variant: 'destructive',
          });
          return false;
        }
        
        // Create a local bet
        const now = new Date();
        const localBet: UserBet = {
          id: `local-${Date.now()}`,
          user_id: user.id,
          question_id: questionId,
          option_id: optionId,
          amount: amount,
          potential_payout: amount * (option.odds || 2.0),
          is_settled: false,
          created_at: now.toISOString()
        };
        
        console.log(`Creating local bet: id=${localBet.id}, question=${localBet.question_id}, option=${localBet.option_id}`);
        
        // Update local state - ensure we don't lose track of bets
        setLocalBets(prev => {
          const updatedBets = [...prev, localBet];
          console.log(`Updated local bets - now tracking ${updatedBets.length} bets`);
          return updatedBets;
        });
        
        // Update user balance locally
        const newBalance = user.balance - amount;
        await authService.updateProfile(user.id, { balance: newBalance });
        
        // Refresh user data to show updated balance
        await refreshUserData();
        
        toast({
          title: 'Bet Placed!',
          description: `You bet $${amount} on "${option.text}". Good luck!`,
        });
        
        return true;
      } catch (err) {
        console.error('Error placing local bet:', err);
        toast({
          title: 'Bet Failed',
          description: 'Failed to place bet',
          variant: 'destructive',
        });
        return false;
      }
    } else {
      // Handle database questions with Supabase
      const { bet, error } = await bettingService.placeBet(user.id, questionId, optionId, amount);
      
      if (error) {
        toast({
          title: 'Bet Failed',
          description: error.message || 'Failed to place bet',
          variant: 'destructive',
        });
        return false;
      } else {
        // Get the option text for the success message
        const question = questions.find(q => q.id === questionId);
        const option = question?.options?.find(o => o.id === optionId) || 
                      (await bettingService.getBettingQuestionWithOptions(questionId)).options
                        .find(o => o.id === optionId);
        
        toast({
          title: 'Bet Placed!',
          description: `You bet $${amount} on "${option?.text}". Good luck!`,
        });
        
        // Update user in auth context to reflect new balance
        if (user) {
          const newBalance = user.balance - amount;
          await authService.updateProfile(user.id, { balance: newBalance });
          
          // Refresh user data to show updated balance immediately
          await refreshUserData();
        }
        
        // Refresh user bets
        await refreshUserBets();
        return true;
      }
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (questionId: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to manage favorites',
        variant: 'destructive',
      });
      return;
    }
    
    const { isFavorite, error } = await bettingService.toggleFavorite(user.id, questionId);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update favorite status',
        variant: 'destructive',
      });
    } else {
      toast({
        title: isFavorite ? 'Added to Favorites' : 'Removed from Favorites',
        description: isFavorite ? 'Bet added to your favorites' : 'Bet removed from your favorites',
      });
      
      // Update local state
      if (isFavorite) {
        setFavorites([...favorites, questionId]);
      } else {
        setFavorites(favorites.filter(id => id !== questionId));
      }
    }
  };

  // Toggle notification status
  const toggleNotification = async (questionId: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to manage notifications',
        variant: 'destructive',
      });
      return;
    }
    
    const { isEnabled, error } = await bettingService.toggleNotification(user.id, questionId);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notification status',
        variant: 'destructive',
      });
    } else {
      toast({
        title: isEnabled ? 'Notifications Enabled' : 'Notifications Disabled',
        description: isEnabled ? 'You will receive updates for this bet' : 'You won\'t receive updates for this bet',
      });
      
      // Update local state
      if (isEnabled) {
        setNotifications([...notifications, questionId]);
      } else {
        setNotifications(notifications.filter(id => id !== questionId));
      }
    }
  };

  // Check if a question is favorited
  const isFavorite = (questionId: string): boolean => {
    return favorites.includes(questionId);
  };

  // Check if notifications are enabled for a question
  const isNotificationEnabled = (questionId: string): boolean => {
    return notifications.includes(questionId);
  };

  // CRITICAL: Listen for question-expired events from BettingCard components
  useEffect(() => {
    const handleQuestionExpired = (event: Event) => {
      const customEvent = event as CustomEvent<{questionId: string, hasUserBet: boolean}>;
      const { questionId, hasUserBet } = customEvent.detail;
      console.log(`🔔 GLOBAL EVENT: Question expired - ${questionId}, Has user bet: ${hasUserBet}`);
      
      if (hasUserBet) {
        // Immediately force a check for expired questions with user bets
        console.log('🚨 FORCING IMMEDIATE OUTCOME CHECK due to expired question with user bet');
        
        // Call our local check function
        checkLocalExpiredQuestions();
        
        // Also try to call the scheduler's check function directly if available
        if (questionScheduler) {
          console.log('📡 Calling scheduler.checkExpiredQuestions() directly');
          questionScheduler.checkExpiredQuestions().catch(err => {
            console.error('Error calling scheduler.checkExpiredQuestions():', err);
          });
        }
        
        // DIRECT FORCE: If we know the user bet on this question, show the result modal immediately
        const allUserBets = [...userBets, ...localBets];
        const matchingBets = allUserBets.filter(bet => bet.question_id === questionId);
        
        if (matchingBets.length > 0 && questions.length > 0) {
          const bet = matchingBets[matchingBets.length - 1];
          const question = questions.find(q => q.id === questionId);
          
          if (question && question.options && question.options.length > 0) {
            console.log('💣 EMERGENCY BET RESULT DISPLAY - Direct force show');
            
            // Find the user's selected option
            const selectedOption = question.options.find(opt => opt.id === bet.option_id);
            
            // Choose a random winner
            const winnerIndex = Math.floor(Math.random() * question.options.length);
            const winningOption = question.options[winnerIndex];
            
            if (selectedOption) {
              const win = selectedOption.id === winningOption.id;
              const payout = win ? bet.amount * (selectedOption.odds || 1) : 0;
              
              // Set result data and show modal
              setBetResult({
                win,
                amount: bet.amount,
                questionText: question.question,
                optionText: selectedOption.text,
                payout: win ? payout : undefined
              });
              
              // Show modal with multiple attempts for reliability
              setBetResultModalOpen(false);
              setTimeout(() => {
                setBetResultModalOpen(true);
                console.log('📳 EMERGENCY BET RESULT MODAL SHOWN');
                forceRender({});
              }, 50);
            }
          }
        }
      }
    };
    
    // Add global event listener
    window.addEventListener('question-expired', handleQuestionExpired);
    console.log('💿 Event listener for question-expired has been registered');
    
    return () => {
      // Remove listener on cleanup
      window.removeEventListener('question-expired', handleQuestionExpired);
    };
  }, [questions, userBets, localBets]);

  return (
    <BettingContext.Provider
      value={{
        questions,
        userBets: [...userBets, ...localBets], // Include local bets in the returned value
        favorites,
        notifications,
        loading,
        loadingBets,
        refreshQuestions,
        refreshUserBets,
        placeBet,
        toggleFavorite,
        toggleNotification,
        isFavorite,
        isNotificationEnabled
      }}
    >
      {children}
      
      {/* Bet Result Modal - No conditional rendering to ensure it's always in the DOM */}
      <BetResultModal
        open={betResultModalOpen && betResult !== null}
        onClose={() => setBetResultModalOpen(false)}
        win={betResult?.win || false}
        amount={betResult?.amount || 0}
        questionText={betResult?.questionText || ''}
        optionText={betResult?.optionText || ''}
        payout={betResult?.payout}
      />
    </BettingContext.Provider>
  );
};
