
interface SentimentStatisticsProps {
  overallScore: number;
  stdDev: number;
  commentCount: number;
}

const SentimentStatistics = ({ overallScore, stdDev, commentCount }: SentimentStatisticsProps) => {
  return (
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
          <div className="text-2xl font-bold">{commentCount}</div>
        </div>
      </div>
    </div>
  );
};

export default SentimentStatistics;
