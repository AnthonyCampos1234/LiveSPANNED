
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, Zap, TrendingUp, CheckCircle, FlameKindling } from "lucide-react";
import { cn } from '@/lib/utils';

export interface BettingOption {
  id: string;
  text: string;
  odds: number;
}

export interface BettingQuestionProps {
  id: string;
  question: string;
  timeRemaining: number;
  options: BettingOption[];
  onPlaceBet: (questionId: string, optionId: string, amount: number) => void;
}

const BettingQuestion: React.FC<BettingQuestionProps> = ({
  id,
  question,
  timeRemaining,
  options,
  onPlaceBet
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(10);

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleBetAmountChange = (amount: number) => {
    if (betAmount + amount > 0) {
      setBetAmount(prev => prev + amount);
    }
  };

  const handlePlaceBet = () => {
    if (selectedOption) {
      onPlaceBet(id, selectedOption, betAmount);
      // Reset
      setSelectedOption(null);
      setBetAmount(10);
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Function to determine if time is getting low
  const isLowTime = timeRemaining < 30;

  return (
    <Card className={cn(
      "bg-gambling-card border-gambling-muted overflow-hidden animate-fade-in shadow-lg h-full",
      isLowTime && "border-gambling-accent/50 glow-accent"
    )}>
      <CardHeader className="pb-2 bg-gambling-dark">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold flex items-center gap-1.5">
            {isLowTime ? (
              <FlameKindling className="h-4 w-4 text-gambling-accent animate-pulse-betting" />
            ) : (
              <Zap className="h-4 w-4 text-gambling-secondary" />
            )}
            {question}
          </CardTitle>
          <div className={cn(
            "flex items-center px-3 py-1.5 rounded-md text-sm",
            isLowTime ? "bg-gambling-accent/20 text-gambling-accent" : "bg-gambling-dark/70 text-gambling-secondary"
          )}>
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            <span className={cn(isLowTime && "animate-pulse-betting")}>{formatTimeRemaining(timeRemaining)}</span>
          </div>
        </div>
        <CardDescription className="mt-1.5 text-gambling-secondary/90">Select an option and place your bet</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2 pt-3">
        <div className="space-y-2.5">
          {options.map(option => (
            <div 
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              className={cn(
                "betting-option group relative overflow-hidden",
                selectedOption === option.id && "betting-option-selected"
              )}
            >
              <div className="flex items-center gap-2">
                {selectedOption === option.id && (
                  <CheckCircle className="h-4 w-4 text-gambling-secondary animate-float" />
                )}
                <span className="font-medium">{option.text}</span>
              </div>
              <div className="odds-badge">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>{option.odds}x</span>
              </div>
              
              <div className={cn(
                "absolute bottom-0 left-0 h-0.5 w-0 bg-gambling-secondary transition-all duration-700",
                selectedOption === option.id && "w-full"
              )}></div>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-3 pt-1">
        <div className="flex justify-between items-center w-full">
          <div className="flex space-x-1">
            <Button 
              size="sm" 
              variant="outline"
              className="h-8 px-2 bg-gambling-dark/50 border-gambling-muted hover:bg-gambling-muted/50 hover:border-gambling-secondary"
              onClick={() => handleBetAmountChange(-10)}
            >-10</Button>
            <Button 
              size="sm" 
              variant="outline"
              className="h-8 px-2 bg-gambling-dark/50 border-gambling-muted hover:bg-gambling-muted/50 hover:border-gambling-secondary"
              onClick={() => handleBetAmountChange(-50)}
            >-50</Button>
            <Button 
              size="sm" 
              variant="outline"
              className="h-8 px-2 bg-gambling-dark/50 border-gambling-muted hover:bg-gambling-muted/50 hover:border-gambling-secondary"
              onClick={() => handleBetAmountChange(10)}
            >+10</Button>
            <Button 
              size="sm" 
              variant="outline"
              className="h-8 px-2 bg-gambling-dark/50 border-gambling-muted hover:bg-gambling-muted/50 hover:border-gambling-secondary"
              onClick={() => handleBetAmountChange(50)}
            >+50</Button>
          </div>
          <div className="flex items-center bg-gambling-dark/70 px-3 py-1.5 rounded-md border border-gambling-muted/50">
            <DollarSign className="h-4 w-4 mr-1 text-gambling-accent" />
            <span className="font-medium">{betAmount}</span>
          </div>
        </div>
        
        <Button 
          className={cn(
            "w-full bg-gambling-accent hover:bg-gambling-accent/80 text-white font-medium transition-all duration-300",
            !selectedOption && "opacity-50"
          )}
          disabled={!selectedOption}
          onClick={handlePlaceBet}
        >
          Place Bet
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BettingQuestion;
