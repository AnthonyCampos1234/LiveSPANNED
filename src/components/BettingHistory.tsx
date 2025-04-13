
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { cn } from '@/lib/utils';

export interface BetHistoryItem {
  id: string;
  question: string;
  option: string;
  amount: number;
  potentialWinnings: number;
  timestamp: Date;
  result?: 'win' | 'loss' | 'pending';
}

interface BettingHistoryProps {
  bets: BetHistoryItem[];
}

const BettingHistory: React.FC<BettingHistoryProps> = ({ bets }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="bg-gambling-card border-gambling-muted/30 w-full">
      <CardHeader className="p-2 border-b border-gambling-muted/30 bg-gambling-dark">
        <div className="flex items-center gap-1.5">
          <div className="bg-gambling-accent h-3 w-0.5 rounded-full"></div>
          <CardTitle className="text-xs font-semibold uppercase">Your Bets</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-2 overflow-y-auto max-h-[320px]">
        {bets.length === 0 ? (
          <div className="text-center py-4 bg-gambling-muted/10 rounded-md border border-gambling-muted/20 text-gambling-secondary/70 text-xs">
            No betting history yet. Place your first bet!
          </div>
        ) : (
          <div className="space-y-2">
            {bets.map((bet) => (
              <div 
                key={bet.id} 
                className={cn(
                  "p-2 rounded-md border text-xs",
                  bet.result === 'win' ? "border-gambling-success/30" :
                  bet.result === 'loss' ? "border-gambling-accent/30" :
                  "border-gambling-muted/30"
                )}
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium truncate flex-1 mr-2 text-white/90 text-xs">{bet.question}</div>
                  <div className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-md whitespace-nowrap text-xs",
                    bet.result === 'win' ? "bg-gambling-muted/30 text-gambling-success" :
                    bet.result === 'loss' ? "bg-gambling-muted/30 text-gambling-accent" :
                    "bg-gambling-muted/30"
                  )}>
                    {bet.result === 'win' && (
                      <Check className="h-3 w-3 text-gambling-success" />
                    )}
                    {bet.result === 'loss' && (
                      <X className="h-3 w-3 text-gambling-accent" />
                    )}
                    <span className={cn(
                      "font-bold text-xs",
                      bet.result === 'win' && "text-gambling-success",
                      bet.result === 'loss' && "text-gambling-accent"
                    )}>
                      {bet.result === 'win' ? `+$${bet.potentialWinnings}` : 
                        bet.result === 'loss' ? `-$${bet.amount}` : 
                        `$${bet.amount}`}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-gambling-muted/20 text-[10px]">
                  <div className="flex items-center gap-1">
                    <span className="text-white/60">Bet:</span>
                    <span className="text-white">{bet.option}</span>
                  </div>
                  <div className="font-mono text-white/50">{formatTime(bet.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BettingHistory;
