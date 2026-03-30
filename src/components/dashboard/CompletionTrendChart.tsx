'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'

type TrendItem = {
  date: string
  count: number
}

type Props = {
  data: TrendItem[]
}

export const CompletionTrendChart = ({ data }: Props) => {
  const chartData = data.map((item) => ({
    ...item,
    label: format(parseISO(item.date), 'M/d'),
  }))

  return (
    <div className="rounded-lg border border-foreground/10 bg-background p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">直近7日間の完了タスク推移</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 0.15)" />
            <XAxis
              dataKey="label"
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
              labelFormatter={(label) => String(label)}
            />
            <Line
              type="monotone"
              dataKey="count"
              name="完了タスク数"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ fill: '#34d399', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
