
interface SentimentStatisticsProps {
  overallScore: number;
  commentScores: number[];
  stdDev: number;
  commentCount: number;
}

const SentimentStatistics = ({ overallScore, commentScores, stdDev, commentCount }: SentimentStatisticsProps) => {
  // Calculate the true average from individual comment scores
  const averageScore = commentScores.length > 0 
    ? commentScores.reduce((sum, score) => sum + score, 0) / commentScores.length 
    : 0;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Statistics</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground">Overall Sentiment</div>
          <div className="text-2xl font-bold">{overallScore.toFixed(2)}</div>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground">Average Comment</div>
          <div className="text-2xl font-bold">{averageScore.toFixed(2)}</div>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground">Standard Deviation</div>
          <div className="text-2xl font-bold">{stdDev}</div>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground">Comments Analyzed</div>
          <div className="text-2xl font-bold">{commentCount}</div>
        </div>
      </div>
    </div>
  );
};

export default SentimentStatistics;
