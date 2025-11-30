import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X, BookOpen, Languages, Sparkles, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface TextSelectionPopupProps {
  selectedText: string;
  position: { x: number; y: number };
  onClose: () => void;
  onExplain: (text: string) => Promise<string>;
  onTranslate: (text: string) => Promise<string>;
  onBetterExplain: (text: string) => Promise<string>;
  onSave: (text: string, explanation: string, type: string) => Promise<void>;
}

export const TextSelectionPopup = ({
  selectedText,
  position,
  onClose,
  onExplain,
  onTranslate,
  onBetterExplain,
  onSave,
}: TextSelectionPopupProps) => {
  const { toast } = useToast();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAction = async (action: string, handler: (text: string) => Promise<string>) => {
    setActiveAction(action);
    setLoading(true);
    setResult("");
    try {
      const response = await handler(selectedText);
      setResult(response);
    } catch (error: any) {
      setResult(`Error: ${error.message || "Failed to process request"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setLoading(true);
    try {
      await onSave(selectedText, result, activeAction || "explain");
      setSaved(true);
      toast({
        title: "Saved",
        description: "Explanation saved successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed z-50 bg-background border rounded-lg shadow-lg p-4 min-w-[400px] max-w-[600px]"
      style={{
        left: `${Math.min(position.x, window.innerWidth - 420)}px`,
        top: `${Math.min(position.y, window.innerHeight - 300)}px`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Selected Text</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mb-3 p-2 bg-muted rounded text-sm max-h-24 overflow-y-auto">
        "{selectedText.substring(0, 100)}{selectedText.length > 100 ? "..." : ""}"
      </div>

      <div className="flex gap-2 mb-3">
        <Button
          variant={activeAction === "explain" ? "default" : "outline"}
          size="sm"
          onClick={() => handleAction("explain", onExplain)}
          disabled={loading}
        >
          <BookOpen className="h-4 w-4 mr-1" />
          Explain
        </Button>
        <Button
          variant={activeAction === "translate" ? "default" : "outline"}
          size="sm"
          onClick={() => handleAction("translate", onTranslate)}
          disabled={loading}
        >
          <Languages className="h-4 w-4 mr-1" />
          Translate
        </Button>
        <Button
          variant={activeAction === "better" ? "default" : "outline"}
          size="sm"
          onClick={() => handleAction("better", onBetterExplain)}
          disabled={loading}
        >
          <Sparkles className="h-4 w-4 mr-1" />
          Better Way
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {result && !loading && (
        <Card className="mt-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Badge variant="secondary">
                  {activeAction === "explain" && "Explanation"}
                  {activeAction === "translate" && "Translation"}
                  {activeAction === "better" && "Better Explanation"}
                </Badge>
              </CardTitle>
              {!saved && (
                <Button variant="ghost" size="sm" onClick={handleSave} disabled={loading}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <p className="text-sm whitespace-pre-wrap">{result}</p>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

