# Customer Feedback Aggregator MVP

A Next.js application for monitoring business reputation based on star ratings using the Yelp Open Dataset.

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Prisma** (PostgreSQL ORM)
- **ShadCN UI** (Component library)
- **Tailwind CSS**
- **Yelp Open Dataset** (local data)

## Features

- Import and analyze Yelp Open Dataset
- Store businesses and reviews in PostgreSQL database
- Automatic risk level classification based on star ratings (HIGH/MEDIUM/LOW)
- Reputation status tracking (HEALTHY/WATCH/AT_RISK)
- Low-rating spike detection
- Interactive dashboard with business selection
- Filtering by risk level and star rating
- "Needs Attention" mode for recent high-risk reviews
- Color-coded risk and reputation badges
- Clean, functional UI with ShadCN components
- Demo-first, read-only dashboard

## Why We Use the Yelp Open Dataset

This MVP is designed as a **product demo** using the Yelp Open Dataset instead of live APIs:

**Advantages:**
- No API rate limits or quotas
- No API key required
- Predictable, reproducible data
- Faster development and testing
- Works offline
- Real business data for authentic demos

**Dataset Source:**
The Yelp Open Dataset is available at https://www.yelp.com/dataset and contains millions of real businesses and reviews for academic and research purposes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Yelp Open Dataset (should be in `Yelp JSON/yelp_dataset/` directory)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/feedback_aggregator?schema=public"
```

### 3. Set Up Database

Generate Prisma client:

```bash
npm run db:generate
```

Push the schema to your database:

```bash
npm run db:push
```

### 4. Import Yelp Dataset

Import businesses and reviews from the Yelp Open Dataset:

```bash
npm run import:yelp
```

This will:
- Import top 100 businesses (by review count)
- Import up to 50 reviews per business
- Compute risk level for each review based on star ratings
- Display progress as it runs

**Note:** The import script is designed for demo purposes and limits the data to keep the database manageable.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to view the dashboard.

## Usage

### Viewing the Dashboard

Navigate to `/dashboard` to view the interactive dashboard:

1. **Select a Business** - Choose from the dropdown of imported businesses
2. **View Business Info** - See business name, location, star rating, reputation status, and spike warnings
3. **Toggle Needs Attention** - View only recent high-risk reviews (1-2 stars in last 30 days)
4. **Filter Reviews** - Use risk level and rating filters to narrow down results (when not in Needs Attention mode)
5. **Browse Reviews** - Read reviews with their ratings, dates, and computed risk levels

### API Endpoints

The application provides RESTful API routes for accessing data:

**GET /api/businesses**
- Returns all imported businesses with reputation metrics and spike warnings

**GET /api/reviews**
- Query params: `businessId`, `riskLevel`, `rating`, `minRating`, `maxRating`, `limit`, `needsAttention`
- Returns filtered reviews with risk level distribution

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── businesses/
│   │   │   └── route.ts          # API route for listing businesses
│   │   └── reviews/
│   │       └── route.ts          # API route for fetching reviews with filters
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard page (client-side)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   ├── ui/                       # ShadCN UI components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── select.tsx
│   │   └── table.tsx
│   ├── dashboard-table.tsx       # Review table with filters
│   ├── risk-badge.tsx            # Risk level badge component
│   └── reputation-badge.tsx      # Reputation status badge and spike warning
├── lib/
│   ├── db.ts                     # Prisma client with singleton
│   ├── reputation-risk.ts        # Reputation risk calculation logic
│   └── utils.ts                  # Utility functions
├── prisma/
│   └── schema.prisma             # Database schema (Business & Review models)
├── scripts/
│   └── import-yelp.ts            # Dataset ingestion script
├── Yelp JSON/
│   └── yelp_dataset/             # Yelp Open Dataset files
│       ├── yelp_academic_dataset_business.json
│       └── yelp_academic_dataset_review.json
├── .env                          # Environment variables
├── package.json
└── README.md
```

## Database Schema

```prisma
// Risk level classification based on star ratings
// 1-2 stars = HIGH_RISK, 3 stars = MEDIUM_RISK, 4-5 stars = LOW_RISK
enum RiskLevel {
  HIGH_RISK
  MEDIUM_RISK
  LOW_RISK
}

model Business {
  id          String   @id              // Yelp business_id
  name        String
  city        String
  state       String
  categories  String[]                  // Array of categories
  stars       Float
  reviewCount Int
  reviews     Review[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Review {
  id         String    @id              // Yelp review_id
  businessId String
  rating     Int                        // 1-5 star rating
  text       String    @db.Text
  date       DateTime
  riskLevel  RiskLevel                  // Computed from star rating
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  business   Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
}
```

