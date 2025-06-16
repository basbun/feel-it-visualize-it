
import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eraser, FileText, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TextInputProps {
  onAnalyze: (text: string) => void;
}

const sampleData = `Loved the crisis-management simulation in week three; it felt real and forced our team to delegate under pressure—huge confidence boost.
The evening networking mixers were awkward— too much noise, not enough structured introductions.
Great balance of case studies from both tech and heavy-industry; finally a program that speaks to plant supervisors and product managers.
Honestly, the virtual white-board tools lagged every time we broke into remote groups—frustrating for fast brainstorms.
Faculty feedback on my 90-day action plan was brutally honest yet actionable—I'm already revising our KPI dashboards.
The hotel venue was dated and the coffee ran out twice; feels off-brand for a "premium" leadership academy.
Appreciated the faith-friendly reflection slot each morning; quiet time helped me reset before dense content.
Too much emphasis on Western leadership models; would like more MENA-centric case material next cohort.
Mentorship circles were the hidden gem—my senior mentor introduced me to three VP-level contacts within Aramco.
The gamified learning portal made tracking badges addictive; finished the conflict-resolution quest at 2 a.m.!
Wish the program had included a section on AI-driven workforce analytics—seems like a glaring future-skills gap.
Instructors kept quoting outdated 2017 McKinsey stats; felt like they hadn't updated decks in years.
Breakout rooms with cross-functional peers sparked surprising ideas about safety culture improvements.
Price tag felt steep until I saw the personalized 360-degree assessment; worth every riyal for that report alone.
Logistics emails were chaotic—session links changed last minute and messed up my calendar holds.
I liked that our cohort Slack stayed active after graduation; crowdsourcing solutions beats Googling alone.
Diversity panel opened my eyes to neurodivergent leadership strengths; powerful and very personal stories.
Travel to the desert retreat for the team-building field exercise was a hassle, but the camel-tracker challenge built real trust.
The "executive presence" module skimmed over virtual presentation skills—most of my meetings are on Teams now.
Sensitivity training around generational differences led to one of the most heated yet enlightening debates.
Program length (six consecutive weekends) was perfect—didn't derail my quarterly deliverables.
Group coaching felt repetitive after the first two sessions; we kept circling the same accountability topics.
Guest speaker from Tesla shared raw stories about failure pivots—refreshing candor compared to polished success talks.
E-portfolio export to LinkedIn was seamless; endorsements started rolling in within hours.
Felt the finance for non-finance leaders crash course was too shallow—need more on ROI modeling.
Appreciate the bilingual materials (English/Spanish); made it easier to share insights with my LATAM team.
The peer-review rubric for our capstone project was confusing; half the class graded on effort, half on results.
Live polling during lectures kept the energy up and exposed differing risk-tolerance profiles in real time.
Program director personally checked on my well-being after I missed a session—rare human touch in corporate training.
Certificate arrived digitally the same day we graduated; no waiting weeks for HR to process.`;

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

  const handleSampleData = () => {
    setText(sampleData);
    toast({
      title: "Sample Data Loaded",
      description: "30 test comments have been loaded into the text area.",
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
          <Button variant="outline" onClick={handleSampleData} disabled={isLoading}>
            <Database className="mr-2 h-4 w-4" />
            Sample Data
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
