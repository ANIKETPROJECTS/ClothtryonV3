import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, RefreshCw, Shirt, Scan, AlertCircle } from "lucide-react";
import { TSHIRT_CONFIG } from "@/lib/tshirt-config";

interface VirtualTryOnProps {
  onClose: () => void;
  productImage: string;
}

type Pose = poseDetection.Pose;
type Keypoint = poseDetection.Keypoint;

export function VirtualTryOn({ onClose }: VirtualTryOnProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [model, setModel] = useState<poseDetection.PoseDetector | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({ fps: 0, confidence: 0 });
  const [currentView, setCurrentView] = useState<'front' | 'back' | 'left' | 'right'>('front');
  
  // Assets refs
  const shirtImages = useRef<{ [key: string]: HTMLImageElement }>({});

  // Initialize TensorFlow and Load Model
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        };
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );
        setModel(detector);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load MoveNet model:", err);
        setError("Failed to initialize VTO engine. Please try again.");
        setIsLoading(false);
      }
    };

    // Preload images
    const preloadImages = () => {
      Object.entries(TSHIRT_CONFIG.images).forEach(([key, src]) => {
        const img = new Image();
        img.src = src;
        shirtImages.current[key] = img;
      });
    };

    loadModel();
    preloadImages();
  }, []);

  // Main Detection Loop
  const detect = useCallback(async () => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video?.readyState === 4 &&
      model &&
      canvasRef.current
    ) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // Ensure canvas matches video dimensions
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const start = performance.now();

      // Estimate poses
      const poses = await model.estimatePoses(video);

      const end = performance.now();
      const fps = 1000 / (end - start);

      if (poses.length > 0) {
        const pose = poses[0];
        setMetrics({ 
          fps: Math.round(fps), 
          confidence: Math.round((pose.score || 0) * 100) 
        });
        
        drawCanvas(pose, videoWidth, videoHeight, canvasRef.current);
      }
    }
  }, [model]);

  // Request Animation Frame Loop
  useEffect(() => {
    let animationFrameId: number;

    const loop = async () => {
      await detect();
      animationFrameId = requestAnimationFrame(loop);
    };

    if (!isLoading && model) {
      loop();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [detect, isLoading, model]);

  // Drawing Logic
  const drawCanvas = (pose: Pose, width: number, height: number, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Keypoints
    const keypoints = pose.keypoints;
    const leftShoulder = keypoints.find((k) => k.name === "left_shoulder");
    const rightShoulder = keypoints.find((k) => k.name === "right_shoulder");
    const leftHip = keypoints.find((k) => k.name === "left_hip");
    const rightHip = keypoints.find((k) => k.name === "right_hip");

    // Only draw if we have high confidence in keypoints
    const minConfidence = 0.3;
    if (
      leftShoulder && leftShoulder.score! > minConfidence &&
      rightShoulder && rightShoulder.score! > minConfidence &&
      leftHip && leftHip.score! > minConfidence &&
      rightHip && rightHip.score! > minConfidence
    ) {
      // Calculate torso center and dimensions
      const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
      const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
      
      const hipCenterX = (leftHip.x + rightHip.x) / 2;
      const hipCenterY = (leftHip.y + rightHip.y) / 2;

      // Shoulder width for scaling
      const shoulderWidth = Math.sqrt(
        Math.pow(rightShoulder.x - leftShoulder.x, 2) +
        Math.pow(rightShoulder.y - leftShoulder.y, 2)
      );

      // Torso Height
      const torsoHeight = Math.sqrt(
        Math.pow(hipCenterX - shoulderCenterX, 2) +
        Math.pow(hipCenterY - shoulderCenterY, 2)
      );

      // Angle for rotation
      const angle = Math.atan2(
        rightShoulder.y - leftShoulder.y,
        rightShoulder.x - leftShoulder.x
      );

      // Determine Orientation (Simple logic based on shoulder relative positions)
      // Ideally this would use 3D pose estimation, but for 2D:
      // If shoulder width decreases significantly while height stays same -> turning
      // Here we keep it simple: defaulting to front view mapping for now, 
      // but logic could be added to switch views based on tracking history or user manual switch.
      
      // Select Image
      const shirtImg = shirtImages.current[currentView];

      if (shirtImg) {
        ctx.save();
        
        // Move to center of torso (approximate anchor point)
        // Adjust vertical offset slightly up to cover shoulders properly
        const anchorX = shoulderCenterX;
        const anchorY = shoulderCenterY;

        ctx.translate(anchorX, anchorY);
        ctx.rotate(angle);

        // Scale
        const scale = (shoulderWidth * TSHIRT_CONFIG.calibration.scaleFactor) / shirtImg.width;
        ctx.scale(scale, scale);

        // Draw Image (Centered)
        // Adjust Y offset based on config
        ctx.drawImage(
          shirtImg, 
          -shirtImg.width / 2, 
          -shirtImg.height * 0.15 + TSHIRT_CONFIG.calibration.verticalOffset // 15% up to align neck
        );

        ctx.restore();

        // Debug: Draw skeleton overlay
        // drawSkeleton(ctx, keypoints);
      }
    }
  };

  /* Helper to visualize tracking (optional debug) */
  const drawSkeleton = (ctx: CanvasRenderingContext2D, keypoints: Keypoint[]) => {
     ctx.fillStyle = "red";
     keypoints.forEach(k => {
       if((k.score || 0) > 0.3) {
         ctx.beginPath();
         ctx.arc(k.x, k.y, 5, 0, 2 * Math.PI);
         ctx.fill();
       }
     });
  }

  const capturePhoto = () => {
    if (canvasRef.current && webcamRef.current) {
      // Combine webcam video and canvas overlay into a single image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasRef.current.width;
      tempCanvas.height = canvasRef.current.height;
      const ctx = tempCanvas.getContext('2d');
      
      if (ctx && webcamRef.current.video) {
        // Draw video frame
        ctx.drawImage(webcamRef.current.video, 0, 0, tempCanvas.width, tempCanvas.height);
        // Draw overlay
        ctx.drawImage(canvasRef.current, 0, 0);
        
        // Download
        const link = document.createElement('a');
        link.download = `luxe-vto-${Date.now()}.png`;
        link.href = tempCanvas.toDataURL();
        link.click();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Header / Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-white font-mono text-xs uppercase tracking-widest">Live Feed</span>
        </div>
        
        <button 
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition-all"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Viewport */}
      <div className="relative w-full h-full max-w-4xl max-h-[80vh] flex items-center justify-center bg-neutral-900 overflow-hidden rounded-2xl shadow-2xl border border-white/10">
        
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-50 bg-neutral-900">
            <RefreshCw className="w-10 h-10 animate-spin text-primary mb-4" />
            <h3 className="text-xl font-display font-bold">Initializing VTO Engine</h3>
            <p className="text-neutral-400 mt-2">Loading TensorFlow models...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-50 bg-neutral-900">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-xl font-bold">Error</h3>
            <p className="text-neutral-400 mt-2">{error}</p>
            <button 
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-white text-black font-bold rounded-full"
            >
              Close
            </button>
          </div>
        )}

        <Webcam
          ref={webcamRef}
          audio={false}
          className="absolute inset-0 w-full h-full object-cover"
          mirrored={true}
        />
        
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100" // Match webcam mirror
        />

        {/* UI Overlay */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center items-end gap-4 px-6 z-20">
            
            {/* View Switcher */}
            <div className="flex bg-black/50 backdrop-blur-md rounded-full p-1 border border-white/10 mb-2">
              {(['front', 'back', 'left', 'right'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all ${
                    currentView === view 
                      ? 'bg-primary text-black shadow-lg' 
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>

            {/* Capture Button */}
            <button
              onClick={capturePhoto}
              className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-110 transition-transform"
            >
              <Camera className="w-6 h-6" />
            </button>
        </div>

        {/* Stats Overlay */}
        <div className="absolute top-6 left-6 z-20 bg-black/40 backdrop-blur-md rounded-lg p-3 border border-white/5 text-xs font-mono text-white/70 space-y-1">
          <div className="flex justify-between w-24">
            <span>FPS:</span>
            <span className="text-primary">{metrics.fps}</span>
          </div>
          <div className="flex justify-between w-24">
            <span>CONF:</span>
            <span className={metrics.confidence > 50 ? "text-green-400" : "text-yellow-400"}>
              {metrics.confidence}%
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 text-neutral-500 text-xs text-center px-4">
        Ensure you are well-lit and your full upper body is visible. Stand 2-3 meters back.
      </div>
    </div>
  );
}
