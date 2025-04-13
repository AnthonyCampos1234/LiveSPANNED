import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, AlertTriangle, X, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BetResultModalProps {
  open: boolean;
  onClose: () => void;
  win: boolean;
  amount: number;
  questionText: string;
  optionText: string;
  payout?: number;
}

const BetResultModal: React.FC<BetResultModalProps> = ({
  open,
  onClose,
  win,
  amount,
  questionText,
  optionText,
  payout
}) => {
  // Force document.body to have overflow hidden when modal is open
  useEffect(() => {
    if (open) {
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
      console.log('🎯 BET RESULT MODAL RENDERED 🎯');
      console.log(`Modal status: OPEN=${open}, WIN=${win}, AMOUNT=${amount}, PAYOUT=${payout}`);
      
      // Auto-close after 8 seconds
      const timer = setTimeout(() => {
        console.log('⏱️ BetResultModal auto-closing');
        onClose();
      }, 8000);
      
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }
  }, [open, onClose, win, amount, payout]);
  
  // Only render if open is true
  if (!open) return null;
  
  // Use ReactDOM.createPortal to ensure the modal is rendered at the root level
  return ReactDOM.createPortal(
    <div className="fixed inset-0 overflow-hidden flex items-center justify-center z-[9999]">
      {/* Backdrop with click handler */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
        className={cn(
          "relative z-[10000] w-full max-w-3xl overflow-auto p-4",
          "md:max-h-[calc(100vh-2rem)] md:rounded-lg md:shadow-xl"
        )}
      >
        <div 
          className={cn(
            "relative w-full overflow-hidden rounded-lg", 
            win ? "bg-gambling-success" : "bg-red-600"
          )}
        >
          <header className="p-6 border-b border-white/20">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                {win ? <CheckCircle size={36} className="text-white" /> : <XCircle size={36} className="text-white" />}
                {win ? 'BET WON!' : 'BET LOST'}
              </h2>
              <button 
                onClick={onClose} 
                className="text-white hover:text-white/80 bg-black/20 p-2 rounded-full"
              >
                <X size={28} />
              </button>
            </div>
            <p className="text-xl text-white mt-3 font-medium">
              {win ? 'Congratulations! Your prediction was correct.' : 'Better luck next time!'}
            </p>
          </header>

          <div className="p-6">
            <div className={cn(
              "p-6 rounded-lg text-white w-full max-w-md mx-auto",
              win ? "bg-white/20 border-2 border-yellow-300" : "bg-black/20"
            )}>
              <div className="flex items-center mb-6">
                {win 
                  ? <Award className="h-10 w-10 mr-3 text-yellow-300" /> 
                  : <AlertTriangle className="h-10 w-10 mr-3 text-yellow-300" />}
                <span className="font-bold text-3xl">{win ? 'You Won!' : 'You Lost'}</span>
              </div>
              
              <div className="space-y-4">
                <div className="bg-black/30 p-4 rounded">
                  <p className="font-medium mb-1 text-white/80">Question:</p>
                  <p className="text-white font-semibold text-lg">{questionText}</p>
                </div>
                
                <div className="bg-black/30 p-4 rounded">
                  <p className="font-medium mb-1 text-white/80">Your bet:</p>
                  <p className="text-white font-semibold text-lg">{optionText}</p>
                </div>
                
                <div className="flex items-center justify-between bg-black/30 p-4 rounded">
                  <span className="font-medium">Amount Bet:</span>
                  <span className="font-bold text-xl">${amount}</span>
                </div>
                
                {win && (
                  <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1.05 }}
                    transition={{ 
                      repeat: 3, 
                      repeatType: "reverse", 
                      duration: 0.5 
                    }}
                    className="flex items-center justify-between bg-black/30 p-4 rounded border-2 border-yellow-300"
                  >
                    <span className="font-medium text-xl">Payout:</span>
                    <span className="font-bold text-3xl text-yellow-300 flex items-center">
                      <DollarSign className="h-6 w-6 mr-1" />
                      {payout}
                    </span>
                  </motion.div>
                )}
                
                <div className="mt-6 text-center">
                  <button 
                    onClick={onClose}
                    className="bg-black/30 hover:bg-black/50 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default BetResultModal;
