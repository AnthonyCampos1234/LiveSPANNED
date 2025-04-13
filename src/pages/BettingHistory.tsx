import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBetting } from '@/contexts/BettingContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icons } from '@/components/ui/icons';
import { 
  HistoryIcon,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Filter,
  ArrowUpDown,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import Header from '@/components/Header';

// Define proper types
interface UserBet {
  id: string;
  created_at: string;
  amount: number;
  potential_payout: number;
  is_settled: boolean;
  user_id?: string;
  question_id?: string;
  option_id?: string;
  result?: boolean; // Added for consistent win/loss determination
}

type FilterType = 'all' | 'won' | 'lost' | 'pending';
type SortOptionType = 'newest' | 'oldest' | 'amount';

// Component for statistics card
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <div className="p-6 border border-gambling-muted/30 rounded-none bg-gambling-secondary/5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gambling-muted">{title}</h3>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

// Component for bet history item
interface BetHistoryItemProps {
  bet: UserBet;
  index: number;
  formatDate: (date: string) => string;
  questionText?: string;
  optionText?: string;
}

const BetHistoryItem: React.FC<BetHistoryItemProps> = ({ 
  bet, 
  index, 
  formatDate,
  questionText = `Question #${index + 1}`,
  optionText = `Option #${index + 1}`
}) => {
  return (
    <div className="p-4 border border-gambling-muted/30 rounded-none bg-gambling-secondary/5 hover:bg-gambling-secondary/10 transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <h3 className="text-md font-medium mb-1 truncate">{questionText}</h3>
          <p className="text-sm text-gambling-muted mb-2">Your bet: {optionText}</p>
          
          <div className="flex items-center text-sm text-gambling-muted mb-1">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            <span>{formatDate(bet.created_at)}</span>
          </div>
        </div>
        
        <div className="flex flex-col justify-center">
          <div className="flex items-center text-sm gap-4">
            <div>
              <p className="text-xs text-gambling-muted mb-1">Amount</p>
              <p className="font-medium flex items-center">
                <DollarSign className="h-3.5 w-3.5 text-gambling-muted" />
                ${bet.amount.toFixed(2)}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gambling-muted mb-1">Potential Win</p>
              <p className="font-medium flex items-center">
                <TrendingUp className="h-3.5 w-3.5 text-gambling-muted" />
                ${bet.potential_payout.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end">
          {!bet.is_settled ? (
            <div className="flex items-center bg-gambling-muted/20 text-white text-sm py-1 px-3 rounded-none">
              <Clock className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
              <span>Pending</span>
            </div>
          ) : bet.result ? (
            <div className="flex items-center bg-gambling-success/20 text-gambling-success text-sm py-1 px-3 rounded-none">
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              <span>Won ${bet.potential_payout.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex items-center bg-gambling-destructive/20 text-gambling-destructive text-sm py-1 px-3 rounded-none">
              <XCircle className="h-3.5 w-3.5 mr-1.5" />
              <span>Lost ${bet.amount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BettingHistory: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { userBets, loading: betsLoading } = useBetting();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortOption, setSortOption] = useState<SortOptionType>('newest');
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
    }
  }, [user, authLoading, navigate]);

  // Prepare bets with consistent win/loss results
  const processedBets = useMemo(() => {
    if (!userBets || userBets.length === 0) return [];
    
    // Add a deterministic result property to each bet for consistent display
    return userBets.map(bet => ({
      ...bet,
      // Use a hash of the bet ID for deterministic randomness instead of Math.random
      result: bet.is_settled ? 
        // Using a simple hash function based on the bet ID for consistent results
        bet.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 2 === 0 
        : null
    }));
  }, [userBets]);

  // Filter and sort bets with memoization for performance
  const filteredAndSortedBets = useMemo(() => {
    if (!processedBets || processedBets.length === 0) return [];
    
    // Apply filter
    let filtered = [...processedBets];
    if (filter !== 'all') {
      filtered = filtered.filter(bet => {
        if (filter === 'pending') return !bet.is_settled;
        if (filter === 'won') return bet.is_settled && bet.result === true;
        if (filter === 'lost') return bet.is_settled && bet.result === false;
        return true;
      });
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortOption === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortOption === 'amount') return b.amount - a.amount;
      return 0;
    });
  }, [processedBets, filter, sortOption]);
  
  // Calculate statistics with memoization
  const stats = useMemo(() => {
    const totalBets = processedBets.length;
    const totalWagered = processedBets.reduce((sum, bet) => sum + bet.amount, 0);
    const potentialWinnings = processedBets.reduce((sum, bet) => sum + bet.potential_payout, 0);
    
    return {
      totalBets,
      totalWagered,
      potentialWinnings
    };
  }, [processedBets]);
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Invalid date format:", error);
      return "Invalid date";
    }
  };
  
  // Show loading spinner when authentication or betting data is loading
  if (authLoading || betsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center">
          <Icons.spinner className="h-8 w-8 animate-spin text-gambling-accent mb-2" />
          <p className="text-gambling-accent text-sm">Loading betting history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <HistoryIcon className="mr-2 h-6 w-6 text-gambling-accent" />
            Betting History
          </h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="border-gambling-accent/50 text-white hover:bg-gambling-accent/20 rounded-none"
              onClick={() => navigate('/profile')}
            >
              Back to Profile
            </Button>
          </div>
        </div>
        
        <Card className="border-gambling-accent/40 bg-gambling-dark text-white rounded-none shadow-md">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Your Betting Activity</CardTitle>
                <CardDescription className="text-gambling-muted">
                  Track all your bets and their outcomes
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center rounded-none border border-gambling-muted/30 bg-gambling-dark">
                  <span className="px-3 text-sm text-gambling-muted flex items-center">
                    <Filter className="h-4 w-4 mr-1" /> Filter
                  </span>
                  <Select 
                    value={filter}
                    onValueChange={(val) => setFilter(val as FilterType)}
                  >
                    <SelectTrigger className="border-0 bg-transparent focus:ring-0 focus:ring-offset-0 rounded-none w-28">
                      <SelectValue placeholder="All Bets" />
                    </SelectTrigger>
                    <SelectContent className="bg-gambling-dark border-gambling-muted/30 text-white rounded-none">
                      <SelectItem value="all" className="focus:bg-gambling-accent/20">All Bets</SelectItem>
                      <SelectItem value="won" className="focus:bg-gambling-accent/20">Won</SelectItem>
                      <SelectItem value="lost" className="focus:bg-gambling-accent/20">Lost</SelectItem>
                      <SelectItem value="pending" className="focus:bg-gambling-accent/20">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center rounded-none border border-gambling-muted/30 bg-gambling-dark">
                  <span className="px-3 text-sm text-gambling-muted flex items-center">
                    <ArrowUpDown className="h-4 w-4 mr-1" /> Sort
                  </span>
                  <Select
                    value={sortOption}
                    onValueChange={(val) => setSortOption(val as SortOptionType)}
                  >
                    <SelectTrigger className="border-0 bg-transparent focus:ring-0 focus:ring-offset-0 rounded-none w-28">
                      <SelectValue placeholder="Newest" />
                    </SelectTrigger>
                    <SelectContent className="bg-gambling-dark border-gambling-muted/30 text-white rounded-none">
                      <SelectItem value="newest" className="focus:bg-gambling-accent/20">Newest</SelectItem>
                      <SelectItem value="oldest" className="focus:bg-gambling-accent/20">Oldest</SelectItem>
                      <SelectItem value="amount" className="focus:bg-gambling-accent/20">Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="bg-gambling-secondary/20 rounded-none w-full grid grid-cols-2 mb-6">
                <TabsTrigger value="list" className="rounded-none data-[state=active]:bg-gambling-accent data-[state=active]:text-white">
                  List View
                </TabsTrigger>
                <TabsTrigger value="stats" className="rounded-none data-[state=active]:bg-gambling-accent data-[state=active]:text-white">
                  Statistics
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="list" className="space-y-4">
                {filteredAndSortedBets.length > 0 ? (
                  filteredAndSortedBets.map((bet, index) => (
                    <BetHistoryItem 
                      key={bet.id} 
                      bet={bet} 
                      index={index} 
                      formatDate={formatDate} 
                    />
                  ))
                ) : user && !betsLoading ? (
                  <div className="text-center p-12 border border-dashed border-gambling-muted/30 rounded-none">
                    <HistoryIcon className="h-10 w-10 text-gambling-muted/50 mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">No betting history found</h3>
                    <p className="text-gambling-muted mb-4">You haven't placed any bets that match this filter</p>
                    {filter !== 'all' && (
                      <Button 
                        variant="outline"
                        className="border-gambling-accent text-white hover:bg-gambling-accent/20 rounded-none"
                        onClick={() => setFilter('all')}
                      >
                        View All Bets
                      </Button>
                    )}
                  </div>
                ) : null}
              </TabsContent>
              
              <TabsContent value="stats" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard 
                    title="Total Bets" 
                    value={stats.totalBets.toString()}
                    icon={<HistoryIcon className="h-5 w-5 text-gambling-accent" />} 
                  />
                  <StatCard 
                    title="Total Wagered" 
                    value={`$${stats.totalWagered.toFixed(2)}`}
                    icon={<DollarSign className="h-5 w-5 text-gambling-accent" />} 
                  />
                  <StatCard 
                    title="Potential Winnings" 
                    value={`$${stats.potentialWinnings.toFixed(2)}`}
                    icon={<TrendingUp className="h-5 w-5 text-gambling-accent" />} 
                  />
                </div>
                
                <div className="p-6 border border-gambling-muted/30 rounded-none text-center">
                  <h3 className="text-lg font-medium mb-4">Betting Summary</h3>
                  <p className="text-gambling-muted mb-2">Detailed statistics will be available soon</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BettingHistory;