import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as readline from 'readline'
import * as path from 'path'
import { getRiskLevelFromRating } from '../lib/reputation-risk'

const prisma = new PrismaClient()

// Paths to Yelp dataset files
const YELP_DATA_DIR = path.join(process.cwd(), 'Yelp JSON', 'yelp_dataset')
const BUSINESS_FILE = path.join(YELP_DATA_DIR, 'yelp_academic_dataset_business.json')
const REVIEW_FILE = path.join(YELP_DATA_DIR, 'yelp_academic_dataset_review.json')

// Configuration: limit data for demo purposes
const MAX_BUSINESSES = 100 // Import top 100 businesses
const MAX_REVIEWS_PER_BUSINESS = 50 // Import up to 50 reviews per business

interface YelpBusiness {
  business_id: string
  name: string
  city: string
  state: string
  categories: string | null
  stars: number
  review_count: number
}

interface YelpReview {
  review_id: string
  business_id: string
  stars: number
  text: string
  date: string
}

/**
 * Stream-reads a newline-delimited JSON file
 * This avoids loading the entire file into memory
 */
async function* readJsonLines<T>(filePath: string): AsyncGenerator<T> {
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' })
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  for await (const line of rl) {
    if (line.trim()) {
      try {
        yield JSON.parse(line) as T
      } catch (error) {
        console.error(`Failed to parse line: ${line.substring(0, 100)}...`)
      }
    }
  }
}

/**
 * Import businesses from Yelp dataset
 * Returns a Set of business IDs that were imported
 */
async function importBusinesses(): Promise<Set<string>> {
  console.log('\n📦 Importing businesses...')

  const businessIds = new Set<string>()
  const businesses: YelpBusiness[] = []

  // Read and filter businesses with reviews
  for await (const business of readJsonLines<YelpBusiness>(BUSINESS_FILE)) {
    // Only import businesses that have reviews and valid data
    if (business.review_count > 0 && business.name && business.city && business.state) {
      businesses.push(business)

      if (businesses.length >= MAX_BUSINESSES) {
        break
      }
    }
  }

  // Sort by review count descending to get most reviewed businesses
  businesses.sort((a, b) => b.review_count - a.review_count)

  console.log(`Found ${businesses.length} businesses to import`)

  // Insert businesses in batches
  let imported = 0
  for (const business of businesses) {
    try {
      // Parse categories string into array
      const categories = business.categories
        ? business.categories.split(',').map(c => c.trim())
        : []

      await prisma.business.upsert({
        where: { id: business.business_id },
        update: {},
        create: {
          id: business.business_id,
          name: business.name,
          city: business.city,
          state: business.state,
          categories,
          stars: business.stars,
          reviewCount: business.review_count
        }
      })

      businessIds.add(business.business_id)
      imported++

      if (imported % 10 === 0) {
        console.log(`  ✓ Imported ${imported}/${businesses.length} businesses`)
      }
    } catch (error) {
      console.error(`Failed to import business ${business.business_id}:`, error)
    }
  }

  console.log(`✅ Imported ${imported} businesses`)
  return businessIds
}

/**
 * Import reviews for the given businesses
 * Determines risk level based on star rating
 */
async function importReviews(businessIds: Set<string>): Promise<void> {
  console.log('\n📝 Importing reviews...')

  // Track reviews per business to enforce limit
  const reviewCountByBusiness = new Map<string, number>()
  let totalImported = 0
  let skipped = 0

  for await (const review of readJsonLines<YelpReview>(REVIEW_FILE)) {
    // Only import reviews for businesses we've imported
    if (!businessIds.has(review.business_id)) {
      skipped++
      continue
    }

    // Check if we've hit the limit for this business
    const currentCount = reviewCountByBusiness.get(review.business_id) || 0
    if (currentCount >= MAX_REVIEWS_PER_BUSINESS) {
      skipped++
      continue
    }

    try {
      // Determine risk level from star rating
      const riskLevel = getRiskLevelFromRating(review.stars)

      // Insert review
      await prisma.review.upsert({
        where: { id: review.review_id },
        update: {},
        create: {
          id: review.review_id,
          businessId: review.business_id,
          rating: review.stars,
          text: review.text,
          date: new Date(review.date),
          riskLevel: riskLevel
        }
      })

      reviewCountByBusiness.set(review.business_id, currentCount + 1)
      totalImported++

      if (totalImported % 100 === 0) {
        console.log(`  ✓ Imported ${totalImported} reviews (skipped ${skipped})`)
      }

      // Stop if we've imported enough reviews
      if (totalImported >= MAX_BUSINESSES * MAX_REVIEWS_PER_BUSINESS) {
        break
      }
    } catch (error) {
      console.error(`Failed to import review ${review.review_id}:`, error)
    }
  }

  console.log(`✅ Imported ${totalImported} reviews (skipped ${skipped})`)

  // Print distribution by business
  console.log('\nReview distribution:')
  const businesses = await prisma.business.findMany({
    include: {
      _count: {
        select: { reviews: true }
      }
    },
    orderBy: {
      reviewCount: 'desc'
    },
    take: 5
  })

  for (const business of businesses) {
    console.log(`  ${business.name}: ${business._count.reviews} reviews`)
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting Yelp dataset import...')
  console.log(`📁 Data directory: ${YELP_DATA_DIR}`)

  // Verify files exist
  if (!fs.existsSync(BUSINESS_FILE)) {
    throw new Error(`Business file not found: ${BUSINESS_FILE}`)
  }
  if (!fs.existsSync(REVIEW_FILE)) {
    throw new Error(`Review file not found: ${REVIEW_FILE}`)
  }

  try {
    // Import businesses first
    const businessIds = await importBusinesses()

    // Then import reviews
    await importReviews(businessIds)

    console.log('\n✨ Import completed successfully!')

    // Print summary stats
    const businessCount = await prisma.business.count()
    const reviewCount = await prisma.review.count()
    const highRiskCount = await prisma.review.count({ where: { riskLevel: 'HIGH_RISK' } })
    const mediumRiskCount = await prisma.review.count({ where: { riskLevel: 'MEDIUM_RISK' } })
    const lowRiskCount = await prisma.review.count({ where: { riskLevel: 'LOW_RISK' } })

    console.log('\n📊 Database stats:')
    console.log(`  Businesses: ${businessCount}`)
    console.log(`  Reviews: ${reviewCount}`)
    console.log(`  Risk level distribution:`)
    console.log(`    High Risk (1-2★): ${highRiskCount} (${Math.round(highRiskCount/reviewCount*100)}%)`)
    console.log(`    Medium Risk (3★): ${mediumRiskCount} (${Math.round(mediumRiskCount/reviewCount*100)}%)`)
    console.log(`    Low Risk (4-5★): ${lowRiskCount} (${Math.round(lowRiskCount/reviewCount*100)}%)`)

  } catch (error) {
    console.error('❌ Import failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
