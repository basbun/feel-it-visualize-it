
import { useState } from 'react';
import TextInput from '@/components/TextInput';
import SentimentAnalysis from '@/components/SentimentAnalysis';
import TopicAnalysis from '@/components/TopicAnalysis';

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
          Analyze the sentiment and topics of your text
        </p>
      </header>
      
      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TextInput onAnalyze={handleAnalyzeText} />
          </div>
          <div className="lg:col-span-1">
            <SentimentAnalysis text={text} />
          </div>
          <div className="lg:col-span-1">
            <TopicAnalysis text={text} />
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
