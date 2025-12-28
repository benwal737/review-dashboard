import { prisma } from '@/lib/db'
import { DashboardTable } from '@/components/dashboard-table'

async function getReviews() {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: {
        date: 'desc',
      },
    })
    return reviews
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
}

export default async function DashboardPage() {
  const reviews = await getReviews()

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Customer Feedback Dashboard</h1>
        <p className="text-muted-foreground">
          View and analyze Yelp reviews with sentiment analysis
        </p>
      </div>

      <DashboardTable reviews={reviews} />

      {/* Instructions for fetching reviews */}
      {reviews.length === 0 && (
        <div className="mt-8 p-6 border rounded-lg bg-muted/50">
          <h2 className="text-lg font-semibold mb-2">No reviews found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            To fetch reviews from Yelp, make a GET request to:
          </p>
          <code className="block p-3 bg-background rounded text-sm">
            GET /api/yelp-reviews?businessId=YOUR_BUSINESS_ID
          </code>
          <p className="text-sm text-muted-foreground mt-4">
            Replace YOUR_BUSINESS_ID with a valid Yelp business ID (e.g., "gary-danko-san-francisco")
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Make sure you have set the YELP_API_KEY in your .env file
          </p>
        </div>
      )}
    </div>
  )
}
