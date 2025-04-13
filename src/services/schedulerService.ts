import { generateBettingQuestions } from './openaiService';
import { calculateOutcomes, determineWinnerAndProcessBets } from './outcomeService';
import { supabase } from '@/lib/supabase';
import { BettingQuestion, BettingOption } from '@/lib/supabase';

// Interface for callbacks
interface SchedulerCallbacks {
  onQuestionsGenerated?: (questions: BettingQuestion[]) => void;
  onQuestionsExpired?: (questions: BettingQuestion[]) => void;
  onOutcomesCalculated?: (questions: BettingQuestion[], winners: Record<string, BettingOption>) => void;
  onError?: (error: any) => void;
}

class QuestionScheduler {
  private interval: number = 15 * 1000; // 15 seconds in milliseconds to match video segments
  private timerId: NodeJS.Timeout | null = null;
  private outcomeTimerId: NodeJS.Timeout | null = null;
  private callbacks: SchedulerCallbacks = {};
  private isRunning: boolean = false;
  private questionCount: number = 3; // Default number of questions to generate
  private useLocalOnly: boolean = false; // Whether to store questions in Supabase or just local state
  private activeQuestions: BettingQuestion[] = []; // Store active questions in memory for local mode
  
  // Initialize the scheduler
  constructor(options?: { 
    intervalMinutes?: number; 
    questionCount?: number;
    useLocalOnly?: boolean;
    callbacks?: SchedulerCallbacks 
  }) {
    if (options?.intervalMinutes) {
      this.interval = options.intervalMinutes * 60 * 1000;
    }
    
    if (options?.questionCount) {
      this.questionCount = options.questionCount;
    }
    
    if (options?.useLocalOnly !== undefined) {
      this.useLocalOnly = options.useLocalOnly;
    }
    
    if (options?.callbacks) {
      this.callbacks = options.callbacks;
    }
  }
  
  // Start the scheduler
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    
    this.generateQuestions();
    
    // Generate new questions based on interval
    this.timerId = setInterval(() => {
      this.generateQuestions();
    }, this.interval);
    
