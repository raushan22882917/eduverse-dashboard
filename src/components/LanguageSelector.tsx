import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Languages } from 'lucide-react';

interface Language {
  language: string;
  name?: string;
}

interface LanguageSelectorProps {
  onLanguageChange?: (language: string) => void;
  defaultLanguage?: string;
}

export function LanguageSelector({ onLanguageChange, defaultLanguage = 'en' }: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      setLoading(true);
      const response = await api.translation.getSupportedLanguages();
      setLanguages(response.languages || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load languages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    onLanguageChange?.(language);
    
    // Store in localStorage
    localStorage.setItem('preferred_language', language);
    
    toast({
      title: 'Language changed',
      description: `Interface language set to ${language.toUpperCase()}`,
    });
  };

  // Common languages for quick access
  const commonLanguages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ar', name: 'Arabic' },
  ];

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedLanguage} onValueChange={handleLanguageChange} disabled={loading}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {commonLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name} ({lang.code.toUpperCase()})
            </SelectItem>
          ))}
          {languages
            .filter((lang) => !commonLanguages.find((cl) => cl.code === lang.language))
            .slice(0, 10)
            .map((lang) => (
              <SelectItem key={lang.language} value={lang.language}>
                {lang.name || lang.language} ({lang.language.toUpperCase()})
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}


