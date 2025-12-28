import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { RiskLevel } from '@prisma/client'

/**
 * GET /api/reviews
 * Returns reviews with optional filters
 *
 * Query parameters:
 * - businessId: Filter by business ID (optional)
 * - riskLevel: Filter by risk level (HIGH_RISK, MEDIUM_RISK, LOW_RISK)
 * - rating: Filter by exact rating (1-5)
 * - minRating: Filter by minimum rating
 * - maxRating: Filter by maximum rating
 * - limit: Maximum number of reviews to return (default: 50)
 * - needsAttention: If true, returns only recent high-risk reviews (last 30 days)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')
    const riskLevel = searchParams.get('riskLevel')
    const rating = searchParams.get('rating')
    const minRating = searchParams.get('minRating')
    const maxRating = searchParams.get('maxRating')
    const limit = parseInt(searchParams.get('limit') || '50')
    const needsAttention = searchParams.get('needsAttention') === 'true'

    // Build filter object
    const where: any = {}

    // Business ID filter (optional to allow fetching all reviews)
    if (businessId) {
      where.businessId = businessId
    }

    // Needs Attention filter: HIGH_RISK reviews + last 30 days
    if (needsAttention) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      where.riskLevel = 'HIGH_RISK'
      where.date = {
        gte: thirtyDaysAgo
      }
    }

    // Risk Level filter
    if (riskLevel && !needsAttention) {
      const validRiskLevels: RiskLevel[] = ['HIGH_RISK', 'MEDIUM_RISK', 'LOW_RISK']
      if (validRiskLevels.includes(riskLevel as RiskLevel)) {
        where.riskLevel = riskLevel as RiskLevel
      } else {
        return NextResponse.json(
          { error: 'Invalid risk level. Must be HIGH_RISK, MEDIUM_RISK, or LOW_RISK' },
          { status: 400 }
        )
      }
    }

    // Rating filters
    if (rating) {
      const ratingNum = parseInt(rating)
      if (ratingNum >= 1 && ratingNum <= 5) {
        where.rating = ratingNum
      } else {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        )
      }
    } else {
      // Range filters (only if exact rating not specified)
      const ratingFilters: any = {}

      if (minRating) {
        const min = parseInt(minRating)
        if (min >= 1 && min <= 5) {
          ratingFilters.gte = min
        }
      }

      if (maxRating) {
        const max = parseInt(maxRating)
        if (max >= 1 && max <= 5) {
          ratingFilters.lte = max
        }
      }

      if (Object.keys(ratingFilters).length > 0) {
        where.rating = ratingFilters
      }
    }

    // Fetch reviews
    const reviews = await prisma.review.findMany({
      where,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: limit
    })

    // Get risk level distribution for the filtered results
    const riskCounts = await prisma.review.groupBy({
      by: ['riskLevel'],
      where,
      _count: true
    })

    const distribution = {
      HIGH_RISK: 0,
      MEDIUM_RISK: 0,
      LOW_RISK: 0
    }

    riskCounts.forEach(item => {
      distribution[item.riskLevel] = item._count
    })

    return NextResponse.json({
      success: true,
      count: reviews.length,
      reviews,
      distribution
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch reviews',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
