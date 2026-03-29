'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type PriorityChartItem = {
  priority: string
  count: number
}

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: '緊急',
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
  NONE: 'なし',
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
  NONE: '#94a3b8',
}

type Props = {
  data: PriorityChartItem[]
}

export const PriorityPieChart = ({ data }: Props) => {
  const chartData = data
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: PRIORITY_LABELS[item.priority] ?? item.priority,
      value: item.count,
      color: PRIORITY_COLORS[item.priority] ?? '#94a3b8',
    }))

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-foreground/10 bg-background p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">優先度別タスク数</h3>
        <div className="flex h-64 items-center justify-center text-sm text-foreground/40">
          データがありません
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-foreground/10 bg-background p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">優先度別タスク数</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              nameKey="name"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid oklch(0.5 0 0 / 0.15)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              formatter={(value: string) => (
                <span className="text-xs text-foreground/60">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
