
import React, { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Lock, Volume2, Users, DollarSign, Zap, FlameKindling, Maximize2 } from "lucide-react";
import { useVideo } from '@/contexts/VideoContext';



const Analytics = () => {
  const [isPredictionsVisible, setIsPredictionsVisible] = useState(false);
  const { currentTime, isPlaying, updateTime, play, pause, registerVideoRef, syncVideoElement } = useVideo();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Register video ref with context
  useEffect(() => {
    if (videoRef.current) {
      registerVideoRef(videoRef.current);
      return () => registerVideoRef(null);
    }
  }, [registerVideoRef]);
  
  // Sync video with shared context state
  useEffect(() => {
    if (videoRef.current) {
      // Make sure video is muted to avoid autoplay issues
      videoRef.current.muted = true;
      // Sync with current playback position and state
      syncVideoElement(videoRef.current);
      
      console.log('Analytics: Video synced with main page', {
        time: currentTime,
        playing: isPlaying
      });
    }
  }, [currentTime, isPlaying, syncVideoElement]);

  return (
    <div className="min-h-screen flex flex-col bg-gambling-dark text-white">
      <Header />
      
      <main className="flex-1 p-4 flex flex-col max-w-screen-2xl mx-auto w-full h-[calc(100vh-64px)] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">CSPAN Analysis Platform</h1>
          
          <Button variant="outline" className="bg-gambling-card border-gambling-accent text-gambling-accent hover:bg-gambling-accent hover:text-white" onClick={() => setIsPredictionsVisible(!isPredictionsVisible)}>
            {isPredictionsVisible ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {isPredictionsVisible ? "Hide Predictions" : "Show Predictions"}
          </Button>
        </div>

        <Card className="bg-gambling-card border-gambling-muted">
          <CardContent className="flex flex-col lg:flex-row gap-6 p-6">
            <div className="w-full lg:w-2/3">
              <div className="relative bg-black rounded-none overflow-hidden">
                <div className="w-full h-full bg-black relative overflow-hidden border-2 border-gambling-accent/30 shadow-lg">
                  {/* Live badge */}
                  <div className="absolute top-0 left-0 w-full z-10 p-2 bg-black/80 flex justify-between items-center">
                    <div className="bg-gambling-accent text-white text-xs font-bold px-2 py-1 rounded-sm inline-flex items-center gap-1">
                      <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                      <span>LIVE ANALYSIS</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <div className="bg-black/80 text-white text-xs px-2 py-1 rounded-sm flex items-center gap-1">
                        <Users className="h-3 w-3 text-gambling-secondary" />
                        <span>14,632</span>
                      </div>
                      
                      <div className="bg-gambling-accent text-white text-xs px-2 py-1 rounded-sm flex items-center gap-1">
                        <FlameKindling className="h-3 w-3" />
                        <span>LIVE</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Local Video player - synchronized with main page */}
                  <video 
                    ref={videoRef}
                    className="w-full aspect-video bg-black min-h-[320px]"
                    loop
                    muted
                    playsInline
                    style={{ objectFit: 'cover' }}
                    src="/slowed_video.mp4"
                  ></video>
                  
                  {/* Bottom controls */}
                  <div className="absolute bottom-0 left-0 w-full z-10 p-2 bg-black/80 flex justify-between items-center">
                    <div className="text-white font-bold flex items-center gap-1.5 text-sm">
                      <Zap className="h-3.5 w-3.5 text-gambling-accent" />
                      <span className="truncate">Senate Judiciary Committee Analysis</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-white bg-gambling-accent/90 px-2 py-1 rounded-sm flex items-center gap-1">
                        <Volume2 className="h-3 w-3" />
                        <span className="text-xs font-bold">LIVE</span>
                      </div>
                      
                      <button className="bg-gambling-accent hover:bg-gambling-accent/80 p-1 rounded-sm flex items-center justify-center">
                        <Maximize2 className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-1/3">
              <div className={`bg-gambling-dark border border-gambling-accent p-4 rounded-none h-full relative ${!isPredictionsVisible ? 'blur-md' : ''}`}>
                <h3 className="text-lg font-bold text-gambling-accent mb-4">Coal Industry Executive Orders Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gambling-muted/80">Presidential Intent Analysis</p>
                    <div className="w-full bg-gambling-muted/20 rounded-none h-2 mt-1">
                      <div className="bg-gambling-accent h-2 rounded-none" style={{ width: '86%' }}></div>
                    </div>
                    <p className="text-sm mt-1">Confidence: 86% Pro-Coal Industry</p>
                  </div>
                  <div>
                    <p className="text-sm text-gambling-muted/80">Next Likely Statement</p>
                    <p className="text-sm mt-1 font-semibold">Reference to "Obama-era regulations being targeted"</p>
                    <p className="text-sm">Probability: 92%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gambling-muted/80">Hand Movement Analysis</p>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span>Gesture Frequency</span>
                      <span>Increasing</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Movement Variance</span>
                      <span>0.06</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gambling-muted/80">Miner Reaction Prediction</p>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span>Likely to Applaud</span>
                      <span>93%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Handshake Probability</span>
                      <span>87%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gambling-muted/80">Signing Analysis</p>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span>Executive Orders</span>
                      <span>2 predicted</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Ceremonial Emphasis</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
                {!isPredictionsVisible && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/60 p-4 rounded-none flex items-center">
                      <Lock className="h-6 w-6 text-gambling-accent mr-2" />
                      <span className="text-white font-bold">Premium Feature</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Analytics;
