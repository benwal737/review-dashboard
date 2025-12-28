import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

export type ReputationStatus = 'HEALTHY' | 'WATCH' | 'AT_RISK'

interface ReputationBadgeProps {
  status: ReputationStatus
  className?: string
}

export function ReputationBadge({ status, className }: ReputationBadgeProps) {
  const config = {
    HEALTHY: {
      color: "bg-green-100 text-green-800 border-green-300",
      label: "Healthy"
    },
    WATCH: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      label: "Watch"
    },
    AT_RISK: {
      color: "bg-red-100 text-red-800 border-red-300",
      label: "At Risk"
    }
  }

  const { color, label } = config[status]

  return (
    <Badge
      variant="outline"
      className={cn(color, "font-semibold", className)}
    >
      {label}
    </Badge>
  )
}

interface SpikeWarningProps {
  className?: string
}

export function SpikeWarning({ className }: SpikeWarningProps) {
  return (
    <div className={cn("flex items-center gap-2 text-orange-600 text-sm font-medium", className)}>
      <AlertTriangle className="h-4 w-4" />
      <span>Low-rating spike detected</span>
    </div>
  )
}
