import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Plus, Pencil, Trash2, Bell, BellOff, Search } from "lucide-react";
import { Input } from "../components/ui/input";
import { EmptyState } from "../components/empty-state";
import { SubscriptionModal } from "../components/subscription-modal";
import { toast } from "sonner";

// Mock subscription data
const mockSubscriptions = [
  {
    id: 1,
    service: "Netflix",
    amount: 15.99,
    currency: "USD",
    billingCycle: "Monthly",
    nextBilling: "2026-02-25",
    category: "Entertainment",
    alertEnabled: true,
    alertDays: 3,
  },
  {
    id: 2,
    service: "Figma Professional",
    amount: 12.00,
    currency: "USD",
    billingCycle: "Monthly",
    nextBilling: "2026-02-28",
    category: "Productivity",
    alertEnabled: true,
    alertDays: 5,
  },
  {
    id: 3,
    service: "AWS",
    amount: 42.50,
    currency: "USD",
    billingCycle: "Monthly",
    nextBilling: "2026-03-01",
    category: "Cloud Services",
    alertEnabled: false,
    alertDays: 0,
  },
  {
    id: 4,
    service: "Spotify Premium",
    amount: 10.99,
    currency: "USD",
    billingCycle: "Monthly",
    nextBilling: "2026-03-05",
    category: "Entertainment",
    alertEnabled: true,
    alertDays: 7,
  },
  {
    id: 5,
    service: "GitHub Pro",
    amount: 7.00,
    currency: "USD",
    billingCycle: "Monthly",
    nextBilling: "2026-03-10",
    category: "Development",
    alertEnabled: true,
    alertDays: 3,
  },
  {
    id: 6,
    service: "Adobe Creative Cloud",
    amount: 54.99,
    currency: "USD",
    billingCycle: "Monthly",
    nextBilling: "2026-03-15",
    category: "Productivity",
    alertEnabled: false,
    alertDays: 0,
  },
  {
    id: 7,
    service: "Dropbox Plus",
    amount: 11.99,
    currency: "USD",
    billingCycle: "Monthly",
    nextBilling: "2026-03-18",
    category: "Cloud Services",
    alertEnabled: true,
    alertDays: 5,
  },
  {
    id: 8,
    service: "LinkedIn Premium",
    amount: 29.99,
    currency: "USD",
    billingCycle: "Monthly",
    nextBilling: "2026-03-20",
    category: "Professional",
    alertEnabled: false,
    alertDays: 0,
  },
];

type Subscription = (typeof mockSubscriptions)[0];

export function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(mockSubscriptions);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddNew = () => {
    setEditingSubscription(null);
    setModalOpen(true);
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setSubscriptions(subscriptions.filter((sub) => sub.id !== id));
    toast.success("Subscription deleted successfully");
  };

  const handleSave = (subscription: Subscription) => {
    if (editingSubscription) {
      setSubscriptions(
        subscriptions.map((sub) =>
          sub.id === editingSubscription.id ? subscription : sub
        )
      );
      toast.success("Subscription updated successfully");
    } else {
      setSubscriptions([...subscriptions, { ...subscription, id: Date.now() }]);
      toast.success("Subscription added successfully");
    }
    setModalOpen(false);
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Entertainment: "bg-purple-100 text-purple-700 border-purple-200",
      Productivity: "bg-blue-100 text-blue-700 border-blue-200",
      "Cloud Services": "bg-cyan-100 text-cyan-700 border-cyan-200",
      Development: "bg-green-100 text-green-700 border-green-200",
      Professional: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return colors[category] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your recurring subscriptions
          </p>
        </div>
        <Button onClick={handleAddNew} className="gap-2 sm:w-auto">
          <Plus className="w-4 h-4" />
          Add Subscription
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search subscriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>
            {filteredSubscriptions.length} subscription{filteredSubscriptions.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubscriptions.length === 0 ? (
            <EmptyState
              title="No subscriptions found"
              description={
                searchQuery
                  ? "Try adjusting your search query"
                  : "Get started by adding your first subscription"
              }
              actionLabel={searchQuery ? undefined : "Add Subscription"}
              onAction={searchQuery ? undefined : handleAddNew}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Alert</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id} className="hover:bg-accent/50">
                      <TableCell className="font-medium">
                        {subscription.service}
                      </TableCell>
                      <TableCell>{formatCurrency(subscription.amount)}</TableCell>
                      <TableCell>{subscription.billingCycle}</TableCell>
                      <TableCell>{formatDate(subscription.nextBilling)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getCategoryColor(subscription.category)}
                        >
                          {subscription.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {subscription.alertEnabled ? (
                          <div className="flex items-center gap-1 text-primary">
                            <Bell className="w-4 h-4" />
                            <span className="text-xs">{subscription.alertDays}d</span>
                          </div>
                        ) : (
                          <BellOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(subscription)}
                            className="h-8 w-8"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(subscription.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Modal */}
      <SubscriptionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        subscription={editingSubscription}
        onSave={handleSave}
      />
    </div>
  );
}
