import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Smile, Meh, Frown, BarChart as ChartIcon, FileSpreadsheet } from "lucide-react";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';

interface SentimentAnalysisProps {
  text: string;
}

const splitTextIntoComments = (text: string): string[] => {
  if (!text) return [];
  
  const comments = text.split(/[\n;.]+/)
    .map(comment => comment.trim())
    .filter(comment => comment.length > 0);
  
  return comments;
};

const analyzeSentiment = (text: string) => {
  if (!text) return { score: 0, comments: [] };
  
  const comments = splitTextIntoComments(text);
  
  const positiveWords = [
    'good', 'great', 'excellent', 'happy', 'positive', 'nice', 'love', 'best', 'wonderful',
    'amazing', 'outstanding', 'fantastic', 'terrific', 'impressive', 'beautiful', 'brilliant',
    'delightful', 'perfect', 'pleased', 'superb', 'exciting', 'thrilled', 'joy', 'successful',
    'awesome', 'incredible', 'remarkable', 'enjoy', 'praise', 'appreciated', 'satisfied',
    'enjoy', 'like', 'liked', 'recommend', 'recommended', 'favorite', 'awesome', 'win', 'winner',
    'worthy', 'worth', 'fun', 'funny', 'entertaining', 'easy', 'pleasant', 'glad', 'thankful',
    'grateful', 'helpful', 'useful', 'insightful', 'informative', 'interesting', 'engaging'
  ];
  
  const negativeWords = [
    'bad', 'worst', 'terrible', 'sad', 'negative', 'hate', 'awful', 'poor', 'disappointed',
    'horrible', 'unfortunate', 'failure', 'disappointing', 'useless', 'mediocre', 'rubbish',
    'pathetic', 'horrible', 'disaster', 'frustrating', 'annoying', 'unhappy', 'angry', 'miserable',
    'disgusting', 'dreadful', 'unpleasant', 'dislike', 'inadequate', 'inferior', 'problem',
    'broken', 'waste', 'difficult', 'hard', 'slow', 'confusing', 'confused', 'boring', 'bored',
    'ugly', 'expensive', 'overpriced', 'fail', 'failed', 'mistake', 'error', 'wrong', 'bad',
    'buggy', 'glitchy', 'concern', 'concerned', 'worried', 'worry', 'tired', 'exhausted',
    'uncomfortable', 'inconvenient', 'complicated', 'issue', 'issues', 'trouble', 'troubling'
  ];
  
  const intensifiers = [
    'very', 'extremely', 'absolutely', 'completely', 'totally', 'utterly', 
    'really', 'truly', 'incredibly', 'exceptionally', 'highly', 'especially',
    'particularly', 'remarkably', 'terribly', 'awfully', 'super', 'quite',
    'definitely', 'certainly', 'undoubtedly', 'surely', 'indeed'
  ];
  
  const negators = [
    'not', "don't", 'never', 'no', 'neither', 'nor', "isn't", "wasn't", "aren't", "weren't",
    "doesn't", "didn't", "can't", "couldn't", "won't", "wouldn't", 'hardly', 'barely',
    'scarcely', 'seldom', 'rarely', 'nothing', 'nobody', 'none', 'nowhere', 'without'
  ];
  
  const commentScores = comments.map(comment => {
    const lowerComment = comment.toLowerCase();
    const words = lowerComment.split(/\s+/);
    let commentScore = 0;
    let totalWordWeight = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^\w']/g, '');
      let wordScore = 0;
      let intensifierMultiplier = 1;
      let negationEffect = 1;
      
      for (let j = Math.max(0, i-2); j < i; j++) {
        if (intensifiers.includes(words[j])) {
          intensifierMultiplier = 1.8;
          break;
        }
      }
      
      for (let j = Math.max(0, i-3); j < i; j++) {
        if (negators.includes(words[j])) {
          negationEffect = -1;
          break;
        }
      }
      
      if (positiveWords.includes(word)) {
        wordScore = 0.6 * intensifierMultiplier * negationEffect;
      } else if (negativeWords.includes(word)) {
        wordScore = -0.6 * intensifierMultiplier * negationEffect;
      }
      
      const positionFactor = (i < words.length / 4 || i > words.length * 3/4) ? 1.5 : 1;
      
      wordScore *= positionFactor;
      
      commentScore += wordScore;
      if (wordScore !== 0) {
        totalWordWeight++;
      }
    }
    
    if (totalWordWeight > 0) {
      const lengthFactor = Math.min(2.0, 3.0 / Math.sqrt(words.length));
      commentScore = (commentScore / Math.max(1, Math.sqrt(totalWordWeight))) * lengthFactor;
      
      if (commentScore > 0 && commentScore < 0.2) commentScore = 0.2;
      if (commentScore < 0 && commentScore > -0.2) commentScore = -0.2;
    } else {
      const exclamationCount = (comment.match(/!/g) || []).length;
      const questionCount = (comment.match(/\?/g) || []).length;
      
      if (exclamationCount > 0) commentScore = 0.1 * exclamationCount;
      if (questionCount > 1) commentScore = -0.05 * questionCount;
    }
    
    commentScore = Math.max(-1, Math.min(1, commentScore));
    
    return { text: comment, score: Number(commentScore.toFixed(2)) };
  });
  
  const overallScore = commentScores.length > 0 
    ? commentScores.reduce((sum, c) => sum + c.score, 0) / commentScores.length 
    : 0;
  
  return {
    score: Number(overallScore.toFixed(2)),
    comments: commentScores
  };
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

    const result = analyzeSentiment(text);
    setAnalysis(result);

    if (result.comments.length > 0) {
      const scores = result.comments.map(c => c.score);
      setStdDev(calculateStdDev(scores));

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

  const handleExportToExcel = () => {
    if (analysis.comments.length === 0) return;

    const exportData = analysis.comments.map((comment, index) => ({
      'Comment Number': index + 1,
      'Comment Text': comment.text,
      'Sentiment Score': comment.score,
      'Sentiment Category': comment.score > 0.3 ? 'Positive' : 
                          comment.score < -0.3 ? 'Negative' : 'Neutral'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sentiment Analysis");

    const colWidths = [
      { wch: 15 },
      { wch: 50 },
      { wch: 15 },
      { wch: 15 }
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, "sentiment-analysis.xlsx");
  };

  const normalizedScore = ((analysis.score + 1) / 2) * 100;
  
  let sentimentLabel = "Neutral";
  if (analysis.score > 0.6) sentimentLabel = "Very Positive";
  else if (analysis.score > 0.2) sentimentLabel = "Positive";
  else if (analysis.score < -0.6) sentimentLabel = "Very Negative";
  else if (analysis.score < -0.2) sentimentLabel = "Negative";
  
  const getProgressColor = () => {
    if (analysis.score > 0.3) return "bg-green-500";
    if (analysis.score < -0.3) return "bg-red-500";
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
            {getSentimentIcon(analysis.score)}
            <span className="ml-2">Sentiment Analysis</span>
          </CardTitle>
          {analysis.comments.length > 0 && (
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
                className={`h-4 mb-2 ${getProgressColor()}`}
              />
              <div className="flex justify-between items-center">
                <span className="font-medium">
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
            <p className="mb-2">Enter text in the input area and click "Analyze Sentiment"</p>
            <p>Results will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SentimentAnalysis;
