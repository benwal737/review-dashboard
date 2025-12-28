'use client'

import { useEffect, useState } from 'react'
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

  // Fetch businesses on mount
  useEffect(() => {
    fetchBusinesses()
  }, [])

  // Fetch reviews when business is selected or needsAttention changes
  useEffect(() => {
    if (selectedBusinessId) {
      fetchReviews(selectedBusinessId)
    }
  }, [selectedBusinessId, needsAttention])

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

  const fetchReviews = async (businessId: string) => {
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
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (businesses.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Customer Feedback Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor business reputation based on star ratings and identify high-risk reviews
          </p>
        </div>

        <div className="mt-8 p-8 border rounded-lg bg-card shadow-sm max-w-2xl">
          <h2 className="text-xl font-semibold mb-3">No Data Found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Import the Yelp dataset to get started:
          </p>
          <code className="block p-4 bg-muted rounded-md text-sm font-mono">
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
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Customer Feedback Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor business reputation based on star ratings and identify high-risk reviews
        </p>
      </div>

      {/* Business selector */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Business</label>
        <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
          <SelectTrigger className="max-w-2xl">
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
        <div className="mb-8 p-6 border rounded-lg bg-card shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-semibold">{selectedBusiness.name}</h2>
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
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 justify-end">
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
        >
          {needsAttention ? "Show All Reviews" : "Show Reviews Needing Attention"}
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
