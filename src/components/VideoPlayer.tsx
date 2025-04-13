import React, { useRef, useEffect } from 'react';
import { Volume2, Users, DollarSign, Zap, FlameKindling, Maximize2 } from 'lucide-react';
import { useVideo } from '@/contexts/VideoContext';

interface VideoPlayerProps {
  videoId?: string; // YouTube video ID
  videoSrc?: string; // Local video file path
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, videoSrc }) => {
  // Use the shared video context
  const { currentTime, isPlaying, updateTime, play, pause, registerVideoRef, syncVideoElement } = useVideo();
  // Keep a local reference for this component instance
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Register the video ref with the context when it's available
  useEffect(() => {
    if (videoRef.current) {
      registerVideoRef(videoRef.current);
      // Return a cleanup function to unregister when unmounting
      return () => registerVideoRef(null);
    }
  }, [registerVideoRef]);
  
  // Initialize the video and sync with shared state
  useEffect(() => {
    if (videoRef.current) {
      // Always mute to avoid autoplay restrictions
      videoRef.current.muted = true;
      
      // Sync this video with the shared state
      syncVideoElement(videoRef.current);
    }
  }, [currentTime, isPlaying, syncVideoElement]);
  
  // Update the shared state when the video time changes
  useEffect(() => {
    const handleTimeUpdate = () => {
      if (videoRef.current) {
        updateTime(videoRef.current.currentTime);
      }
    };
    
    const handlePlay = () => {
      play();
    };
    
    const handlePause = () => {
      pause();
    };
    
    const video = videoRef.current;
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
    }
    
    return () => {
      if (video) {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
      }
    };
  }, [updateTime, play, pause]);

  return (
    <div className="w-full h-full bg-black relative overflow-hidden border-2 border-gambling-accent/30 shadow-lg">
      {/* Live badge */}
      <div className="absolute top-0 left-0 w-full z-10 p-2 bg-black/80 flex justify-between items-center">
        <div className="bg-gambling-accent text-white text-xs font-bold px-2 py-1 rounded-sm inline-flex items-center gap-1">
          <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
          <span>LIVE</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded-sm flex items-center gap-1">
            <Users className="h-3 w-3 text-gambling-secondary" />
            <span>14,632</span>
          </div>
          
          <div className="bg-black/80 text-gambling-success text-xs px-2 py-1 rounded-sm flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>$243,892</span>
          </div>
          
          <div className="bg-gambling-accent text-white text-xs px-2 py-1 rounded-sm flex items-center gap-1">
            <FlameKindling className="h-3 w-3" />
            <span>LIVE</span>
          </div>
        </div>
      </div>
      
      {/* Local Video player */}
      <video 
        ref={videoRef}
        className="w-full aspect-video bg-black min-h-[320px]"
        loop
        muted
        playsInline
        autoPlay
        style={{ objectFit: 'cover' }}
      >
        <source src={videoSrc || "/President Trump Signs Executive Orders Supporting Coal Industry.mp4"} type="video/mp4" />
      </video>
      
      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 w-full z-10 p-2 bg-black/80 flex justify-between items-center">
        <div className="text-white font-bold flex items-center gap-1.5 text-sm">
          <Zap className="h-3.5 w-3.5 text-gambling-accent" />
          <span className="truncate">Senate Judiciary Committee Hearing</span>
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
  );
};

export default VideoPlayer;
