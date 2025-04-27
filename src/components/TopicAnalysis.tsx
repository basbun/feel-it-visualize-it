
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FolderKanban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Topic {
  topic: string;
  comments: string[];
  averageSentiment?: number;
}

interface TopicAnalysisProps {
  text: string;
  isParentAnalyzing?: boolean;
  onAnalysisComplete?: () => void;
}

const TopicAnalysis = ({ text, isParentAnalyzing = false, onAnalysisComplete }: TopicAnalysisProps) => {
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());
  
  // Refs to control analysis flow
  const isFirstRender = useRef(true);
  const previousText = useRef(text);
  const isAnalysisInProgress = useRef(false);
  const analysisRequested = useRef(false);

  const toggleTopic = (index: number) => {
    const newExpandedTopics = new Set(expandedTopics);
    if (newExpandedTopics.has(index)) {
      newExpandedTopics.delete(index);
    } else {
      newExpandedTopics.add(index);
    }
    setExpandedTopics(newExpandedTopics);
  };

  useEffect(() => {
    // If it's the first render with no text, don't analyze
    if (isFirstRender.current && !text) {
      isFirstRender.current = false;
      return;
    }

    // Update flags based on text change
    const textChanged = previousText.current !== text;
    previousText.current = text;
    isFirstRender.current = false;
    
    // Reset topics if no text
    if (!text) {
      setTopics([]);
      setIsAnalyzing(false);
      if (onAnalysisComplete) onAnalysisComplete();
      return;
    }

    // Only analyze if parent is analyzing or text changed
    if ((isParentAnalyzing || textChanged) && text.trim()) {
      analysisRequested.current = true;
      analyzeTopics();
    }
  }, [text, isParentAnalyzing, onAnalysisComplete]);

  const analyzeTopics = async () => {
    // Don't start another analysis if one is in progress
    if (isAnalysisInProgress.current) return;
    
    // Clear the analysis requested flag
    analysisRequested.current = false;
    isAnalysisInProgress.current = true;
    setIsAnalyzing(true);
    
    if (!text.trim()) {
      setTopics([]);
      setIsAnalyzing(false);
      isAnalysisInProgress.current = false;
      if (onAnalysisComplete) onAnalysisComplete();
      return;
    }
    
    try {
      console.log("Starting topic analysis");
      // First get topics
      const { data: topicsData, error: topicsError } = await supabase.functions.invoke('analyze-sentiment', {
        body: { text, mode: 'topics' }
      });

      if (topicsError) {
        console.error("Error from topic analysis edge function:", topicsError);
        throw topicsError;
      }
      
      console.log("Topic analysis response:", topicsData);
      if (!topicsData || topicsData.error) {
        throw new Error(topicsData?.error || "Failed to get topic analysis results");
      }

      if (!topicsData.topics || !Array.isArray(topicsData.topics)) {
        console.error("Invalid topics response format:", topicsData);
        throw new Error('Invalid topics response format');
      }

      console.log(`Found ${topicsData.topics.length} topics, analyzing sentiment for each`);
      
      // For each topic, analyze sentiment of its comments
      const topicsWithSentiment = await Promise.all(
        topicsData.topics.map(async (topic: Topic) => {
          const commentsText = topic.comments.join('\n');
          const { data: sentimentData, error: sentimentError } = await supabase.functions.invoke('analyze-sentiment', {
            body: { text: commentsText }
          });

          if (sentimentError) {
            console.error("Error analyzing sentiment for topic:", sentimentError);
            throw sentimentError;
          }

          return {
            ...topic,
            averageSentiment: sentimentData.score
          };
        })
      );

      console.log("Topic analysis with sentiment completed successfully");
      setTopics(topicsWithSentiment);
      
      // Show success toast
      toast({
        title: "Topic Analysis Complete",
        description: `Identified ${topicsWithSentiment.length} topics in the text`,
      });
    } catch (error: any) {
      console.error('Error in topic analysis:', error);
      toast({
        title: "Analysis Error",
        description: `Could not complete topic analysis: ${error.message}`,
        variant: "destructive"
      });
      setTopics([]);
    } finally {
      setIsAnalyzing(false);
      isAnalysisInProgress.current = false;
      
      // Notify parent that analysis is complete
      if (onAnalysisComplete) onAnalysisComplete();
      
      // If another analysis was requested while this one was in progress, run it now
      if (analysisRequested.current) {
        analyzeTopics();
      }
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return "bg-green-500";
    if (score < -0.3) return "bg-red-500";
    return "bg-yellow-500";
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.6) return "Very Positive";
    if (score > 0.3) return "Positive";
    if (score > -0.3) return "Neutral";
    if (score > -0.6) return "Negative";
    return "Very Negative";
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FolderKanban className="mr-2 h-5 w-5" />
          Topic Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
            <p className="text-muted-foreground">Analyzing topics...</p>
          </div>
        ) : text ? (
          topics.length > 0 ? (
            <div className="space-y-4">
              {topics.map((topic, index) => (
                <Collapsible key={index} open={expandedTopics.has(index)} onOpenChange={() => toggleTopic(index)}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <CollapsibleTrigger className="flex items-center gap-2 font-medium w-full text-left">
                        <h3 className="text-lg font-semibold hover:underline">{topic.topic}</h3>
                      </CollapsibleTrigger>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${topic.averageSentiment && topic.averageSentiment > 0 ? 'bg-green-100 text-green-800' : topic.averageSentiment && topic.averageSentiment < 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {topic.averageSentiment ? getSentimentLabel(topic.averageSentiment) : 'Neutral'}
                        </span>
                        <span className="text-sm font-medium">
                          {topic.averageSentiment?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={((topic.averageSentiment || 0) + 1) * 50} 
                      className={`h-2 ${getSentimentColor(topic.averageSentiment || 0)}`}
                    />
                    <CollapsibleContent>
                      <div className="bg-muted/50 p-3 rounded-md space-y-1.5 mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Comments ({topic.comments.length})</p>
                        {topic.comments.map((comment, commentIndex) => (
                          <p key={commentIndex} className="text-sm py-1 border-b border-muted last:border-0">{comment}</p>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
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
