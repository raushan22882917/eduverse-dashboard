import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Camera as CameraIcon,
    Hand,
    Send,
    Trash2,
    Loader2,
    Info,
    Download,
    Lightbulb
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "@mediapipe/camera_utils";
import { Hands, Results, HAND_CONNECTIONS, Landmark } from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DrawInAir = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const [cameraActive, setCameraActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentGesture, setCurrentGesture] = useState<string>("None");
    const [analysisResult, setAnalysisResult] = useState<string>("");

    // Drawing state
    const prevPoint = useRef<{ x: number, y: number } | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
        }
    }, [user, authLoading, navigate]);

    // Initialize drawing canvas
    useEffect(() => {
        if (!drawingCanvasRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = 1280;
            canvas.height = 720;
            drawingCanvasRef.current = canvas;
        }
    }, []);

    useEffect(() => {
        let camera: Camera | null = null;
        let hands: Hands | null = null;

        if (cameraActive && videoRef.current && canvasRef.current && drawingCanvasRef.current) {
            hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7
            });

            hands.onResults(onResults);

            camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    if (videoRef.current && hands) {
                        await hands.send({ image: videoRef.current });
                    }
                },
                width: 1280,
                height: 720
            });

            camera.start();
            setIsProcessing(true);
        }

        return () => {
            if (camera) {
                camera.stop();
                camera = null;
            }
            if (hands) {
                hands.close();
                hands = null;
            }
            setIsProcessing(false);
        };
    }, [cameraActive]);

    const onResults = (results: Results) => {
        if (!canvasRef.current || !drawingCanvasRef.current) return;

        const canvasCtx = canvasRef.current.getContext('2d');
        const drawingCtx = drawingCanvasRef.current.getContext('2d');

        if (!canvasCtx || !drawingCtx) return;

        const width = canvasRef.current.width;
        const height = canvasRef.current.height;

        // 1. Clear main canvas and draw camera feed
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, width, height);
        canvasCtx.drawImage(results.image, 0, 0, width, height);

        // 2. Draw existing drawings
        canvasCtx.drawImage(drawingCanvasRef.current, 0, 0, width, height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // Draw skeleton
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
            drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });

            detectGesture(landmarks, width, height, drawingCtx);
        }

        canvasCtx.restore();
    };

    const detectGesture = (landmarks: Landmark[], width: number, height: number, drawingCtx: CanvasRenderingContext2D) => {
        // Finger Tips & PIPS
        const indexTip = landmarks[8];
        const indexPip = landmarks[6];
        const middleTip = landmarks[12];
        const middlePip = landmarks[10];
        const ringTip = landmarks[16];
        const ringPip = landmarks[14];
        const pinkyTip = landmarks[20];
        const pinkyPip = landmarks[18];

        // Check which fingers are UP
        const indexUp = indexTip.y < indexPip.y;
        const middleUp = middleTip.y < middlePip.y;
        const ringUp = ringTip.y < ringPip.y;
        const pinkyUp = pinkyTip.y < pinkyPip.y;

        // Coordinates for drawing (Index Tip)
        let cx = indexTip.x * width;
        let cy = indexTip.y * height;

        // A. Drawing Mode: Only Index UP
        if (indexUp && !middleUp && !ringUp && !pinkyUp) {
            setCurrentGesture("Drawing ✏️");

            if (!prevPoint.current) {
                prevPoint.current = { x: cx, y: cy };
            }

            drawingCtx.beginPath();
            drawingCtx.moveTo(prevPoint.current.x, prevPoint.current.y);
            drawingCtx.lineTo(cx, cy);
            drawingCtx.strokeStyle = "#FF00FF"; // Magenta
            drawingCtx.lineWidth = 10;
            drawingCtx.lineCap = "round";
            drawingCtx.stroke();

            prevPoint.current = { x: cx, y: cy };
        }
        // B. Moving Mode: Index + Middle UP (Hover)
        else if (indexUp && middleUp && !ringUp) {
            setCurrentGesture("Moving ✋");
            prevPoint.current = null;
        }
        // C. Erasing Mode: All Fingers UP
        else if (indexUp && middleUp && ringUp && pinkyUp) {
            setCurrentGesture("Erasing 🧼");
            drawingCtx.clearRect(0, 0, width, height);
            // Also clear the analysis result when erasing? Maybe not.
        }
        else {
            setCurrentGesture("Waiting...");
            prevPoint.current = null;
        }
    };

    const clearCanvas = () => {
        if (drawingCanvasRef.current) {
            const ctx = drawingCanvasRef.current.getContext('2d');
            ctx?.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
            setAnalysisResult("");
            toast({
                title: "Canvas Cleared",
                description: "Drawing canvas has been cleared",
            });
        }
    };

    const analyzeDrawing = async () => {
        if (!drawingCanvasRef.current) return;

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            toast({
                title: "Configuration Error",
                description: "VITE_GEMINI_API_KEY is missing in your .env file.",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);

            // Get the image data
            // Note: The drawingCanvasRef is NOT mirrored. It's drawn in "local" coordinates.
            // But the Camera feed was mirrored.
            const dataUrl = drawingCanvasRef.current.toDataURL('image/png');
            const base64Data = dataUrl.split(',')[1];

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

            const prompt = "Analyze this drawing. It might be a math equation, a diagram, or a shape. Explain what you see and solve it if it's a problem. Return plain text.";

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/png",
                    },
                },
            ]);

            const response = await result.response;
            const text = response.text();

            setAnalysisResult(text);
            toast({
                title: "Analysis Complete",
                description: "Gemini has analyzed your drawing!",
            });

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Analysis Failed",
                description: error.message || "Failed to connect to Gemini.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const downloadDrawing = () => {
        if (!drawingCanvasRef.current) return;
        const link = document.createElement('a');
        link.download = `air-drawing-${Date.now()}.png`;
        link.href = drawingCanvasRef.current.toDataURL();
        link.click();
    };

    return (
        <div className="flex min-h-screen w-full">
            <StudentSidebar />

            <main className="flex-1 p-8 overflow-y-auto bg-background">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                                <Hand className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Draw In Air
                                </h1>
                                <p className="text-muted-foreground">
                                    Use hand gestures to draw in the air and get AI analysis
                                </p>
                            </div>
                        </div>

                        {/* Instructions */}
                        <Alert className="mb-6 border-blue-200 bg-blue-50">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                <div className="space-y-2">
                                    <p className="font-medium">Gestures:</p>
                                    <ul className="text-sm space-y-1">
                                        <li>• ✏️ <strong>Draw:</strong> Index finger UP only</li>
                                        <li>• ✋ <strong>Hover/Move:</strong> Index + Middle fingers UP</li>
                                        <li>• 🧼 <strong>Erase:</strong> All fingers UP (Open Palm)</li>
                                    </ul>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Side - Camera */}
                        <div className="lg:col-span-2">
                            <Card className="h-full flex flex-col">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="flex items-center gap-2">
                                        <CameraIcon className="h-5 w-5" />
                                        Canvas
                                        {cameraActive && (
                                            <Badge variant="secondary" className="bg-red-100 text-red-800 animate-pulse">
                                                LIVE
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => setCameraActive(!cameraActive)}
                                            variant={cameraActive ? "destructive" : "default"}
                                            size="sm"
                                        >
                                            {cameraActive ? "Stop Camera" : "Start Camera"}
                                        </Button>
                                        <Button
                                            onClick={clearCanvas}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 p-0 relative overflow-hidden bg-black min-h-[500px]">
                                    <video
                                        ref={videoRef}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        style={{ transform: "scaleX(-1)", visibility: "hidden" }} // Hide video, show canvas
                                        playsInline
                                        muted
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="absolute inset-0 w-full h-full object-contain"
                                        width={1280}
                                        height={720}
                                        style={{ transform: "scaleX(-1)" }}
                                    />

                                    {/* Status Overlay */}
                                    <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-lg font-medium backdrop-blur-md">
                                        {currentGesture}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Side - Analysis */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5" />
                                        AI Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Draw complex shapes, math equations, or diagrams, then ask AI to explain them.
                                    </p>

                                    <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={analyzeDrawing}
                                        disabled={loading || !cameraActive}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" />
                                                Analyze Drawing (Gemini)
                                            </>
                                        )}
                                    </Button>

                                    <Button variant="outline" className="w-full" onClick={downloadDrawing}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Image
                                    </Button>
                                </CardContent>
                            </Card>

                            {analysisResult && (
                                <Card className="bg-blue-50/50 border-blue-200">
                                    <CardHeader>
                                        <CardTitle className="text-blue-900 text-lg">Result</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="prose prose-sm prose-blue max-w-none">
                                            <p className="whitespace-pre-wrap text-blue-800">{analysisResult}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DrawInAir;
