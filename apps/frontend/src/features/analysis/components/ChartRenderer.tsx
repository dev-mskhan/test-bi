import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ChartConfig } from "../../../types";
import { getColorForScheme, getColorsList } from "../../../utils/chartHelpers";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { formatCurrency, formatNumber } from "../../../utils/formatters";

interface ChartRendererProps {
  config: ChartConfig;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ config }) => {
  const {
    type,
    title,
    labels = [],
    values = [],
    series = [],
    kpi_value,
    kpi_trend,
    kpi_change,
    color_scheme = "blue",
  } = config;

  const x_axis_label = (config as any).x_axis_label as string | undefined;
  const y_axis_label = (config as any).y_axis_label as string | undefined;
  const x_values = (config as any).x_values as number[] | undefined;
  const y_values = (config as any).y_values as number[] | undefined;

  const primaryColor = getColorForScheme(color_scheme, 0);
  const colors = getColorsList(color_scheme);

  const formatValue = (val: any) => {
    if (typeof val === "number") {
      return val > 1000 ? formatCurrency(val) : formatNumber(val);
    }
    return val;
  };

  // 1. KPI CARD
  if (type === "kpi_card") {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6 flex flex-col justify-between shadow-sm">
        <div>
          <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider">{title}</span>
          <h3 className="text-3xl font-bold text-[#ededed] mt-2 font-mono">{kpi_value || "N/A"}</h3>
        </div>
        {kpi_change && (
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            {kpi_trend === "up" && (
              <span className="flex items-center gap-0.5 text-[#22c55e] font-semibold bg-[#22c55e]/10 px-1.5 py-0.5 rounded">
                <ArrowUp className="w-3.5 h-3.5" />
                {kpi_change}
              </span>
            )}
            {kpi_trend === "down" && (
              <span className="flex items-center gap-0.5 text-[#ef4444] font-semibold bg-[#ef4444]/10 px-1.5 py-0.5 rounded">
                <ArrowDown className="w-3.5 h-3.5" />
                {kpi_change}
              </span>
            )}
            {kpi_trend === "flat" && (
              <span className="flex items-center gap-0.5 text-[#888888] font-semibold bg-[#2a2a2a] px-1.5 py-0.5 rounded">
                <Minus className="w-3.5 h-3.5" />
                {kpi_change}
              </span>
            )}
            {!kpi_trend && <span className="text-[#888888]">{kpi_change}</span>}
          </div>
        )}
      </div>
    );
  }

  // 2. TABLE
  if (type === "table") {
    const tableData = labels.map((label, idx) => ({
      label,
      value: values[idx] ?? null,
    }));

    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-5 shadow-sm overflow-hidden">
        <h4 className="text-sm font-medium text-[#888888] uppercase tracking-wider mb-4">{title}</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#ededed]">
            <thead>
              <tr className="border-b border-[#2a2a2a] text-xs uppercase tracking-wider text-[#888888]">
                <th className="pb-3 font-semibold">Dimension</th>
                <th className="pb-3 text-right font-semibold">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]/40">
              {tableData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#2a2a2a]/20 transition-colors">
                  <td className="py-2.5 font-medium">{row.label}</td>
                  <td className="py-2.5 text-right font-mono font-semibold">
                    {row.value !== null ? formatValue(row.value) : "N/A"}
                  </td>
                </tr>
              ))}
              {tableData.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-[#888888] text-xs">
                    No data rows found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Prepare standard chart data from labels/values/series
  const hasSeries = series && series.length > 0;
  const chartData = (() => {
    if (hasSeries) {
      const maxLen = Math.max(...series.map((s) => s.data?.length ?? 0));
      const keys = labels.length > 0 ? labels : Array.from({ length: maxLen }, (_, i) => `${i + 1}`);
      return keys.map((label, idx) => {
        const item: Record<string, any> = { name: label };
        series.forEach((s) => { item[s.name] = s.data?.[idx] ?? 0; });
        return item;
      });
    }
    return labels.map((label, idx) => ({ name: label, value: values[idx] ?? 0 }));
  })();

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-3 rounded-lg shadow-lg text-xs">
          <p className="font-semibold text-[#ededed] mb-1.5">{label}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} className="text-[#888888] flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: pld.color || pld.fill || primaryColor }}
              />
              {pld.name || "Value"}:{" "}
              <span className="font-mono font-semibold text-[#ededed]">{formatValue(pld.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    // 3. BAR CHART
    if (type === "bar" || type === "heatmap") {
      return (
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            label={
              x_axis_label
                ? { value: x_axis_label, position: "insideBottom", offset: -15, fill: "#888888", fontSize: 11 }
                : undefined
            }
          />
          <YAxis
            stroke="#888888"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
            label={
              y_axis_label
                ? { value: y_axis_label, angle: -90, position: "insideLeft", fill: "#888888", fontSize: 11 }
                : undefined
            }
          />
          <Tooltip content={customTooltip} cursor={{ fill: "#2a2a2a", opacity: 0.15 }} />
          {hasSeries ? (
            <>
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              {series.map((s, idx) => (
                <Bar
                  key={s.name}
                  dataKey={s.name}
                  fill={getColorForScheme(color_scheme, idx)}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </>
          ) : (
            <Bar dataKey="value" fill={primaryColor} radius={[4, 4, 0, 0]}>
              {color_scheme === "multi" &&
                chartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorForScheme("multi", index)} />
                ))}
            </Bar>
          )}
        </BarChart>
      );
    }

    // 4. LINE CHART
    if (type === "line") {
      return (
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            label={
              x_axis_label
                ? { value: x_axis_label, position: "insideBottom", offset: -15, fill: "#888888", fontSize: 11 }
                : undefined
            }
          />
          <YAxis
            stroke="#888888"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
            label={
              y_axis_label
                ? { value: y_axis_label, angle: -90, position: "insideLeft", fill: "#888888", fontSize: 11 }
                : undefined
            }
          />
          <Tooltip content={customTooltip} />
          {hasSeries ? (
            <>
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              {series.map((s, idx) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={getColorForScheme(color_scheme, idx)}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </>
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              stroke={primaryColor}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}
        </LineChart>
      );
    }

    // 5. AREA CHART
    if (type === "area") {
      return (
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={primaryColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            label={
              x_axis_label
                ? { value: x_axis_label, position: "insideBottom", offset: -15, fill: "#888888", fontSize: 11 }
                : undefined
            }
          />
          <YAxis
            stroke="#888888"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
            label={
              y_axis_label
                ? { value: y_axis_label, angle: -90, position: "insideLeft", fill: "#888888", fontSize: 11 }
                : undefined
            }
          />
          <Tooltip content={customTooltip} />
          {hasSeries ? (
            <>
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              {series.map((s, idx) => (
                <Area
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={getColorForScheme(color_scheme, idx)}
                  fillOpacity={0.1}
                  fill={getColorForScheme(color_scheme, idx)}
                />
              ))}
            </>
          ) : (
            <Area
              type="monotone"
              dataKey="value"
              stroke={primaryColor}
              strokeWidth={2}
              fill="url(#areaGrad)"
            />
          )}
        </AreaChart>
      );
    }

    // 6. PIE CHART
    if (type === "pie") {
      const dataForPie = hasSeries
        ? []
        : chartData.map((item) => ({ name: item.name, value: item.value }));

      return (
        <PieChart margin={{ top: 10, bottom: 20 }}>
          <Pie
            data={dataForPie}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {dataForPie.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={getColorForScheme("multi", index)} />
            ))}
          </Pie>
          <Tooltip content={customTooltip} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      );
    }

    // 7. SCATTER CHART
    if (type === "scatter") {
      const scatterData =
        x_values && y_values
          ? x_values.map((x, idx) => ({ x, y: y_values[idx] ?? 0 }))
          : chartData.map((d) => ({ x: d.name, y: d.value }));

      return (
        <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            type="number"
            dataKey="x"
            name={x_axis_label || "X"}
            stroke="#888888"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            label={
              x_axis_label
                ? { value: x_axis_label, position: "insideBottom", offset: -15, fill: "#888888", fontSize: 11 }
                : undefined
            }
          />
          <YAxis
            type="number"
            dataKey="y"
            name={y_axis_label || "Y"}
            stroke="#888888"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
            label={
              y_axis_label
                ? { value: y_axis_label, angle: -90, position: "insideLeft", fill: "#888888", fontSize: 11 }
                : undefined
            }
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (active && payload?.length) {
                return (
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-3 rounded-lg shadow-lg text-xs">
                    <p className="text-[#888888]">
                      {x_axis_label || "X"}:{" "}
                      <span className="font-mono font-semibold text-[#ededed]">
                        {payload[0]?.value}
                      </span>
                    </p>
                    <p className="text-[#888888]">
                      {y_axis_label || "Y"}:{" "}
                      <span className="font-mono font-semibold text-[#ededed]">
                        {payload[1]?.value}
                      </span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter name={title} data={scatterData} fill={primaryColor} />
        </ScatterChart>
      );
    }

    return null;
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-5 shadow-sm">
      <h4 className="text-sm font-semibold text-[#888888] uppercase tracking-wider mb-4">{title}</h4>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart() ?? <div className="text-[#888888] text-xs">Unsupported chart type</div>}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartRenderer;