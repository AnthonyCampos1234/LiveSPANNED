import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBetting } from '@/contexts/BettingContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/ui/icons';
import { UserBet } from '@/lib/supabase';
import { DollarSign, Star, Bell, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, signOut, updateProfile, loading } = useAuth();
  const { userBets, loadingBets } = useBetting();
  const [username, setUsername] = useState(user?.username || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  // Redirect if not logged in
  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/signin');
    }
  }, [user, loading, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !username) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      await updateProfile({ username });
    } catch (error) {
      console.error('Update profile error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Icons.spinner className="h-8 w-8 animate-spin text-gambling-accent" />
      </div>
    );
  }

  // Format bets for display
  const activeBets = userBets.filter(bet => !bet.is_settled);
  const settledBets = userBets.filter(bet => bet.is_settled);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="container max-w-4xl mx-auto py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Card */}
          <Card className="md:w-1/3 border-gambling-accent bg-gambling-dark text-white rounded-none">
            <CardHeader className="border-b border-gambling-accent/40 rounded-none">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24 border-2 border-gambling-accent">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-gambling-secondary text-lg">
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <CardTitle className="text-xl">{user.username}</CardTitle>
                  <CardDescription className="text-gambling-muted">
                    {user.email}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex justify-between items-center p-4 bg-gambling-secondary/20 rounded-none">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-gambling-accent" />
                  <span className="text-sm">Balance</span>
                </div>
                <span className="font-bold text-lg">${user.balance.toFixed(2)}</span>
              </div>
              
              <form onSubmit={handleUpdateProfile}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-gambling-muted border-gambling-muted/50 text-white rounded-none"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gambling-accent hover:bg-gambling-accent/80 rounded-none"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Profile'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full border-gambling-muted text-white hover:bg-gambling-muted/20 rounded-none"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </CardFooter>
          </Card>
          
          {/* Bets History */}
          <div className="flex-1">
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="bg-gambling-dark border border-gambling-muted/30 rounded-none w-full grid grid-cols-2">
                <TabsTrigger value="active" className="rounded-none data-[state=active]:bg-gambling-accent">
                  Active Bets
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-none data-[state=active]:bg-gambling-accent">
                  Betting History
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="mt-4">
                <Card className="border-gambling-accent bg-gambling-dark text-white rounded-none">
                  <CardHeader className="border-b border-gambling-accent/40 rounded-none">
                    <CardTitle className="text-lg flex items-center">
                      <Star className="h-5 w-5 mr-2 text-gambling-accent" />
                      Active Bets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {loadingBets ? (
                      <div className="flex justify-center p-8">
                        <Icons.spinner className="h-6 w-6 animate-spin text-gambling-accent" />
                      </div>
                    ) : activeBets.length > 0 ? (
                      <div className="space-y-4">
                        {activeBets.map((bet) => (
                          <BetItem key={bet.id} bet={bet} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8 text-gambling-muted">
                        You don't have any active bets
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="history" className="mt-4">
                <Card className="border-gambling-accent bg-gambling-dark text-white rounded-none">
                  <CardHeader className="border-b border-gambling-accent/40 rounded-none">
                    <CardTitle className="text-lg flex items-center">
                      <Bell className="h-5 w-5 mr-2 text-gambling-accent" />
                      Betting History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {loadingBets ? (
                      <div className="flex justify-center p-8">
                        <Icons.spinner className="h-6 w-6 animate-spin text-gambling-accent" />
                      </div>
                    ) : settledBets.length > 0 ? (
                      <div className="space-y-4">
                        {settledBets.map((bet) => (
                          <BetItem key={bet.id} bet={bet} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8 text-gambling-muted">
                        You don't have any settled bets
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component to display a bet item
interface BetItemProps {
  bet: UserBet;
}

const BetItem: React.FC<BetItemProps> = ({ bet }) => {
  // This is a placeholder - in reality, you'd get these from the bet object using relations
  const questionTitle = "Question Title"; // would come from betting_questions relation
  const optionText = "Option Text"; // would come from betting_options relation
  const isWinner = Math.random() > 0.5; // For demonstration only - would come from the bet object
  
  return (
    <div className="p-4 border border-gambling-muted/30 rounded-none">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-white">{questionTitle}</h4>
        <div className="flex items-center">
          {bet.is_settled ? (
            isWinner ? (
              <div className="flex items-center text-gambling-success">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-xs">Won</span>
              </div>
            ) : (
              <div className="flex items-center text-gambling-destructive">
                <XCircle className="h-4 w-4 mr-1" />
                <span className="text-xs">Lost</span>
              </div>
            )
          ) : (
            <div className="px-2 py-1 bg-gambling-secondary/20 text-white text-xs">
              Pending
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-3 text-sm text-gambling-muted">
        {optionText}
      </div>
      
      <Separator className="my-2 bg-gambling-muted/20" />
      
      <div className="flex justify-between items-center mt-2 text-sm">
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 mr-1 text-gambling-muted" />
          <span>Bet: ${bet.amount.toFixed(2)}</span>
        </div>
        <div className="flex items-center">
          <TrendingUp className="h-4 w-4 mr-1 text-gambling-accent" />
          <span>Potential: ${bet.potential_payout.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default Profile;
