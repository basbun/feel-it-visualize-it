
import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eraser, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TextInputProps {
  onAnalyze: (text: string) => void;
}

const TextInput = ({ onAnalyze }: TextInputProps) => {
  const [text, setText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  
  const handleClear = () => {
    setText('');
    onAnalyze('');
  };
  
  const handleAnalyze = () => {
    if (text.trim()) {
      setIsLoading(true);
      onAnalyze(text);
      // The isLoading state will be handled by the parent component
      setTimeout(() => setIsLoading(false), 500); // Reset loading state locally after a brief delay
    } else {
      toast({
        title: "Empty Input",
        description: "Please enter some text to analyze.",
        variant: "destructive"
      });
    }
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };
  
  const handlePaste = () => {
    navigator.clipboard.readText().then(
      clipText => {
        setText(clipText);
      }
    ).catch(err => {
      console.error('Failed to read clipboard contents: ', err);
      toast({
        title: "Clipboard Error",
        description: "Failed to read clipboard contents.",
        variant: "destructive"
      });
    });
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Text Input
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-80px)]">
        <Textarea 
          placeholder="Enter or paste text here for sentiment analysis..." 
          className="flex-1 min-h-[300px] mb-4 resize-none"
          value={text}
          onChange={handleTextChange}
        />
        <div className="flex justify-end space-x-2 mt-auto">
          <Button variant="outline" onClick={handleClear} disabled={isLoading}>
            <Eraser className="mr-2 h-4 w-4" />
            Clear
          </Button>
          <Button onClick={handlePaste} disabled={isLoading}>
            Paste from Clipboard
          </Button>
          <Button onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze Sentiment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TextInput;
