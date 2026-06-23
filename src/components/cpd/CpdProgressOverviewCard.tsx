import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export const PROGRESS_COLORS = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
} as const;

export type ProgressIndicator = keyof typeof PROGRESS_COLORS;

export type ProgressBarItem = {
  label: string;
  value: number;
  indicator: ProgressIndicator;
};

export type ProgressOverviewMock = {
  headline: string;
  subheadline: string;
  percent: number;
  badge: string;
  bars: ProgressBarItem[];
  monthly: Array<{ month: string; hours: number; indicator: ProgressIndicator }>;
};

export const STAFF_PROGRESS_MOCK: ProgressOverviewMock = {
  headline: "18h",
  subheadline: "of 40h annual target",
  percent: 45,
  badge: "45% complete",
  bars: [
    { label: "Approved", value: 12, indicator: "green" },
    { label: "Pending", value: 6, indicator: "yellow" },
    { label: "Behind", value: 22, indicator: "red" },
  ],
  monthly: [
    { month: "Jan", hours: 5, indicator: "green" },
    { month: "Feb", hours: 4, indicator: "yellow" },
    { month: "Mar", hours: 3, indicator: "red" },
    { month: "Apr", hours: 6, indicator: "green" },
  ],
};

export const ADMIN_PROGRESS_MOCK: ProgressOverviewMock = {
  headline: "70%",
  subheadline: "approval rate this month",
  percent: 70,
  badge: "14/20 processed",
  bars: [
    { label: "Approved", value: 14, indicator: "green" },
    { label: "Pending", value: 7, indicator: "yellow" },
    { label: "Rejected", value: 2, indicator: "red" },
  ],
  monthly: [
    { month: "Jan", hours: 11, indicator: "green" },
    { month: "Feb", hours: 9, indicator: "yellow" },
    { month: "Mar", hours: 13, indicator: "green" },
    { month: "Apr", hours: 14, indicator: "green" },
  ],
};

export const HOD_PROGRESS_MOCK: ProgressOverviewMock = {
  headline: "61%",
  subheadline: "department clearance rate",
  percent: 61,
  badge: "11 approved · 5 in queue",
  bars: [
    { label: "Approved", value: 11, indicator: "green" },
    { label: "In queue", value: 5, indicator: "yellow" },
    { label: "Returned", value: 2, indicator: "red" },
  ],
  monthly: [
    { month: "Jan", hours: 8, indicator: "green" },
    { month: "Feb", hours: 7, indicator: "yellow" },
    { month: "Mar", hours: 10, indicator: "green" },
    { month: "Apr", hours: 11, indicator: "green" },
  ],
};

const chartConfig = {
  value: { label: "Count" },
  hours: { label: "Hours" },
};

function IndicatorDot({ indicator }: { indicator: ProgressIndicator }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: PROGRESS_COLORS[indicator] }}
      aria-hidden
    />
  );
}

type CpdProgressOverviewCardProps = {
  title?: string;
  description: string;
  data: ProgressOverviewMock;
  monthlyLabel?: string;
};

export function CpdProgressOverviewCard({
  title = "Progress overview",
  description,
  data,
  monthlyLabel = "Monthly hours",
}: CpdProgressOverviewCardProps) {
  const statusChartData = data.bars.map((bar) => ({
    name: bar.label,
    value: bar.value,
    fill: PROGRESS_COLORS[bar.indicator],
  }));

  const monthlyChartData = data.monthly.map((item) => ({
    month: item.month,
    hours: item.hours,
    fill: PROGRESS_COLORS[item.indicator],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Overall</p>
            <p className="font-display text-3xl font-bold">
              {data.headline}{" "}
              <span className="text-base font-normal text-muted-foreground">{data.subheadline}</span>
            </p>
          </div>
          <Badge variant="secondary" className="h-6">
            {data.badge}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-4">
          {data.bars.map((bar) => (
            <div key={bar.label} className="flex items-center gap-2 text-sm">
              <IndicatorDot indicator={bar.indicator} />
              <span className="text-muted-foreground">{bar.label}</span>
              <span className="font-semibold tabular-nums">{bar.value}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status breakdown</p>
            <ChartContainer config={chartConfig} className="aspect-[5/3] w-full min-h-[180px]">
              <BarChart data={statusChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {statusChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>

          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{monthlyLabel}</p>
            <ChartContainer config={chartConfig} className="aspect-[5/3] w-full min-h-[180px]">
              <BarChart data={monthlyChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {monthlyChartData.map((entry) => (
                    <Cell key={entry.month} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Legend</span>
          {(["green", "yellow", "red"] as const).map((indicator) => (
            <span key={indicator} className="flex items-center gap-1.5 capitalize">
              <IndicatorDot indicator={indicator} />
              {indicator === "green" ? "On track" : indicator === "yellow" ? "In progress" : "At risk"}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function progressIndicatorClass(indicator: ProgressIndicator) {
  return cn(
    indicator === "green" && "text-green-600 dark:text-green-400",
    indicator === "yellow" && "text-yellow-600 dark:text-yellow-400",
    indicator === "red" && "text-red-600 dark:text-red-400",
  );
}
