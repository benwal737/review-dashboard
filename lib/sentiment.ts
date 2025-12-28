import Sentiment from 'sentiment'

const analyzer = new Sentiment()

export function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const result = analyzer.analyze(text)

  if (result.score > 0) {
    return 'positive'
  } else if (result.score < 0) {
    return 'negative'
  } else {
    return 'neutral'
  }
}
