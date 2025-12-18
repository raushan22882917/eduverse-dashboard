import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Palette, 
  RotateCcw, 
  Download, 
  Zap, 
  Loader2, 
  Hand,
  Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ClassroomDrawingProps {
  subject: string;
  contentTitle?: string;
  onAnalysisComplete?: (analysis: string) => void;
}

const ClassroomDrawing: React.FC<ClassroomDrawingProps> = ({
  subject,
  contentTitle,
  onAnalysisComplete
}) => {
  const { toast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#2563eb');
  const [brushSize, setBrushSize] = useState(3);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Set drawing properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = brushSize;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setAnalysisResult('');
    setShowAnalysis(false);

    toast({
      title: "Canvas Cleared",
      description: "Drawing canvas has been cleared",
    });
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `classroom-sketch-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast({
      title: "Download Started",
      description: "Your sketch is being downloaded",
    });
  };

  const analyzeDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setAnalyzing(true);
    
    try {
      // Get the image data
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];

      // Create analysis prompt based on subject
      const subjectPrompts = {
        mathematics: `🧮 **MATHEMATICS ANALYSIS**

Analyze this mathematical sketch/drawing. Provide:

1. **📊 What I See**: Identify mathematical elements (equations, graphs, shapes, numbers)
2. **🔢 Solution**: If it's a problem, solve it step-by-step with clear explanations
3. **📐 Concepts**: Explain the mathematical concepts involved
4. **💡 Learning Tips**: Provide study tips and related topics
5. **🔗 Connections**: How this relates to other math topics

Use proper mathematical notation and be educational.`,

        physics: `⚡ **PHYSICS ANALYSIS**

Analyze this physics-related sketch. Provide:

1. **🔬 What I See**: Identify physics elements (forces, circuits, waves, etc.)
2. **⚖️ Analysis**: Explain the physics principles involved
3. **🧪 Calculations**: If applicable, show relevant calculations
4. **🌟 Real-World**: Connect to real-world applications
5. **📚 Study Guide**: Related physics topics to explore

Focus on physics concepts and practical applications.`,

        chemistry: `🧪 **CHEMISTRY ANALYSIS**

Analyze this chemistry-related sketch. Provide:

1. **⚗️ What I See**: Identify chemical elements (molecules, reactions, structures)
2. **🔬 Chemical Analysis**: Explain the chemistry involved
3. **⚛️ Molecular Details**: Discuss molecular structure and bonding
4. **🧬 Reactions**: If applicable, explain chemical reactions
5. **🌡️ Properties**: Discuss chemical and physical properties

Focus on chemical concepts and molecular understanding.`,

        biology: `🧬 **BIOLOGY ANALYSIS**

Analyze this biology-related sketch. Provide:

1. **🔬 What I See**: Identify biological elements (cells, organs, organisms)
2. **🧬 Biological Analysis**: Explain the biological processes
3. **🌱 Life Processes**: Discuss relevant life processes
4. **🔬 Microscopic View**: If applicable, explain at cellular level
5. **🌿 Ecosystem**: Connect to broader biological systems

Focus on biological concepts and life processes.`
      };

      const analysisPrompt = subjectPrompts[subject as keyof typeof subjectPrompts] || 
        `Analyze this educational sketch related to ${subject}${contentTitle ? ` and ${contentTitle}` : ''}. Provide detailed educational insights and explanations.`;

      let analysisText = '';

      // Use Gemini API directly for drawing analysis
      console.log('Using Gemini API for drawing analysis...');
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY.');
      }

      console.log('Attempting Gemini API call for drawing analysis...');
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const enhancedPrompt = `${analysisPrompt}

Context: This is a hand-drawn sketch by a student studying ${subject}${contentTitle ? ` - ${contentTitle}` : ''}. 

Please analyze this drawing carefully and provide detailed educational insights. Look for:
- Mathematical equations, formulas, or geometric shapes
- Physics diagrams, force vectors, or circuit elements  
- Chemical structures, molecular diagrams, or reaction schemes
- Biological structures, cell diagrams, or anatomical drawings
- Any text, labels, or annotations

Use markdown formatting for better readability and be encouraging in your educational response.`;

      console.log('Sending drawing to Gemini with image data length:', base64Data.length);
      
      const result = await model.generateContent([
        enhancedPrompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/png",
          },
        },
      ]);

      console.log('Gemini API response received for drawing');
      const response = result.response;
      analysisText = response.text();
      
      console.log('Gemini drawing analysis text length:', analysisText?.length || 0);
      
      if (!analysisText || analysisText.trim().length === 0) {
        throw new Error('Empty response from Gemini API');
      }
      
      console.log('Gemini API drawing analysis successful');
      
      setAnalysisResult(analysisText);
      setShowAnalysis(true);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisText);
      }

      toast({
        title: "Analysis Complete",
        description: "Your sketch has been analyzed successfully",
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      
      // Provide fallback analysis
      const fallbackAnalysis = `# Drawing Analysis - ${subject.charAt(0).toUpperCase() + subject.slice(1)}

**Error**: Unable to analyze your drawing using Gemini API.

**Details**: ${error.message || 'Unknown error occurred'}

## What You Can Do:

1. **Check Your Drawing**: Make sure you've drawn something on the canvas
2. **Try Again**: The API might be temporarily unavailable
3. **Manual Analysis**: Look at your drawing and identify:

${subject === 'mathematics' ? `
   - **Equations**: Any mathematical formulas or expressions
   - **Graphs**: Coordinate systems, functions, or data plots
   - **Shapes**: Geometric figures, angles, or measurements
   - **Numbers**: Calculations, values, or mathematical notation
` : subject === 'physics' ? `
   - **Forces**: Arrows indicating direction and magnitude
   - **Circuits**: Electrical components and connections
   - **Diagrams**: Free body diagrams, wave patterns, or energy flows
   - **Measurements**: Units, scales, or quantitative values
` : subject === 'chemistry' ? `
   - **Molecules**: Atomic structures and chemical bonds
   - **Reactions**: Chemical equations and reaction mechanisms
   - **Structures**: Molecular geometry and electron arrangements
   - **Formulas**: Chemical notation and compound representations
` : subject === 'biology' ? `
   - **Structures**: Cell components, organs, or anatomical features
   - **Processes**: Life cycles, metabolic pathways, or biological functions
   - **Diagrams**: Labeled illustrations of biological systems
   - **Relationships**: Connections between different biological concepts
` : `
   - **Key Concepts**: Main ideas or topics illustrated
   - **Relationships**: How different elements connect
   - **Labels**: Text or annotations you've added
   - **Visual Elements**: Important shapes, symbols, or patterns
`}

## Study Tips:
- **Practice Drawing**: Keep sketching to improve your visual learning
- **Add Labels**: Include text to clarify your diagrams
- **Use Colors**: Different colors can help organize information
- **Ask Questions**: Think about what your drawing represents

*Try the analysis again or use the air drawing interface for more advanced features.*`;

      setAnalysisResult(fallbackAnalysis);
      setShowAnalysis(true);
      
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Showing fallback analysis. Check console for details.",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drawing Canvas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Sketch & Analyze
          </CardTitle>
          <CardDescription>
            Draw your ideas and get AI-powered analysis for {subject}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drawing Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Color:</label>
              <input
                type="color"
                value={drawingColor}
                onChange={(e) => setDrawingColor(e.target.value)}
                className="w-8 h-8 rounded border cursor-pointer"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Size:</label>
              <input
                type="range"
                min="1"
                max="10"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground w-8">{brushSize}px</span>
            </div>

            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCanvas}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={downloadDrawing}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              <Button
                onClick={analyzeDrawing}
                disabled={analyzing}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Analyze Sketch
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 bg-muted/10">
            <canvas
              ref={canvasRef}
              className="border border-border rounded-lg cursor-crosshair bg-white shadow-sm w-full max-w-full"
              style={{ maxHeight: '400px' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Click and drag to draw • Use the controls above to customize your drawing</p>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {showAnalysis && analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Analysis Results
            </CardTitle>
            <CardDescription>
              Subject-specific analysis of your sketch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {analysisResult}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Access to Full Drawing Interface */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Hand className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">Need More Advanced Drawing?</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Try our air drawing interface with hand gesture recognition for a more immersive experience.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open('/draw-in-air', '_blank');
              }}
              className="shrink-0"
            >
              <Hand className="h-4 w-4 mr-2" />
              Air Drawing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassroomDrawing;