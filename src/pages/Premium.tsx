
import React from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, BarChart4, BarChartHorizontal, Clock, TrendingUp, Shield, Award } from "lucide-react";

const Premium = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gambling-dark text-white">
      <Header />
      
      <main className="flex-1 p-4 md:p-6 flex flex-col max-w-screen-2xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-2">
            <Crown className="h-8 w-8 text-gambling-accent" />
            <span>Premium Analytics</span>
          </h1>
          <p className="text-lg text-gambling-muted/80 mb-6">
            Take your betting to the next level with advanced analytics and real-time insights
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gambling-card border-gambling-muted">
            <CardHeader>
              <div className="p-3 bg-gambling-muted/20 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <BarChart4 className="h-6 w-6 text-gambling-secondary" />
              </div>
              <CardTitle className="text-xl font-bold">Advanced Statistics</CardTitle>
              <CardDescription className="text-gambling-muted/80">
                Detailed statistics on your betting patterns and success rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gambling-success" />
                  <span>Win rate by bet type</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gambling-success" />
                  <span>Performance over time</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gambling-success" />
                  <span>Optimal bet sizing</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-gambling-card border-gambling-muted">
            <CardHeader>
              <div className="p-3 bg-gambling-muted/20 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <BarChartHorizontal className="h-6 w-6 text-gambling-accent" />
              </div>
              <CardTitle className="text-xl font-bold">AI Predictions</CardTitle>
              <CardDescription className="text-gambling-muted/80">
                AI-powered predictions to improve your betting decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gambling-success" />
                  <span>Win probability estimates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gambling-success" />
                  <span>Trend analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gambling-success" />
                  <span>Pattern recognition</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-gambling-card border-gambling-muted">
            <CardHeader>
              <div className="p-3 bg-gambling-muted/20 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-gambling-primary" />
              </div>
              <CardTitle className="text-xl font-bold">Market Insights</CardTitle>
              <CardDescription className="text-gambling-muted/80">
                Real-time market data to identify opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gambling-success" />
                  <span>Odds movement tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gambling-success" />
                  <span>Market sentiment analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gambling-success" />
                  <span>Value bet identification</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="col-span-1 md:col-span-3 bg-gambling-card border-gambling-muted overflow-hidden">
            <div className="relative">
              <div className="absolute top-0 right-0 bg-gambling-accent text-white px-4 py-1 rounded-bl-lg font-medium text-sm">
                Most Popular
              </div>
              <CardHeader className="text-center pt-10">
                <div className="mx-auto p-3 bg-gambling-primary/20 rounded-full w-16 h-16 flex items-center justify-center mb-4 border border-gambling-primary">
                  <Crown className="h-8 w-8 text-gambling-accent" />
                </div>
                <CardTitle className="text-2xl font-bold">Pro Plan</CardTitle>
                <CardDescription className="text-gambling-muted/80">
                  Everything you need to dominate the betting market
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-bold">$19.99</span>
                  <span className="text-gambling-muted/80"> / month</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="flex flex-col items-center p-4 bg-gambling-muted/10 rounded-lg">
                    <Clock className="h-6 w-6 text-gambling-secondary mb-2" />
                    <h3 className="font-bold mb-1">24/7 Access</h3>
                    <p className="text-sm text-gambling-muted/80 text-center">
                      Get analytics and insights any time, day or night
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center p-4 bg-gambling-muted/10 rounded-lg">
                    <Shield className="h-6 w-6 text-gambling-accent mb-2" />
                    <h3 className="font-bold mb-1">Data Security</h3>
                    <p className="text-sm text-gambling-muted/80 text-center">
                      End-to-end encryption for all your betting data
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center p-4 bg-gambling-muted/10 rounded-lg">
                    <Award className="h-6 w-6 text-gambling-primary mb-2" />
                    <h3 className="font-bold mb-1">Premium Support</h3>
                    <p className="text-sm text-gambling-muted/80 text-center">
                      Priority customer support and dedicated team
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center pb-10">
                <Button className="bg-gambling-accent hover:bg-gambling-accent/80 text-white font-bold py-6 px-10 text-lg">
                  Subscribe Now
                </Button>
              </CardFooter>
            </div>
          </Card>
        </div>
        
        <div className="bg-gambling-muted/20 p-6 rounded-lg border border-gambling-muted/40 text-center max-w-3xl mx-auto">
          <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-gambling-accent" />
            <span>Already a Premium Member?</span>
          </h3>
          <p className="text-gambling-muted/80 mb-4">Log in to access your premium analytics dashboard</p>
          <Button className="bg-gambling-primary hover:bg-gambling-primary/80 text-white">
            Access Premium Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Premium;
