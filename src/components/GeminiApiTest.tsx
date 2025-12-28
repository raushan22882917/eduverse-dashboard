import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Brain, 
  Key,
  AlertTriangle,
  Info
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useToast } from '@/hooks/use-toast';

const GeminiApiTest: React.FC = () => {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [testQuery, setTestQuery] = useState('Explain how AI works in a few words');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    response?: string;
    error?: string;
    timestamp?: string;
  } | null>(null);
  const { toast } = useToast();

  const testGeminiAPI = async () => {
    if (!apiKey || apiKey === 'YOUR_ACTUAL_GEMINI_API_KEY_HERE') {
      toast({
        title: "API Key Required",
        description: "Please enter a valid Gemini API key",
        variant: "destructive"
      });
      return;
    }

    if (!testQuery.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a test query",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      // Initialize Google Generative AI with the provided API key
      const genAI = new GoogleGenerativeAI(apiKey);

      // Get the generative model - using stable model name
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      console.log('Testing Gemini API with query:', testQuery);

      // Generate content using the correct API syntax
      const result = await model.generateContent(testQuery);
      const response = await result.response;

      console.log('Gemini API response received:', response);

      // Extract the response text
      const responseText = response.text();

      if (responseText) {
        setTestResult({
          success: true,
          response: responseText,
          timestamp: new Date().toISOString()
        });

        toast({
          title: "✅ API Test Successful",
          description: "Gemini API is working correctly!"
        });
      } else {
        throw new Error('Empty response from Gemini API');
      }

    } catch (error) {
      console.error('Gemini API test failed:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more specific error messages
        if (error.message.includes('403')) {
          errorMessage = 'API key authentication failed. Please check your Gemini API key.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid request format. Please check your query.';
        } else if (error.message.includes('404')) {
          errorMessage = 'API endpoint not found. Please check the model name.';
        }
      }

      setTestResult({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "❌ API Test Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runQuickTest = async () => {
    setTestQuery('Say "Hello" if you can hear me.');
    // Wait for state to update, then run test
    setTimeout(() => testGeminiAPI(), 100);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Gemini API Test (Google Generative AI Library)
          </CardTitle>
          <CardDescription>
            Test the Google Generative AI library integration with your API key
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              Gemini API Key
            </label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key..."
              className="font-mono"
            />
          </div>

          {/* Test Query Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Query</label>
            <Input
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="Enter a test question..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={testGeminiAPI}
              disabled={isLoading || !apiKey || !testQuery}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Test API
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={runQuickTest}
              disabled={isLoading || !apiKey}
            >
              Quick Test
            </Button>
          </div>

          {/* API Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Library:</strong> @google/generative-ai (Official Library)</p>
                <p><strong>Model:</strong> gemini-2.5-flash</p>
                <p><strong>Method:</strong> model.generateContent()</p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Test Results
              <Badge variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? "Success" : "Failed"}
              </Badge>
            </CardTitle>
            {testResult.timestamp && (
              <CardDescription>
                Tested at: {new Date(testResult.timestamp).toLocaleString()}
              </CardDescription>
            )}
          </CardHeader>
          
          <CardContent>
            {testResult.success ? (
              <div className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>API Response:</strong>
                  </AlertDescription>
                </Alert>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 whitespace-pre-wrap">
                    {testResult.response}
                  </p>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {testResult.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Example */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Example</CardTitle>
          <CardDescription>
            How to use the Google Generative AI library in your code
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre>{`import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("your-api-key-here");

async function main() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const result = await model.generateContent("Explain how AI works in a few words");
  const response = await result.response;
  
  console.log(response.text());
}

await main();`}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Troubleshooting
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>403 Error:</strong> Invalid API key or insufficient permissions
            </div>
            <div>
              <strong>429 Error:</strong> Rate limit exceeded - wait before retrying
            </div>
            <div>
              <strong>400 Error:</strong> Invalid request format or parameters
            </div>
            <div>
              <strong>404 Error:</strong> Model not found - check model name
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeminiApiTest;