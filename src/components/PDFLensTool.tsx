import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Zap, 
  Loader2, 
  X, 
  Brain,
  Eye,
  MessageCircle,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { analyzeImage, testGeminiConnection } from '@/utils/geminiApi';
import remarkGfm from 'remark-gfm';

interface PDFLensToolProps {
  pdfContainerRef?: React.RefObject<HTMLDivElement>;
  subject: string;
  contentTitle?: string;
}

interface LensPosition {
  x: number;
  y: number;
}

interface AnalysisResult {
  id: string;
  content: string;
  timestamp: Date;
  subject: string;
  confidence: number;
  imageData?: string;
  question?: string;
}

const PDFLensTool: React.FC<PDFLensToolProps> = ({
  pdfContainerRef,
  subject,
  contentTitle
}) => {
  const { toast } = useToast();
  
  const [isActive, setIsActive] = useState(false);
  const [lensPosition, setLensPosition] = useState<LensPosition>({ 
    x: Math.max(100, window.innerWidth / 2 - 75), 
    y: Math.max(100, window.innerHeight / 2 - 75) 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lensSize, setLensSize] = useState(150);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [chatMode, setChatMode] = useState(false);

  const lensRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle mouse events for dragging the lens
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!lensRef.current) return;
    
    const rect = lensRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    const maxX = window.innerWidth - lensSize;
    const maxY = window.innerHeight - lensSize;
    
    setLensPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  }, [isDragging, dragOffset, lensSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Update lens position when size changes to keep it within bounds
  useEffect(() => {
    const maxX = window.innerWidth - lensSize;
    const maxY = window.innerHeight - lensSize;
    
    setLensPosition(prev => ({
      x: Math.max(0, Math.min(prev.x, maxX)),
      y: Math.max(0, Math.min(prev.y, maxY))
    }));
  }, [lensSize]);

  // Capture the area under the lens
  const captureArea = useCallback(async (): Promise<string | null> => {
    if (!canvasRef.current) return null;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      canvas.width = lensSize;
      canvas.height = lensSize;

      const elementUnderLens = document.elementFromPoint(
        lensPosition.x + lensSize / 2, 
        lensPosition.y + lensSize / 2
      );
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, lensSize, lensSize);
      
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, lensSize - 2, lensSize - 2);
      
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      
      if (elementUnderLens) {
        const tagName = elementUnderLens.tagName.toLowerCase();
        const textContent = elementUnderLens.textContent?.substring(0, 200) || '';
        
        ctx.fillText(`Element: ${tagName}`, lensSize / 2, 30);
        
        if (textContent) {
          const words = textContent.split(' ').slice(0, 12);
          let y = 50;
          for (let i = 0; i < words.length; i += 4) {
            const line = words.slice(i, i + 4).join(' ');
            if (line.length > 25) {
              ctx.fillText(line.substring(0, 25) + '...', lensSize / 2, y);
            } else {
              ctx.fillText(line, lensSize / 2, y);
            }
            y += 15;
            if (y > lensSize - 40) break;
          }
        }
        
        if (tagName === 'iframe' || tagName === 'embed') {
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(20, lensSize - 40, lensSize - 40, 20);
          ctx.fillStyle = '#ffffff';
          ctx.fillText('PDF/Media Content', lensSize / 2, lensSize - 27);
        } else if (tagName === 'img') {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(20, lensSize - 40, lensSize - 40, 20);
          ctx.fillStyle = '#ffffff';
          ctx.fillText('Image Content', lensSize / 2, lensSize - 27);
        } else if (textContent) {
          ctx.fillStyle = '#6366f1';
          ctx.fillRect(20, lensSize - 40, lensSize - 40, 20);
          ctx.fillStyle = '#ffffff';
          ctx.fillText('Text Content', lensSize / 2, lensSize - 27);
        }
      } else {
        ctx.fillText('Screen Area', lensSize / 2, lensSize / 2 - 10);
        ctx.fillText(`Position: ${Math.round(lensPosition.x)}, ${Math.round(lensPosition.y)}`, lensSize / 2, lensSize / 2 + 10);
      }

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing area:', error);
      return null;
    }
  }, [lensSize, lensPosition.x, lensPosition.y]);

  // Test Gemini API connection
  const testGeminiAPI = async () => {
    try {
      const result = await testGeminiConnection();
      return result.success;
    } catch (error) {
      console.error('Gemini API test failed:', error);
      return false;
    }
  };

  // Analyze the captured area with AI
  const analyzeArea = useCallback(async (question?: string) => {
    setAnalyzing(true);
    
    try {
      const imageData = await captureArea();
      if (!imageData) {
        throw new Error('Failed to capture area');
      }

      let analysisText = '';
      let confidence = 0.85;

      // Use Gemini API directly for lens analysis
      console.log('Using Gemini API for lens analysis...');
      
      const analysisPrompt = question 
        ? `The user is asking about this specific screen area while studying ${subject}${contentTitle ? ` - "${contentTitle}"` : ''}: "${question}". Please analyze the content and provide a detailed educational answer.`
        : `Analyze this specific screen area while the user is studying ${subject}${contentTitle ? ` - "${contentTitle}"` : ''}. Identify and explain any text, diagrams, formulas, or concepts that might be visible. Provide educational insights and explanations relevant to ${subject}. If the content appears to be from a PDF, document, or educational material, provide detailed analysis.`;

      const geminiPrompt = `${analysisPrompt}

**Context**: This is a screen capture from an educational interface where a student is studying ${subject}${contentTitle ? ` - ${contentTitle}` : ''}. 

**Instructions**: 
1. Analyze the captured screen area image carefully
2. Provide educational insights relevant to ${subject}
3. If you can identify text, formulas, diagrams, or educational content, explain them in detail
4. Use markdown formatting for better readability
5. Be encouraging and educational in your response
6. If the image shows a PDF or document, try to read and explain the visible content

**Subject Focus**: ${subject.charAt(0).toUpperCase() + subject.slice(1)}

Please provide a detailed analysis of what you can see in this image.`;

      try {
        console.log('Sending request to Gemini...');
        const base64Data = imageData.split(',')[1];
        
        analysisText = await analyzeImage(base64Data, geminiPrompt);
        confidence = 0.85;
        
        console.log('Gemini analysis completed, text length:', analysisText?.length || 0);
        
        if (!analysisText || analysisText.trim().length === 0) {
          throw new Error('Empty response from Gemini API');
        }
        
        console.log('Gemini API analysis successful');
      } catch (geminiError) {
        console.error('Gemini API failed:', geminiError);
        
        analysisText = `# Screen Analysis Failed

**Error**: Unable to analyze the screen content using Gemini API.

**Details**: ${geminiError.message || 'Unknown API error'}

## Troubleshooting:

1. **Check API Key**: Ensure VITE_GEMINI_API_KEY is properly configured
2. **Network**: Verify internet connection
3. **API Limits**: You may have reached usage limits
4. **Browser Console**: Check for additional error details

## ${subject.charAt(0).toUpperCase() + subject.slice(1)} Study Tips:

${subject === 'mathematics' ? `
- **Look for**: Equations, graphs, geometric shapes, formulas
- **Focus on**: Step-by-step problem solving, pattern recognition
- **Practice**: Work through similar problems, check your calculations
` : subject === 'physics' ? `
- **Look for**: Force diagrams, circuit elements, wave patterns, energy concepts
- **Focus on**: Understanding physical principles, cause and effect relationships
- **Practice**: Apply formulas to real-world scenarios, draw diagrams
` : subject === 'chemistry' ? `
- **Look for**: Molecular structures, chemical equations, reaction mechanisms
- **Focus on**: Electron behavior, bonding patterns, reaction types
- **Practice**: Balance equations, predict products, understand mechanisms
` : subject === 'biology' ? `
- **Look for**: Cell structures, biological processes, anatomical diagrams
- **Focus on**: Life processes, structure-function relationships, systems
- **Practice**: Label diagrams, trace processes, understand connections
` : `
- **Look for**: Key concepts, definitions, examples, visual aids
- **Focus on**: Understanding main ideas, connecting concepts
- **Practice**: Summarize content, create your own examples
`}

Try using the test button (🧪) to verify API connectivity.`;
        
        confidence = 0.3;
      }

      const result: AnalysisResult = {
        id: Date.now().toString(),
        content: analysisText,
        timestamp: new Date(),
        subject: subject,
        confidence: confidence,
        imageData: imageData,
        question: question
      };

      setAnalysisResults(prev => [result, ...prev]);
      setShowAnalysisDialog(true);

      toast({
        title: "Analysis Complete",
        description: question ? "Your question has been answered" : "Screen area analyzed successfully",
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "Failed to analyze the selected area",
      });
    } finally {
      setAnalyzing(false);
    }
  }, [captureArea, subject, contentTitle, toast]);

  const handleQuestionSubmit = () => {
    if (!currentQuestion.trim()) return;
    
    analyzeArea(currentQuestion);
    setCurrentQuestion('');
    setChatMode(false);
  };

  if (!isActive) {
    return (
      <div className="fixed bottom-4 right-4" style={{ zIndex: 9998 }}>
        <Button
          onClick={() => setIsActive(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          <Search className="h-4 w-4 mr-2" />
          Screen Lens
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Lens Overlay */}
      <div
        ref={lensRef}
        className={cn(
          "fixed border-4 border-blue-500 rounded-full bg-blue-500/10 backdrop-blur-sm cursor-move shadow-2xl transition-colors",
          isDragging && "border-blue-600 bg-blue-600/20"
        )}
        style={{
          left: `${lensPosition.x}px`,
          top: `${lensPosition.y}px`,
          width: `${lensSize}px`,
          height: `${lensSize}px`,
          zIndex: 9999,
          pointerEvents: 'auto'
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Lens Center Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-6 h-0.5 bg-blue-500"></div>
          <div className="absolute w-0.5 h-6 bg-blue-500"></div>
        </div>

        {/* Lens Controls */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              analyzeArea();
            }}
            disabled={analyzing}
            className="h-8 px-2"
          >
            {analyzing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Zap className="h-3 w-3" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              setChatMode(true);
            }}
            className="h-8 px-2"
          >
            <MessageCircle className="h-3 w-3" />
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={async (e) => {
              e.stopPropagation();
              const isWorking = await testGeminiAPI();
              toast({
                title: isWorking ? "✅ Gemini API Working" : "❌ Gemini API Failed",
                description: isWorking ? "API connection successful" : "Check console for errors",
                variant: isWorking ? "default" : "destructive"
              });
            }}
            className="h-8 px-2"
            title="Test Gemini API"
          >
            🧪
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              setIsActive(false);
            }}
            className="h-8 px-2"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Size Controls */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/80 p-2 rounded-lg border border-white/20">
          <div className="flex flex-col items-center gap-1">
            <span className="text-white text-xs">Size</span>
            <input
              type="range"
              min="100"
              max="300"
              value={lensSize}
              onChange={(e) => {
                e.stopPropagation();
                setLensSize(Number(e.target.value));
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              className="w-20 h-2 accent-blue-500"
            />
            <span className="text-white text-xs">{lensSize}px</span>
          </div>
        </div>

        {/* Lens Info */}
        <div className="absolute -right-24 top-0 bg-black/90 text-white text-xs p-2 rounded-lg pointer-events-none shadow-lg border border-white/20">
          <div>Size: {lensSize}px</div>
          <div className="text-blue-200">📍 Movable</div>
          <div className="text-green-200">🤖 Gemini</div>
        </div>
      </div>

      {/* Hidden Canvas for Capture */}
      <canvas
        ref={canvasRef}
        className="hidden"
        width={lensSize}
        height={lensSize}
      />

      {/* Chat Mode Dialog */}
      <Dialog open={chatMode} onOpenChange={setChatMode}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Ask About This Area
            </DialogTitle>
            <DialogDescription>
              What would you like to know about the content under the lens?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder="e.g., Explain this formula, What is this diagram showing?"
              onKeyDown={(e) => e.key === 'Enter' && handleQuestionSubmit()}
              autoFocus
            />
            
            <div className="flex gap-2">
              <Button onClick={handleQuestionSubmit} disabled={!currentQuestion.trim()} className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Analyze & Answer
              </Button>
              <Button variant="outline" onClick={() => setChatMode(false)}>
                Cancel
              </Button>
            </div>

            {/* Quick Questions */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Quick Questions:</p>
              <div className="grid grid-cols-1 gap-1">
                {[
                  "Explain this concept",
                  "What does this formula mean?",
                  "How does this diagram work?",
                  "Solve this problem step by step"
                ].map((question) => (
                  <Button
                    key={question}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCurrentQuestion(question);
                      handleQuestionSubmit();
                    }}
                    className="justify-start text-xs h-8"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analysis Results Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Screen Analysis Results
            </DialogTitle>
            <DialogDescription>
              AI analysis of the selected screen area
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-4">
              {analysisResults.map((result) => (
                <Card key={result.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {result.subject.charAt(0).toUpperCase() + result.subject.slice(1)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      {result.confidence && (
                        <Badge variant="outline">
                          {Math.round(result.confidence * 100)}% confidence
                        </Badge>
                      )}
                    </div>
                    {result.question && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm font-medium">Question:</p>
                        <p className="text-sm text-muted-foreground">{result.question}</p>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Captured Image */}
                      {result.imageData && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Analyzed Area:</p>
                          <div className="border rounded-lg overflow-hidden">
                            <img
                              src={result.imageData}
                              alt="Captured screen area"
                              className="w-full h-auto"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Analysis Content */}
                      <div className="md:col-span-2 space-y-2">
                        <p className="text-sm font-medium">Analysis:</p>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {result.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {analysisResults.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No analysis results yet. Use the lens to analyze screen content!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PDFLensTool;