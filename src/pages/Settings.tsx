import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/ui/icons';
import { toast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import { 
  UserCog, 
  Bell, 
  Shield, 
  Wallet, 
  LogOut,
  Save,
  AlertTriangle
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user, signOut, updateProfile, loading } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notifications, setNotifications] = useState({
    betResults: true,
    newQuestions: true,
    promotions: false
  });
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
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (error) {
      console.error('Update profile error:', error);
      toast({
        title: 'Update Failed',
        description: 'There was an error updating your profile',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    toast({
      title: 'Notifications Updated',
      description: 'Your notification preferences have been updated',
    });
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
          <UserCog className="mr-2 h-6 w-6 text-gambling-accent" />
          Account Settings
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <Card className="border-gambling-accent/40 bg-gambling-dark text-white rounded-none shadow-md">
              <CardContent className="p-0">
                <nav className="flex flex-col">
                  <a href="#profile" className="p-4 border-l-2 border-gambling-accent bg-gambling-secondary/20">
                    Profile
                  </a>
                  <a href="#notifications" className="p-4 border-l-2 border-transparent hover:bg-gambling-secondary/10">
                    Notifications
                  </a>
                  <a href="#security" className="p-4 border-l-2 border-transparent hover:bg-gambling-secondary/10">
                    Security
                  </a>
                  <a href="#payment" className="p-4 border-l-2 border-transparent hover:bg-gambling-secondary/10">
                    Payment Methods
                  </a>
                </nav>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Profile Section */}
            <Card id="profile" className="border-gambling-accent/40 bg-gambling-dark text-white rounded-none shadow-md mb-6">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  Profile Information
                </CardTitle>
                <CardDescription className="text-gambling-muted">
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-gambling-muted/30 border-gambling-muted/50 text-white rounded-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="bg-gambling-muted/30 border-gambling-muted/50 text-white/70 rounded-none cursor-not-allowed"
                      />
                      <p className="text-xs text-gambling-muted italic">Email cannot be changed</p>
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
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            {/* Notifications Section */}
            <Card id="notifications" className="border-gambling-accent/40 bg-gambling-dark text-white rounded-none shadow-md mb-6">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Bell className="mr-2 h-5 w-5 text-gambling-accent" />
                  Notification Settings
                </CardTitle>
                <CardDescription className="text-gambling-muted">
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Bet Results</h4>
                      <p className="text-sm text-gambling-muted">Get notified when your bets are settled</p>
                    </div>
                    <Switch 
                      checked={notifications.betResults} 
                      onCheckedChange={() => handleNotificationChange('betResults')}
                      className="data-[state=checked]:bg-gambling-accent"
                    />
                  </div>
                  <Separator className="bg-gambling-muted/20" />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">New Questions</h4>
                      <p className="text-sm text-gambling-muted">Get notified when new betting questions are available</p>
                    </div>
                    <Switch 
                      checked={notifications.newQuestions} 
                      onCheckedChange={() => handleNotificationChange('newQuestions')} 
                      className="data-[state=checked]:bg-gambling-accent"
                    />
                  </div>
                  <Separator className="bg-gambling-muted/20" />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Promotions and Offers</h4>
                      <p className="text-sm text-gambling-muted">Receive emails about promotions and special offers</p>
                    </div>
                    <Switch 
                      checked={notifications.promotions} 
                      onCheckedChange={() => handleNotificationChange('promotions')} 
                      className="data-[state=checked]:bg-gambling-accent"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Security Section */}
            <Card id="security" className="border-gambling-accent/40 bg-gambling-dark text-white rounded-none shadow-md mb-6">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-gambling-accent" />
                  Security Settings
                </CardTitle>
                <CardDescription className="text-gambling-muted">
                  Manage your account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="flex gap-3">
                    <Input
                      id="password"
                      type="password"
                      value="••••••••••"
                      disabled
                      className="bg-gambling-muted/30 border-gambling-muted/50 text-white/70 rounded-none cursor-not-allowed"
                    />
                    <Button 
                      variant="outline" 
                      className="border-gambling-accent text-white hover:bg-gambling-accent/20 rounded-none"
                      onClick={() => toast({
                        title: 'Feature Coming Soon',
                        description: 'Password reset functionality will be available soon.',
                      })}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Payment Methods Section */}
            <Card id="payment" className="border-gambling-accent/40 bg-gambling-dark text-white rounded-none shadow-md mb-6">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Wallet className="mr-2 h-5 w-5 text-gambling-accent" />
                  Payment Methods
                </CardTitle>
                <CardDescription className="text-gambling-muted">
                  Manage your payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center p-4 border border-dashed border-gambling-muted/40 rounded-none mb-4">
                  <p className="text-gambling-muted">No payment methods added yet</p>
                  <Button 
                    variant="outline"
                    className="mt-2 border-gambling-accent text-white hover:bg-gambling-accent/20 rounded-none"
                    onClick={() => toast({
                      title: 'Feature Coming Soon',
                      description: 'Payment method management will be available soon.',
                    })}
                  >
                    Add Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Account Actions */}
            <Card className="border-gambling-destructive/40 bg-gambling-dark text-white rounded-none shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center text-gambling-destructive">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Account Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-gambling-destructive/30 rounded-none">
                  <h4 className="font-medium mb-2">Sign Out From All Devices</h4>
                  <p className="text-sm text-gambling-muted mb-3">This will sign you out from all devices you're currently signed in on.</p>
                  <Button 
                    variant="outline" 
                    className="border-gambling-destructive text-gambling-destructive hover:bg-gambling-destructive/10 rounded-none w-full"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
