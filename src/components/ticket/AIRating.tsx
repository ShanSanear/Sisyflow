import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AIRatingProps {
  rating: number | null;
  onRate: (rating: number) => void;
}

export function AIRating({ rating, onRate }: AIRatingProps) {
  const handleRate = (newRating: number) => {
    onRate(newRating);
    // Rating will be saved when the ticket is submitted
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-m">Rate AI Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Button
              key={star}
              data-testid={`ai-rating-star-${star}`}
              variant="ghost"
              size="sm"
              onClick={() => handleRate(star)}
              className="p-1 h-auto"
            >
              <Star
                className={`h-5 w-5 ${rating && star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
              />
            </Button>
          ))}
          {rating && (
            <span className="ml-2 text-sm text-gray-600">
              {rating} star{rating !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">Optional: Help us improve AI suggestions</p>
      </CardContent>
    </Card>
  );
}
