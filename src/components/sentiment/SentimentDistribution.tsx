
import { BarChart as BarChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SentimentDistributionProps {
  distributionData: { range: string; count: number }[];
}

const SentimentDistribution = ({ distributionData }: SentimentDistributionProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <BarChartIcon className="mr-2 h-5 w-5" />
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
                fontSize={10}
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
  );
};

export default SentimentDistribution;
