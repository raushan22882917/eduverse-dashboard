import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
    Hand,
    Send,
    Trash2,
    Loader2,
    Download,
    Bot,
    User,
    MessageCircle,
    Sparkles,
    Palette,
    Zap,
    RotateCcw,
    Play,
    Pause,
    BookOpen,
    Lightbulb,
    Target,
    Brain
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "@mediapipe/camera_utils";
import { Hands, Results, HAND_CONNECTIONS, Landmark } from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    type?: 'analysis' | 'instruction' | 'general';
    subject?: 'mathematics' | 'physics' | 'chemistry' | 'biology' | 'general';
    relatedImages?: string[];
    confidence?: number;
}

const DrawInAir = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLInputElement>(null);

    const [cameraActive, setCameraActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentGesture, setCurrentGesture] = useState<string>("None");
    const [analysisResult, setAnalysisResult] = useState<string>("");
    
    // Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [showChat, setShowChat] = useState(true);

    // Drawing state
    const prevPoint = useRef<{ x: number, y: number } | null>(null);
    const [drawingColor, setDrawingColor] = useState("#FF00FF");
    const [brushSize, setBrushSize] = useState(10);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
        }
    }, [user, authLoading, navigate]);

    // Initialize chat with welcome message
    useEffect(() => {
        setChatMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `🎨 **Welcome to Draw In Air!** 

I'm your AI-powered educational assistant with advanced subject recognition. Here's what makes me special:

## ✋ **Hand Gestures:**
• **✏️ Draw:** Index finger UP only
• **🖐️ Move:** Index + Middle fingers UP  
• **🧼 Erase:** All fingers UP (Open Palm)

## � h**Smart Subject Analysis:**
I automatically categorize your drawings into:
• 🧮 **Mathematics** - Equations, graphs, geometry
• ⚡ **Physics** - Forces, circuits, mechanics  
• 🧪 **Chemistry** - Molecules, reactions, structures
• 🧬 **Biology** - Cells, organisms, life processes

## 🎯 **What I Provide:**
• **Subject-specific analysis** with confidence scoring
• **Step-by-step solutions** for problems
• **Related educational content** and visual aids
• **Interactive learning** with real-time feedback

**Ready to start?** Draw something and I'll analyze it with subject expertise! 🚀`,
            timestamp: new Date(),
            type: 'instruction',
            subject: 'general'
        }]);
    }, []);

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [chatMessages]);

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
            drawingCtx.strokeStyle = drawingColor;
            drawingCtx.lineWidth = brushSize;
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
            setChatLoading(true);

            // Add user message to chat
            const userMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'user',
                content: "🎨 Please analyze my drawing",
                timestamp: new Date(),
                type: 'analysis'
            };
            setChatMessages(prev => [...prev, userMessage]);

            // Get the image data
            const dataUrl = drawingCanvasRef.current.toDataURL('image/png');
            const base64Data = dataUrl.split(',')[1];

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            // First, classify the subject
            const classificationPrompt = `Analyze this drawing and classify it into one of these subjects: mathematics, physics, chemistry, biology, or general.

Return ONLY a JSON object with this format:
{
  "subject": "mathematics|physics|chemistry|biology|general",
  "confidence": 0.95,
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Look for:
- Mathematics: equations, graphs, geometric shapes, numbers, formulas
- Physics: force diagrams, circuits, waves, mechanics, energy
- Chemistry: molecular structures, chemical equations, periodic table, reactions
- Biology: cell structures, anatomy, DNA, organisms, biological processes
- General: other drawings, art, or unclear content`;

            const classificationResult = await model.generateContent([
                classificationPrompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/png",
                    },
                },
            ]);

            let subject = 'general';
            let confidence = 0.5;
            let keywords: string[] = [];

            try {
                const classificationText = classificationResult.response.text();
                const jsonMatch = classificationText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const classification = JSON.parse(jsonMatch[0]);
                    subject = classification.subject || 'general';
                    confidence = classification.confidence || 0.5;
                    keywords = classification.keywords || [];
                }
            } catch (e) {
                console.log('Classification parsing failed, using general');
            }

            // Now analyze with subject-specific context
            const subjectPrompts = {
                mathematics: `🧮 **MATHEMATICS ANALYSIS**

Analyze this mathematical drawing/equation. Provide:

1. **📊 What I See**: Identify mathematical elements (equations, graphs, shapes, numbers)
2. **🔢 Solution**: If it's a problem, solve it step-by-step with clear explanations
3. **📐 Concepts**: Explain the mathematical concepts involved
4. **💡 Learning Tips**: Provide study tips and related topics
5. **🔗 Connections**: How this relates to other math topics

Use proper mathematical notation and be educational.`,

                physics: `⚡ **PHYSICS ANALYSIS**

Analyze this physics-related drawing. Provide:

1. **🔬 What I See**: Identify physics elements (forces, circuits, waves, etc.)
2. **⚖️ Analysis**: Explain the physics principles involved
3. **🧪 Calculations**: If applicable, show relevant calculations
4. **🌟 Real-World**: Connect to real-world applications
5. **📚 Study Guide**: Related physics topics to explore

Focus on physics concepts and practical applications.`,

                chemistry: `🧪 **CHEMISTRY ANALYSIS**

Analyze this chemistry-related drawing. Provide:

1. **⚗️ What I See**: Identify chemical elements (molecules, reactions, structures)
2. **🔬 Chemical Analysis**: Explain the chemistry involved
3. **⚛️ Molecular Details**: Discuss molecular structure and bonding
4. **🧬 Reactions**: If applicable, explain chemical reactions
5. **🌡️ Properties**: Discuss chemical and physical properties

Focus on chemical concepts and molecular understanding.`,

                biology: `🧬 **BIOLOGY ANALYSIS**

Analyze this biology-related drawing. Provide:

1. **🔬 What I See**: Identify biological elements (cells, organs, organisms)
2. **🧬 Biological Analysis**: Explain the biological processes
3. **🌱 Life Processes**: Discuss relevant life processes
4. **🔬 Microscopic View**: If applicable, explain at cellular level
5. **🌿 Ecosystem**: Connect to broader biological systems

Focus on biological concepts and life processes.`,

                general: `🎨 **GENERAL ANALYSIS**

Analyze this drawing. Provide:

1. **👁️ What I See**: Describe the visual elements
2. **🎯 Purpose**: Try to understand the intent or meaning
3. **📝 Explanation**: Provide educational insights if possible
4. **💡 Suggestions**: Offer learning opportunities
5. **🔗 Connections**: Link to relevant academic subjects

Be helpful and educational regardless of the content.`
            };

            const analysisPrompt = subjectPrompts[subject as keyof typeof subjectPrompts] || subjectPrompts.general;

            const result = await model.generateContent([
                analysisPrompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/png",
                    },
                },
            ]);

            const response = result.response;
            const text = response.text();

            // Generate related images based on keywords
            const relatedImages = await generateRelatedImages(keywords, subject);

            // Add AI response to chat with subject classification
            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: text,
                timestamp: new Date(),
                type: 'analysis',
                subject: subject as any,
                confidence: confidence,
                relatedImages: relatedImages
            };
            setChatMessages(prev => [...prev, aiMessage]);

            setAnalysisResult(text);
            toast({
                title: "Analysis Complete",
                description: `Classified as ${subject.toUpperCase()} (${Math.round(confidence * 100)}% confidence)`,
            });

        } catch (error: any) {
            console.error(error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: "❌ Sorry, I couldn't analyze your drawing. Please try again or make sure your drawing is clear and visible.",
                timestamp: new Date(),
                type: 'general'
            };
            setChatMessages(prev => [...prev, errorMessage]);
            
            toast({
                title: "Analysis Failed",
                description: error.message || "Failed to connect to Gemini.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setChatLoading(false);
        }
    };

    // Generate educational SVG images based on subject
    const generateEducationalSVG = (subject: string, concept: string, color: string, index: number): string => {
        const icons = {
            mathematics: ['∑', '∫', 'π', '∞'],
            physics: ['⚡', '🔬', '⚛️', '🌊'],
            chemistry: ['⚗️', '🧪', '⚛️', '🔬'],
            biology: ['🧬', '🦠', '🌱', '🔬'],
            general: ['📚', '💡', '🎯', '🧠']
        };

        const subjectIcons = icons[subject as keyof typeof icons] || icons.general;
        const icon = subjectIcons[index % subjectIcons.length];

        const svg = `
            <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad-${subject}-${index}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:0.9" />
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0.6" />
                    </linearGradient>
                    <filter id="shadow-${index}">
                        <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
                    </filter>
                </defs>
                <rect width="300" height="200" fill="url(#grad-${subject}-${index})" rx="12" filter="url(#shadow-${index})"/>
                <circle cx="150" cy="80" r="25" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
                <text x="150" y="88" font-family="Arial, sans-serif" font-size="24" 
                      text-anchor="middle" fill="white" dominant-baseline="middle">
                    ${icon}
                </text>
                <text x="150" y="130" font-family="Arial, sans-serif" font-size="16" font-weight="bold" 
                      text-anchor="middle" fill="white" dominant-baseline="middle">
                    ${concept}
                </text>
                <text x="150" y="155" font-family="Arial, sans-serif" font-size="11" 
                      text-anchor="middle" fill="rgba(255,255,255,0.8)" dominant-baseline="middle">
                    ${subject.charAt(0).toUpperCase() + subject.slice(1)} • Educational Content
                </text>
            </svg>
        `;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    };

    // Generate related educational images
    const generateRelatedImages = async (keywords: string[], subject: string): Promise<string[]> => {
        try {
            const conceptMap = {
                mathematics: {
                    concepts: ['Algebra', 'Geometry', 'Calculus', 'Statistics'],
                    color: '#4F46E5'
                },
                physics: {
                    concepts: ['Forces', 'Energy', 'Waves', 'Mechanics'],
                    color: '#DC2626'
                },
                chemistry: {
                    concepts: ['Molecules', 'Reactions', 'Bonds', 'Elements'],
                    color: '#059669'
                },
                biology: {
                    concepts: ['Cells', 'DNA', 'Organisms', 'Evolution'],
                    color: '#16A34A'
                },
                general: {
                    concepts: ['Learning', 'Education', 'Knowledge'],
                    color: '#6B7280'
                }
            };

            const subjectData = conceptMap[subject as keyof typeof conceptMap] || conceptMap.general;
            const images: string[] = [];

            // Generate 2-3 educational images based on the subject
            const numImages = Math.min(3, Math.max(2, keywords.length));
            for (let i = 0; i < numImages; i++) {
                const concept = subjectData.concepts[i % subjectData.concepts.length];
                const svgImage = generateEducationalSVG(subject, concept, subjectData.color, i);
                images.push(svgImage);
            }

            return images;
        } catch (error) {
            console.error('Failed to generate related images:', error);
            return [];
        }
    };

    const handleChatSend = async () => {
        if (!chatInput.trim() || chatLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: chatInput,
            timestamp: new Date(),
            type: 'general'
        };

        setChatMessages(prev => [...prev, userMessage]);
        const question = chatInput;
        setChatInput("");
        setChatLoading(true);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error("Gemini API key not configured");
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            // Detect subject from question
            const subjectDetection = question.toLowerCase();
            let detectedSubject = 'general';
            
            if (subjectDetection.includes('math') || subjectDetection.includes('equation') || subjectDetection.includes('formula') || subjectDetection.includes('calculate')) {
                detectedSubject = 'mathematics';
            } else if (subjectDetection.includes('physics') || subjectDetection.includes('force') || subjectDetection.includes('energy') || subjectDetection.includes('motion')) {
                detectedSubject = 'physics';
            } else if (subjectDetection.includes('chemistry') || subjectDetection.includes('chemical') || subjectDetection.includes('molecule') || subjectDetection.includes('reaction')) {
                detectedSubject = 'chemistry';
            } else if (subjectDetection.includes('biology') || subjectDetection.includes('biological') || subjectDetection.includes('cell') || subjectDetection.includes('organism')) {
                detectedSubject = 'biology';
            }

            const subjectPrompts = {
                mathematics: `🧮 You are a mathematics tutor specializing in air drawing analysis. Help the student with mathematical concepts, equations, and problem-solving.`,
                physics: `⚡ You are a physics tutor specializing in air drawing analysis. Help the student understand physics concepts, forces, and natural phenomena.`,
                chemistry: `🧪 You are a chemistry tutor specializing in air drawing analysis. Help the student with chemical structures, reactions, and molecular concepts.`,
                biology: `🧬 You are a biology tutor specializing in air drawing analysis. Help the student understand biological processes, structures, and life sciences.`,
                general: `🎨 You are an AI drawing tutor helping students with their air drawing practice.`
            };

            const contextPrompt = subjectPrompts[detectedSubject as keyof typeof subjectPrompts];

            const prompt = `${contextPrompt}

Context: The student is using a hand gesture drawing system where they can draw in the air using finger gestures.

Student question: ${question}

Please provide a helpful, educational response with subject-specific insights. If they're asking about drawing techniques, gestures, or need help with their work, be encouraging and provide clear guidance. Use markdown formatting for better readability.

Focus on ${detectedSubject} concepts if relevant.`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Generate related images for the response
            const keywords = question.split(' ').filter(word => word.length > 3);
            const relatedImages = await generateRelatedImages(keywords, detectedSubject);

            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: text,
                timestamp: new Date(),
                type: 'general',
                subject: detectedSubject as any,
                relatedImages: relatedImages
            };

            setChatMessages(prev => [...prev, aiMessage]);

        } catch (error: any) {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: "❌ Sorry, I couldn't process your message. Please try again.",
                timestamp: new Date(),
                type: 'general'
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleChatKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChatSend();
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

            <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
                {/* Enhanced Header */}
                <div className="border-b bg-card/50 backdrop-blur-sm">
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="relative">
                                    <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg">
                                        <Hand className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                        Draw In Air
                                    </h1>
                                    <p className="text-muted-foreground text-sm sm:text-lg">
                                        ✨ AI-powered gesture drawing with real-time analysis
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowChat(!showChat)}
                                    className="gap-2 flex-1 sm:flex-none"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    <span className="sm:inline">{showChat ? 'Hide Chat' : 'Show Chat'}</span>
                                </Button>
                                <Badge variant="secondary" className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">Gemini 2.0 Flash</span>
                                    <span className="sm:hidden">AI</span>
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden relative">
                    {/* Drawing Canvas Area */}
                    <div className="flex-1 flex flex-col p-4 lg:p-6 min-w-0">
                        {/* Canvas Controls */}
                        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <Button
                                    onClick={() => setCameraActive(!cameraActive)}
                                    variant={cameraActive ? "destructive" : "default"}
                                    size="sm"
                                    className="gap-2"
                                >
                                    {cameraActive ? (
                                        <>
                                            <Pause className="h-4 w-4" />
                                            <span className="hidden sm:inline">Stop Camera</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="h-4 w-4" />
                                            <span className="hidden sm:inline">Start Camera</span>
                                        </>
                                    )}
                                </Button>
                                
                                {cameraActive && (
                                    <Badge variant="secondary" className="bg-red-100 text-red-800 animate-pulse px-2 py-1 text-xs">
                                        🔴 LIVE
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                {/* Drawing Controls */}
                                <div className="flex items-center gap-1 sm:gap-2 bg-card rounded-lg p-1 sm:p-2 border">
                                    <Palette className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                    <input
                                        type="color"
                                        value={drawingColor}
                                        onChange={(e) => setDrawingColor(e.target.value)}
                                        className="w-6 h-6 sm:w-8 sm:h-8 rounded border-0 cursor-pointer"
                                        title="Drawing Color"
                                    />
                                    <div className="w-px h-4 sm:h-6 bg-border mx-1"></div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="30"
                                        value={brushSize}
                                        onChange={(e) => setBrushSize(Number(e.target.value))}
                                        className="w-12 sm:w-20"
                                        title="Brush Size"
                                    />
                                    <span className="text-xs text-muted-foreground w-4 sm:w-6">{brushSize}px</span>
                                </div>

                                <Button
                                    onClick={clearCanvas}
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 sm:gap-2 px-2 sm:px-3"
                                >
                                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Clear</span>
                                </Button>

                                <Button
                                    onClick={analyzeDrawing}
                                    disabled={loading || !cameraActive}
                                    size="sm"
                                    className="gap-1 sm:gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-2 sm:px-3"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                            <span className="hidden sm:inline">Analyzing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                                            <span className="hidden sm:inline">Analyze</span>
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={downloadDrawing}
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 sm:gap-2 px-2 sm:px-3"
                                >
                                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Save</span>
                                </Button>
                            </div>
                        </div>

                        {/* Canvas */}
                        <Card className="flex-1 overflow-hidden shadow-2xl border-2 min-h-[500px] max-h-[calc(100vh-200px)]">
                            <CardContent className="p-0 relative h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                                <video
                                    ref={videoRef}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    style={{ transform: "scaleX(-1)", visibility: "hidden" }}
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

                                {/* Enhanced Status Overlay */}
                                <div className="absolute top-6 left-6 bg-black/70 text-white px-4 py-2 rounded-xl backdrop-blur-md border border-white/20">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            currentGesture.includes("Drawing") ? "bg-green-400 animate-pulse" :
                                            currentGesture.includes("Moving") ? "bg-blue-400" :
                                            currentGesture.includes("Erasing") ? "bg-red-400 animate-pulse" :
                                            "bg-gray-400"
                                        )}></div>
                                        <span className="font-medium">{currentGesture}</span>
                                    </div>
                                </div>

                                {/* Gesture Guide Overlay */}
                                {!cameraActive && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                        <div className="text-center text-white space-y-4 max-w-md">
                                            <div className="text-6xl mb-4">🎨</div>
                                            <h3 className="text-2xl font-bold">Ready to Draw?</h3>
                                            <p className="text-lg opacity-90">Start your camera to begin drawing in the air!</p>
                                            <div className="grid grid-cols-3 gap-4 mt-6 text-sm">
                                                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                                                    <div className="text-2xl mb-2">✏️</div>
                                                    <div className="font-medium">Draw</div>
                                                    <div className="opacity-75">Index finger up</div>
                                                </div>
                                                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                                                    <div className="text-2xl mb-2">🖐️</div>
                                                    <div className="font-medium">Move</div>
                                                    <div className="opacity-75">Two fingers up</div>
                                                </div>
                                                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                                                    <div className="text-2xl mb-2">🧼</div>
                                                    <div className="font-medium">Erase</div>
                                                    <div className="opacity-75">Open palm</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Enhanced Chat Sidebar */}
                    {showChat && (
                        <div className="absolute sm:relative inset-y-0 right-0 w-full sm:w-80 lg:w-96 border-l bg-card/95 sm:bg-card/50 backdrop-blur-sm flex flex-col z-10 shadow-2xl sm:shadow-none max-h-[calc(100vh-200px)]">
                            {/* Chat Header */}
                            <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                            <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-sm sm:text-base truncate">AI Drawing Assistant</h3>
                                        <p className="text-xs text-muted-foreground">Powered by Gemini 2.0 Flash</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowChat(false)}
                                            className="sm:hidden h-8 w-8 p-0"
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <ScrollArea className="flex-1 p-2 sm:p-4" ref={chatScrollRef}>
                                <div className="space-y-3 sm:space-y-4">
                                    {chatMessages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={cn(
                                                "flex gap-2 sm:gap-3",
                                                message.role === 'user' ? 'justify-end' : 'justify-start'
                                            )}
                                        >
                                            {message.role === 'assistant' && (
                                                <Avatar className="h-6 w-6 sm:h-8 sm:w-8 shrink-0">
                                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                                        <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            
                                            <div
                                                className={cn(
                                                    "max-w-[85%] rounded-lg p-2 sm:p-3 shadow-sm",
                                                    message.role === 'user'
                                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white ml-auto'
                                                        : 'bg-card border'
                                                )}
                                            >
                                                {/* Subject Badge for AI messages */}
                                                {message.role === 'assistant' && message.subject && message.subject !== 'general' && (
                                                    <div className="mb-2 flex items-center gap-2">
                                                        <Badge 
                                                            variant="secondary" 
                                                            className={cn(
                                                                "text-xs px-2 py-1",
                                                                message.subject === 'mathematics' && "bg-blue-100 text-blue-800",
                                                                message.subject === 'physics' && "bg-red-100 text-red-800",
                                                                message.subject === 'chemistry' && "bg-green-100 text-green-800",
                                                                message.subject === 'biology' && "bg-purple-100 text-purple-800"
                                                            )}
                                                        >
                                                            {message.subject === 'mathematics' && '🧮 Mathematics'}
                                                            {message.subject === 'physics' && '⚡ Physics'}
                                                            {message.subject === 'chemistry' && '🧪 Chemistry'}
                                                            {message.subject === 'biology' && '🧬 Biology'}
                                                        </Badge>
                                                        {message.confidence && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {Math.round(message.confidence * 100)}% confidence
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="text-xs sm:text-sm">
                                                    {message.role === 'assistant' ? (
                                                        <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-1 sm:prose-headings:my-2 prose-ul:my-1 prose-ol:my-1">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {message.content}
                                                            </ReactMarkdown>
                                                        </div>
                                                    ) : (
                                                        message.content
                                                    )}
                                                </div>

                                                {/* Related Images */}
                                                {message.relatedImages && message.relatedImages.length > 0 && (
                                                    <div className="mt-3 space-y-2">
                                                        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                            <span>📚</span>
                                                            <span>Related Educational Content:</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {message.relatedImages.slice(0, 4).map((imageUrl, index) => (
                                                                <div key={index} className="relative group">
                                                                    <div className="w-full h-20 sm:h-24 rounded border overflow-hidden bg-gradient-to-br from-muted/50 to-muted hover:shadow-md transition-all cursor-pointer">
                                                                        <img 
                                                                            src={imageUrl} 
                                                                            alt={`Related ${message.subject} content ${index + 1}`}
                                                                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                                                                            onError={(e) => {
                                                                                // Fallback to a simple colored div with text
                                                                                const target = e.target as HTMLImageElement;
                                                                                const parent = target.parentElement;
                                                                                if (parent) {
                                                                                    parent.innerHTML = `
                                                                                        <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 text-blue-800 text-xs font-medium">
                                                                                            ${message.subject?.charAt(0).toUpperCase()}${message.subject?.slice(1)} Content
                                                                                        </div>
                                                                                    `;
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded transition-colors"></div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground opacity-75">
                                                            💡 Educational concepts related to your {message.subject} drawing
                                                        </div>
                                                    </div>
                                                )}

                                                <div className={cn(
                                                    "text-xs mt-1 sm:mt-2 opacity-70 flex items-center justify-between",
                                                    message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                                                )}>
                                                    <span>{message.timestamp.toLocaleTimeString()}</span>
                                                    {message.type === 'analysis' && (
                                                        <span className="text-xs">🎨 Analysis</span>
                                                    )}
                                                </div>
                                            </div>

                                            {message.role === 'user' && (
                                                <Avatar className="h-6 w-6 sm:h-8 sm:w-8 shrink-0">
                                                    <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                                                        <User className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {chatLoading && (
                                        <div className="flex gap-2 sm:gap-3 justify-start">
                                            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 shrink-0">
                                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                                    <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="bg-card border rounded-lg p-2 sm:p-3 shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                                    <span className="text-xs sm:text-sm text-muted-foreground">Thinking...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Chat Input */}
                            <div className="p-2 sm:p-4 border-t bg-background/50">
                                <div className="flex gap-2">
                                    <Input
                                        ref={chatInputRef}
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyPress={handleChatKeyPress}
                                        placeholder="Ask me about your drawing..."
                                        disabled={chatLoading}
                                        className="flex-1 text-sm"
                                    />
                                    <Button
                                        onClick={handleChatSend}
                                        disabled={!chatInput.trim() || chatLoading}
                                        size="sm"
                                        className="px-2 sm:px-3"
                                    >
                                        <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                </div>
                                <div className="flex gap-1 mt-2 flex-wrap">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setChatInput("Explain the mathematics in my drawing with step-by-step solution");
                                            chatInputRef.current?.focus();
                                        }}
                                        className="text-xs px-2 py-1 h-auto"
                                    >
                                        🧮 <span className="hidden sm:inline">Math</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setChatInput("Analyze the physics concepts and forces in my drawing");
                                            chatInputRef.current?.focus();
                                        }}
                                        className="text-xs px-2 py-1 h-auto"
                                    >
                                        ⚡ <span className="hidden sm:inline">Physics</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setChatInput("Identify chemical structures and reactions in my drawing");
                                            chatInputRef.current?.focus();
                                        }}
                                        className="text-xs px-2 py-1 h-auto"
                                    >
                                        🧪 <span className="hidden sm:inline">Chemistry</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setChatInput("Explain the biological processes and structures in my drawing");
                                            chatInputRef.current?.focus();
                                        }}
                                        className="text-xs px-2 py-1 h-auto"
                                    >
                                        🧬 <span className="hidden sm:inline">Biology</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DrawInAir;
