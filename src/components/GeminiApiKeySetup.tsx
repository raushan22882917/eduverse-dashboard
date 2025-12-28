import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { testGeminiConnection } from '@/utils/geminiApi';
import { useToast } from '@/hooks/use-toast';

const GeminiApiKeySetup: React.FC = () => {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const { toast } = useToast();

  const handleTest = async () => {
    if (!apiKey || apiKey === 'YOUR_ACTUAL_GEMINI_API_KEY_HERE' || apiKey === 'YOUR_ACTUAL_API_KEY_HERE') {
      toast({
        title: "API Key Required",
        description: "Please enter a valid Gemini API key first.",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    try {
      // Temporarily set the API key for testing
      const originalKey = import.meta.env.VITE_GEMINI_API_KEY;
      (import.meta.env as any).VITE_GEMINI_API_KEY = apiKey;
      
      const result = await testGeminiConnection();
      setTestResult(result);
      
      // Restore original key
      (import.meta.env as any).VITE_GEMINI_API_KEY = originalKey;
      
      toast({
        title: result.success ? "✅ API Key Valid" : "❌ API Key Invalid",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Test failed: ${(error as Error).message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const copyEnvExample = () => {
    const envContent = `# Add this to your .env file
VITE_GEMINI_API_KEY="${apiKey || 'your-api-key-here'}"`;
    
    navigator.clipboard.writeText(envContent);
    toast({
      title: "Copied to Clipboard",
      description: "Environment variable configuration copied. Add this to your .env file."
    });
  };

  const currentKey = import.meta.env.VITE_GEMINI_API_KEY;
  const isConfigured = currentKey && 
    currentKey !== 'YOUR_ACTUAL_GEMINI_API_KEY_HERE' && 
    currentKey !== 'YOUR_ACTUAL_API_KEY_HERE' &&
    currentKey.length > 10;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Gemini API Configuration
        </CardTitle>
        <CardDescription>
          Configure your Google Gemini API key for AI-powered features
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current Status:</span>
            {isConfigured ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            )}
          </div>
          
          {isConfigured && (
            <div className="text-xs text-muted-foreground">
              Key: {currentKey.substring(0, 8)}...{currentKey.substring(currentKey.length - 4)}
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>To get your Gemini API key:</strong></p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Google AI Studio <ExternalLink className="h-3 w-3" /></a></li>
                <li>Sign in with your Google account</li>
                <li>Click "Create API Key"</li>
                <li>Copy the generated API key</li>
                <li>Add it to your .env file as shown below</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>

        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="api-key">Gemini API Key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              onClick={handleTest}
              disabled={testing || !apiKey}
              variant="outline"
            >
              {testing ? "Testing..." : "Test"}
            </Button>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Environment Configuration */}
        <div className="space-y-2">
          <Label>Environment Configuration</Label>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground"># Add to your .env file:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyEnvExample}
                className="h-6 px-2"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div>
              VITE_GEMINI_API_KEY="{apiKey || 'your-api-key-here'}"
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p><strong>Important:</strong></p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Keep your API key secure and never share it publicly</li>
                <li>The .env file should not be committed to version control</li>
                <li>Restart your development server after updating the .env file</li>
                <li>Free tier has usage limits - monitor your usage in Google AI Studio</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open('https://makersuite.google.com/app/apikey', '_blank')}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Get API Key
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('https://ai.google.dev/gemini-api/docs', '_blank')}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Documentation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeminiApiKeySetup;