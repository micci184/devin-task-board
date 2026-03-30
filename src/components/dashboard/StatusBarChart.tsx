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
import { useTranslations } from 'next-intl'

type StatusChartItem = {
  status: string
  count: number
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
  const t = useTranslations('dashboardStatus')
  const tDashboard = useTranslations('dashboard')
  const chartData = data.map((item) => ({
    name: t(item.status as 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'),
    count: item.count,
    fill: STATUS_COLORS[item.status] ?? '#94a3b8',
  }))

  return (
    <div className="rounded-lg border border-foreground/10 bg-background p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{tDashboard('statusChart')}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 0.15)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: 'var(--foreground)' }}
              stroke="var(--foreground)"
              opacity={0.4}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: 'var(--foreground)' }}
              stroke="var(--foreground)"
              opacity={0.4}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--foreground)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--foreground)',
              }}
            />
            <Bar dataKey="count" name={tDashboard('taskCount')} radius={[4, 4, 0, 0]}>
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
