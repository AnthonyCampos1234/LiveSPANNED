
import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendHorizontal, Users } from "lucide-react";
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isAdmin?: boolean;
}

const mockMessages: ChatMessage[] = [
  { id: '1', username: 'CPANfan', message: 'This hearing is so intense!', timestamp: new Date(Date.now() - 5000) },
  { id: '2', username: 'Moderator', message: 'Welcome to CSPAN Betting! Place your bets now.', timestamp: new Date(Date.now() - 30000), isAdmin: true },
  { id: '3', username: 'BetterThanCNN', message: 'Did you see that senator fidgeting?', timestamp: new Date(Date.now() - 60000) },
  { id: '4', username: 'PoliticalGambler', message: 'I\'m betting he says "infrastructure" in the next 5 minutes', timestamp: new Date(Date.now() - 120000) },
  { id: '5', username: 'D.C.Whale', message: 'Just won 500 on that last question! 🎉', timestamp: new Date(Date.now() - 180000) },
  { id: '6', username: 'Moderator', message: 'New betting round starts in 30 seconds!', timestamp: new Date(Date.now() - 240000), isAdmin: true },
];

const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        username: 'You',
        message: inputMessage,
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setInputMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-black border border-gambling-muted/20 overflow-hidden">
      <div className="p-2 border-b border-gambling-muted/20 flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="font-semibold text-xs text-gambling-accent uppercase">LIVE CHAT</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/50">
          <Users className="h-3 w-3" />
          <span>1,426</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 py-1 bg-black">
        {messages.map(msg => (
          <div key={msg.id} className="mb-1.5 last:mb-0 text-xs">
            <div className="flex flex-col">
              <div className="flex">
                <span className={cn(
                  "font-medium mr-1 text-xs", 
                  msg.isAdmin ? "text-gambling-accent" : 
                  "text-gambling-secondary"
                )}>
                  {msg.username}:
                </span>
                <span className="text-xs text-white">{msg.message}</span>
              </div>
              <div className="text-[10px] text-white/40 ml-0.5">
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-2 border-t border-gambling-muted/20 flex items-center gap-2 bg-black">
        <Input
          className="bg-gambling-muted/10 border-gambling-muted/30 focus-visible:ring-0 text-xs h-7 rounded-none"
          placeholder="Send a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button 
          size="sm" 
          className="h-7 w-7 p-0 rounded-none bg-gambling-accent hover:bg-gambling-accent/90"
          onClick={handleSendMessage}
        >
          <SendHorizontal className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default ChatBox;
