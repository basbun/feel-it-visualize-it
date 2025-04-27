
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Smile, Meh, Frown, BarChart as ChartIcon, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExcelJS from 'exceljs';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SentimentAnalysisProps {
  text: string;
  isParentAnalyzing?: boolean;
}

const splitTextIntoComments = (text: string): string[] => {
  if (!text) return [];
  
  // Split by newlines first, then handle each line as a separate comment
  // This preserves periods within sentences while still allowing multiple comments
  const comments = text.split(/\n+/)
    .map(comment => comment.trim())
    .filter(comment => comment.length > 0);
  
  return comments;
};

const calculateStdDev = (values: number[]): number => {
  if (values.length <= 1) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
  
  return Number(Math.sqrt(variance).toFixed(2));
};

const getSentimentColor = (score: number): string => {
  if (score > 0.3) return 'sentiment-positive';
  if (score < -0.3) return 'sentiment-negative';
  return 'sentiment-neutral';
};

const getSentimentIcon = (score: number) => {
  if (score > 0.3) return <Smile className="h-6 w-6 text-green-500" />;
  if (score < -0.3) return <Frown className="h-6 w-6 text-red-500" />;
  return <Meh className="h-6 w-6 text-yellow-500" />;
};

const SentimentAnalysis = ({ text, isParentAnalyzing = false }: SentimentAnalysisProps) => {
  const [comments, setComments] = useState<{ text: string; score: number }[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [stdDev, setStdDev] = useState<number>(0);
  const [distributionData, setDistributionData] = useState<{ range: string; count: number }[]>([]);
  const { toast } = useToast();
  const isFirstRender = useRef(true);
  const previousText = useRef(text);
  const isAnalysisInProgress = useRef(false);
  
  useEffect(() => {
    // If it's the first render with no text or the text hasn't changed, don't analyze
    if ((isFirstRender.current && !text) || previousText.current === text) {
      isFirstRender.current = false;
      return;
    }

    // Update previous text ref to current text
    previousText.current = text;
    isFirstRender.current = false;
    
    if (!text) {
      setComments([]);
      setOverallScore(0);
      setStdDev(0);
      setDistributionData([]);
      setIsAnalyzing(false);
      return;
    }

    // Prevent multiple parallel analyses
    if (isAnalysisInProgress.current) return;

    const analyzeTextSentiment = async () => {
      isAnalysisInProgress.current = true;
      setIsAnalyzing(true);
      const commentsList = splitTextIntoComments(text);
      
      if (commentsList.length === 0) {
        setIsAnalyzing(false);
        isAnalysisInProgress.current = false;
        return;
      }

      try {
        // First, analyze the overall sentiment
        const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
          body: { text }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        setOverallScore(data.score);
        
        // Now analyze each comment individually
        const commentPromises = commentsList.map(async (comment) => {
          try {
            const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
              body: { text: comment }
            });
            
            if (error) {
              console.error('Error analyzing comment:', error);
              return { text: comment, score: 0 };
            }
            
            return { text: comment, score: data.score };
          } catch (err) {
            console.error('Error processing comment:', err);
            return { text: comment, score: 0 };
          }
        });
        
        const analyzedComments = await Promise.all(commentPromises);
        setComments(analyzedComments);
        
        // Calculate statistics
        const scores = analyzedComments.map(c => c.score);
        setStdDev(calculateStdDev(scores));
        
        // Create distribution data
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
      } catch (error: any) {
        console.error('Error in sentiment analysis:', error);
        toast({
          title: "Analysis Error",
          description: `Could not complete sentiment analysis: ${error.message}`,
          variant: "destructive"
        });
      } finally {
        setIsAnalyzing(false);
        isAnalysisInProgress.current = false;
      }
    };
    
    // Only run the analysis if there's actual text to analyze
    if (text.trim()) {
      analyzeTextSentiment();
    }
  }, [text, toast]);

  const handleExportToExcel = async () => {
    if (comments.length === 0) return;

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sentiment Analysis");

    // Define columns
    worksheet.columns = [
      { header: 'Comment Number', key: 'number', width: 15 },
      { header: 'Comment Text', key: 'text', width: 50 },
      { header: 'Sentiment Score', key: 'score', width: 15 },
      { header: 'Sentiment Category', key: 'category', width: 15 }
    ];

    // Add rows from data
    comments.forEach((comment, index) => {
      worksheet.addRow({
        number: index + 1,
        text: comment.text,
        score: comment.score,
        category: comment.score > 0.3 ? 'Positive' : 
                 comment.score < -0.3 ? 'Negative' : 'Neutral'
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };

    // Generate a blob and trigger download
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

  const normalizedScore = ((overallScore + 1) / 2) * 100;
  
  let sentimentLabel = "Neutral";
  if (overallScore > 0.6) sentimentLabel = "Very Positive";
  else if (overallScore > 0.2) sentimentLabel = "Positive";
  else if (overallScore < -0.6) sentimentLabel = "Very Negative";
  else if (overallScore < -0.2) sentimentLabel = "Negative";
  
  const getProgressColor = () => {
    if (overallScore > 0.3) return "bg-green-500";
    if (overallScore < -0.3) return "bg-red-500";
    return "bg-yellow-500";
  };
  
  const getCommentBorderColor = (score: number) => {
    if (score > 0.3) return "border-green-500";
    if (score < -0.3) return "border-red-500";
    return "border-yellow-500";
  };
  
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
        {(isAnalyzing || isParentAnalyzing) ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
            <p className="text-muted-foreground">Analyzing sentiment...</p>
          </div>
        ) : text ? (
          comments.length > 0 ? (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-2">Overall Sentiment</h3>
                <div className="flex items-center justify-between mb-2">
                  <span>-1</span>
                  <span>0</span>
                  <span>1</span>
                </div>
                <Progress
                  value={normalizedScore}
                  className={`h-4 mb-2 ${getProgressColor()}`}
                />
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    Score: {overallScore.toFixed(2)}
                  </span>
                  <span className="font-medium">{sentimentLabel}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Average</div>
                    <div className="text-2xl font-bold">{overallScore.toFixed(2)}</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Standard Deviation</div>
                    <div className="text-2xl font-bold">{stdDev}</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg col-span-2">
                    <div className="text-sm text-muted-foreground">Comments Analyzed</div>
                    <div className="text-2xl font-bold">{comments.length}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <ChartIcon className="mr-2 h-5 w-5" />
                  Sentiment Distribution
                </h3>
                <div className="h-64">
                  {distributionData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={distributionData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="range" 
                          angle={-45} 
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar 
                          dataKey="count" 
                          fill="#3b82f6" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Individual Comments</h3>
                <div className="space-y-2">
                  {comments.map((comment, index) => (
                    <div key={index} className={`p-3 rounded-md border ${getCommentBorderColor(comment.score)}`}>
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">{comment.text}</div>
                        <div className="text-sm font-bold">{comment.score.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <p className="mb-2">Analysis complete but no comments were found</p>
              <p>Make sure your text contains at least one line</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p className="mb-2">Enter text in the input area and click "Analyze Sentiment"</p>
            <p>Results will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SentimentAnalysis;
