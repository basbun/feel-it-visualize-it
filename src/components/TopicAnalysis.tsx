
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FolderKanban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Topic {
  topic: string;
  comments: string[];
  averageSentiment?: number;
}

interface TopicAnalysisProps {
  text: string;
}

const TopicAnalysis = ({ text }: TopicAnalysisProps) => {
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  useEffect(() => {
    const analyzeTopics = async () => {
      if (!text) {
        setTopics([]);
        return;
      }

      setIsAnalyzing(true);
      try {
        // First get topics
        const { data: topicsData, error: topicsError } = await supabase.functions.invoke('analyze-sentiment', {
          body: { text, mode: 'topics' }
        });

        if (topicsError) throw topicsError;

        // For each topic, analyze sentiment of its comments
        const topicsWithSentiment = await Promise.all(
          topicsData.topics.map(async (topic: Topic) => {
            const commentsText = topic.comments.join('\n');
            const { data: sentimentData, error: sentimentError } = await supabase.functions.invoke('analyze-sentiment', {
              body: { text: commentsText }
            });

            if (sentimentError) throw sentimentError;

            return {
              ...topic,
              averageSentiment: sentimentData.score
            };
          })
        );

        setTopics(topicsWithSentiment);
      } catch (error) {
        console.error('Error in topic analysis:', error);
        toast({
          title: "Analysis Error",
          description: "Could not complete topic analysis. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeTopics();
  }, [text, toast]);

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return "bg-green-500";
    if (score < -0.3) return "bg-red-500";
    return "bg-yellow-500";
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FolderKanban className="mr-2 h-5 w-5" />
          Topic Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
            <p className="text-muted-foreground">Analyzing topics...</p>
          </div>
        ) : text ? (
          topics.length > 0 ? (
            <div className="space-y-6">
              {topics.map((topic, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{topic.topic}</h3>
                    <span className="text-sm font-medium">
                      Sentiment: {topic.averageSentiment?.toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={((topic.averageSentiment || 0) + 1) * 50} 
                    className={`h-2 ${getSentimentColor(topic.averageSentiment || 0)}`}
                  />
                  <div className="bg-muted/50 p-4 rounded-md space-y-2">
                    {topic.comments.map((comment, commentIndex) => (
                      <p key={commentIndex} className="text-sm">{comment}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No topics identified</p>
          )
        ) : (
          <p className="text-center text-muted-foreground">
            Enter text in the input area to see topic analysis
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TopicAnalysis;
