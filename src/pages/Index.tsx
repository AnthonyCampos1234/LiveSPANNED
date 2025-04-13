import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import VideoPlayer from '@/components/VideoPlayer';
import BettingCard from '@/components/BettingCard';
import ChatBox from '@/components/ChatBox';
import BettingHistory, { BetHistoryItem } from '@/components/BettingHistory';
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useBetting } from '@/contexts/BettingContext';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

// Configuration
const CSPAN_VIDEO_ID = "utW1DmZmFYs"; // CSPAN video of a Senate hearing

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { 
    questions, 
    userBets, 
    loading: bettingLoading, 
    placeBet: handleSupabaseBet,
    toggleFavorite,
    toggleNotification,
    isFavorite,
    isNotificationEnabled
  } = useBetting();
  const [bettingHistory, setBettingHistory] = useState<BetHistoryItem[]>([]);
  const isMobile = useIsMobile();

  // Convert user bets to betting history format
  useEffect(() => {
    if (userBets.length > 0) {
      const formattedBets: BetHistoryItem[] = userBets.map(bet => ({
        id: bet.id,
        question: "Loading question...", // You would get this from relations in a real implementation
        option: "Loading option...", // You would get this from relations in a real implementation
        amount: bet.amount,
        potentialWinnings: bet.potential_payout,
        timestamp: new Date(bet.created_at),
        result: bet.is_settled ? (Math.random() > 0.5 ? 'win' : 'loss') : 'pending', // For demo purposes
      }));
      
      setBettingHistory(formattedBets);
    }
  }, [userBets]);

  const handlePlaceBet = async (questionId: string, optionId: string, amount: number) => {
    console.log(`Index: Placing bet on question ${questionId}, option ${optionId}, amount ${amount}`);
    
    // Check authentication
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to place bets",
        variant: "destructive",
      });
      return;
    }
    
    // Check if the question exists
    const question = questions.find(q => q.id === questionId);
    if (!question) {
      console.error(`Question with ID ${questionId} not found`);
      toast({
        title: "Betting Error",
        description: "This betting question is no longer available",
        variant: "destructive",
      });
      return;
    }
    
    // Check if the option exists
    const option = question.options?.find(o => o.id === optionId);
    if (!option) {
      console.error(`Option with ID ${optionId} not found for question ${questionId}`);
      toast({
        title: "Betting Error",
        description: "This betting option is no longer available",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user has enough balance
    if (user.balance < amount) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${amount} credits but only have ${user.balance}`,
        variant: "destructive",
      });
      return;
    }
    
    // Attempt to place the bet
    try {
      const success = await handleSupabaseBet(questionId, optionId, amount);
      if (!success) {
        // Error is already handled in the context with a toast
        console.error("Failed to place bet through betting context");
      } else {
        console.log("Successfully placed bet!");
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      toast({
        title: "Betting Error",
        description: "An unexpected error occurred while placing your bet",
        variant: "destructive",
      });
    }
  };
  
  const handleToggleFavorite = (questionId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to favorite bets",
        variant: "destructive",
      });
      return;
    }
    
    toggleFavorite(questionId);
  };
  
  const handleToggleNotification = (questionId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage notifications",
        variant: "destructive",
      });
      return;
    }
    
    toggleNotification(questionId);
  };

  // Add a debug component to forcibly show even with loading state
  const DebugComponent = () => (
    <div className="fixed top-0 right-0 bg-black text-white p-2 z-50 text-xs">
      <div>Loading: {bettingLoading ? 'true' : 'false'}</div>
      <div>Questions: {questions.length}</div>
      <div>Auth Loading: {authLoading ? 'true' : 'false'}</div>
    </div>
  );

  // Forcibly render the content regardless of loading state for debugging
  console.log('*** RENDER STATE ***');
  console.log('Loading:', bettingLoading);
  console.log('Questions:', questions);
  console.log('Questions Length:', questions.length);
  
  // If the questions array is valid but we're still loading, force exit loading state
  if (bettingLoading && questions && questions.length > 0) {
    console.log('Forcing exit from loading state since questions are available');
    // Continue to render below instead of showing loading screen
  } 
  // Only show loading if actually loading and we have no questions yet
  else if (bettingLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <DebugComponent />
        <Icons.spinner className="h-10 w-10 animate-spin text-gambling-accent" />
        <span className="ml-2">Loading betting data...</span>
      </div>
    );
  }

  // Always add the debug component to the UI
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <DebugComponent />
      <Header />
      
      <main className="flex-1 flex flex-col max-w-screen-2xl mx-auto w-full h-[calc(100vh-64px)] overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Main content area (2/3 width on large screens) */}
          <div className="lg:w-2/3 h-full flex flex-col p-2">
            {/* Video player - made larger and more prominent */}
            <div className="rounded-sm overflow-hidden shadow-md mb-3 relative">
              <VideoPlayer videoId={CSPAN_VIDEO_ID} />
            </div>
            
            {/* Live betting section */}
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold">Live Betting</h2>
                {!user && (
                  <div className="flex space-x-2">
                    <Link to="/signin">
                      <Button variant="outline" size="sm" className="rounded-none border-gambling-accent text-white">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button size="sm" className="rounded-none bg-gambling-accent hover:bg-gambling-accent/80">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {questions && questions.length > 0 ? (
                <div className="flex space-x-4 overflow-x-auto pb-4">
                  {/* Filter to only show active questions */}
                  {questions
                    .filter(question => question.is_active)
                    .map(question => {
                      // Debug info for question identification
                      const isLocal = question.id.startsWith('local-');
                      console.log(`Rendering question ${question.id} (${isLocal ? 'local' : 'database'})`);
                      
                      // Find user's bet for this question (if any)
                      const userBet = userBets?.find(bet => bet.question_id === question.id);
                      
                      // Determine if the user won based on the selected option
                      const userWon = userBet && 
                        question.options?.some(opt => 
                          opt.id === userBet.option_id && opt.is_winner === true
                        );
                      
                      return (
                        <BettingCard
                          key={question.id}
                          id={question.id}
                          question={question.question}
                          timeRemaining={question.time_remaining}
                          options={question.options ? question.options : []}
                          onPlaceBet={handlePlaceBet}
                          onToggleFavorite={() => handleToggleFavorite(question.id)}
                          onToggleNotification={() => handleToggleNotification(question.id)}
                          isFavorite={user ? isFavorite(question.id) : false}
                          isNotifyEnabled={user ? isNotificationEnabled(question.id) : false}
                          isLocalQuestion={isLocal} // Pass this info to the card
                          userBetOption={userBet?.option_id}
                          userBetAmount={userBet?.amount}
                        />
                      );
                    })}
                </div>
              ) : (
                <div className="p-8 border border-gambling-muted/20 text-center text-gambling-muted">
                  {bettingLoading ? (
                    <>
                      <Icons.spinner className="h-6 w-6 animate-spin text-gambling-accent mx-auto mb-2" />
                      <div>Loading betting questions...</div>
                    </>
                  ) : (
                    "No active betting questions available at the moment."
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Side Column - Chat and History */}
          <div className="w-full lg:w-1/3 p-4 border-l border-gambling-muted/20 flex flex-col">
            {/* Chat section */}
            <div className="mb-6 h-1/2">
              <h2 className="text-xl font-bold mb-3">Live Chat</h2>
              <ChatBox />
            </div>
            
            {/* Betting history */}
            <div className="h-1/2">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold">Betting History</h2>
                {user && (
                  <Link to="/profile">
                    <Button variant="outline" size="sm" className="rounded-none border-gambling-accent text-white">
                      View All
                    </Button>
                  </Link>
                )}
              </div>
              {user ? (
                <BettingHistory bets={bettingHistory} />
              ) : (
                <div className="p-4 border border-gambling-muted/20 text-center text-gambling-muted">
                  Sign in to view your betting history
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
