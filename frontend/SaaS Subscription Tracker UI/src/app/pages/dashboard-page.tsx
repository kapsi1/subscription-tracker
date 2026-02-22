import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { DollarSign, Calendar, CreditCard, TrendingUp, Plus, Bell } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Mock data
const monthlyForecast = [
  { month: "Jan", amount: 127 },
  { month: "Feb", amount: 127 },
  { month: "Mar", amount: 142 },
  { month: "Apr", amount: 142 },
  { month: "May", amount: 157 },
  { month: "Jun", amount: 157 },
  { month: "Jul", amount: 157 },
  { month: "Aug", amount: 142 },
  { month: "Sep", amount: 142 },
  { month: "Oct", amount: 157 },
  { month: "Nov", amount: 157 },
  { month: "Dec", amount: 172 },
];

const categoryData = [
  { name: "Entertainment", value: 45, color: "#4F46E5" },
  { name: "Productivity", value: 35, color: "#8b5cf6" },
  { name: "Cloud Services", value: 42, color: "#ec4899" },
  { name: "Development", value: 28, color: "#06b6d4" },
  { name: "Other", value: 22, color: "#10b981" },
];

const upcomingPayments = [
  {
    id: 1,
    service: "Netflix",
    amount: 15.99,
    date: "2026-02-25",
    category: "Entertainment",
    alertEnabled: true,
  },
  {
    id: 2,
    service: "Figma Professional",
    amount: 12.00,
    date: "2026-02-28",
    category: "Productivity",
    alertEnabled: true,
  },
  {
    id: 3,
    service: "AWS",
    amount: 42.50,
    date: "2026-03-01",
    category: "Cloud Services",
    alertEnabled: false,
  },
  {
    id: 4,
    service: "Spotify Premium",
    amount: 10.99,
    date: "2026-03-05",
    category: "Entertainment",
    alertEnabled: true,
  },
  {
    id: 5,
    service: "GitHub Pro",
    amount: 7.00,
    date: "2026-03-10",
    category: "Development",
    alertEnabled: true,
  },
];

export function DashboardPage() {
  const [selectedChart, setSelectedChart] = useState<"pie" | "bar">("pie");

  const totalMonthly = 127.48;
  const totalYearly = totalMonthly * 12;
  const upcomingCount = upcomingPayments.filter(
    (p) => new Date(p.date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ).length;
  const activeSubscriptions = 12;

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your subscription costs
          </p>
        </div>
        <Button className="gap-2 sm:w-auto">
          <Plus className="w-4 h-4" />
          Add Subscription
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Monthly Cost
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(totalMonthly)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+2.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Yearly Cost
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(totalYearly)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Projected annual spend
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Payments
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-pink-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{upcomingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Next 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-cyan-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Forecast */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>12-Month Forecast</CardTitle>
            <CardDescription>Projected monthly spending</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`$${value}`, "Amount"]}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={{ fill: "#4F46E5", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cost by Category</CardTitle>
                <CardDescription>Monthly breakdown</CardDescription>
              </div>
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={selectedChart === "pie" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedChart("pie")}
                  className="h-7 text-xs"
                >
                  Pie
                </Button>
                <Button
                  variant={selectedChart === "bar" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedChart("bar")}
                  className="h-7 text-xs"
                >
                  Bar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {selectedChart === "pie" ? (
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: $${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value}`} />
                </PieChart>
              ) : (
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value}`, "Amount"]}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Upcoming Payments</CardTitle>
          <CardDescription>Your next billing dates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-3"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{payment.service}</p>
                      {payment.alertEnabled && (
                        <Bell className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {payment.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(payment.date)}
                    </p>
                  </div>
                  <Badge variant="outline" className="hidden sm:inline-flex">
                    {payment.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
