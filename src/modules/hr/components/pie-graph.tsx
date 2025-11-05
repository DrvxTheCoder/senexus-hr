'use client';

import * as React from 'react';
import { IconUsers } from '@tabler/icons-react';
import { Label, Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

const chartConfig = {
  employees: {
    label: 'Employés'
  },
  active: {
    label: 'Actifs',
    color: 'var(--primary)'
  },
  onLeave: {
    label: 'En congé',
    color: 'var(--primary)'
  },
  inactive: {
    label: 'Inactifs',
    color: 'var(--primary)'
  },
  terminated: {
    label: 'Terminés',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

interface PieGraphProps {
  data?: Array<{ status: string; count: number; fill: string }>;
}

export function PieGraph({ data }: PieGraphProps) {
  const [chartData, setChartData] = React.useState<
    Array<{ status: string; count: number; fill: string }>
  >(data || []);
  const [loading, setLoading] = React.useState(!data);

  React.useEffect(() => {
    if (data) {
      setChartData(data);
      setLoading(false);
    } else {
      setChartData([]);
      setLoading(false);
    }
  }, [data]);

  const totalEmployees = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  const largestClient =
    chartData.length > 0
      ? chartData.reduce(
          (max, item) => (item.count > max.count ? item : max),
          chartData[0]
        )
      : null;
  const largestClientPercentage =
    totalEmployees > 0 && largestClient
      ? ((largestClient.count / totalEmployees) * 100).toFixed(1)
      : '0';

  if (loading) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardTitle>Distribution des employés</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='bg-muted h-[250px] w-full animate-pulse rounded' />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0 || totalEmployees === 0) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardTitle>Distribution des employés</CardTitle>
          <CardDescription>Répartition des employés par client</CardDescription>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='text-muted-foreground flex h-[250px] w-full items-center justify-center'>
            Aucun employé enregistré
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Distribution des employés</CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>
            Répartition des employés par client
          </span>
          <span className='@[540px]/card:hidden'>Par client</span>
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square h-[250px]'
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey='count'
              nameKey='status'
              innerRadius={60}
              strokeWidth={2}
              stroke='var(--background)'
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-3xl font-bold'
                        >
                          {totalEmployees.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground text-sm'
                        >
                          Total
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='flex items-center gap-2 leading-none font-medium'>
          {largestClient && (
            <>
              {largestClient.status}: {largestClientPercentage}% (
              {largestClient.count}) <IconUsers className='h-4 w-4' />
            </>
          )}
        </div>
        <div className='text-muted-foreground leading-none'>
          Données en temps réel
        </div>
      </CardFooter>
    </Card>
  );
}
