import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SecurityViolation {
  type: "fullscreen" | "copy" | "paste" | "rightclick" | "devtools" | "tabswitch";
  timestamp: Date;
  count: number;
}

export const useExamSecurity = (
  onViolation?: (violation: SecurityViolation) => void,
  enabled: boolean = true
) => {
  const { toast } = useToast();
  const [violations, setViolations] = useState<SecurityViolation[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const violationCounts = useRef<Map<string, number>>(new Map());
  const isFullscreenRef = useRef(false);
  const visibilityChangeRef = useRef(false);

  useEffect(() => {
    // Skip if security is disabled
    if (!enabled) return;

    // Prevent copy
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      const count = (violationCounts.current.get("copy") || 0) + 1;
      violationCounts.current.set("copy", count);
      
      const violation: SecurityViolation = {
        type: "copy",
        timestamp: new Date(),
        count,
      };
      
      setViolations(prev => [...prev, violation]);
      onViolation?.(violation);
      
      toast({
        variant: "destructive",
        title: "Security Warning",
        description: `Copying is disabled during the exam. Violation #${count}`,
      });
      
      return false;
    };

    // Prevent paste
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const count = (violationCounts.current.get("paste") || 0) + 1;
      violationCounts.current.set("paste", count);
      
      const violation: SecurityViolation = {
        type: "paste",
        timestamp: new Date(),
        count,
      };
      
      setViolations(prev => [...prev, violation]);
      onViolation?.(violation);
      
      toast({
        variant: "destructive",
        title: "Security Warning",
        description: `Pasting is disabled during the exam. Violation #${count}`,
      });
      
      return false;
    };

    // Prevent right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const count = (violationCounts.current.get("rightclick") || 0) + 1;
      violationCounts.current.set("rightclick", count);
      
      const violation: SecurityViolation = {
        type: "rightclick",
        timestamp: new Date(),
        count,
      };
      
      setViolations(prev => [...prev, violation]);
      onViolation?.(violation);
      
      toast({
        variant: "destructive",
        title: "Security Warning",
        description: `Right-click is disabled during the exam. Violation #${count}`,
      });
      
      return false;
    };

    // Prevent keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+A, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common shortcuts
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "c" || e.key === "v" || e.key === "a" || e.key === "x" || e.key === "s")
      ) {
        e.preventDefault();
        const shortcut = e.key.toUpperCase();
        const count = (violationCounts.current.get(`shortcut-${shortcut}`) || 0) + 1;
        violationCounts.current.set(`shortcut-${shortcut}`, count);
        
        toast({
          variant: "destructive",
          title: "Security Warning",
          description: `Keyboard shortcut (Ctrl+${shortcut}) is disabled during the exam.`,
        });
        
        return false;
      }

      // Block F12 (Developer Tools)
      if (e.key === "F12") {
        e.preventDefault();
        const count = (violationCounts.current.get("devtools") || 0) + 1;
        violationCounts.current.set("devtools", count);
        
        toast({
          variant: "destructive",
          title: "Security Warning",
          description: "Developer tools are disabled during the exam.",
        });
        
        return false;
      }

      // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools shortcuts)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "I" || e.key === "J" || e.key === "C")
      ) {
        e.preventDefault();
        const count = (violationCounts.current.get("devtools") || 0) + 1;
        violationCounts.current.set("devtools", count);
        
        toast({
          variant: "destructive",
          title: "Security Warning",
          description: "Developer tools are disabled during the exam.",
        });
        
        return false;
      }
    };

    // Detect fullscreen exit
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      setIsFullscreen(isCurrentlyFullscreen);

      if (isFullscreenRef.current && !isCurrentlyFullscreen) {
        // User exited fullscreen
        const count = (violationCounts.current.get("fullscreen") || 0) + 1;
        violationCounts.current.set("fullscreen", count);
        
        const violation: SecurityViolation = {
          type: "fullscreen",
          timestamp: new Date(),
          count,
        };
        
        setViolations(prev => [...prev, violation]);
        onViolation?.(violation);
        
        toast({
          variant: "destructive",
          title: "Security Warning",
          description: `Fullscreen mode was exited. Violation #${count}. Please stay in fullscreen mode.`,
        });
      }

      isFullscreenRef.current = isCurrentlyFullscreen;
    };

    // Detect tab/window switching
    const handleVisibilityChange = () => {
      if (document.hidden) {
        visibilityChangeRef.current = true;
        const count = (violationCounts.current.get("tabswitch") || 0) + 1;
        violationCounts.current.set("tabswitch", count);
        
        const violation: SecurityViolation = {
          type: "tabswitch",
          timestamp: new Date(),
          count,
        };
        
        setViolations(prev => [...prev, violation]);
        onViolation?.(violation);
        
        toast({
          variant: "destructive",
          title: "Security Warning",
          description: `Tab/window switch detected. Violation #${count}. Please stay on the exam page.`,
        });
      } else {
        // User came back to the tab
        if (visibilityChangeRef.current) {
          toast({
            variant: "destructive",
            title: "Security Warning",
            description: "Returning to the exam page. All violations are being tracked.",
          });
        }
      }
    };

    // Detect blur (window loses focus)
    const handleBlur = () => {
      const count = (violationCounts.current.get("tabswitch") || 0) + 1;
      violationCounts.current.set("tabswitch", count);
      
      const violation: SecurityViolation = {
        type: "tabswitch",
        timestamp: new Date(),
        count,
      };
      
      setViolations(prev => [...prev, violation]);
      onViolation?.(violation);
    };

    // Request fullscreen on mount (only if enabled)
    const requestFullscreen = async () => {
      if (!enabled) return;
      
      try {
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen();
        }
        isFullscreenRef.current = true;
      } catch (error) {
        console.error("Failed to enter fullscreen:", error);
        toast({
          variant: "destructive",
          title: "Fullscreen Required",
          description: "Please enable fullscreen mode to continue with the exam.",
        });
      }
    };

    // Request fullscreen when component mounts
    requestFullscreen();

    // Add event listeners
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    // Prevent text selection (additional security)
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    document.body.style.mozUserSelect = "none";
    document.body.style.msUserSelect = "none";

    // Cleanup
    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      
      // Restore text selection
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      document.body.style.mozUserSelect = "";
      document.body.style.msUserSelect = "";
    };
  }, [toast, onViolation, enabled]);

  return {
    violations,
    violationCounts: violationCounts.current,
    totalViolations: violations.length,
    isFullscreen,
  };
};

