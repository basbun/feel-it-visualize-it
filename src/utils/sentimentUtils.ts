export const calculateStdDev = (values: number[]): number => {
  if (values.length <= 1) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
  
  return Number(Math.sqrt(variance).toFixed(2));
};

export const calculateAverage = (values: number[]): number => {
  console.log('=== calculateAverage Debug ===');
  console.log('Input values:', values);
  console.log('Values length:', values.length);
  console.log('Values types:', values.map(v => typeof v));
  
  if (values.length === 0) {
    console.log('No values provided, returning 0');
    return 0;
  }
  
  // Filter out invalid values (NaN, null, undefined)
  const validValues = values.filter(val => 
    typeof val === 'number' && 
    !isNaN(val) && 
    isFinite(val)
  );
  
  console.log('Valid values after filtering:', validValues);
  console.log('Valid values length:', validValues.length);
  
  if (validValues.length === 0) {
    console.log('No valid values after filtering, returning 0');
    return 0;
  }
  
  const sum = validValues.reduce((sum, val) => sum + val, 0);
  const average = sum / validValues.length;
  const result = Number(average.toFixed(2));
  
  console.log('Sum:', sum);
  console.log('Raw average:', average);
  console.log('Final result:', result);
  console.log('=== End calculateAverage Debug ===');
  
  return result;
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
