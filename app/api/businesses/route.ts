import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeReputationMetrics } from '@/lib/reputation-risk'

/**
 * GET /api/businesses
 * Returns all businesses from the local database with reputation metrics
 */
export async function GET() {
  try {
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        stars: true,
        reviewCount: true,
        categories: true,
        _count: {
          select: {
            reviews: true
          }
        }
      },
      orderBy: {
        reviewCount: 'desc'
      }
    })

    // Compute reputation metrics for each business
    const businessesWithMetrics = await Promise.all(
      businesses.map(async (business: typeof businesses[0]) => {
        const metrics = await computeReputationMetrics(prisma, business.id)
        return {
          ...business,
          reputationStatus: metrics.reputationStatus,
          hasLowRatingSpike: metrics.hasLowRatingSpike,
          recentLowRatingCount: metrics.recentLowRatingCount
        }
      })
    )

    return NextResponse.json({
      success: true,
      count: businessesWithMetrics.length,
      businesses: businessesWithMetrics
    })
  } catch (error) {
    console.error('Error fetching businesses:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch businesses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
