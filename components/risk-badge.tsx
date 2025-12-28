import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type RiskLevel = 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK'

interface RiskBadgeProps {
  riskLevel: RiskLevel
  className?: string
}

export function RiskBadge({ riskLevel, className }: RiskBadgeProps) {
  const config = {
    HIGH_RISK: {
      color: "bg-red-100 text-red-800 border-red-300",
      label: "High Risk"
    },
    MEDIUM_RISK: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      label: "Medium Risk"
    },
    LOW_RISK: {
      color: "bg-green-100 text-green-800 border-green-300",
      label: "Low Risk"
    }
  }

  const { color, label } = config[riskLevel]

  return (
    <Badge
      variant="outline"
      className={cn(color, className)}
    >
      {label}
    </Badge>
  )
}
