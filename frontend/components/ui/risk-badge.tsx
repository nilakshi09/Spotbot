import React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'

interface RiskBadgeProps {
  riskLevel: 'low' | 'medium' | 'high'
  size?: 'sm' | 'md' | 'lg'
}

export function RiskBadge({ riskLevel, size = 'md' }: RiskBadgeProps) {
  const config = {
    high: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
    medium: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
    low: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
  }

  const { icon: Icon, color, bg, border } = config[riskLevel] || config.low
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  }

  return (
    <div className={`inline-flex items-center rounded-full border ${bg} ${border} ${color} ${sizeClasses[size]}`}>
      <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
      <span className="font-medium capitalize">{riskLevel}</span>
    </div>
  )
}
