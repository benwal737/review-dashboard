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
import { RiskBadge, RiskLevel } from "@/components/risk-badge"

interface Review {
  id: string
  businessId: string
  rating: number
  text: string
  date: string
  riskLevel: RiskLevel
  business: {
    id: string
    name: string
    city: string
    state: string
  }
}

interface DashboardTableProps {
  reviews: Review[]
  needsAttention?: boolean
}

export function DashboardTable({ reviews, needsAttention = false }: DashboardTableProps) {
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>("all")
  const [ratingFilter, setRatingFilter] = useState<string>("all")

  // Apply filters only when not in needsAttention mode
  const filteredReviews = needsAttention ? reviews : reviews.filter((review) => {
    const riskMatch = riskLevelFilter === "all" || review.riskLevel === riskLevelFilter
    const ratingMatch = ratingFilter === "all" || review.rating.toString() === ratingFilter
    return riskMatch && ratingMatch
  })

  return (
    <div className="space-y-4">
      {/* Filters - only show when NOT in needsAttention mode */}
      {!needsAttention && (
        <div className="flex gap-4">
          <div className="w-48">
            <label className="text-sm font-medium mb-2 block">Risk Level</label>
            <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All risk levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="HIGH_RISK">High Risk</SelectItem>
                <SelectItem value="MEDIUM_RISK">Medium Risk</SelectItem>
                <SelectItem value="LOW_RISK">Low Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <label className="text-sm font-medium mb-2 block">Star Rating</label>
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
      )}

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {needsAttention ? (
          reviews.length === 0 ? (
            "No reviews need attention - great news!"
          ) : (
            `${reviews.length} review${reviews.length === 1 ? '' : 's'} needing attention`
          )
        ) : (
          `Showing ${filteredReviews.length} of ${reviews.length} reviews`
        )}
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Star Rating</TableHead>
            <TableHead>Review Text</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Risk Level</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReviews.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No reviews found
              </TableCell>
            </TableRow>
          ) : (
            filteredReviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span>{review.rating}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-2xl">
                  <div className="line-clamp-3">{review.text}</div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {new Date(review.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <RiskBadge riskLevel={review.riskLevel} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
