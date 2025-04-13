import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface VideoContextType {
  currentTime: number;
  isPlaying: boolean;
  updateTime: (time: number) => void;
  play: () => void;
  pause: () => void;
  registerVideoRef: (ref: HTMLVideoElement | null) => void;
  syncVideoElement: (videoElement: HTMLVideoElement) => void;
}

// Create the context with default values
const VideoContext = createContext<VideoContextType>({
  currentTime: 0,
  isPlaying: false,
  updateTime: () => {},
  play: () => {},
  pause: () => {},
  registerVideoRef: () => {},
  syncVideoElement: () => {}
});

export const useVideo = () => useContext(VideoContext);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  
  // Store the video state in localStorage to maintain it across page navigations
  useEffect(() => {
    const storedTime = localStorage.getItem('video-current-time');
    const storedIsPlaying = localStorage.getItem('video-is-playing');
    
    if (storedTime) {
      setCurrentTime(parseFloat(storedTime));
    }
    
    if (storedIsPlaying) {
      setIsPlaying(storedIsPlaying === 'true');
    }
    
    // Sync state to localStorage when component unmounts
    return () => {
      localStorage.setItem('video-current-time', currentTime.toString());
      localStorage.setItem('video-is-playing', isPlaying.toString());
    };
  }, []);
  
  // Update localStorage when state changes
  useEffect(() => {
    localStorage.setItem('video-current-time', currentTime.toString());
    localStorage.setItem('video-is-playing', isPlaying.toString());
  }, [currentTime, isPlaying]);
  
  // Function to update the current time
  const updateTime = (time: number) => {
    setCurrentTime(time);
    setLastUpdateTime(Date.now());
  };
  
  // Function to play the video
  const play = () => {
    setIsPlaying(true);
  };
  
  // Function to pause the video
  const pause = () => {
    setIsPlaying(false);
  };
  
  // Function to register a video reference
  const registerVideoRef = (ref: HTMLVideoElement | null) => {
    if (ref && !videoRefs.current.includes(ref)) {
      videoRefs.current = [...videoRefs.current, ref];
    } else if (!ref) {
      // Clean up any null references
      videoRefs.current = videoRefs.current.filter(Boolean);
    }
  };
  
  // Function to sync a video element with current state
  const syncVideoElement = (videoElement: HTMLVideoElement) => {
    if (!videoElement) return;
    
    // Sync time position if needed
    if (Math.abs(videoElement.currentTime - currentTime) > 0.5) {
      videoElement.currentTime = currentTime;
    }
    
    // Sync play/pause state
    if (isPlaying && videoElement.paused) {
      videoElement.play().catch(err => {
        console.error('Error playing synchronized video:', err);
      });
    } else if (!isPlaying && !videoElement.paused) {
      videoElement.pause();
    }
  };
  
  // Sync all registered videos when state changes
  useEffect(() => {
    videoRefs.current.forEach(videoElement => {
      if (videoElement) {
        syncVideoElement(videoElement);
      }
    });
  }, [currentTime, isPlaying]);
  
  return (
    <VideoContext.Provider 
      value={{ 
        currentTime, 
        isPlaying, 
        updateTime, 
        play, 
        pause,
        registerVideoRef,
        syncVideoElement
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};
