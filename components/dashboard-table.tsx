"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SentimentFlag } from "@/components/sentiment-flag"

interface Review {
  id: number
  business: string
  author: string
  rating: number
  text: string
  date: Date | string
  sentiment: 'positive' | 'neutral' | 'negative'
}

interface DashboardTableProps {
  reviews: Review[]
}

export function DashboardTable({ reviews }: DashboardTableProps) {
  const [sentimentFilter, setSentimentFilter] = useState<string>("all")
  const [ratingFilter, setRatingFilter] = useState<string>("all")

  // Apply filters
  const filteredReviews = reviews.filter((review) => {
    const sentimentMatch = sentimentFilter === "all" || review.sentiment === sentimentFilter
    const ratingMatch = ratingFilter === "all" || review.rating.toString() === ratingFilter
    return sentimentMatch && ratingMatch
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="w-48">
          <label className="text-sm font-medium mb-2 block">Sentiment</label>
          <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All sentiments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiments</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <label className="text-sm font-medium mb-2 block">Rating</label>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredReviews.length} of {reviews.length} reviews
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Review Text</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Sentiment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReviews.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No reviews found
              </TableCell>
            </TableRow>
          ) : (
            filteredReviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="font-medium">{review.business}</TableCell>
                <TableCell>{review.author}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span>{review.rating}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="line-clamp-2">{review.text}</div>
                </TableCell>
                <TableCell>
                  {new Date(review.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <SentimentFlag sentiment={review.sentiment} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
