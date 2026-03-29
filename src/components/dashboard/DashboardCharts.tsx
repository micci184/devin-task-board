'use client'

import { StatusBarChart } from './StatusBarChart'
import { PriorityPieChart } from './PriorityPieChart'
import { CompletionTrendChart } from './CompletionTrendChart'

type StatusChartItem = {
  status: string
  count: number
}

type PriorityChartItem = {
  priority: string
  count: number
}

type TrendItem = {
  date: string
  count: number
}

type Props = {
  statusChart: StatusChartItem[]
  priorityChart: PriorityChartItem[]
  completionTrend: TrendItem[]
}

export const DashboardCharts = ({
  statusChart,
  priorityChart,
  completionTrend,
}: Props) => (
  <>
    <div className="grid gap-6 lg:grid-cols-2">
      <StatusBarChart data={statusChart} />
      <PriorityPieChart data={priorityChart} />
    </div>
    <CompletionTrendChart data={completionTrend} />
  </>
)