## API Routes

### GET /api/businesses

Returns all businesses with reputation metrics.

**Response:**
```json
{
  "success": true,
  "count": 100,
  "businesses": [
    {
      "id": "business-id",
      "name": "Business Name",
      "city": "City",
      "state": "State",
      "stars": 4.5,
      "reviewCount": 1250,
      "reputationStatus": "HEALTHY",
      "hasLowRatingSpike": false,
      "recentLowRatingCount": 0,
      "_count": { "reviews": 50 }
    }
  ]
}
```

### GET /api/reviews

Returns reviews with optional filters.

**Query Parameters:**
- `businessId`: Filter by business (optional)
- `riskLevel`: Filter by HIGH_RISK, MEDIUM_RISK, or LOW_RISK
- `rating`: Filter by exact rating (1-5)
- `minRating`: Minimum rating filter
- `maxRating`: Maximum rating filter
- `limit`: Max results (default: 50)
- `needsAttention`: If true, returns only HIGH_RISK reviews from last 30 days

**Response:**
```json
{
  "success": true,
  "count": 50,
  "reviews": [...],
  "distribution": {
    "HIGH_RISK": 5,
    "MEDIUM_RISK": 10,
    "LOW_RISK": 35
  }
}
```

## Risk Level Classification

Reviews are automatically classified into risk levels based solely on their star ratings:

- **HIGH_RISK**: 1-2 stars (critical reviews)
- **MEDIUM_RISK**: 3 stars (neutral reviews)
- **LOW_RISK**: 4-5 stars (positive reviews)

**Why rating-based classification?**
- **Objective and defensible**: Based on the customer's explicit rating, not subjective interpretation
- **Deterministic**: Same rating always produces same risk level
- **No ML dependencies**: Simple, fast, and reliable
- **B2B ready**: Easy to explain to stakeholders and clients
- **Universally understood**: Star ratings are intuitive across all industries

Risk levels are calculated during data import and stored in the database.

## Reputation Status

Businesses are assigned a reputation status based on their recent review patterns:

- **HEALTHY**: Strong reputation with few low-rating reviews
- **WATCH**: Moderate concern with some low-rating reviews or slight rating decline
- **AT_RISK**: Significant reputation risk with multiple low-rating reviews or notable rating decline

**Calculation Logic:**
- AT_RISK: ≥3 low-rating reviews (1-2 stars) in last 30 days OR rating drop ≥0.7
- WATCH: 1-2 low-rating reviews in last 30 days OR rating drop ≥0.4
- HEALTHY: All other cases

**Low-Rating Spike Detection:**
Identifies sudden increases in negative feedback by comparing the last 7 days to the previous 7 days. A spike is triggered when:
- Low-rating count doubled AND increased by at least 2 reviews, OR
- Low-rating count increased by 3+ reviews

## Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio

# Import Yelp dataset
npm run import:yelp

# Lint code
npm run lint
```

## Architecture Decisions

### Why Yelp Open Dataset?
- **No API dependencies**: Works offline, no rate limits
- **Reproducible demos**: Same data every time
- **Faster iteration**: No network calls during development
- **Real data**: Authentic reviews for believable demos

### Why rating-based risk classification?
- **Objectivity**: Star ratings are explicit customer judgments, not interpreted text
- **Simplicity**: No NLP complexity or ML maintenance overhead
- **Transparency**: Easy to explain and defend to stakeholders
- **Accuracy**: Customers' ratings already represent their sentiment
- **Consistency**: Deterministic mapping eliminates variability
- **Cost-effective**: No external API calls or ML infrastructure needed

### Why stream-based import?
- **Memory efficient**: Handles large JSON files without loading into memory
- **Progress feedback**: Shows import status in real-time
- **Resilient**: Skips invalid records, continues processing

## Notes

- This is a **demo-focused MVP**, not production-ready
- Data is limited to 100 businesses × 50 reviews for manageable database size
- Dashboard is read-only (no review editing/deletion)
- Client-side filtering for instant response
- Uses App Router with client components for interactivity

## Future Enhancements

- Pagination for large datasets
- Charts and visualizations (rating trends over time, risk distribution)
- Export to CSV/PDF reports
- Multiple platform support (beyond Yelp)
- Email alerts for reputation status changes or spikes
- Custom risk thresholds per business
- Response tracking (monitor business replies to reviews)
- User authentication and multi-tenant support

## License

MIT
# review-dashboard
