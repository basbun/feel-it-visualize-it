
import { useState, useCallback } from 'react';
import TextInput from '@/components/TextInput';
import SentimentAnalysis from '@/components/SentimentAnalysis';
import TopicAnalysis from '@/components/TopicAnalysis';
import { useToast } from "@/hooks/use-toast";

interface Topic {
  topic: string;
  comments: string[];
}

const Index = () => {
  const [text, setText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const { toast } = useToast();

  const handleAnalyzeText = useCallback((inputText: string) => {
    // Clear results if no text
    if (!inputText.trim()) {
      setText('');
      setIsAnalyzing(false);
      return;
    }
    
    // Set analyzing to true and update text
    setText(inputText);
    setIsAnalyzing(true);
    
    // Show toast to let user know analysis has started
    toast({
      title: "Analysis Started",
      description: "Analyzing text for sentiment and topics...",
    });
    
    // Let child components handle the actual API calls
    // They will show their own loading states
  }, [toast]);

  const handleTopicsUpdate = (newTopics: Topic[]) => {
    console.log('Topics updated:', newTopics); // Debug log
    setTopics(newTopics);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Sentiment Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Analyze the sentiment and topics of your text
        </p>
      </header>
      
      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-6">
          <TextInput onAnalyze={handleAnalyzeText} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SentimentAnalysis 
              text={text} 
              topics={topics}
              isParentAnalyzing={isAnalyzing} 
              onAnalysisComplete={() => setIsAnalyzing(false)}
            />
            <TopicAnalysis 
              text={text} 
              isParentAnalyzing={isAnalyzing} 
              onAnalysisComplete={() => setIsAnalyzing(false)}
              onTopicsUpdate={handleTopicsUpdate}
            />
          </div>
        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto mt-8 text-center text-sm text-muted-foreground">
        <p>This is a sentiment and topic analysis application.</p>
        <p className="mt-1">For production use, consider using a professional NLP service.</p>
      </footer>
    </div>
  );
};

export default Index;
