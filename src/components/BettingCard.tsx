import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Timer, DollarSign, Star, Bell, Flame, TrendingUp, ArrowUpRight, Zap, XCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { toast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BettingOption {
  id: string;
  text: string;
  odds: number;
  is_winner?: boolean | null;
}

interface BettingCardProps {
  id: string;
  question: string;
  timeRemaining: number;
  options: BettingOption[];
  onPlaceBet: (questionId: string, optionId: string, amount: number) => void;
  onToggleFavorite?: (questionId: string) => void;
  onToggleNotification?: (questionId: string) => void;
  isFavorite?: boolean;
  isNotifyEnabled?: boolean;
  isLocalQuestion?: boolean; // Flag to identify locally generated questions
  userBetOption?: string; // Option ID the user bet on (if any)
  userBetAmount?: number; // Amount the user bet
  userBetWon?: boolean; // Whether the user's bet won
}

const BettingCard: React.FC<BettingCardProps> = ({
  id,
  question,
  timeRemaining: initialTimeRemaining,
  options,
  onPlaceBet,
  onToggleFavorite,
  onToggleNotification,
  isFavorite: propIsFavorite = false,
  isNotifyEnabled: propIsNotifyEnabled = false,
  isLocalQuestion = false,
  userBetOption,
  userBetAmount,
  userBetWon
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [localIsFavorite, setLocalIsFavorite] = useState(propIsFavorite);
  const [localNotifyEnabled, setLocalNotifyEnabled] = useState(propIsNotifyEnabled);
  const [timeRemaining, setTimeRemaining] = useState<number>(initialTimeRemaining);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleBetSubmit = () => {
    if (selectedOption && betAmount > 0) {
      console.log(`Submitting bet on ${isLocalQuestion ? 'local' : 'database'} question: ${id}`);
      onPlaceBet(id, selectedOption, betAmount);
      
      // Toast is now handled by BettingContext after successful bet placement
      // Reset the form locally
      setSelectedOption(null);
      setBetAmount(10);
    }
  };

  const toggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(id);
    } else {
      setLocalIsFavorite(!localIsFavorite);
      toast({
        title: localIsFavorite ? "Removed from favorites" : "Added to favorites",
        description: localIsFavorite ? "Bet removed from your favorites" : "Bet added to your favorites",
      });
    }
  };

  const toggleNotifications = () => {
    if (onToggleNotification) {
      onToggleNotification(id);
    } else {
      setLocalNotifyEnabled(!localNotifyEnabled);
      toast({
        title: localNotifyEnabled ? "Notifications disabled" : "Notifications enabled",
        description: localNotifyEnabled ? "You won't receive updates for this bet" : "You'll receive updates for this bet",
      });
    }
  };

  // Update timeRemaining when the initialTimeRemaining prop changes
  useEffect(() => {
    setTimeRemaining(initialTimeRemaining);
    // If time is already 0, mark as expired
    if (initialTimeRemaining <= 0) {
      setIsExpired(true);
    } else {
      setIsExpired(false);
    }
  }, [initialTimeRemaining]);
  
  // Set up the countdown timer
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Only start the timer if not already expired
    if (timeRemaining > 0 && !isExpired) {
      console.log(`Starting timer for question with ${timeRemaining} seconds remaining`);
      timerRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            // Clear the interval when time is up
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setIsExpired(true);
            console.log('Timer expired, marking question as expired');
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    // Clean up on component unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeRemaining, isExpired]);
  
  // Time calculations - convert from seconds to display format
  // Maximum time for a question is 15 seconds now (matching video segments)
  const totalTime = 15; // 15 seconds total
  const timePercentage = Math.min(100, Math.max(0, (timeRemaining / totalTime) * 100));
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeDisplay = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  
  // Function to determine if time is getting low
  const isLowTime = timeRemaining < 5; // Getting low when less than 5 seconds
  const isHot = timeRemaining > 10; // Hot when new (more than 10 seconds left)

  return (
    <Card className="w-[230px] flex-shrink-0 bg-gambling-dark border-l-4 border-gambling-accent border rounded-none shadow-lg hover:shadow-gambling-accent/30 hover:translate-y-[-2px] transition-all relative overflow-hidden">
      {/* Timer header */}
      <CardHeader className="p-2 pb-1 space-y-1 border-b border-gambling-accent/40 bg-black relative">
        {/* Action buttons */}
        <div className="absolute right-1 top-1 flex space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-white hover:bg-gambling-accent/20 rounded-none"
                  onClick={toggleFavorite}
                >
                  <Star className={cn("h-3 w-3", (propIsFavorite || localIsFavorite) ? "fill-gambling-accent text-gambling-accent" : "text-white/70")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{(propIsFavorite || localIsFavorite) ? "Remove from favorites" : "Add to favorites"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-white hover:bg-gambling-accent/20 rounded-none"
                  onClick={toggleNotifications}
                >
                  <Bell className={cn("h-3 w-3", (propIsNotifyEnabled || localNotifyEnabled) ? "text-gambling-accent" : "text-white/70")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{(propIsNotifyEnabled || localNotifyEnabled) ? "Disable notifications" : "Enable notifications"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Hot/Live labels */}
        <div className="absolute left-0 top-0 flex">
          {isLowTime && (
            <Badge variant="outline" className="rounded-none border-0 bg-gambling-accent text-white text-xs font-bold px-2 py-0.5">
              <Timer className="h-3 w-3 mr-1 animate-pulse" />
              ENDING
            </Badge>
          )}
          
          {isHot && (
            <Badge variant="outline" className="rounded-none border-0 bg-red-500 text-white text-xs font-bold px-2 py-0.5">
              <Flame className="h-3 w-3 mr-1" />
              HOT
            </Badge>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-6">
          <div className="flex items-center gap-1 max-w-[75%]">
            <h3 className="text-sm font-bold text-white" title={question}>
              {question.length > 70 ? `${question.substring(0, 67)}...` : question}
            </h3>
          </div>
          <div className={cn(
            "flex items-center gap-1 text-xs font-mono font-medium px-2 py-1",
            isLowTime 
              ? "text-white bg-gambling-accent animate-pulse" 
              : "text-white bg-gambling-secondary"
          )}>
            <Timer className="h-3 w-3 mr-0.5" />
            <span>{timeDisplay}</span>
          </div>
        </div>
        <Progress 
          value={timePercentage} 
          className="h-1.5 bg-gambling-muted/30"
          indicatorClassName={cn(
            isLowTime ? "bg-gambling-accent" : "bg-gambling-secondary"
          )}
        />
      </CardHeader>
      
      {/* Options */}
      <CardContent className="p-0">
        {options.map((option, index) => (
          <div
            key={option.id}
            className={cn(
              "flex justify-between items-center p-3 border-b border-gambling-muted/20 cursor-pointer transition-all hover:bg-gambling-muted/5",
              selectedOption === option.id 
                ? "bg-gambling-accent/10 border-l-2 border-l-gambling-accent" 
                : "hover:bg-gambling-muted/10 border-l-2 border-l-transparent"
            )}
            onClick={() => handleOptionSelect(option.id)}
          >
            <div className={cn(
              "flex items-center gap-2",
              (selectedOption === option.id || userBetOption === option.id) ? "font-bold text-white" : "text-white"
            )}>
              {userBetOption === option.id && option.is_winner !== null ? (
                <div className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-sm",
                  option.is_winner ? "bg-gambling-success" : "bg-red-500"
                )}>
                  {option.is_winner ? 
                    <DollarSign className="h-3.5 w-3.5 text-white" /> : 
                    <XCircle className="h-3.5 w-3.5 text-white" />
                  }
                </div>
              ) : selectedOption === option.id ? (
                <div className="flex h-5 w-5 items-center justify-center bg-gambling-accent rounded-sm">
                  <CheckCircle className="h-3.5 w-3.5 text-white" />
                </div>
              ) : (
                <div className="flex h-5 w-5 items-center justify-center bg-gambling-muted/20 rounded-sm border border-gambling-muted/50">
                  <span className="text-xs font-bold text-white">{index + 1}</span>
                </div>
              )}
              <span className={cn(
                "text-sm", 
                (selectedOption === option.id || userBetOption === option.id) ? "font-bold text-white" : "text-white"
              )}>{option.text}</span>
            </div>
            <div className={cn(
              "text-xs font-mono px-2 py-1 flex items-center gap-1",
              selectedOption === option.id 
                ? "bg-gambling-accent text-white" 
                : option.odds > 2 ? "bg-gambling-success/20 text-gambling-success" : "bg-gambling-muted/20 text-white"
            )}>
              {option.odds > 2 && <TrendingUp className="h-3 w-3" />}
              <span>{option.odds > 1 ? '+' : ''}{option.odds}x</span>
            </div>
          </div>
        ))}
      </CardContent>
      
      {/* Card footer with place bet button */}
      <CardFooter className="p-2 pt-0 flex flex-col">
        {/* Show different content based on expiration state and if winner is determined */}
        {isExpired || timeRemaining <= 0 ? (
          <div className="w-full">
            {/* Check if any option has been marked as winner */}
            {options.some(opt => opt.is_winner === true) ? (
              <>
                <div className="text-xs text-gambling-accent bg-gambling-accent/10 p-2 w-full text-center font-bold flex items-center justify-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Outcome determined
                </div>
                
                {/* Show win/loss status if user placed a bet */}
                {userBetOption && (
                  <div className={cn(
                    "mt-2 p-2 text-center font-bold flex items-center justify-center gap-2",
                    options.find(o => o.id === userBetOption)?.is_winner 
                      ? "text-gambling-success bg-gambling-success/10 border border-gambling-success/20" 
                      : "text-red-400 bg-red-900/10 border border-red-900/20"
                  )}>
                    {options.find(o => o.id === userBetOption)?.is_winner ? (
                      <>
                        <DollarSign className="h-4 w-4" />
                        <span>You won {userBetAmount && options.find(o => o.id === userBetOption)?.odds ? 
                          `$${(userBetAmount * (options.find(o => o.id === userBetOption)?.odds || 1)).toFixed(2)}` : 
                          '!'}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        <span>You lost ${userBetAmount?.toFixed(2) || ''}</span>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-red-400 bg-red-900/20 p-2 w-full text-center">
                Betting closed - calculating outcome
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col w-full gap-2">
            <div className="flex justify-between items-center">
              <Input 
                type="number" 
                placeholder="Bet amount"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="w-20 h-8 rounded-none border border-gambling-accent/30 bg-black text-white"
                min="1"
                step="1"
              />
              <Button 
                onClick={handleBetSubmit}
                disabled={!selectedOption || betAmount <= 0}
                className="bg-gambling-accent hover:bg-gambling-accent/70 text-white rounded-none h-8">
                <Zap className="h-4 w-4 mr-1" />
                Place Bet
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default BettingCard;
