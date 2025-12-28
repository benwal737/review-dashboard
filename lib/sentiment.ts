import Sentiment from 'sentiment'

// Lightweight sentiment analyzer using keyword-based scoring
// This is deterministic and fast, suitable for demo purposes
const analyzer = new Sentiment()

export type SentimentLabel = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'

export interface SentimentResult {
  label: SentimentLabel
  score: number
}

/**
 * Analyzes the sentiment of a text using keyword-based scoring
 * Returns both a numeric score and a categorical label
 *
 * @param text - The text to analyze
 * @returns Object with sentiment label and numeric score
 */
export function analyzeSentiment(text: string): SentimentResult {
  const result = analyzer.analyze(text)

  // Determine label based on score thresholds
  let label: SentimentLabel
  if (result.score > 0) {
    label = 'POSITIVE'
  } else if (result.score < 0) {
    label = 'NEGATIVE'
  } else {
    label = 'NEUTRAL'
  }

  return {
    label,
    score: result.score
  }
}
