'use client';

import { useEffect, useState } from 'react';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

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
  embauches: {
    label: 'Embauches',
    color: 'var(--primary)'
  },
  departs: {
    label: 'Départs',
    color: 'hsl(var(--destructive))'
  }
} satisfies ChartConfig;

interface AreaGraphProps {
  data?: Array<{ month: string; embauches: number; departs: number }>;
}

export function AreaGraph({ data }: AreaGraphProps) {
  const [chartData, setChartData] = useState<
    Array<{ month: string; embauches: number; departs: number }>
  >(data || []);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (!data) {
      // Since we don't have an API endpoint, we'll use empty data
      // The parent component should pass data as a prop
      setChartData([]);
      setLoading(false);
    }
  }, [data]);

  const totalHired = chartData.reduce((sum, item) => sum + item.embauches, 0);
  const totalLeft = chartData.reduce((sum, item) => sum + item.departs, 0);
  const netGrowth = totalHired - totalLeft;
  const growthPercentage =
    totalLeft > 0 ? ((netGrowth / totalLeft) * 100).toFixed(1) : '0';
  const isPositive = netGrowth >= 0;

  if (loading) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardTitle>Tendances d&apos;embauche</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='bg-muted h-[250px] w-full animate-pulse rounded' />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0 || (totalHired === 0 && totalLeft === 0)) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardTitle>Tendances d&apos;embauche</CardTitle>
          <CardDescription>
            Évolution des embauches et départs sur 6 mois
          </CardDescription>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='text-muted-foreground flex h-[250px] w-full items-center justify-center'>
            Aucune embauche enregistrée
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Tendances d&apos;embauche</CardTitle>
        <CardDescription>
          Évolution des embauches et départs sur 6 mois
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillEmbauches' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-embauches)'
                  stopOpacity={1.0}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-embauches)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillDeparts' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-departs)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-departs)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            <Area
              dataKey='departs'
              type='natural'
              fill='url(#fillDeparts)'
              stroke='var(--color-departs)'
              stackId='a'
            />
            <Area
              dataKey='embauches'
              type='natural'
              fill='url(#fillEmbauches)'
              stroke='var(--color-embauches)'
              stackId='a'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              {isPositive ? 'Croissance' : 'Déclin'} de{' '}
              {Math.abs(Number(growthPercentage))}%{' '}
              {isPositive ? (
                <IconTrendingUp className='h-4 w-4' />
              ) : (
                <IconTrendingDown className='h-4 w-4' />
              )}
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              {totalHired} embauches • {totalLeft} départs •{' '}
              {netGrowth >= 0 ? '+' : ''}
              {netGrowth} net
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
