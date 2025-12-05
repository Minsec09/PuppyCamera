import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Trash2, Camera, X, Palette, Image as ImageIcon, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

import { UploadedPhoto, FramedPhotoData, BackgroundTheme } from './types';
import { createPolaroidFrame } from './utils/imageProcessor';
import CuteCamera from './components/CuteCamera';

// --- Background Themes Config ---
const BACKGROUND_THEMES: BackgroundTheme[] = [
  { 
    id: 'cream-dots', 
    name: 'Cream Dots', 
    cssBackground: '#fefce8 radial-gradient(#9ca3af 1px, transparent 1px) 0 0 / 24px 24px', 
    previewColor: '#fefce8' 
  },
  { 
    id: 'blue-grid', 
    name: 'Blue Grid', 
    // Using simple color + explicit gradient
    cssBackground: 'linear-gradient(#93c5fd 1px, transparent 1px), linear-gradient(90deg, #93c5fd 1px, transparent 1px)',
    previewColor: '#eff6ff' 
  },
  { 
    id: 'pink-love', 
    name: 'Pink Soft', 
    cssBackground: '#fff1f2', 
    previewColor: '#fff1f2' 
  },
  { 
    id: 'sage-green', 
    name: 'Sage Green', 
    cssBackground: '#ecfccb', 
    previewColor: '#ecfccb' 
  },
  { 
    id: 'wood', 
    name: 'Warm Wood', 
    cssBackground: '#fae8d0', 
    previewColor: '#fae8d0' 
  },
];

