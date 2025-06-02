import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2, Smile, Meh, Frown } from "lucide-react";
import ExcelJS from 'exceljs';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { normalizeText } from '@/utils/textNormalization';
import { calculateStdDev, calculateAverage, splitTextIntoComments } from '@/utils/sentimentUtils';
import OverallSentiment from './sentiment/OverallSentiment';
import SentimentStatistics from './sentiment/SentimentStatistics';
import SentimentDistribution from './sentiment/SentimentDistribution';
import CommentsList from './sentiment/CommentsList';

interface SentimentAnalysisProps {
  text: string;
  topics: { topic: string; comments: string[] }[];
  isParentAnalyzing?: boolean;
  onAnalysisComplete?: () => void;
}

const getSentimentIcon = (score: number) => {
  if (score > 0.3) return <Smile className="h-6 w-6 text-green-500" />;
  if (score < -0.3) return <Frown className="h-6 w-6 text-red-500" />;
  return <Meh className="h-6 w-6 text-yellow-500" />;
};

const SentimentAnalysis = ({ text, topics, isParentAnalyzing = false, onAnalysisComplete }: SentimentAnalysisProps) => {
  const [comments, setComments] = useState<{ text: string; score: number }[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [distributionData, setDistributionData] = useState<{ range: string; count: number }[]>([]);
  const { toast } = useToast();
  
  const isFirstRender = useRef(true);
  const previousText = useRef(text);
  const isAnalysisInProgress = useRef(false);
  const analysisRequested = useRef(false);

  // Calculate statistics using useMemo to ensure consistency
  const statistics = useMemo(() => {
    console.log('=== Statistics Calculation ===');
    console.log('Comments array:', comments);
    
    if (comments.length === 0) {
      console.log('No comments, returning default statistics');
      return { stdDev: 0, averageScore: 0 };
    }
    
    const scores = comments.map(c => c.score);
    console.log('Extracted scores:', scores);
    
    const stdDev = calculateStdDev(scores);
    const averageScore = calculateAverage(scores);
    
    console.log('Calculated stdDev:', stdDev);
    console.log('Calculated averageScore:', averageScore);
    console.log('=== End Statistics Calculation ===');
    
    return { stdDev, averageScore };
  }, [comments]);

  useEffect(() => {
    if (isFirstRender.current && !text) {
      isFirstRender.current = false;
      return;
    }

    const textChanged = previousText.current !== text;
    previousText.current = text;
    isFirstRender.current = false;
    
    if (!text) {
      setComments([]);
      setOverallScore(0);
      setDistributionData([]);
      setIsAnalyzing(false);
      if (onAnalysisComplete) onAnalysisComplete();
      return;
    }
    
    if ((isParentAnalyzing || textChanged) && text.trim()) {
      analysisRequested.current = true;
      analyzeTextSentiment();
    }
  }, [text, isParentAnalyzing, onAnalysisComplete]);

  const analyzeTextSentiment = async () => {
    if (isAnalysisInProgress.current) return;
    
    analysisRequested.current = false;
    isAnalysisInProgress.current = true;
    setIsAnalyzing(true);
    
    const commentsList = splitTextIntoComments(text);
    
    if (commentsList.length === 0) {
      setIsAnalyzing(false);
      isAnalysisInProgress.current = false;
      if (onAnalysisComplete) onAnalysisComplete();
      return;
    }

    try {
      console.log("Starting sentiment analysis for overall text");
      const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
        body: { text }
      });
      
      if (error) {
        console.error("Error from sentiment analysis edge function:", error);
        throw new Error(error.message);
      }
      
      console.log("Sentiment analysis response:", data);
      if (!data || data.error) {
        throw new Error(data?.error || "Failed to get sentiment analysis results");
      }
      
      setOverallScore(data.score);
      
      const commentPromises = commentsList.map(async (comment, index) => {
        try {
          console.log(`Analyzing comment ${index + 1}: "${comment}"`);
          const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
            body: { text: comment }
          });
          
          if (error) {
            console.error(`Error analyzing comment ${index + 1}:`, error);
            // Return null for failed analyses so we can filter them out
            return null;
          }
          
          if (!data || typeof data.score !== 'number' || isNaN(data.score)) {
            console.error(`Invalid score received for comment ${index + 1}:`, data);
            return null;
          }
          
          console.log(`Comment ${index + 1} score:`, data.score);
          return { text: comment, score: data.score };
        } catch (err) {
          console.error(`Error processing comment ${index + 1}:`, err);
          return null;
        }
      });
      
      const commentResults = await Promise.all(commentPromises);
      
      // Filter out failed analyses (null values)
      const analyzedComments = commentResults.filter(result => result !== null) as { text: string; score: number }[];
      
      console.log(`Successfully analyzed ${analyzedComments.length} out of ${commentsList.length} comments`);
      console.log('Final analyzed comments:', analyzedComments);
      
      setComments(analyzedComments);
      
      // Calculate distribution from valid scores only
      const scores = analyzedComments.map(c => c.score);
      const distribution = [
        { range: "Very Negative (-1.0 to -0.6)", count: 0 },
        { range: "Negative (-0.6 to -0.2)", count: 0 },
        { range: "Neutral (-0.2 to 0.2)", count: 0 },
        { range: "Positive (0.2 to 0.6)", count: 0 },
        { range: "Very Positive (0.6 to 1.0)", count: 0 }
      ];

      scores.forEach(score => {
        if (score >= -1.0 && score < -0.6) distribution[0].count++;
        else if (score >= -0.6 && score < -0.2) distribution[1].count++;
        else if (score >= -0.2 && score < 0.2) distribution[2].count++;
        else if (score >= 0.2 && score < 0.6) distribution[3].count++;
        else if (score >= 0.6 && score <= 1.0) distribution[4].count++;
      });

      setDistributionData(distribution);
      
      toast({
        title: "Sentiment Analysis Complete",
        description: `Overall sentiment score: ${data.score.toFixed(2)}`,
      });
    } catch (error: any) {
      console.error('Error in sentiment analysis:', error);
      toast({
        title: "Analysis Error",
        description: `Could not complete sentiment analysis: ${error.message}`,
        variant: "destructive"
      });
      setComments([]);
    } finally {
      setIsAnalyzing(false);
      isAnalysisInProgress.current = false;
      
      if (onAnalysisComplete) onAnalysisComplete();
      
      if (analysisRequested.current) {
        analyzeTextSentiment();
      }
    }
  };

  const handleExportToExcel = async () => {
    if (comments.length === 0) return;

    console.log('\n=== Excel Export Debug ===');
    console.log('All comments:', comments);
    console.log('Available topics:', topics);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sentiment Analysis");

    worksheet.columns = [
      { header: 'Comment Number', key: 'number', width: 15 },
      { header: 'Comment Text', key: 'text', width: 50 },
      { header: 'Sentiment Score', key: 'score', width: 15 },
      { header: 'Sentiment Category', key: 'category', width: 15 },
      { header: 'Topic', key: 'topic', width: 30 }
    ];

    comments.forEach((comment, index) => {
      const normalizedCommentText = normalizeText(comment.text);
      console.log(`\nProcessing comment ${index + 1}:`);
      console.log('Original:', comment.text);
      console.log('Normalized:', normalizedCommentText);
      console.log('Normalized length:', normalizedCommentText.length);
      console.log('Character codes:', [...normalizedCommentText].map(c => c.charCodeAt(0)));
      
      const matchingTopic = topics.find(t => {
        const hasMatch = t.comments.some(topicComment => {
          const normalizedTopicComment = normalizeText(topicComment);
          const isMatch = normalizedTopicComment === normalizedCommentText;
          console.log('\nTopic match check:');
          console.log('Topic:', t.topic);
          console.log('Topic comment (original):', topicComment);
          console.log('Topic comment (normalized):', normalizedTopicComment);
          console.log('Topic comment length:', normalizedTopicComment.length);
          console.log('Topic comment codes:', [...normalizedTopicComment].map(c => c.charCodeAt(0)));
          console.log('Match?:', isMatch);
          console.log('Exact comparison:', JSON.stringify(normalizedTopicComment) === JSON.stringify(normalizedCommentText));
          return isMatch;
        });
        return hasMatch;
      });

      const topic = matchingTopic?.topic || 'Uncategorized';
      console.log('Final topic assignment:', topic);
      
      worksheet.addRow({
        number: index + 1,
        text: comment.text,
        score: comment.score,
        category: comment.score > 0.3 ? 'Positive' : 
                 comment.score < -0.3 ? 'Negative' : 'Neutral',
        topic: topic
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sentiment-analysis.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isAnalyzing) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
          <p className="text-muted-foreground">Analyzing sentiment...</p>
        </CardContent>
      </Card>
    );
  }

  if (!text) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
          <p className="mb-2">Enter text in the input area and click "Analyze Sentiment"</p>
          <p>Results will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            {getSentimentIcon(overallScore)}
            <span className="ml-2">Sentiment Analysis</span>
          </CardTitle>
          {comments.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToExcel}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export to Excel
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 h-[calc(100%-80px)] overflow-auto">
        {comments.length > 0 ? (
          <>
            <OverallSentiment overallScore={overallScore} />
            <SentimentStatistics 
              overallScore={overallScore}
              averageScore={statistics.averageScore}
              stdDev={statistics.stdDev}
              commentCount={comments.length}
            />
            <SentimentDistribution distributionData={distributionData} />
            <CommentsList comments={comments} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p className="mb-2">Analysis complete but no comments were found</p>
            <p>Make sure your text contains at least one line</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SentimentAnalysis;
