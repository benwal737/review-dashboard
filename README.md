# Customer Feedback Aggregator MVP

A Next.js application for aggregating and analyzing Yelp reviews with sentiment analysis.

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Prisma** (PostgreSQL ORM)
- **ShadCN UI** (Component library)
- **Tailwind CSS**
- **Yelp Fusion API**
- **Sentiment** NPM library

## Features

- Fetch Yelp reviews via API
- Store reviews in PostgreSQL database
- Automatic sentiment analysis (positive/neutral/negative)
- Interactive dashboard with filtering by sentiment and rating
- Color-coded sentiment badges
- Clean, functional UI with ShadCN components

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Yelp API key (get one at https://www.yelp.com/developers/v3/manage_app)

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
YELP_API_KEY="your_yelp_api_key_here"
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

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Usage

### Fetching Reviews from Yelp

To fetch and store reviews for a business, make a GET request to:

```
GET http://localhost:3000/api/yelp-reviews?businessId=YOUR_BUSINESS_ID
```

Example using curl:

```bash
curl "http://localhost:3000/api/yelp-reviews?businessId=gary-danko-san-francisco"
```

Example using JavaScript:

```javascript
const response = await fetch('/api/yelp-reviews?businessId=gary-danko-san-francisco')
const data = await response.json()
console.log(data)
```

**Finding Business IDs:**
- Search for a business on Yelp
- The business ID is in the URL: `yelp.com/biz/BUSINESS-ID-HERE`
- Example: `gary-danko-san-francisco` from `https://www.yelp.com/biz/gary-danko-san-francisco`

### Viewing the Dashboard

Navigate to `/dashboard` to view all stored reviews. The dashboard includes:

- Table with all review data
- Sentiment filter (All/Positive/Neutral/Negative)
- Rating filter (All/1-5 stars)
- Color-coded sentiment badges
- Review count

## Project Structure

```
├── app/
│   ├── api/
│   │   └── yelp-reviews/
│   │       └── route.ts          # API route for fetching Yelp reviews
│   ├── dashboard/
│   │   └── page.tsx               # Dashboard page
│   ├── layout.tsx                 # Root layout
│   ├── globals.css                # Global styles
│   └── page.tsx                   # Home page (redirects to dashboard)
├── components/
│   ├── ui/                        # ShadCN UI components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── select.tsx
│   │   └── table.tsx
│   ├── dashboard-table.tsx        # Main dashboard table component
│   └── sentiment-flag.tsx         # Sentiment badge component
├── lib/
│   ├── db.ts                      # Prisma client
│   ├── sentiment.ts               # Sentiment analysis logic
│   └── utils.ts                   # Utility functions
├── prisma/
│   └── schema.prisma              # Database schema
├── .env.example                   # Environment variables template
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Database Schema

```prisma
model Review {
  id        Int      @id @default(autoincrement())
  business  String
  author    String
  rating    Int
  text      String
  date      DateTime
  sentiment String   // 'positive' | 'neutral' | 'negative'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## API Routes

### GET /api/yelp-reviews

Fetches reviews from Yelp and stores them in the database with sentiment analysis.

**Query Parameters:**
- `businessId` (required): The Yelp business ID

**Response:**
```json
{
  "success": true,
  "count": 3,
  "reviews": [...]
}
```

**Error Responses:**
- 400: Missing businessId
- 500: Missing YELP_API_KEY or internal error

## Sentiment Analysis

The app uses the `sentiment` NPM library to analyze review text:

- **Positive**: Score > 0
- **Neutral**: Score = 0
- **Negative**: Score < 0

Sentiment is calculated automatically when reviews are fetched and stored.

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

# Lint code
npm run lint
```

## Notes

- This is an MVP focused on functionality over styling
- Reviews are fetched from Yelp's API (limited to 3 reviews per request in the free tier)
- Sentiment analysis is basic and uses the `sentiment` library
- The dashboard uses server-side rendering with Next.js App Router
- Filters are client-side for fast interaction

## Future Enhancements

- Pagination for large datasets
- More advanced sentiment analysis
- Charts and visualizations
- Export to CSV
- Multiple platform support (beyond Yelp)
- Real-time updates
- User authentication

## License

MIT
# review-dashboard
