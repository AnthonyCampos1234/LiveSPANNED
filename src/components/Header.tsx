
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Bell, User, Menu, DollarSign, TrendingUp, ArrowUpRight, BarChart3, Zap, Trophy, Crown, UserCircle, LogOut, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [balance, setBalance] = useState(user?.balance || 1000);
  const [notifications, setNotifications] = useState(3);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  
  // Update balance when user changes
  useEffect(() => {
    if (user) {
      setBalance(user.balance);
    }
  }, [user]);
  
  const handleTrendingClick = () => {
    toast({
      title: "Top Trending Bets",
      description: "Loading the hottest political bets happening right now!",
    });
  };
  
  const handleLeaderboardClick = () => {
    toast({
      title: "Leaderboard",
      description: "View the top players and their winnings",
    });
  };
  
  const handleNotificationsClick = () => {
    toast({
      title: "Notifications",
      description: `You have ${notifications} new notifications`,
    });
    // Reset notification count after viewing
    setNotifications(0);
  };
  
  const handleDeposit = (amount: number) => {
    setBalance(prev => prev + amount);
    setShowDepositDialog(false);
    toast({
      title: "Deposit Successful",
      description: `$${amount} has been added to your account!`,
    });
  };

  return (
    <header className="w-full bg-black border-b border-gambling-muted/20 py-2 px-4 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        <div className="flex items-center">
          {isMobile && (
            <Button variant="ghost" size="icon" className="mr-2 text-white hover:bg-gambling-muted/10">
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <Link to="/" className="text-lg font-bold flex items-center gap-1">
            <Zap className="h-4 w-4 text-gambling-accent" />
            <span className="text-white">Live</span>
            <span className="text-gambling-accent font-extrabold">SPANNED</span>
          </Link>
          
          {!isMobile && (
            <nav className="ml-6 flex space-x-1">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-white hover:bg-gambling-muted/10 flex items-center gap-1" asChild>
                <Link to="/">
                  <Zap className="h-3.5 w-3.5 text-gambling-accent mr-1" />
                  Live
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-white hover:bg-gambling-muted/10" asChild>
                <Link to="/analytics">
                  <BarChart3 className="h-3.5 w-3.5 mr-1 text-white/70" />
                  Analytics
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-white hover:bg-gambling-muted/10" asChild>
                <Link to="/premium">
                  <Crown className="h-3.5 w-3.5 mr-1 text-gambling-accent" />
                  Premium
                </Link>
              </Button>
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 bg-black text-white border-gambling-muted/30 flex items-center gap-1"
          >
            <DollarSign className="h-3.5 w-3.5 text-gambling-success" />
            <span className="font-medium">${balance.toLocaleString()}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white hover:bg-gambling-muted/10"
            onClick={handleTrendingClick}
          >
            <TrendingUp className="h-4 w-4 text-white/70" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white hover:bg-gambling-muted/10"
            onClick={handleLeaderboardClick}
          >
            <Trophy className="h-4 w-4 text-white/70" />
          </Button>
          
          <div className="relative">
            {notifications > 0 && (
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-gambling-accent text-[10px] flex items-center justify-center text-white rounded-full font-bold z-10">
                {notifications}
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white hover:bg-gambling-muted/10 relative"
              onClick={handleNotificationsClick}
            >
              <Bell className="h-4 w-4 text-white/70" />
            </Button>
          </div>
          
          <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 hidden md:inline-flex bg-gambling-accent text-white hover:bg-gambling-accent/90 border-gambling-accent rounded-none"
              >
                <span>Deposit</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gambling-dark border-gambling-accent text-white rounded-none sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gambling-accent" />
                  Add Funds to Your Account
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  Choose an amount to deposit into your account.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-2 py-4">
                {[100, 250, 500, 1000, 2500, 5000].map((amount) => (
                  <Button 
                    key={amount} 
                    onClick={() => handleDeposit(amount)}
                    className="bg-gambling-muted/30 text-white hover:bg-gambling-accent rounded-none border border-gambling-accent/20"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-gambling-muted/30 text-white hover:bg-gambling-muted/40"
              >
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gambling-dark border-gambling-accent/50 text-white rounded-none min-w-[200px]">
              <DropdownMenuLabel className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-gambling-accent" />
                <span>Your Account</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gambling-muted/20" />
              <Link to="/profile">
                <DropdownMenuItem className="focus:bg-gambling-accent/20 cursor-pointer">
                  <User className="h-4 w-4 mr-2 text-gambling-muted" />
                  Profile
                </DropdownMenuItem>
              </Link>
              <Link to="/account">
                <DropdownMenuItem className="focus:bg-gambling-accent/20 cursor-pointer">
                  <DollarSign className="h-4 w-4 mr-2 text-gambling-muted" />
                  Account
                </DropdownMenuItem>
              </Link>
              <Link to="/betting-history">
                <DropdownMenuItem className="focus:bg-gambling-accent/20 cursor-pointer">
                  <TrendingUp className="h-4 w-4 mr-2 text-gambling-muted" />
                  Betting History
                </DropdownMenuItem>
              </Link>
              <Link to="/settings">
                <DropdownMenuItem className="focus:bg-gambling-accent/20 cursor-pointer">
                  <Settings className="h-4 w-4 mr-2 text-gambling-muted" />
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="bg-gambling-muted/20" />
              <DropdownMenuItem 
                className="focus:bg-gambling-accent/20 cursor-pointer text-gambling-destructive" 
                onClick={() => {
                  // Sign out logic will be handled here
                  toast({
                    title: "Signed Out",
                    description: "You have been successfully signed out"
                  });
                  // Navigate to sign in page
                  window.location.href = "/signin";
                }}
              >
                <LogOut className="h-4 w-4 mr-2 text-gambling-destructive" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
