
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Smile, Meh, Frown, BarChart as ChartIcon } from "lucide-react";
import { useState, useEffect } from 'react';

interface SentimentAnalysisProps {
  text: string;
}

// Helper function to split text into individual comments
const splitTextIntoComments = (text: string): string[] => {
  if (!text) return [];
  
  // Split by common delimiters: newlines, semicolons, or commas
  const comments = text.split(/[\n;,]+/)
    .map(comment => comment.trim())
    .filter(comment => comment.length > 0);
  
  return comments;
};

// Helper function to calculate sentiment score (mock implementation)
const analyzeSentiment = (text: string) => {
  if (!text) return { score: 0, comments: [] };
  
  // Split the input text into separate comments
  const comments = splitTextIntoComments(text);
  
  // This is a very simple mock implementation
  // In a real app, you would use a proper sentiment analysis library or API
  const positiveWords = ['good', 'great', 'excellent', 'happy', 'positive', 'nice', 'love', 'best'];
  const negativeWords = ['bad', 'worst', 'terrible', 'sad', 'negative', 'hate', 'awful', 'poor', 'disappointed'];
  
  // Analyze each comment individually
  const commentScores = comments.map(comment => {
    const words = comment.toLowerCase().split(/\s+/);
    let commentScore = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) commentScore += 0.3;
      if (negativeWords.includes(word)) commentScore -= 0.3;
    });
    
    // Normalize between -1 and 1
    commentScore = Math.max(-1, Math.min(1, commentScore));
    return { text: comment, score: commentScore };
  });
  
  // Calculate overall score as average of comment scores
  const overallScore = commentScores.length > 0 
    ? commentScores.reduce((sum, c) => sum + c.score, 0) / commentScores.length 
    : 0;
  
  return {
    score: Number(overallScore.toFixed(2)),
    comments: commentScores
  };
};

// Helper function to calculate standard deviation
const calculateStdDev = (values: number[]): number => {
  if (values.length <= 1) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
  
  return Number(Math.sqrt(variance).toFixed(2));
};

// Helper function to get color based on sentiment score
const getSentimentColor = (score: number): string => {
  if (score > 0.3) return 'sentiment-positive';
  if (score < -0.3) return 'sentiment-negative';
  return 'sentiment-neutral';
};

// Helper function to get icon based on sentiment score
const getSentimentIcon = (score: number) => {
  if (score > 0.3) return <Smile className="h-6 w-6 text-sentiment-positive" />;
  if (score < -0.3) return <Frown className="h-6 w-6 text-sentiment-negative" />;
  return <Meh className="h-6 w-6 text-sentiment-neutral" />;
};

const SentimentAnalysis = ({ text }: SentimentAnalysisProps) => {
  const [analysis, setAnalysis] = useState<{ 
    score: number; 
    comments: { text: string; score: number }[] 
  }>({ 
    score: 0, 
    comments: [] 
  });
  const [stdDev, setStdDev] = useState<number>(0);
  const [distributionData, setDistributionData] = useState<{ range: string; count: number }[]>([]);

  useEffect(() => {
    if (!text) {
      setAnalysis({ score: 0, comments: [] });
      setStdDev(0);
      setDistributionData([]);
      return;
    }

    // Perform sentiment analysis
    const result = analyzeSentiment(text);
    setAnalysis(result);

    // Calculate standard deviation
    if (result.comments.length > 0) {
      const scores = result.comments.map(c => c.score);
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
    }
  }, [text]);

  // Calculate normalized score (0-100) for progress bar
  const normalizedScore = ((analysis.score + 1) / 2) * 100;
  
  // Determine sentiment label
  let sentimentLabel = "Neutral";
  if (analysis.score > 0.6) sentimentLabel = "Very Positive";
  else if (analysis.score > 0.2) sentimentLabel = "Positive";
  else if (analysis.score < -0.6) sentimentLabel = "Very Negative";
  else if (analysis.score < -0.2) sentimentLabel = "Negative";
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          {getSentimentIcon(analysis.score)}
          <span className="ml-2">Sentiment Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 h-[calc(100%-80px)] overflow-auto">
        {text ? (
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
                className="h-4 mb-2"
              />
              <div className="flex justify-between items-center">
                <span className={`font-medium text-${getSentimentColor(analysis.score)}`}>
                  Score: {analysis.score}
                </span>
                <span className="font-medium">{sentimentLabel}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Average</div>
                  <div className="text-2xl font-bold">{analysis.score}</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Standard Deviation</div>
                  <div className="text-2xl font-bold">{stdDev}</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg col-span-2">
                  <div className="text-sm text-muted-foreground">Comments Analyzed</div>
                  <div className="text-2xl font-bold">{analysis.comments.length}</div>
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
                {analysis.comments.map((comment, index) => (
                  <div key={index} className={`p-3 rounded-md border border-${getSentimentColor(comment.score)}`}>
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
            <p className="mb-2">Enter text in the input area and click "Analyze Sentiment"</p>
            <p>Results will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SentimentAnalysis;
