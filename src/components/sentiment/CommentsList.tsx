
import { getSentimentBorderColor } from "@/utils/sentimentUtils";

interface Comment {
  text: string;
  score: number;
}

interface CommentsListProps {
  comments: Comment[];
}

const CommentsList = ({ comments }: CommentsListProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Individual Comments</h3>
      <div className="space-y-2">
        {comments.map((comment, index) => (
          <div key={index} className={`p-3 rounded-md border ${getSentimentBorderColor(comment.score)}`}>
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">{comment.text}</div>
              <div className="text-sm font-bold">{comment.score.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentsList;
