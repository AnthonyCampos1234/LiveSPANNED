import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/ui/icons';
import { toast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import { 
  User, 
  Wallet, 
  Upload,
  Download,
  History,
  Settings,
  LogOut,
  CreditCard,
  DollarSign,
  ChevronRight
} from 'lucide-react';

const Account: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/signin');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid deposit amount',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: 'Deposit Successful',
        description: `$${depositAmount} has been added to your account`,
      });
      setDepositAmount('');
      setIsProcessing(false);
    }, 1500);
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid withdrawal amount',
        variant: 'destructive',
      });
      return;
    }
    
    if (user && parseFloat(withdrawAmount) > user.balance) {
      toast({
        title: 'Insufficient Funds',
        description: 'Your withdrawal amount exceeds your available balance',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: 'Withdrawal Requested',
        description: `Your withdrawal of $${withdrawAmount} is being processed`,
      });
      setWithdrawAmount('');
      setIsProcessing(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Icons.spinner className="h-8 w-8 animate-spin text-gambling-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <User className="mr-2 h-6 w-6 text-gambling-accent" />
          Account Dashboard
        </h1>
        
        {/* Balance Card */}
        <Card className="border-gambling-accent border-2 bg-gambling-dark text-white rounded-none shadow-md mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gambling-muted mb-1">Available Balance</p>
                <h2 className="text-3xl font-bold flex items-center">
                  <DollarSign className="h-6 w-6 text-gambling-accent mr-1" />
                  {user?.balance.toFixed(2)}
                </h2>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="border-gambling-accent text-white hover:bg-gambling-accent/20 rounded-none"
                  onClick={() => document.getElementById('deposit-tab')?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Deposit
                </Button>
                <Button 
                  variant="outline" 
                  className="border-gambling-muted text-white hover:bg-gambling-muted/20 rounded-none"
                  onClick={() => document.getElementById('withdraw-tab')?.click()}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Withdraw
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Sidebar - Quick Links */}
          <div className="md:col-span-1">
            <Card className="border-gambling-accent/40 bg-gambling-dark text-white rounded-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav>
                  <Link to="/profile" className="flex items-center justify-between p-4 hover:bg-gambling-muted/10 border-l-2 border-transparent hover:border-gambling-accent">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-3 text-gambling-muted" />
                      <span>Profile</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gambling-muted" />
                  </Link>
                  <Link to="/betting-history" className="flex items-center justify-between p-4 hover:bg-gambling-muted/10 border-l-2 border-transparent hover:border-gambling-accent">
                    <div className="flex items-center">
                      <History className="h-4 w-4 mr-3 text-gambling-muted" />
                      <span>Betting History</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gambling-muted" />
                  </Link>
                  <Link to="/settings" className="flex items-center justify-between p-4 hover:bg-gambling-muted/10 border-l-2 border-transparent hover:border-gambling-accent">
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 mr-3 text-gambling-muted" />
                      <span>Settings</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gambling-muted" />
                  </Link>
                  <div onClick={handleSignOut} className="flex items-center justify-between p-4 hover:bg-gambling-muted/10 border-l-2 border-transparent hover:border-gambling-destructive cursor-pointer">
                    <div className="flex items-center">
                      <LogOut className="h-4 w-4 mr-3 text-gambling-destructive" />
                      <span className="text-gambling-destructive">Sign Out</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gambling-muted" />
                  </div>
                </nav>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Content - Deposit/Withdraw */}
          <div className="md:col-span-2">
            <Card className="border-gambling-accent/40 bg-gambling-dark text-white rounded-none shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Wallet className="mr-2 h-5 w-5 text-gambling-accent" />
                  Manage Funds
                </CardTitle>
                <CardDescription className="text-gambling-muted">
                  Deposit or withdraw funds from your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="deposit" className="w-full">
                  <TabsList className="bg-gambling-secondary/20 rounded-none w-full grid grid-cols-2 mb-6">
                    <TabsTrigger 
                      id="deposit-tab"
                      value="deposit" 
                      className="rounded-none data-[state=active]:bg-gambling-accent data-[state=active]:text-white"
                    >
                      Deposit
                    </TabsTrigger>
                    <TabsTrigger 
                      id="withdraw-tab"
                      value="withdraw" 
                      className="rounded-none data-[state=active]:bg-gambling-accent data-[state=active]:text-white"
                    >
                      Withdraw
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="deposit">
                    <form onSubmit={handleDeposit}>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center mb-1">
                            <CreditCard className="h-4 w-4 mr-2 text-gambling-muted" />
                            <p className="text-sm text-gambling-muted">Select Payment Method</p>
                          </div>
                          <div className="p-4 border border-gambling-muted/30 rounded-none bg-gambling-secondary/5 mb-4">
                            <div className="flex items-center">
                              <div className="w-5 h-5 rounded-full border border-gambling-accent flex items-center justify-center mr-3">
                                <div className="w-3 h-3 rounded-full bg-gambling-accent"></div>
                              </div>
                              <div>
                                <p className="font-medium">Credit Card</p>
                                <p className="text-xs text-gambling-muted">VISA •••• 4242</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="deposit-amount" className="text-sm text-gambling-muted flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            Deposit Amount
                          </label>
                          <Input
                            id="deposit-amount"
                            type="number"
                            min="10"
                            step="1"
                            placeholder="Enter deposit amount"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="bg-gambling-muted/30 border-gambling-muted/50 text-white rounded-none"
                          />
                          <p className="text-xs text-gambling-muted">Minimum deposit: $10.00</p>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-gambling-accent hover:bg-gambling-accent/80 rounded-none"
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Deposit Funds
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="withdraw">
                    <form onSubmit={handleWithdraw}>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center mb-1">
                            <Wallet className="h-4 w-4 mr-2 text-gambling-muted" />
                            <p className="text-sm text-gambling-muted">Select Withdrawal Method</p>
                          </div>
                          <div className="p-4 border border-gambling-muted/30 rounded-none bg-gambling-secondary/5 mb-4">
                            <div className="flex items-center">
                              <div className="w-5 h-5 rounded-full border border-gambling-accent flex items-center justify-center mr-3">
                                <div className="w-3 h-3 rounded-full bg-gambling-accent"></div>
                              </div>
                              <div>
                                <p className="font-medium">Bank Account</p>
                                <p className="text-xs text-gambling-muted">Checking •••• 1234</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="withdraw-amount" className="text-sm text-gambling-muted flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            Withdrawal Amount
                          </label>
                          <Input
                            id="withdraw-amount"
                            type="number"
                            min="10"
                            max={user?.balance}
                            step="1"
                            placeholder="Enter withdrawal amount"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="bg-gambling-muted/30 border-gambling-muted/50 text-white rounded-none"
                          />
                          <div className="flex justify-between">
                            <p className="text-xs text-gambling-muted">Minimum withdrawal: $10.00</p>
                            <p className="text-xs text-gambling-muted">Available: ${user?.balance.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-gambling-accent hover:bg-gambling-accent/80 rounded-none"
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              Withdraw Funds
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
