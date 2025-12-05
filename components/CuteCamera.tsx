import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface CuteCameraProps {
  onClick: () => void;
  queueCount: number;
  isProcessing: boolean;
  progress: number;
  stream?: MediaStream | null;
  flashTrigger?: boolean; // New prop for manual flash
}

const CuteCamera: React.FC<CuteCameraProps> = ({ 
  onClick, 
  queueCount, 
  isProcessing, 
  progress, 
  stream,
  flashTrigger 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const showFlash = isProcessing || flashTrigger;

  return (
    <div className="relative w-72 h-72 flex flex-col items-center justify-end select-none pointer-events-none">
      
      {/* Dog Container */}
      <motion.div 
        className="relative z-10 w-full h-full flex items-end justify-center"
        animate={isProcessing ? { y: [0, 2, 0] } : {}}
        transition={{ repeat: Infinity, duration: 0.4 }}
      >
        {/* === THE DOG SVG === */}
        <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-xl overflow-visible">
          
          {/* 1. Tail (Wagging Animation) */}
          <motion.path 
            d="M 230 200 Q 260 180 250 150" 
            fill="none" 
            stroke="#FDE047" 
            strokeWidth="12" 
            strokeLinecap="round"
            className="origin-bottom-left"
            animate={isProcessing || stream ? { rotate: [0, 10, 0, 10, 0] } : { rotate: 0 }}
            transition={{ repeat: Infinity, duration: 0.3 }}
          />

          {/* 2. Body Shape (Yellow Blob) */}
          <path 
            d="M 60 150 C 60 80, 240 80, 240 150 C 240 280, 240 280, 150 280 C 60 280, 60 280, 60 150 Z" 
            fill="#FDE047" 
            stroke="black" 
            strokeWidth="5"
          />

          {/* 3. Ears (Floppy) */}
          {/* Left Ear */}
          <path 
            d="M 80 110 Q 50 110, 40 150 T 60 190" 
            fill="#FDE047" 
            stroke="black" 
            strokeWidth="5"
          />
          {/* Right Ear */}
          <path 
            d="M 220 110 Q 250 110, 260 150 T 240 190" 
            fill="#FDE047" 
            stroke="black" 
            strokeWidth="5"
          />

          {/* 4. Face Features */}
          {/* Eyes */}
          <circle cx="110" cy="140" r="6" fill="black" />
          <circle cx="190" cy="140" r="6" fill="black" />
          
          {/* Nose */}
          <ellipse cx="150" cy="155" rx="8" ry="5" fill="black" />
          
          {/* Mouth (W shape) */}
          <path 
            d="M 135 165 Q 150 175, 165 165" 
            fill="none" 
            stroke="black" 
            strokeWidth="3" 
            strokeLinecap="round"
          />

          {/* Cheeks */}
          <circle cx="90" cy="155" r="8" fill="#FCA5A5" opacity="0.6" />
          <circle cx="210" cy="155" r="8" fill="#FCA5A5" opacity="0.6" />

          {/* 5. Paws holding the camera */}
          <ellipse cx="100" cy="220" rx="20" ry="15" fill="#FDE047" stroke="black" strokeWidth="4" />
          <ellipse cx="200" cy="220" rx="20" ry="15" fill="#FDE047" stroke="black" strokeWidth="4" />

        </svg>

        {/* === THE CAMERA OBJECT (Held by dog) === */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-32 h-24 bg-teal-500 rounded-2xl border-4 border-black flex flex-col items-center justify-center shadow-md">
            
            {/* Camera Lens / Viewfinder */}
            <div className="w-16 h-16 bg-gray-800 rounded-full border-4 border-white flex items-center justify-center relative overflow-hidden">
                 {stream ? (
                   // Viewfinder Mode
                   <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" 
                   />
                 ) : (
                   // Default Lens Mode
                   <>
                    <div className="w-4 h-4 bg-white/40 rounded-full absolute top-3 right-3"></div>
                   </>
                 )}
                 
                 {/* Flash animation inside lens */}
                 {showFlash && (
                     <motion.div 
                        className="w-full h-full rounded-full bg-white absolute inset-0 z-20"
                        initial={{ opacity: 0 }}
                        animate={isProcessing ? { opacity: [0, 0.8, 0] } : { opacity: [0, 1, 0] }}
                        transition={isProcessing ? { repeat: Infinity, duration: 0.8 } : { duration: 0.15 }}
                     />
                 )}
            </div>

            {/* Flash Unit / Rec Indicator */}
            {stream ? (
               <motion.div 
                 animate={{ opacity: [1, 0.5, 1] }}
                 transition={{ repeat: Infinity, duration: 1 }}
                 className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border border-black"
               />
            ) : (
               <div className="absolute top-2 right-2 w-6 h-4 bg-yellow-200 border-2 border-black rounded-sm relative overflow-hidden">
                  {/* Flash bulb firing */}
                  {showFlash && (
                    <motion.div 
                      className="absolute inset-0 bg-white"
                      animate={isProcessing ? { opacity: [0, 1, 0] } : { opacity: [0, 1, 0] }}
                      transition={isProcessing ? { repeat: Infinity, duration: 0.8, delay: 0.1 } : { duration: 0.1 }}
                    />
                  )}
               </div>
            )}
            
            {/* Slot (Hidden behind logic, but conceptually at bottom) */}
        </div>

        {/* Ejection Animation Layer */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-2 overflow-visible flex justify-center">
             {isProcessing && (
                 <motion.div 
                    className="absolute top-0 w-20 h-24 bg-white border border-gray-200 shadow-sm"
                    initial={{ y: 0, opacity: 0 }}
                    animate={{ y: 20, opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                 />
             )}
        </div>

      </motion.div>

      {/* Queue Badge - High Z-index to prevent clipping */}
      {queueCount > 0 && !stream && (
        <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-4 top-10 bg-red-500 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-white z-50 shadow-md cursor-pointer pointer-events-auto"
            onClick={onClick}
        >
            {queueCount}
        </motion.div>
      )}

      {/* Interactive overlay for clicking - Adjusted to bottom 75% to avoid overlapping buttons above */}
      <div 
         className="absolute bottom-0 left-0 right-0 h-[66%] z-20 cursor-pointer pointer-events-auto" 
         onClick={onClick}
         title={stream ? "Click to Snap!" : (queueCount > 0 ? "Click to eject photo!" : "Ready for photos")}
      ></div>

      {/* Progress Bar (Floating below dog) */}
      {isProcessing && (
        <div className="absolute -bottom-4 w-40 h-2 bg-gray-200 rounded-full overflow-hidden border border-gray-400">
           <motion.div 
              className="h-full bg-teal-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
           />
        </div>
      )}

    </div>
  );
};

export default CuteCamera;