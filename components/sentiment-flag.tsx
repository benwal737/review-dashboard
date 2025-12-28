import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SentimentFlagProps {
  sentiment: 'positive' | 'neutral' | 'negative'
  className?: string
}

export function SentimentFlag({ sentiment, className }: SentimentFlagProps) {
  const colors = {
    positive: "bg-green-100 text-green-800 border-green-200",
    neutral: "bg-gray-100 text-gray-800 border-gray-200",
    negative: "bg-red-100 text-red-800 border-red-200"
  }

  return (
    <Badge
      variant="outline"
      className={cn(colors[sentiment], className)}
    >
      {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
    </Badge>
  )
}
