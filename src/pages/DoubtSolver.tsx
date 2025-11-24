import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentSidebar from "@/components/StudentSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { 
  MessageSquare, 
  Image, 
  Mic, 
  Send,
  Loader2,
  BookOpen,
  FileText,
  Lightbulb
} from "lucide-react";

const DoubtSolver = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("text");
  const [textQuery, setTextQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const handleTextSubmit = async () => {
    if (!textQuery.trim() || !user) return;

    setLoadingResponse(true);
    try {
      const result = await api.doubt.text({
        user_id: user.id,
        text: textQuery,
        subject: selectedSubject || undefined,
      });
      setResponse(result);
      toast({
        title: "Success",
        description: "Your doubt has been processed!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process doubt",
      });
    } finally {
      setLoadingResponse(false);
    }
  };

  const handleImageSubmit = async () => {
    if (!imageFile || !user) return;

    setLoadingResponse(true);
    try {
      const result = await api.doubt.image({
        user_id: user.id,
        image: imageFile,
        subject: selectedSubject || undefined,
      });
      setResponse(result);
      toast({
        title: "Success",
        description: "Image processed successfully!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process image",
      });
    } finally {
      setLoadingResponse(false);
    }
  };

  const handleVoiceSubmit = async () => {
    if (!audioFile || !user) return;

    setLoadingResponse(true);
    try {
      const result = await api.doubt.voice({
        user_id: user.id,
        audio: audioFile,
        subject: selectedSubject || undefined,
      });
      setResponse(result);
      toast({
        title: "Success",
        description: "Voice processed successfully!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process voice",
      });
    } finally {
      setLoadingResponse(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <StudentSidebar />
      
      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Doubt Solver</h1>
            <p className="text-muted-foreground">Ask your questions and get comprehensive solutions</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Input */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Ask Your Question</CardTitle>
                  <CardDescription>Choose how you want to ask</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject (Optional)</label>
                      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mathematics">Mathematics</SelectItem>
                          <SelectItem value="physics">Physics</SelectItem>
                          <SelectItem value="chemistry">Chemistry</SelectItem>
                          <SelectItem value="biology">Biology</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="text">
                          <MessageSquare className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="image">
                          <Image className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="voice">
                          <Mic className="h-4 w-4" />
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="text" className="space-y-4 mt-4">
                        <Textarea
                          placeholder="Type your question here..."
                          value={textQuery}
                          onChange={(e) => setTextQuery(e.target.value)}
                          rows={6}
                        />
                        <Button 
                          onClick={handleTextSubmit} 
                          className="w-full"
                          disabled={!textQuery.trim() || loadingResponse}
                        >
                          {loadingResponse ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Submit Question
                            </>
                          )}
                        </Button>
                      </TabsContent>

                      <TabsContent value="image" className="space-y-4 mt-4">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                          <Image className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="image-upload"
                          />
                          <label htmlFor="image-upload">
                            <Button variant="outline" asChild>
                              <span>Choose Image</span>
                            </Button>
                          </label>
                          {imageFile && (
                            <p className="mt-2 text-sm text-muted-foreground">{imageFile.name}</p>
                          )}
                        </div>
                        <Button 
                          onClick={handleImageSubmit} 
                          className="w-full"
                          disabled={!imageFile || loadingResponse}
                        >
                          {loadingResponse ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Submit Image
                            </>
                          )}
                        </Button>
                      </TabsContent>

                      <TabsContent value="voice" className="space-y-4 mt-4">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                          <Mic className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                          <Input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="audio-upload"
                          />
                          <label htmlFor="audio-upload">
                            <Button variant="outline" asChild>
                              <span>Choose Audio</span>
                            </Button>
                          </label>
                          {audioFile && (
                            <p className="mt-2 text-sm text-muted-foreground">{audioFile.name}</p>
                          )}
                        </div>
                        <Button 
                          onClick={handleVoiceSubmit} 
                          className="w-full"
                          disabled={!audioFile || loadingResponse}
                        >
                          {loadingResponse ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Submit Voice
                            </>
                          )}
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Response */}
            <div className="lg:col-span-2">
              {response ? (
                <div className="space-y-4">
                  {/* NCERT Summary */}
                  {response.ncert_summary && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          NCERT Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{response.ncert_summary}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Solved Example */}
                  {response.solved_example && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-green-500" />
                          Solved Example
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {response.solved_example.question && (
                            <div>
                              <p className="font-semibold mb-2">Question:</p>
                              <p className="text-sm">{response.solved_example.question}</p>
                            </div>
                          )}
                          {response.solved_example.solution && (
                            <div>
                              <p className="font-semibold mb-2">Solution:</p>
                              <p className="text-sm whitespace-pre-wrap">{response.solved_example.solution}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* PYQ */}
                  {response.pyq && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-500" />
                          Previous Year Question
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {response.pyq.question && (
                            <p className="text-sm whitespace-pre-wrap">{response.pyq.question}</p>
                          )}
                          {response.pyq.year && (
                            <p className="text-xs text-muted-foreground">Year: {response.pyq.year}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* HOTS Question */}
                  {response.hots_question && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-purple-500" />
                          HOTS Question
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {response.hots_question.question && (
                          <p className="text-sm whitespace-pre-wrap">{response.hots_question.question}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Submit a question to see the solution</p>
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

export default DoubtSolver;

