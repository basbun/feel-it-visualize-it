
import { useState } from 'react';
import TextInput from '@/components/TextInput';
import SentimentAnalysis from '@/components/SentimentAnalysis';

const Index = () => {
  const [text, setText] = useState<string>('');

  const handleAnalyzeText = (inputText: string) => {
    setText(inputText);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Sentiment Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Analyze the sentiment of your text from -1 (negative) to 1 (positive)
        </p>
      </header>
      
      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-1">
            <TextInput onAnalyze={handleAnalyzeText} />
          </div>
          <div className="md:col-span-1">
            <SentimentAnalysis text={text} />
          </div>
        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto mt-8 text-center text-sm text-muted-foreground">
        <p>This is a simple sentiment analysis application for demonstration purposes.</p>
        <p className="mt-1">For accurate sentiment analysis in production, use a professional NLP service.</p>
      </footer>
    </div>
  );
};

export default Index;
