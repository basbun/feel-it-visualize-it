
import { Progress } from "@/components/ui/progress";
import { getSentimentColor, getSentimentLabel } from "@/utils/sentimentUtils";

interface OverallSentimentProps {
  overallScore: number;
}

const OverallSentiment = ({ overallScore }: OverallSentimentProps) => {
  const normalizedScore = ((overallScore + 1) / 2) * 100;
  const sentimentLabel = getSentimentLabel(overallScore);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Overall Sentiment</h3>
      <div className="flex items-center justify-between mb-2">
        <span>-1</span>
        <span>0</span>
        <span>1</span>
      </div>
      <Progress
        value={normalizedScore}
        className={`h-4 mb-2 ${getSentimentColor(overallScore)}`}
      />
      <div className="flex justify-between items-center">
        <span className="font-medium">
          Score: {overallScore.toFixed(2)}
        </span>
        <span className="font-medium">{sentimentLabel}</span>
      </div>
    </div>
  );
};

export default OverallSentiment;
