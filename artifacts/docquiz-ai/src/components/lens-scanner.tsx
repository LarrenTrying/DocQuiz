import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  UploadCloud,
  X,
  Sparkles,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Maximize2,
  FileSearch,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Custom Google Lens Iconic Badge
export function GoogleLensIcon({ className = 'w-5 h-5', animated = true }: { className?: string; animated?: boolean }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
      >
        {/* Outer lens target ring segments with Google Lens colors */}
        {/* Top-Left: Blue */}
        <path
          d="M3 8V6C3 4.34315 4.34315 3 6 3H8"
          stroke="#4285F4"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Top-Right: Red */}
        <path
          d="M16 3H18C19.6569 3 21 4.34315 21 6V8"
          stroke="#EA4335"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Bottom-Right: Yellow */}
        <path
          d="M21 16V18C21 19.6569 19.6569 21 18 21H16"
          stroke="#FBBC05"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Bottom-Left: Green */}
        <path
          d="M8 21H6C4.34315 21 3 19.6569 3 18V16"
          stroke="#34A853"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Central Camera Iris / Dot */}
        <circle cx="12" cy="12" r="3.5" stroke="#4285F4" strokeWidth="2.2" fill="#4285F4" fillOpacity="0.15" />
        <circle cx="13.2" cy="10.8" r="1" fill="#FFFFFF" />
      </svg>
      {animated && (
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
      )}
    </div>
  );
}

// Client-side image compressor
async function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to parse image for compression.'));
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
  });
}

// Top attractive trigger button
export function TopLensScanButton({
  onClick,
  variant = 'prominent',
}: {
  onClick: () => void;
  variant?: 'prominent' | 'compact' | 'header';
}) {
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group relative flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-md active:scale-95"
        title="Google Lens Scanner — Scan math, handwritten notes, or diagrams"
        data-testid="button-top-lens-compact"
      >
        <GoogleLensIcon className="w-4 h-4" animated={false} />
        <span>Scan with Lens</span>
      </button>
    );
  }

  if (variant === 'header') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group relative flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-md active:scale-95"
        title="Google Lens Scanner — Take a photo or upload an image to analyze"
        data-testid="button-header-lens"
      >
        <GoogleLensIcon className="w-4 h-4" />
        <span className="hidden sm:inline font-medium">Lens Scan</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex items-center gap-2.5 overflow-hidden rounded-full border border-primary/30 bg-gradient-to-r from-primary/15 via-accent/20 to-primary/10 px-4 py-2 text-xs font-bold text-foreground shadow-sm transition-all hover:border-primary hover:shadow-md hover:scale-[1.02] active:scale-95"
      data-testid="button-top-lens-prominent"
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
      <GoogleLensIcon className="w-5 h-5" />
      <span className="font-semibold tracking-tight">
        Scan with <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-primary bg-clip-text text-transparent">Lens</span>
      </span>
      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-mono-ui uppercase tracking-wider text-primary">AI</span>
    </button>
  );
}

