import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeSentiment } from '@/lib/sentiment'

// Yelp API endpoint for reviews
const YELP_API_URL = 'https://api.yelp.com/v3/businesses'

interface YelpReview {
  id: string
  rating: number
  user: {
    name: string
  }
  text: string
  time_created: string
}

interface YelpReviewsResponse {
  reviews: YelpReview[]
  total: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId query parameter is required' },
        { status: 400 }
      )
    }

    // Check for Yelp API key
    const yelpApiKey = process.env.YELP_API_KEY
    if (!yelpApiKey) {
      return NextResponse.json(
        { error: 'YELP_API_KEY environment variable is not set' },
        { status: 500 }
      )
    }

    // Fetch reviews from Yelp API
    const response = await fetch(
      `${YELP_API_URL}/${businessId}/reviews`,
      {
        headers: {
          'Authorization': `Bearer ${yelpApiKey}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Yelp API error:', errorText)
      return NextResponse.json(
        { error: `Yelp API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data: YelpReviewsResponse = await response.json()

    // Process and save reviews
    const savedReviews = []

    for (const review of data.reviews) {
      // Analyze sentiment
      const sentiment = analyzeSentiment(review.text)

      // Save to database
      const savedReview = await prisma.review.create({
        data: {
          business: businessId,
          author: review.user.name,
          rating: review.rating,
          text: review.text,
          date: new Date(review.time_created),
          sentiment: sentiment,
        },
      })

      savedReviews.push(savedReview)
    }

    return NextResponse.json({
      success: true,
      count: savedReviews.length,
      reviews: savedReviews,
    })
  } catch (error) {
    console.error('Error fetching Yelp reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
