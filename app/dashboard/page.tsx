'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DashboardTable } from '@/components/dashboard-table'
import { ReputationBadge, SpikeWarning } from '@/components/reputation-badge'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

type ReputationStatus = 'HEALTHY' | 'WATCH' | 'AT_RISK'

interface Business {
  id: string
  name: string
  city: string
  state: string
  stars: number
  reviewCount: number
  reputationStatus: ReputationStatus
  hasLowRatingSpike: boolean
  recentLowRatingCount: number
  _count: {
    reviews: number
  }
}

interface Review {
  id: string
  businessId: string
  rating: number
  text: string
  date: string
  riskLevel: 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK'
  business: {
    id: string
    name: string
    city: string
    state: string
  }
}

export default function DashboardPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('')
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [needsAttention, setNeedsAttention] = useState(false)

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/businesses')
      const data = await response.json()
      if (data.success && data.businesses.length > 0) {
        setBusinesses(data.businesses)
        // Auto-select first business for demo
        setSelectedBusinessId(data.businesses[0].id)
      }
    } catch (error) {
      console.error('Error fetching businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = useCallback(async (businessId: string) => {
    setReviewsLoading(true)
    try {
      const params = new URLSearchParams({
        businessId,
        ...(needsAttention && { needsAttention: 'true' })
      })
      const response = await fetch(`/api/reviews?${params}`)
      const data = await response.json()
      if (data.success) {
        setReviews(data.reviews)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setReviewsLoading(false)
    }
  }, [needsAttention])

  // Fetch businesses on mount
  useEffect(() => {
    fetchBusinesses()
  }, [])

  // Fetch reviews when business is selected or needsAttention changes
  useEffect(() => {
    if (selectedBusinessId) {
      fetchReviews(selectedBusinessId)
    }
  }, [selectedBusinessId, fetchReviews])

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (businesses.length === 0) {
    return (
      <div className="container mx-auto py-4 sm:py-8 px-4 max-w-7xl">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Customer Feedback Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Monitor business reputation based on star ratings and identify high-risk reviews
            </p>
          </div>
          <div className="sm:shrink-0">
            <ThemeToggle />
          </div>
        </div>

        <div className="mt-6 sm:mt-8 p-4 sm:p-8 border rounded-lg bg-card shadow-sm max-w-2xl">
          <h2 className="text-lg sm:text-xl font-semibold mb-3">No Data Found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Import the Yelp dataset to get started:
          </p>
          <code className="block p-3 sm:p-4 bg-muted rounded-md text-xs sm:text-sm font-mono overflow-x-auto">
            npm run import:yelp
          </code>
          <p className="text-sm text-muted-foreground mt-4">
            This will import 100 businesses and their reviews from the Yelp Open Dataset.
          </p>
        </div>
      </div>
    )
  }

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId)

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Customer Feedback Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor business reputation based on star ratings and identify high-risk reviews
          </p>
        </div>
        <div className="sm:shrink-0">
          <ThemeToggle />
        </div>
      </div>

      {/* Business selector */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Business</label>
        <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
          <SelectTrigger className="w-full sm:max-w-2xl">
            <SelectValue placeholder="Choose a business" />
          </SelectTrigger>
          <SelectContent>
            {businesses.map((business) => (
              <SelectItem key={business.id} value={business.id}>
                {business.name} - {business.city}, {business.state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Business info with reputation metrics */}
      {selectedBusiness && (
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 border rounded-lg bg-card shadow-sm">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
            <div className="flex-1 space-y-3 w-full">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-semibold">{selectedBusiness.name}</h2>
                <ReputationBadge status={selectedBusiness.reputationStatus} />
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedBusiness.city}, {selectedBusiness.state}
              </p>
              {selectedBusiness.hasLowRatingSpike && (
                <div className="mt-4 pt-4 border-t">
                  <SpikeWarning />
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedBusiness.recentLowRatingCount} low-rating review{selectedBusiness.recentLowRatingCount === 1 ? '' : 's'} (1-2 stars) in the last 7 days
                  </p>
                </div>
              )}
            </div>
            <div className="text-left sm:text-right shrink-0 w-full sm:w-auto">
              <div className="flex items-center gap-1 sm:justify-end">
                <span className="text-yellow-500 text-xl">★</span>
                <span className="text-xl font-semibold">{selectedBusiness.stars.toFixed(1)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedBusiness._count.reviews} reviews
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Needs Attention Toggle */}
      <div className="mb-6">
        <Button
          variant={needsAttention ? "default" : "outline"}
          onClick={() => setNeedsAttention(!needsAttention)}
          size="lg"
          className="w-full sm:w-auto"
        >
          <span className="hidden sm:inline">
            {needsAttention ? "Show All Reviews" : "Show Reviews Needing Attention"}
          </span>
          <span className="sm:hidden">
            {needsAttention ? "Show All" : "Needs Attention"}
          </span>
        </Button>
      </div>

      {/* Reviews table */}
      {reviewsLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading reviews...</div>
      ) : (
        <DashboardTable reviews={reviews} needsAttention={needsAttention} />
      )}
    </div>
  )
}