// Full Google Lens Scanner Modal
export function LensScannerModal({
  open,
  onOpenChange,
  documentContext,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentContext?: string;
}) {
  const [mode, setMode] = useState<'camera' | 'upload'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Start / Stop Camera Stream
  useEffect(() => {
    if (!open || mode !== 'camera' || imagePreview) {
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
            setCameraError('Camera permission was denied. Please allow camera permissions in your browser.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setCameraError('No camera device detected.');
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
  }, [open, mode, facingMode, imagePreview]);

  // Capture snapshot from video
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    let width = video.videoWidth || 1280;
    let height = video.videoHeight || 720;
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
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setImagePreview(dataUrl);
    setResult(null);
    setErrorMessage(null);
  };

  // Flip camera (front/back)
  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Handle local file selection
  const handleFileUpload = async (file?: File) => {
    if (!file) return;
    setErrorMessage(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please upload a valid image (JPG, PNG, or WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Image is too large. Please select an image under 15MB.');
      return;
    }

    try {
      const compressedBase64 = await compressImage(file, 1024, 1024, 0.75);
      setImagePreview(compressedBase64);
      setResult(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process image.');
    }
  };

  // Submit image to Multimodal AI
  const handleAnalyze = async () => {
    if (!imagePreview) return;
    setIsAnalyzing(true);
    setErrorMessage(null);
    setResult(null);

    const payload = JSON.stringify({
      message: question.trim() || 'Analyze this image. If it contains a question, math problem, or notes, solve and explain step-by-step.',
      imageBase64: imagePreview,
      documentContext,
    });

    try {
      let res: Response | null = null;
      let lastErrMessage = '';

      // 1. Try relative /api route (Vite dev proxy)
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

      // 2. Fallback directly to API server on port 5050 if Vite proxy drops connection
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
        let errDetail = 'Failed to analyze image.';
        if (res) {
          const data = await res.json().catch(() => ({}));
          errDetail = data.error || `Server responded with status ${res.status}`;
        } else if (lastErrMessage) {
          errDetail = `Connection error: ${lastErrMessage}. Ensure the API server is running on http://localhost:5050.`;
        }
        throw new Error(errDetail);
      }

      const data = await res.json();
      setResult(data.answer || data.reply || 'No analysis available.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Analysis failed. Please check your connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset modal state
  const handleReset = () => {
    setImagePreview(null);
    setResult(null);
    setQuestion('');
    setErrorMessage(null);
    setMode('upload');
  };

  // Copy result to clipboard
  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) handleReset(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-3">
            <GoogleLensIcon className="w-6 h-6" />
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">
                Google Lens Visual Scanner
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Scan homework problems, math formulas, handwritten notes, or diagrams.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Hidden Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Main Content Area */}
        <div className="mt-4 space-y-4">
          {!imagePreview ? (
            <div>
              {/* Mode Toggle */}
              <div className="mb-4 flex rounded-xl border border-border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => setMode('upload')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
                    mode === 'upload'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <UploadCloud size={15} /> Upload Image
                </button>
                <button
                  type="button"
                  onClick={() => setMode('camera')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
                    mode === 'camera'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Camera size={15} /> Live Camera
                </button>
              </div>

              {/* Upload Box */}
              {mode === 'upload' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
                  }}
                  className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 p-8 text-center transition-colors hover:border-primary/60 hover:bg-primary/5 cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  />
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <GoogleLensIcon className="w-7 h-7" animated={false} />
                  </div>
                  <p className="text-sm font-bold text-foreground">Click to browse or drop an image</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Supports JPG, PNG, WEBP (Math problems, charts, slides, notes)
                  </p>
                </div>
              )}

              {/* Live Camera View */}
              {mode === 'camera' && (
                <div className="relative overflow-hidden rounded-2xl bg-black aspect-video flex items-center justify-center border border-border">
                  {cameraError ? (
                    <div className="p-6 text-center text-xs text-destructive max-w-sm">
                      <Camera size={32} className="mx-auto mb-2 text-destructive/60" />
                      <p className="font-semibold">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => setMode('upload')}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 font-bold text-foreground border border-border"
                      >
                        <UploadCloud size={13} /> Switch to Upload
                      </button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                      {/* Lens Viewfinder Overlay */}
                      <div className="absolute inset-8 pointer-events-none rounded-xl border border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />
                      </div>

                      {/* Camera Actions Bar */}
                      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={flipCamera}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
                          title="Switch Camera"
                        >
                          <RefreshCw size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black p-1 shadow-xl hover:scale-105 active:scale-95 transition-transform"
                          title="Capture Photo"
                        >
                          <div className="h-full w-full rounded-full border-2 border-black flex items-center justify-center">
                            <Camera size={20} />
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Selected / Captured Image View */
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-black/90 max-h-72 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Scanned thumbnail"
                  className="max-h-72 w-auto object-contain rounded-xl"
                />

                {/* Scanning Laser Animation */}
                {isAnalyzing && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden bg-primary/10">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                      <div className="flex items-center gap-2 rounded-full bg-black/80 px-4 py-2 text-xs font-bold text-cyan-300 border border-cyan-500/40 shadow-xl">
                        <Loader2 size={15} className="animate-spin text-cyan-400" />
                        Analyzing with Multimodal AI…
                      </div>
                    </div>
                  </div>
                )}

                {/* Remove Image Button */}
                {!isAnalyzing && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-black"
                    title="Remove Image"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Optional Prompt Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles size={13} className="text-primary" /> Optional question / prompt
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Solve this math problem step-by-step, or leave blank to auto-scan"
                  disabled={isAnalyzing}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Scan & Solve Action Button */}
              {!result && (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Scanning Visual Content…
                    </>
                  ) : (
                    <>
                      <Zap size={15} /> Scan & Solve with Lens AI <ArrowRight size={14} />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMessage}
            </div>
          )}

          {/* AI Analysis Result */}
          {result && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 animate-in fade-in duration-300">
              <div className="mb-3 flex items-center justify-between border-b border-primary/10 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <GoogleLensIcon className="w-4 h-4" animated={false} />
                  <span>Lens Analysis Result</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                {result}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Scan Another Image
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
