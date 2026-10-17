import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Image as ImageIcon,
  Send,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  SwitchCamera,
  ScanLine,
  ChevronDown,
  Bot,
  User,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import { AnimatedAvatar } from '@/components/animated-avatar';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: string;
}

interface AskAiBarProps {
  documentContext?: string;
  className?: string;
}

export function AskAiBar({ documentContext, className = '' }: AskAiBarProps) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // Handle Camera stream startup & cleanup
  useEffect(() => {
    if (!cameraOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    let isMounted = true;
    setCameraError(null);

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported by your browser.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (isMounted) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        } else {
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch (err: any) {
        if (isMounted) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setCameraError('Camera permission was denied. Please allow camera access in your browser settings.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setCameraError('No camera found on your device.');
          } else {
            setCameraError(err.message || 'Unable to access camera.');
          }
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOpen, facingMode]);

  // Capture snapshot from video stream
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setAttachedImage(dataUrl);
    setCameraOpen(false);
  };

  // Flip camera between front and back
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Handle local image file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      alert('Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxDim = 1024;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setAttachedImage(img.src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        setAttachedImage(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => {
        setAttachedImage(event.target?.result as string);
      };
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  // Submit Prompt + Optional Image to Multimodal AI
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() && !attachedImage) return;

    const userMessage: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt.trim() || (attachedImage ? 'Analyze and explain this image.' : ''),
      imageUrl: attachedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setIsChatOpen(true);
    setIsScanning(true);

    const imageToSend = attachedImage;
    const promptToSend = prompt.trim();

    // Clear active input
    setPrompt('');
    setAttachedImage(null);

    const payload = JSON.stringify({
      message: promptToSend,
      imageBase64: imageToSend,
      documentContext,
      history: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
    });

    try {
      let res: Response | null = null;
      let lastErrMessage = '';

      // 1. Try relative /api route
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        res = await fetch('/api/chat/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (proxyErr: any) {
        lastErrMessage = proxyErr.message || 'Proxy error';
      }

      // 2. Direct fallback to port 5050
      if (!res || !res.ok) {
        try {
          const directUrl = `${window.location.protocol}//${window.location.hostname}:5050/api/chat/ask`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000);
          res = await fetch(directUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (directErr: any) {
          lastErrMessage = directErr.message || lastErrMessage;
        }
      }

      if (!res || !res.ok) {
        let errDetail = 'Failed to get response from AI.';
        if (res) {
          const data = await res.json().catch(() => ({}));
          errDetail = data.error || `Server responded with status ${res.status}`;
        } else if (lastErrMessage) {
          errDetail = `Connection error: ${lastErrMessage}. Ensure the API server is running on port 5050.`;
        }
        throw new Error(errDetail);
      }

      const data = await res.json();
      const assistantMessage: ChatMessageItem = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'I could not process that question. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessageItem = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Analysis Error:** ${err.message || 'Unable to complete image analysis. Please check your connection and try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsScanning(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`w-full space-y-3 ${className}`}>
      
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Camera Capture Dialog Modal */}
      <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
        <DialogContent className="max-w-md rounded-3xl border border-border bg-card p-5 shadow-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Camera size={18} className="text-primary" />
              <span>Camera Scanner</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Position your document, math problem, or diagram in the frame.
            </DialogDescription>
          </DialogHeader>

          <div className="relative overflow-hidden rounded-2xl border border-border bg-black aspect-4/3 flex items-center justify-center">
            {cameraError ? (
              <div className="p-4 text-center text-xs text-destructive flex flex-col items-center gap-2">
                <AlertCircle size={24} />
                <span>{cameraError}</span>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
                {/* Visual Viewfinder Reticle */}
                <div className="pointer-events-none absolute inset-6 border border-white/40 rounded-xl">
                  <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-primary" />
                  <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-primary" />
                  <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-primary" />
                  <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-primary" />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={toggleFacingMode}
              className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <SwitchCamera size={14} />
              <span>Flip</span>
            </button>

            <button
              type="button"
              disabled={Boolean(cameraError)}
              onClick={handleCaptureSnapshot}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer"
              title="Capture Image"
            >
              <div className="h-10 w-10 rounded-full border-2 border-white flex items-center justify-center">
                <div className="h-7 w-7 rounded-full bg-white" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCameraOpen(false)}
              className="rounded-xl border border-border/80 bg-muted/50 px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          THE INTEGRATED ASK AI INPUT BAR (With Google Lens-Style Camera Icon)
          ========================================================================= */}
      <div className="rounded-2xl border border-border/90 bg-card p-3 shadow-lg paper-shadow transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
        
        {/* Attached Image Thumbnail Preview with Delete & Scan Animation */}
        <AnimatePresence>
          {attachedImage && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              className="mb-2.5 flex items-center gap-3"
            >
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-border shadow-xs group">
                <img
                  src={attachedImage}
                  alt="Attached study snapshot"
                  className="h-full w-full object-cover"
                />

                {/* Scanning Laser Line when submitting */}
                {isScanning && (
                  <motion.div
                    animate={{ y: [0, 60, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-x-0 h-1 bg-primary shadow-[0_0_8px_rgba(226,85,57,0.8)]"
                  />
                )}

                {/* Remove Image Button */}
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white shadow-xs hover:bg-destructive transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X size={10} />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <ScanLine size={13} className="text-primary" />
                  <span>Image attached</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  Ask a question about this diagram, problem, or document snippet.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Text Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              attachedImage
                ? 'Ask anything about this image (or press Ask to auto-analyze)…'
                : 'Ask anything about your document or scan an image…'
            }
            className="flex-1 bg-transparent py-1.5 px-1 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />

          {/* GOOGLE LENS-STYLE CAMERA / SCANNER ICON POPUP */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-primary transition-colors cursor-pointer"
                title="Scan image (Google Lens style)"
              >
                <Camera size={17} strokeWidth={2.2} />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-2xl border border-border bg-card p-1 shadow-xl">
              <DropdownMenuItem
                onClick={() => setCameraOpen(true)}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-accent/15"
              >
                <Camera size={14} className="text-primary" />
                <span>📷 Take Photo</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-accent/15"
              >
                <ImageIcon size={14} className="text-amber-500" />
                <span>🖼️ Upload Image</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Submit / Ask Button */}
          <motion.button
            type="submit"
            disabled={(!prompt.trim() && !attachedImage) || isScanning}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-8 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-xs transition-all hover:brightness-105 disabled:opacity-40 cursor-pointer shrink-0"
          >
            {isScanning ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <>
                <Sparkles size={13} />
                <span className="hidden sm:inline">Ask</span>
                <Send size={12} className="sm:hidden" />
              </>
            )}
          </motion.button>
        </form>
      </div>

      {/* =========================================================================
          STUDY TUTOR CHAT DRAWER & RESPONSES
          ========================================================================= */}
      {messages.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-md paper-shadow">
          {/* Chat Header Banner */}
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Bot size={15} className="text-primary" />
              <span className="text-xs font-bold text-foreground">AI Study Assistant</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.2 text-[9px] font-mono-ui font-semibold text-primary">
                {messages.length} messages
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMessages([])}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer"
                title="Clear chat"
              >
                <Trash2 size={12} />
              </button>
              <button
                type="button"
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title={isChatOpen ? 'Collapse chat' : 'Expand chat'}
              >
                <ChevronDown size={14} className={`transition-transform duration-200 ${isChatOpen ? '' : '-rotate-90'}`} />
              </button>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-4 space-y-4 max-h-[380px] overflow-y-auto"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 text-xs leading-relaxed ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                        <Bot size={14} />
                      </div>
                    )}

                    <div
                      className={`rounded-2xl p-3 max-w-[85%] space-y-2 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'bg-muted/50 text-foreground border border-border/70'
                      }`}
                    >
                      {/* Attached Thumbnail in Chat */}
                      {msg.imageUrl && (
                        <div className="overflow-hidden rounded-xl border border-white/20 max-w-[180px] shadow-xs">
                          <img
                            src={msg.imageUrl}
                            alt="Scanned query snapshot"
                            className="h-auto w-full object-cover"
                          />
                        </div>
                      )}

                      {/* Content with basic formatting */}
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Message Footer */}
                      <div className="flex items-center justify-between text-[10px] opacity-70 pt-1">
                        <span>{msg.timestamp}</span>
                        {msg.role === 'assistant' && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msg.id, msg.content)}
                            className="flex items-center gap-1 hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check size={10} className="text-emerald-500" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={10} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="mt-0.5">
                        <AnimatedAvatar username={user?.username} size="xs" />
                      </div>
                    )}
                  </div>
                ))}

                {isScanning && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse p-2">
                    <Loader2 size={14} className="animate-spin text-primary" />
                    <span>Analyzing document & image with AI…</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