const App: React.FC = () => {
  // State
  const [uploads, setUploads] = useState<UploadedPhoto[]>([]);
  const [processingQueue, setProcessingQueue] = useState<FramedPhotoData[]>([]);
  const [dispensedPhotos, setDispensedPhotos] = useState<FramedPhotoData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false); // Flash effect trigger
  const [progress, setProgress] = useState(0);
  const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(BACKGROUND_THEMES[0]);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Refs
  const deskRef = useRef<HTMLDivElement>(null);
  const highestZIndex = useRef(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        file,
        caption: ''
      }));
      setUploads((prev) => [...prev, ...newFiles]);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const snapPhoto = () => {
    if (!cameraStream) return;
    
    // Trigger visual flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    // Create a temporary video element to grab the frame or use ImageCapture
    const track = cameraStream.getVideoTracks()[0];
    const imageCapture = new (window as any).ImageCapture(track);
    
    imageCapture.grabFrame()
      .then((bitmap: ImageBitmap) => {
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(bitmap, 0, 0);
        
        const url = canvas.toDataURL('image/jpeg');
        setUploads(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            url: url,
            file: {} as File, 
            caption: ''
        }]);
      })
      .catch((err: any) => {
          console.error("Snap failed, attempting fallback", err);
          // Fallback logic could be added here if ImageCapture isn't supported in all browsers
      });
  };

  const handleCameraClick = () => {
    if (cameraStream) {
      snapPhoto();
    } else {
      ejectPhoto();
    }
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((p) => p.id !== id));
  };

  const updateCaption = (id: string, text: string) => {
    setUploads((prev) => prev.map(p => p.id === id ? { ...p, caption: text } : p));
  };

  const deleteDispensedPhoto = (id: string) => {
    setDispensedPhotos((prev) => prev.filter(p => p.id !== id));
  };

  const updatePhotoScale = (id: string, delta: number) => {
    setDispensedPhotos((prev) => prev.map(p => {
      if (p.id === id) {
        const newScale = Math.max(0.5, Math.min(2.5, (p.scale || 1) + delta));
        return { ...p, scale: newScale };
      }
      return p;
    }));
  };

  const processPhotos = async () => {
    if (uploads.length === 0 || isProcessing) return;

    // If camera is open, close it
    if (cameraStream) stopCamera();

    setIsProcessing(true);
    setProgress(0);

    // Simulate feeding animation
    await new Promise(r => setTimeout(r, 800));

    const total = uploads.length;
    const newQueue: FramedPhotoData[] = [];

    for (let i = 0; i < total; i++) {
      const photo = uploads[i];
      try {
        const framedBase64 = await createPolaroidFrame(photo.url, photo.caption);
        newQueue.push({
          id: photo.id,
          originalUrl: photo.url,
          framedUrl: framedBase64,
          x: 0, y: 0, rotation: 0, zIndex: 0,
          scale: 1 // Default scale
        });
      } catch (err) {
        console.error("Failed to frame photo", err);
      }
      
      setProgress(((i + 1) / total) * 100);
      await new Promise(r => setTimeout(r, 600));
    }

    setProcessingQueue((prev) => [...prev, ...newQueue]);
    setUploads([]);
    setIsProcessing(false);
    setProgress(0);
  };

  const ejectPhoto = () => {
    if (processingQueue.length === 0) return;

    const [nextPhoto, ...remainingQueue] = processingQueue;
    setProcessingQueue(remainingQueue);

    // Determine random position on the desk
    const deskWidth = deskRef.current?.clientWidth || 300;
    const deskHeight = deskRef.current?.clientHeight || 500;
    
    // Scatter logic
    const padding = 50;
    const randomX = Math.random() * (deskWidth - 150 - padding * 2) + padding;
    const randomY = Math.random() * (deskHeight - 200 - padding * 2) + padding;
    const randomRot = Math.random() * 40 - 20;

    const dispensedPhoto: FramedPhotoData = {
      ...nextPhoto,
      x: randomX,
      y: randomY,
      rotation: randomRot,
      zIndex: highestZIndex.current++,
      scale: 1, // Ensure initial scale
    };

    setDispensedPhotos((prev) => [...prev, dispensedPhoto]);
  };

  const handleDownloadDesk = async () => {
    if (!deskRef.current) return;
    
    try {
      const canvas = await html2canvas(deskRef.current, {
        scale: 2, 
        useCORS: true,
        ignoreElements: (element) => element.classList.contains('do-not-print'),
        backgroundColor: null 
      });
      
      const link = document.createElement('a');
      link.download = `puppy-polaroids-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Download failed", err);
      alert("Oops! Could not save image.");
    }
  };

  const handleDragStart = (id: string) => {
     highestZIndex.current += 1;
     setDispensedPhotos(prev => prev.map(p => {
         if (p.id === id) {
             return { ...p, zIndex: highestZIndex.current };
         }
         return p;
     }));
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-rose-50 text-gray-800 font-sans">
      
      {/* --- TOP/RIGHT SECTION: THE DESK --- */}
      <main className="order-1 md:order-2 flex-1 relative overflow-hidden bg-gray-100 shadow-inner z-0">
        <div 
          ref={deskRef}
          className={`w-full h-full relative transition-all duration-500 ease-in-out ${currentTheme.id === 'blue-grid' ? 'bg-blue-50' : 'bg-gray-50'}`} 
          style={{ 
              background: currentTheme.cssBackground,
              backgroundColor: currentTheme.id === 'blue-grid' ? '#eff6ff' : undefined
          }}
        >
          {/* Decorative Background Text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
             <span className="text-[20vw] font-black text-black rotate-12 select-none">WOOF</span>
          </div>

          <AnimatePresence>
            {dispensedPhotos.map((photo) => (
              <motion.div
                key={photo.id}
                layoutId={photo.id}
                initial={{ 
                  x: '50%', 
                  y: '100%', 
                  rotate: 0,
                  scale: 0.2,
                  opacity: 0 
                }}
                animate={{ 
                  x: photo.x, 
                  y: photo.y, 
                  rotate: photo.rotation,
                  scale: photo.scale || 1,
                  opacity: 1,
                  zIndex: photo.zIndex
                }}
                drag
                dragMomentum={false}
                onDragStart={() => handleDragStart(photo.id)}
                whileHover={{ scale: (photo.scale || 1) + 0.05, zIndex: 9999 }}
                whileDrag={{ scale: (photo.scale || 1) + 0.05, cursor: 'grabbing' }}
                className="absolute origin-center cursor-grab w-40 md:w-56 shadow-lg group touch-none"
              >
                 <img 
                   src={photo.framedUrl} 
                   alt="framed memory" 
                   draggable={false}
                   className="w-full h-auto drop-shadow-md pointer-events-none"
                 />
                 
                 {/* Controls Container */}
                 <div className="absolute -top-3 right-0 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity do-not-print z-50">
                    
                    {/* Zoom In */}
                    <button 
                        onTouchStart={(e) => { e.stopPropagation(); updatePhotoScale(photo.id, 0.1); }}
                        onClick={(e) => { e.stopPropagation(); updatePhotoScale(photo.id, 0.1); }}
                        className="bg-white text-gray-600 rounded-full p-1.5 shadow-md hover:bg-gray-50 hover:scale-110 transition-all border border-gray-200"
                    >
                        <Plus size={14} />
                    </button>

                    {/* Zoom Out */}
                    <button 
                        onTouchStart={(e) => { e.stopPropagation(); updatePhotoScale(photo.id, -0.1); }}
                        onClick={(e) => { e.stopPropagation(); updatePhotoScale(photo.id, -0.1); }}
                        className="bg-white text-gray-600 rounded-full p-1.5 shadow-md hover:bg-gray-50 hover:scale-110 transition-all border border-gray-200"
                    >
                        <Minus size={14} />
                    </button>

                    {/* Delete */}
                    <button 
                        onTouchStart={(e) => { e.stopPropagation(); deleteDispensedPhoto(photo.id); }}
                        onClick={(e) => { e.stopPropagation(); deleteDispensedPhoto(photo.id); }}
                        className="bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 hover:scale-110 transition-all"
                    >
                        <X size={14} />
                    </button>
                 </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty State */}
          {dispensedPhotos.length === 0 && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-10">
                <div className="text-center text-gray-400 opacity-60">
                   <p className="text-xl md:text-3xl font-bold mb-2 font-handwritten rotate-[-5deg] text-gray-500 mix-blend-multiply">Your Desk</p>
                   <p className="text-sm md:text-base">Photos ejected from the camera will appear here.</p>
                </div>
             </div>
          )}
        </div>

        {/* Floating Desk Controls (Theme & Save) */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-3 z-40 do-not-print">
           
           {/* Theme Picker */}
           <div className="relative">
             <button 
               onClick={() => setShowThemePicker(!showThemePicker)}
               className="bg-white p-3 rounded-full shadow-lg text-gray-600 hover:text-yellow-600 transition-colors border border-gray-100"
               title="Change Background"
             >
               <Palette size={20} />
             </button>
             
             <AnimatePresence>
               {showThemePicker && (
                 <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    className="absolute right-0 top-14 bg-white p-3 rounded-2xl shadow-xl border border-gray-100 flex flex-col gap-2 w-48"
                 >
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Backgrounds</p>
                    <div className="grid grid-cols-5 gap-2">
                      {BACKGROUND_THEMES.map(theme => (
                        <button
                          key={theme.id}
                          onClick={() => { setCurrentTheme(theme); setShowThemePicker(false); }}
                          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${currentTheme.id === theme.id ? 'border-yellow-400 scale-110 ring-2 ring-yellow-200' : 'border-gray-200'}`}
                          style={{ background: theme.previewColor }}
                          title={theme.name}
                        />
                      ))}
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>

           {/* Download Button */}
           {dispensedPhotos.length > 0 && (
             <motion.button
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               onClick={handleDownloadDesk}
               className="bg-white px-5 py-3 rounded-full font-bold shadow-lg text-gray-700 flex items-center gap-2 hover:bg-yellow-50 hover:text-yellow-600 transition-colors border border-gray-200"
             >
               <Download size={20} />
               <span className="hidden md:inline">Save</span>
             </motion.button>
           )}
        </div>
      </main>

      {/* --- BOTTOM/LEFT SECTION: CONTROLS & CAMERA --- */}
      <aside className={`
        order-2 md:order-1 
        w-full md:w-[400px] lg:w-[450px] shrink-0
        bg-white md:border-r-4 border-t-4 md:border-t-0 border-yellow-200 
        flex flex-col shadow-2xl md:shadow-xl z-30
        h-[45vh] md:h-full
        transition-all duration-300
      `}>
        
        {/* Compact Header */}
        <div className="px-4 py-2 border-b border-yellow-100 bg-yellow-50/50 flex justify-between items-center shrink-0">
          <h1 className="text-lg md:text-2xl font-bold text-yellow-500 flex items-center gap-2">
            📸 PuppyPolaroid
          </h1>
        </div>

        {/* Content Area - Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 min-h-0 bg-white">
          
          {/* Action Toolbar */}
          <div className="grid grid-cols-2 gap-3 mb-2 shrink-0">
            {/* Upload Button */}
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors text-blue-600 gap-1 active:scale-95"
            >
                <Upload size={24} />
                <span className="font-bold text-sm">Upload</span>
                <input 
                    ref={fileInputRef}
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    className="hidden"
                />
            </div>

            {/* Camera Button */}
            <div 
                onClick={cameraStream ? stopCamera : startCamera}
                className={`border-2 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors gap-1 active:scale-95 
                  ${cameraStream 
                    ? 'bg-red-50 border-red-200 text-red-500 animate-pulse' 
                    : 'bg-teal-50 border-teal-200 text-teal-600 hover:bg-teal-100'}`}
            >
                {cameraStream ? <X size={24} /> : <Camera size={24} />}
                <span className="font-bold text-sm">{cameraStream ? 'Close Cam' : 'Camera'}</span>
            </div>
          </div>

          {/* Upload List */}
          <div className="space-y-2">
             <AnimatePresence>
                {uploads.map((photo) => (
                  <motion.div 
                    key={photo.id}
                    initial={{ opacity: 0, height: 0, x: -20 }}
                    animate={{ opacity: 1, height: 'auto', x: 0 }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    className="flex flex-col gap-2 bg-white p-2 rounded-lg border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                        <img src={photo.url} alt="preview" className="w-10 h-10 object-cover rounded-md bg-gray-100" />
                        <div className="flex-1 min-w-0">
                           <input 
                                type="text" 
                                placeholder="Caption..."
                                maxLength={25}
                                value={photo.caption}
                                onChange={(e) => updateCaption(photo.id, e.target.value)}
                                className="w-full text-sm py-1 border-b border-transparent focus:border-yellow-400 focus:outline-none handwritten text-lg text-gray-700 placeholder:font-sans placeholder:text-gray-300 bg-transparent"
                            />
                        </div>
                        <button 
                            onClick={() => removeUpload(photo.id)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                  </motion.div>
                ))}
             </AnimatePresence>
             
             {uploads.length === 0 && processingQueue.length === 0 && !cameraStream && (
               <div className="text-center py-4 text-gray-300 text-xs md:text-sm">
                 <p>Use buttons above to add photos!</p>
               </div>
             )}
          </div>
        </div>

        {/* Bottom Section: Action Button & Camera */}
        <div className="shrink-0 bg-white border-t border-yellow-100 relative z-20 flex flex-row md:flex-col items-center md:items-stretch px-4 py-2 md:px-0 md:py-0">
          
          {/* Action Button */}
          <div className="md:px-6 md:pt-4 md:pb-2 w-1/2 md:w-full relative z-50">
            <button
              disabled={(uploads.length === 0 && !cameraStream) || isProcessing}
              onClick={cameraStream ? snapPhoto : processPhotos}
              className={`w-full py-2 md:py-3 rounded-xl md:rounded-2xl font-bold text-sm md:text-lg shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2
                ${cameraStream 
                   ? 'bg-teal-500 text-white hover:bg-teal-600 shadow-teal-200'
                   : (uploads.length > 0 && !isProcessing
                      ? 'bg-yellow-400 text-white hover:bg-yellow-500 shadow-yellow-200' 
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed')
                }`}
            >
              {isProcessing ? 'Processing...' : (cameraStream ? '📸 Snap' : '✨ Develop')}
            </button>
          </div>
          
          {/* Integrated Camera View */}
          {/* Changed overflow-hidden to overflow-visible to prevent badge clipping */}
          <div className="flex justify-center items-end h-[140px] md:h-[200px] w-1/2 md:w-full overflow-visible relative">
             {/* Scale camera for mobile */}
             <motion.div 
                animate={{ scale: cameraStream ? 1.1 : 1 }}
                className={`transform ${cameraStream ? 'scale-[0.65]' : 'scale-[0.55]'} md:scale-[0.8] origin-bottom md:mb-2 pointer-events-none transition-transform duration-300`}
             >
                <CuteCamera 
                    onClick={handleCameraClick} 
                    queueCount={processingQueue.length} 
                    isProcessing={isProcessing}
                    progress={progress}
                    stream={cameraStream}
                    flashTrigger={isFlashing}
                />
             </motion.div>
          </div>
        </div>
      </aside>

    </div>
  );
};

export default App;