
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Smile, Meh, Frown, BarChart as ChartIcon } from "lucide-react";
import { useState, useEffect } from 'react';

interface SentimentAnalysisProps {
  text: string;
}

// Helper function to calculate sentiment score (mock implementation)
const analyzeSentiment = (text: string) => {
  if (!text) return { score: 0, sentences: [] };
  
  // This is a very simple mock implementation
  // In a real app, you would use a proper sentiment analysis library or API
  const words = text.toLowerCase().split(/\s+/);
  
  const positiveWords = ['good', 'great', 'excellent', 'happy', 'positive', 'nice', 'love', 'best'];
  const negativeWords = ['bad', 'worst', 'terrible', 'sad', 'negative', 'hate', 'awful', 'poor'];
  
  // Split text into sentences for individual analysis
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceScores = sentences.map(sentence => {
    const words = sentence.toLowerCase().split(/\s+/);
    let sentenceScore = 0;
    words.forEach(word => {
      if (positiveWords.includes(word)) sentenceScore += 0.3;
      if (negativeWords.includes(word)) sentenceScore -= 0.3;
    });
    // Normalize between -1 and 1
    sentenceScore = Math.max(-1, Math.min(1, sentenceScore));
    return { text: sentence.trim(), score: sentenceScore };
  });
  
  // Calculate overall score as average of sentence scores
  const overallScore = sentenceScores.length > 0 
    ? sentenceScores.reduce((sum, s) => sum + s.score, 0) / sentenceScores.length 
    : 0;
  
  return {
    score: Number(overallScore.toFixed(2)),
    sentences: sentenceScores
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
  const [analysis, setAnalysis] = useState<{ score: number; sentences: { text: string; score: number }[] }>({ 
    score: 0, 
    sentences: [] 
  });
  const [stdDev, setStdDev] = useState<number>(0);
  const [distributionData, setDistributionData] = useState<{ range: string; count: number }[]>([]);

  useEffect(() => {
    if (!text) {
      setAnalysis({ score: 0, sentences: [] });
      setStdDev(0);
      setDistributionData([]);
      return;
    }

    // Perform sentiment analysis
    const result = analyzeSentiment(text);
    setAnalysis(result);

    // Calculate standard deviation
    if (result.sentences.length > 0) {
      const scores = result.sentences.map(s => s.score);
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
