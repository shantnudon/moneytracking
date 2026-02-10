import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export function ChartContainer({
  title,
  action,
  height = 300,
  children,
  className = "",
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title && (
            <h3 className="font-black uppercase tracking-widest text-sm">
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      <div
        className="w-full border-l border-b border-black/5 pt-4"
        style={{ height: `${height}px` }}
      >
        {children}
      </div>
    </div>
  );
}

export function BarChartCard({
  data,
  dataKeys = [],
  xAxisKey = "name",
  title,
  action,
  height = 300,
}) {
  const defaultTooltipStyle = {
    backgroundColor: "var(--background)",
    border: "1px solid var(--foreground)",
    borderRadius: "0px",
    color: "var(--foreground)",
    fontSize: "10px",
    fontWeight: "900",
    textTransform: "uppercase",
  };

  return (
    <ChartContainer title={title} action={action} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey={xAxisKey}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 10, fontWeight: 700 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 10, fontWeight: 700 }}
          />
          <Tooltip
            cursor={{ fill: "var(--foreground)", opacity: 0.1 }}
            contentStyle={defaultTooltipStyle}
          />
          {dataKeys.map((key, index) => (
            <Bar
              key={index}
              dataKey={key.dataKey}
              name={key.name}
              fill={key.fill || "var(--foreground)"}
              opacity={key.opacity || 1}
              barSize={key.barSize || 30}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export function LineChartCard({
  data,
  dataKeys = [],
  xAxisKey = "date",
  title,
  action,
  height = 300,
}) {
  const defaultTooltipStyle = {
    backgroundColor: "var(--background)",
    border: "1px solid var(--foreground)",
    borderRadius: "0px",
    color: "var(--foreground)",
    fontSize: "10px",
    fontWeight: "900",
    textTransform: "uppercase",
  };

  return (
    <ChartContainer title={title} action={action} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey={xAxisKey}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 10, fontWeight: 700 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 10, fontWeight: 700 }}
          />
          <Tooltip
            cursor={{ stroke: "var(--foreground)", strokeWidth: 1 }}
            contentStyle={defaultTooltipStyle}
          />
          {dataKeys.map((key) => (
            <Line
              key={key.dataKey}
              type="monotone"
              dataKey={key.dataKey}
              name={key.name}
              stroke={key.stroke || "var(--foreground)"}
              strokeWidth={key.strokeWidth || 2}
              dot={key.dot !== undefined ? key.dot : true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
