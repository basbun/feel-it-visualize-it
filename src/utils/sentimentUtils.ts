
export const calculateStdDev = (values: number[]): number => {
  if (values.length <= 1) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
  
  return Number(Math.sqrt(variance).toFixed(2));
};

export const getSentimentColor = (score: number): string => {
  if (score > 0.3) return "bg-green-500";
  if (score < -0.3) return "bg-red-500";
  return "bg-yellow-500";
};

export const getSentimentLabel = (score: number): string => {
  if (score > 0.6) return "Very Positive";
  else if (score > 0.2) return "Positive";
  else if (score < -0.6) return "Very Negative";
  else if (score < -0.2) return "Negative";
  return "Neutral";
};

export const getSentimentBorderColor = (score: number): string => {
  if (score > 0.3) return "border-green-500";
  if (score < -0.3) return "border-red-500";
  return "border-yellow-500";
};

export const splitTextIntoComments = (text: string): string[] => {
  if (!text) return [];
  
  return text.split(/\n+/)
    .map(comment => comment.trim())
    .filter(comment => comment.length > 0);
};