    // Check for outcomes precisely with the question interval
    // This ensures outcomes are calculated exactly when questions expire
    this.outcomeTimerId = setInterval(() => {
      console.log('Timer triggered: checking for expired questions...');
      this.checkExpiredQuestions();
    }, 10 * 1000); // Check for outcomes more frequently (every 10 seconds)
  }
  
  // Force generate questions immediately and return them (synchronous version)
  generateQuestionsImmediately(): BettingQuestion[] {
    // Create mock questions immediately without waiting for API
    console.log('Generating immediate mock questions to prevent loading screen');
    return this._getMockQuestionsSync(this.questionCount);
  }
  
  // Get mock questions synchronously without awaiting
  private _getMockQuestionsSync(count: number): BettingQuestion[] {
    // Add a 'local-' prefix to question IDs to mark them as locally generated
    const templates = [
      {
        question: "Will President Trump mention 'ending the war on coal' in his next remarks?",
        options: [
          { text: "Yes", odds: 1.3 },
          { text: "No", odds: 3.5 }
        ]
      },
      {
        question: "How many executive orders will President Trump sign during this event?",
        options: [
          { text: "1 order", odds: 3.0 },
          { text: "2 orders", odds: 1.8 },
          { text: "3 or more orders", odds: 2.5 }
        ]
      },
      {
        question: "Will the coal miners applaud after the next executive order is signed?",
        options: [
          { text: "Yes, enthusiastically", odds: 1.7 },
          { text: "Yes, modestly", odds: 2.2 },
          { text: "No applause", odds: 4.0 }
        ]
      },
      {
        question: "How many hand gestures will Trump make in the next segment?",
        options: [
          { text: "0-3 gestures", odds: 3.0 },
          { text: "4-7 gestures", odds: 1.9 },
          { text: "8+ gestures", odds: 2.5 }
        ]
      },
      {
        question: "Will Trump acknowledge any miners by name in his upcoming remarks?",
        options: [
          { text: "Yes", odds: 3.2 },
          { text: "No", odds: 1.5 }
        ]
      },
      {
        question: "Will an aide need to adjust any items on the desk during the signing?",
        options: [
          { text: "Yes", odds: 2.2 },
          { text: "No", odds: 1.8 }
        ]
      },
      {
        question: "Will Trump shake hands with the miners after signing the orders?",
        options: [
          { text: "Yes, with all miners", odds: 1.5 },
          { text: "Only with some miners", odds: 2.8 },
          { text: "No handshakes", odds: 6.0 }
        ]
      },
      {
        question: "How will the camera angle change in the next segment?",
        options: [
          { text: "Close-up on Trump", odds: 1.6 },
          { text: "Wide shot of room", odds: 2.2 },
          { text: "Focus on miners", odds: 3.5 },
          { text: "Focus on documents", odds: 2.8 }
        ]
      }
    ];
    
    const mockQuestions: BettingQuestion[] = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      const questionId = `local-${crypto.randomUUID()}`;
      const endTime = new Date(now.getTime() + 15 * 1000);
      
      const question: BettingQuestion = {
        id: questionId,
        question: template.question,
        time_remaining: 15, // 15 seconds to match video segments
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        is_active: true,
        is_hot: Math.random() > 0.7, // 30% chance of being "hot"
        created_at: now.toISOString(),
        options: template.options.map((opt, index) => ({
          id: `local-opt-${crypto.randomUUID()}`,
          question_id: questionId,
          text: opt.text,
          odds: opt.odds,
          is_winner: null,
          created_at: now.toISOString()
        }))
      };
      
      mockQuestions.push(question);
    }
    
    return mockQuestions;
  }
  
  // Stop the scheduler
  stop(): void {
    if (!this.isRunning) return;
    
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    
    if (this.outcomeTimerId) {
      clearInterval(this.outcomeTimerId);
      this.outcomeTimerId = null;
    }
    
    this.isRunning = false;
    console.log('Question scheduler stopped.');
  }
  
  // Set callbacks
  setCallbacks(callbacks: SchedulerCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
  
  // Generate questions and save them
  private async generateQuestions(): Promise<void> {
    try {
      console.log('Generating new betting questions...');
      const questions = await generateBettingQuestions(this.questionCount);
      
      // Store in our local active questions array
      if (this.useLocalOnly) {
        // Add to our active questions array with the current 3-minute cycle
        this.activeQuestions = [...this.activeQuestions, ...questions];
      } else {
        // Save to Supabase if not in local-only mode
        await this.saveQuestionsToDatabase(questions);
      }
      
      // Notify via callback
      if (this.callbacks.onQuestionsGenerated) {
        this.callbacks.onQuestionsGenerated(questions);
      }
      
      console.log(`Successfully generated ${questions.length} new questions.`);
    } catch (error) {
      console.error('Error in question generation scheduler:', error);
      
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    }
  }
  
  // Save questions to the database
  private async saveQuestionsToDatabase(questions: BettingQuestion[]): Promise<void> {
    if (questions.length === 0) return;
    
    try {
      // First, insert all questions
      const { error: questionsError } = await supabase
        .from('betting_questions')
        .insert(questions.map(q => ({
          id: q.id,
          question: q.question,
          time_remaining: q.time_remaining,
          start_time: q.start_time,
          end_time: q.end_time,
          is_active: q.is_active,
          is_hot: q.is_hot,
          created_at: q.created_at
        })));
      
      if (questionsError) throw questionsError;
      
      // Then, insert all options
      const allOptions = questions.flatMap(q => q.options);
      
      const { error: optionsError } = await supabase
        .from('betting_options')
        .insert(allOptions.map(opt => ({
          id: opt.id,
          question_id: opt.question_id,
          text: opt.text,
          odds: opt.odds,
          is_winner: opt.is_winner,
          created_at: opt.created_at
        })));
      
      if (optionsError) throw optionsError;
      
      console.log(`Saved ${questions.length} questions and ${allOptions.length} options to database.`);
    } catch (error) {
      console.error('Error saving questions to database:', error);
      throw error;
    }
  }
  
  // Check for expired questions and calculate outcomes
  async checkExpiredQuestions() {
    console.log('Checking for expired questions...');
    try {
      const now = new Date();
      let expiredQuestions: BettingQuestion[] = [];
      const winners: Record<string, BettingOption> = {};
      
      if (this.useLocalOnly) {
        // Filter expired questions from our local array
        expiredQuestions = this.activeQuestions.filter(q => 
          new Date(q.end_time) <= now && q.is_active
        );
        
        // Process each expired question
        for (const question of expiredQuestions) {
          // Determine winner
          const winningOption = await determineWinnerAndProcessBets(question, true);
          
          if (winningOption) {
            winners[question.id] = winningOption;
            
            // Mark the question as inactive
            question.is_active = false;
            
            // Mark the winning option
            question.options = question.options.map(option => ({
              ...option,
              is_winner: option.id === winningOption.id
            }));
          }
        }
        
        // Update our active questions list
        this.activeQuestions = this.activeQuestions.map(q => {
          if (expiredQuestions.find(eq => eq.id === q.id)) {
            return {
              ...q,
              is_active: false,
              options: q.options.map(opt => ({
                ...opt,
                is_winner: winners[q.id]?.id === opt.id ? true : false
              }))
            };
          }
          return q;
        });
      } else {
        // Use the database outcome service and pass a local callback for local-only mode
        await calculateOutcomes(this.useLocalOnly, async (emptyQuestions) => {
          // This callback will be used when in local-only mode
          // We'll use our own activeQuestions to find expired ones
          expiredQuestions = this.activeQuestions.filter(q => 
            new Date(q.end_time) <= now && q.is_active
          );
          
          // Process each expired question
          for (const question of expiredQuestions) {
            // Determine winner
            const winningOption = await determineWinnerAndProcessBets(question, true);
            
            if (winningOption) {
              winners[question.id] = winningOption;
              
              // Mark the question as inactive
              question.is_active = false;
              
              // Mark the winning option
              question.options = question.options.map(option => ({
                ...option,
                is_winner: option.id === winningOption.id
              }));
            }
          }
          
          // Update our active questions list
          this.activeQuestions = this.activeQuestions.map(q => {
            if (expiredQuestions.find(eq => eq.id === q.id)) {
              return {
                ...q,
                is_active: false,
                options: q.options.map(opt => ({
                  ...opt,
                  is_winner: winners[q.id]?.id === opt.id ? true : false
                }))
              };
            }
            return q;
          });
        });
        
        if (!this.useLocalOnly) {
          // Get the newly processed questions to notify frontend (only for database mode)
          const { data, error } = await supabase
            .from('betting_questions')
            .select('*, options:betting_options(*)')
            .eq('is_active', false)
            .gt('end_time', new Date(now.getTime() - 5 * 60 * 1000).toISOString()) // Questions that ended in the last 5 minutes
            .lt('end_time', now.toISOString());
          
          if (error) throw error;
          expiredQuestions = data || [];
          
          // Extract winners
          for (const question of expiredQuestions) {
            const winnerOption = question.options?.find(opt => opt.is_winner === true);
            if (winnerOption) {
              winners[question.id] = winnerOption;
            }
          }
        }
      }
      
      // Notify about expired questions
      if (expiredQuestions.length > 0 && this.callbacks.onQuestionsExpired) {
        this.callbacks.onQuestionsExpired(expiredQuestions);
      }
      
      // Notify about calculated outcomes - CRITICAL: this triggers bet result displays
      if (Object.keys(winners).length > 0 && this.callbacks.onOutcomesCalculated) {
        console.log(`IMMEDIATE OUTCOME CALCULATION: Processing ${expiredQuestions.length} questions with ${Object.keys(winners).length} winners`);
        
        // Ensure outcomes are calculated immediately and synchronously
        this.callbacks.onOutcomesCalculated(expiredQuestions, winners);
        
        // Force a small delay to ensure state updates propagate before next question generation
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      if (expiredQuestions.length > 0) {
        console.log(`Processed outcomes for ${expiredQuestions.length} expired questions.`);
      }
    } catch (error) {
      console.error('Error checking expired questions:', error);
      
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    }
  }
  
  // Get all active questions
  getActiveQuestions(): BettingQuestion[] {
    return this.activeQuestions.filter(q => q.is_active);
  }
  
  // Get all questions (active and resolved)
  getAllQuestions(): BettingQuestion[] {
    return this.activeQuestions;
  }
}

// Export a singleton instance
export const questionScheduler = new QuestionScheduler({
  intervalMinutes: 0.25, // Explicitly set to 15 seconds to match video segments
  useLocalOnly: true // Default to local-only mode to avoid DB issues
});

export default questionScheduler;