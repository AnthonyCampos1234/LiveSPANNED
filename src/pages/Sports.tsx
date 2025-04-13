
import React from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, TrendingUp, Timer, Users, DollarSign, Trophy, Dumbbell } from "lucide-react";

// Use custom sport icons since lucide-react doesn't have Football, Baseball, and Basketball icons
const FootballIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
    <path d="M12 22c-1.4 0-2.6-.3-3.7-.9l.4-5.3L12 12l3.3 3.8.4 5.3c-1.1.6-2.3.9-3.7.9z"/>
    <path d="M12 2c1.4 0 2.6.3 3.7.9l-.4 5.3L12 12l-3.3-3.8-.4-5.3c1.1-.6 2.3-.9 3.7-.9z"/>
    <path d="M3.7 5.7c.8-1.1 1.8-2.1 2.9-2.9l1.5 5-1.2 4.9-5 1.5c-.8-1.1-1.4-2.5-1.7-3.9.3-1.7.8-3.2 1.7-4.6z"/>
    <path d="M20.3 5.7c-.8-1.1-1.8-2.1-2.9-2.9l-1.5 5 1.2 4.9 5 1.5c.8-1.1 1.4-2.5 1.7-3.9-.3-1.7-.8-3.2-1.7-4.6z"/>
    <path d="M20.3 18.3c-.8 1.1-1.8 2.1-2.9 2.9l-1.5-5-1.2-4.9 5-1.5c.8 1.1 1.4 2.5 1.7 3.9-.3 1.7-.8 3.2-1.7 4.6z"/>
    <path d="M3.7 18.3c.8 1.1 1.8 2.1 2.9 2.9l1.5-5L7 11.4l-5-1.5c-.8 1.1-1.4 2.5-1.7 3.9.3 1.7.8 3.2 1.7 4.6z"/>
  </svg>
);

const BasketballIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M4.93 4.93c4.96 4.96 14.14 0 14.14 0"/>
    <path d="M4.93 19.07c4.96-4.96 14.14 0 14.14 0"/>
    <path d="M2 12h20"/>
    <path d="M12 2v20"/>
  </svg>
);

const BaseballIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M5.5 5.5c7.5 7.5 0 13 0 13"/>
    <path d="M18.5 5.5c-7.5 7.5 0 13 0 13"/>
    <path d="M5.5 18.5c7.5-7.5 13 0 13 0"/>
    <path d="M5.5 5.5c7.5-7.5 13 0 13 0"/>
  </svg>
);

const sportsCategories = [
  { name: "All Sports", icon: Trophy },
  { name: "Football", icon: FootballIcon },
  { name: "Basketball", icon: BasketballIcon },
  { name: "Baseball", icon: BaseballIcon },
  { name: "MMA/Boxing", icon: Dumbbell },
];

const upcomingMatches = [
  {
    id: 1,
    team1: "Lakers",
    team2: "Celtics",
    time: "19:30",
    odds1: 1.85,
    odds2: 2.15,
    viewers: 8435,
    category: "Basketball",
  },
  {
    id: 2,
    team1: "Chiefs",
    team2: "Bills",
    time: "20:00",
    odds1: 1.55,
    odds2: 2.45,
    viewers: 12650,
    category: "Football",
  },
  {
    id: 3,
    team1: "Yankees",
    team2: "Red Sox",
    time: "18:15",
    odds1: 2.05,
    odds2: 1.75,
    viewers: 6230,
    category: "Baseball",
  },
  {
    id: 4,
    team1: "Mahomes",
    team2: "Allen",
    time: "Live",
    odds1: 1.35,
    odds2: 3.25,
    viewers: 18920,
    category: "Football",
    isLive: true,
  },
];

const Sports = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gambling-dark text-white">
      <Header />
      
      <main className="flex-1 p-4 md:p-6 flex flex-col max-w-screen-2xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-64px-32px)] overflow-hidden">
          <div className="lg:col-span-1">
            <Card className="bg-gambling-card border-gambling-muted h-full">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Sports Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="flex flex-col">
                  {sportsCategories.map((category, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className={`justify-start rounded-none border-l-2 border-transparent px-4 py-6 ${
                        index === 0 ? "bg-gambling-muted/20 border-l-gambling-accent" : ""
                      }`}
                    >
                      <category.icon className="h-5 w-5 mr-3 text-gambling-secondary" />
                      <span>{category.name}</span>
                    </Button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
            <Tabs defaultValue="upcoming" className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <TabsList className="bg-gambling-muted/20">
                  <TabsTrigger value="upcoming" className="data-[state=active]:bg-gambling-muted data-[state=active]:text-white">
                    Upcoming
                  </TabsTrigger>
                  <TabsTrigger value="live" className="data-[state=active]:bg-gambling-muted data-[state=active]:text-white">
                    Live Now
                  </TabsTrigger>
                  <TabsTrigger value="popular" className="data-[state=active]:bg-gambling-muted data-[state=active]:text-white">
                    Popular
                  </TabsTrigger>
                </TabsList>
                
                <Button variant="ghost" size="sm" className="text-gambling-secondary">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <TabsContent value="upcoming" className="flex-1 overflow-auto space-y-4 mt-0">
                {upcomingMatches.map((match) => (
                  <Card key={match.id} className={`bg-gambling-card border-gambling-muted overflow-hidden ${
                    match.isLive ? "border-gambling-accent glow-accent" : ""
                  }`}>
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 md:mb-0">
                          <div className="flex items-center">
                            {match.isLive ? (
                              <div className="bg-gambling-accent text-white text-xs font-semibold px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 mr-3">
                                <span className="animate-pulse-betting h-2 w-2 bg-white rounded-full"></span>
                                <span className="uppercase tracking-wider">LIVE</span>
                              </div>
                            ) : (
                              <div className="text-gambling-muted/80 flex items-center gap-1.5 mr-3">
                                <Timer className="h-4 w-4" />
                                <span>{match.time}</span>
                              </div>
                            )}
                            
                            <div className="text-sm px-2 py-1 bg-gambling-muted/20 rounded text-gambling-secondary">
                              {match.category}
                            </div>
                          </div>
                          
                          <div className="text-xl font-bold">
                            {match.team1} vs {match.team2}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-gambling-muted/80">
                            <Users className="h-4 w-4" />
                            <span>{match.viewers.toLocaleString()}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button className="bg-gambling-card hover:bg-gambling-muted border border-gambling-muted/50">
                              <span className="mr-1">{match.team1}</span>
                              <span className="text-gambling-secondary">{match.odds1}</span>
                            </Button>
                            
                            <Button className="bg-gambling-card hover:bg-gambling-muted border border-gambling-muted/50">
                              <span className="mr-1">{match.team2}</span>
                              <span className="text-gambling-secondary">{match.odds2}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="live" className="flex-1 overflow-auto space-y-4 mt-0">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 text-gambling-muted/50 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Live Events Right Now</h3>
                    <p className="text-gambling-muted/80 max-w-md">
                      Check back soon for live events or explore upcoming matches
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="popular" className="flex-1 overflow-auto space-y-4 mt-0">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-gambling-muted/50 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Trending Matches</h3>
                    <p className="text-gambling-muted/80 max-w-md">
                      We're preparing the most popular matches. Check back soon!
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Sports;
