'use client'

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type StatusChartItem = {
  status: string
  count: number
}

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'バックログ',
  TODO: 'TODO',
  IN_PROGRESS: '進行中',
  IN_REVIEW: 'レビュー中',
  DONE: '完了',
}

const STATUS_COLORS: Record<string, string> = {
  BACKLOG: '#94a3b8',
  TODO: '#60a5fa',
  IN_PROGRESS: '#f59e0b',
  IN_REVIEW: '#a78bfa',
  DONE: '#34d399',
}

type Props = {
  data: StatusChartItem[]
}

export const StatusBarChart = ({ data }: Props) => {
  const chartData = data.map((item) => ({
    name: STATUS_LABELS[item.status] ?? item.status,
    count: item.count,
    fill: STATUS_COLORS[item.status] ?? '#94a3b8',
  }))

  return (
    <div className="rounded-lg border border-foreground/10 bg-background p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">ステータス別タスク数</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 0.15)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              stroke="oklch(0.5 0 0 / 0.4)"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              stroke="oklch(0.5 0 0 / 0.4)"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid oklch(0.5 0 0 / 0.15)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="count" name="タスク数" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
