import { PrismaClient } from '@prisma/client'

export type ReputationStatus = 'HEALTHY' | 'WATCH' | 'AT_RISK'

export interface ReputationMetrics {
  reputationStatus: ReputationStatus
  hasLowRatingSpike: boolean
  recentLowRatingCount: number
  previousLowRatingCount: number
  recentAvgRating: number | null
  lifetimeAvgRating: number
}

/**
 * Computes reputation risk metrics for a business based on star ratings
 * All values are computed at request time, not stored
 *
 * Risk Levels (based on star ratings):
 * - HIGH_RISK: 1-2 stars
 * - MEDIUM_RISK: 3 stars
 * - LOW_RISK: 4-5 stars
 *
 * Reputation Status Logic:
 * - AT_RISK: ≥3 low-rating reviews (1-2 stars) in 30d OR recent avg ≥0.7 lower than lifetime
 * - WATCH: 1-2 low-rating reviews in 30d OR recent avg ≥0.4 lower than lifetime
 * - HEALTHY: otherwise
 *
 * Spike: low-rating count in last 7d doubled OR increased by ≥2 vs previous 7d
 */
export async function computeReputationMetrics(
  prisma: PrismaClient,
  businessId: string
): Promise<ReputationMetrics> {
  const now = new Date()

  // Date boundaries
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // Get all reviews for this business
  const allReviews = await prisma.review.findMany({
    where: { businessId },
    select: {
      rating: true,
      date: true
    }
  })

  // Calculate lifetime average rating
  const lifetimeAvgRating = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : 0

  // Recent reviews (last 30 days)
  const recentReviews = allReviews.filter(r => r.date >= thirtyDaysAgo)

  // Low-rating reviews (1-2 stars) in last 30 days
  const lowRatingRecentCount = recentReviews.filter(
    r => r.rating <= 2
  ).length

  // Recent average rating (last 30 days)
  const recentAvgRating = recentReviews.length > 0
    ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
    : null

  // Low-rating spike detection (last 7d vs previous 7d)
  const last7DaysReviews = allReviews.filter(r => r.date >= sevenDaysAgo)
  const previous7DaysReviews = allReviews.filter(
    r => r.date >= fourteenDaysAgo && r.date < sevenDaysAgo
  )

  const recentLowRatingCount = last7DaysReviews.filter(
    r => r.rating <= 2
  ).length

  const previousLowRatingCount = previous7DaysReviews.filter(
    r => r.rating <= 2
  ).length

  // Spike if doubled OR increased by at least 2
  const hasLowRatingSpike =
    (previousLowRatingCount > 0 && recentLowRatingCount >= previousLowRatingCount * 2) ||
    (recentLowRatingCount - previousLowRatingCount >= 2)

  // Determine reputation status
  let reputationStatus: ReputationStatus = 'HEALTHY'

  const ratingDrop = recentAvgRating !== null
    ? lifetimeAvgRating - recentAvgRating
    : 0

  if (lowRatingRecentCount >= 3 || ratingDrop >= 0.7) {
    reputationStatus = 'AT_RISK'
  } else if (lowRatingRecentCount >= 1 || ratingDrop >= 0.4) {
    reputationStatus = 'WATCH'
  }

  return {
    reputationStatus,
    hasLowRatingSpike,
    recentLowRatingCount,
    previousLowRatingCount,
    recentAvgRating,
    lifetimeAvgRating
  }
}

/**
 * Helper function to determine risk level from star rating
 */
export function getRiskLevelFromRating(rating: number): 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' {
  if (rating <= 2) return 'HIGH_RISK'
  if (rating === 3) return 'MEDIUM_RISK'
  return 'LOW_RISK'
}
