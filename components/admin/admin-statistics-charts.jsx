"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const palette = ["#0f766e", "#f59e0b", "#2563eb", "#db2777", "#7c3aed", "#64748b"];
const mutedColor = "#94a3b8";

export function AdminStatisticsCharts({ statistics }) {
  const { trends, distributions, topProducts } = statistics;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <ChartCard title="Revenue Trend" description="30 hari terakhir">
          <ApexChart
            type="line"
            height={320}
            options={lineOptions(trends.categories, ["Revenue", "Paid orders"])}
            series={[
              { name: "Revenue", data: trends.revenue },
              { name: "Paid orders", data: trends.paidOrders },
            ]}
          />
        </ChartCard>

        <ChartCard title="Order Status" description="Distribusi order platform">
          <ApexChart
            type="donut"
            height={320}
            options={donutOptions(distributions.orderStatus)}
            series={donutSeries(distributions.orderStatus)}
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Platform Growth" description="User dan produk baru">
          <ApexChart
            type="area"
            height={300}
            options={areaOptions(trends.categories)}
            series={[
              { name: "New users", data: trends.newUsers },
              { name: "New products", data: trends.newProducts },
            ]}
          />
        </ChartCard>

        <ChartCard title="Top Product Revenue" description="Produk dengan revenue tertinggi">
          <ApexChart
            type="bar"
            height={300}
            options={barOptions(topProducts.map((product) => truncateLabel(product.title)))}
            series={[
              {
                name: "Revenue",
                data: topProducts.map((product) => product.revenue),
              },
            ]}
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Payment Status" description="Transaksi payment gateway">
          <ApexChart
            type="donut"
            height={260}
            options={donutOptions(distributions.paymentStatus)}
            series={donutSeries(distributions.paymentStatus)}
          />
        </ChartCard>
        <ChartCard title="Product Type" description="Komposisi produk">
          <ApexChart
            type="donut"
            height={260}
            options={donutOptions(distributions.productType)}
            series={donutSeries(distributions.productType)}
          />
        </ChartCard>
        <ChartCard title="Analytics Events" description="Aktivitas tracking">
          <ApexChart
            type="bar"
            height={260}
            options={barOptions(distributions.analytics.map((item) => item.label))}
            series={[
              {
                name: "Events",
                data: distributions.analytics.map((item) => item.value),
              },
            ]}
          />
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, description, children }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{description}</CardDescription>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function lineOptions(categories, names) {
  return {
    ...baseOptions(),
    colors: palette,
    stroke: { curve: "smooth", width: [3, 3] },
    xaxis: { categories },
    yaxis: [
      {
        title: { text: names[0] },
        labels: { formatter: (value) => formatCompact(value) },
      },
      {
        opposite: true,
        title: { text: names[1] },
        labels: { formatter: (value) => Math.round(value) },
      },
    ],
  };
}

function areaOptions(categories) {
  return {
    ...baseOptions(),
    colors: ["#2563eb", "#0f766e"],
    stroke: { curve: "smooth", width: 3 },
    fill: { opacity: 0.14 },
    xaxis: { categories },
  };
}

function barOptions(categories) {
  return {
    ...baseOptions(),
    colors: ["#0f766e"],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
      },
    },
    xaxis: {
      categories: categories.length > 0 ? categories : ["No data"],
      labels: { formatter: (value) => formatCompact(value) },
    },
  };
}

function donutOptions(items) {
  const hasData = items.some((item) => item.value > 0);

  return {
    ...baseOptions(),
    colors: hasData ? palette : [mutedColor],
    labels: hasData ? items.map((item) => item.label) : ["No data"],
    legend: {
      position: "bottom",
      fontSize: "12px",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              formatter: (chart) => chart.globals.seriesTotals.reduce((total, value) => total + value, 0),
            },
          },
        },
      },
    },
  };
}

function donutSeries(items) {
  const values = items.map((item) => item.value);
  return values.some((value) => value > 0) ? values : [1];
}

function baseOptions() {
  return {
    chart: {
      fontFamily: "inherit",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    grid: { borderColor: "#e2e8f0", strokeDashArray: 4 },
    tooltip: {
      theme: "light",
      y: { formatter: (value) => formatCompact(value) },
    },
  };
}

function formatCompact(value) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
    notation: Math.abs(value) >= 1000000 ? "compact" : "standard",
  }).format(value);
}

function truncateLabel(value) {
  return value.length > 28 ? `${value.slice(0, 25)}...` : value;
}
