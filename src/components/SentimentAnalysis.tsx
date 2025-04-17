
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

// Helper function to calculate sentiment score with improved calibration
const analyzeSentiment = (text: string) => {
  if (!text) return { score: 0, comments: [] };
  
  // Split the input text into separate comments
  const comments = splitTextIntoComments(text);
  
  // Enhanced sentiment analysis with more words and better scoring
  const positiveWords = [
    'good', 'great', 'excellent', 'happy', 'positive', 'nice', 'love', 'best', 'wonderful',
    'amazing', 'outstanding', 'fantastic', 'terrific', 'impressive', 'beautiful', 'brilliant',
    'delightful', 'perfect', 'pleased', 'superb', 'exciting', 'thrilled', 'joy', 'successful',
    'awesome', 'incredible', 'remarkable', 'enjoy', 'praise', 'appreciated', 'satisfied'
  ];
  
  const negativeWords = [
    'bad', 'worst', 'terrible', 'sad', 'negative', 'hate', 'awful', 'poor', 'disappointed',
    'horrible', 'unfortunate', 'failure', 'disappointing', 'useless', 'mediocre', 'rubbish',
    'pathetic', 'horrible', 'disaster', 'frustrating', 'annoying', 'unhappy', 'angry', 'miserable',
    'disgusting', 'dreadful', 'unpleasant', 'dislike', 'inadequate', 'inferior', 'problem'
  ];
  
  const intensifiers = [
    'very', 'extremely', 'absolutely', 'completely', 'totally', 'utterly', 
    'really', 'truly', 'incredibly', 'exceptionally'
  ];
  
  const negators = ['not', "don't", 'never', 'no', 'neither', 'nor', "isn't", "wasn't", "aren't", "weren't"];
  
  // Analyze each comment individually with the improved algorithm
  const commentScores = comments.map(comment => {
    const lowerComment = comment.toLowerCase();
    const words = lowerComment.split(/\s+/);
    let commentScore = 0;
    let totalWordWeight = 0;
    
    // Start with baseline analysis of the content
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let wordScore = 0;
      let intensifierMultiplier = 1;
      let negationEffect = 1;
      
      // Check for intensifiers in preceding words
      if (i > 0 && intensifiers.includes(words[i-1])) {
        intensifierMultiplier = 1.5;
      }
      
      // Check for negations in preceding words (up to 3 words back)
      for (let j = Math.max(0, i-3); j < i; j++) {
        if (negators.includes(words[j])) {
          negationEffect = -1;
          break;
        }
      }
      
      // Score the word
      if (positiveWords.includes(word)) {
        wordScore = 0.5 * intensifierMultiplier * negationEffect;
      } else if (negativeWords.includes(word)) {
        wordScore = -0.5 * intensifierMultiplier * negationEffect;
      }
      
      // More weight to words that appear at beginning or end
      const positionFactor = (i < words.length / 4 || i > words.length * 3/4) ? 1.2 : 1;
      
      // Apply position factor
      wordScore *= positionFactor;
      
      commentScore += wordScore;
      if (wordScore !== 0) {
        totalWordWeight++;
      }
    }
    
    // Normalize score based on comment length and sentiment words
    if (totalWordWeight > 0) {
      // Adjust scoring to be more responsive
      // For short comments, a single sentiment word has more impact
      const lengthFactor = Math.min(1.5, 2.5 / Math.sqrt(words.length));
      commentScore = (commentScore / Math.max(1, Math.sqrt(totalWordWeight))) * lengthFactor;
    }
    
    // Ensure score is between -1 and 1
    commentScore = Math.max(-1, Math.min(1, commentScore));
    
    return { text: comment, score: Number(commentScore.toFixed(2)) };
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
