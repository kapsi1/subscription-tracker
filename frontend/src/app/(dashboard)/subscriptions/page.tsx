"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Plus, Pencil, Trash2, Search, Filter, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { SubscriptionModal, Subscription } from "@/components/subscription-modal";
import { toast } from "sonner";
import api from "@/lib/api";
import { useRef } from "react";
import { sendGAEvent } from "@next/third-parties/google";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await api.get("/subscriptions");
      setSubscriptions(res.data);
    } catch (err: any) {
      toast.error("Failed to load subscriptions");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return;
    try {
      await api.delete(`/subscriptions/${id}`);
      setSubscriptions(subscriptions.filter((sub) => sub.id !== id));
      toast.success("Subscription deleted successfully");
    } catch (err) {
      toast.error("Failed to delete subscription");
    }
  };

  const handleSave = async (subscription: Partial<Subscription>) => {
    try {
      if (subscription.id) {
        // Edit existing
        const { id, ...updateData } = subscription;
        const res = await api.patch(`/subscriptions/${id}`, updateData);
        setSubscriptions(
          subscriptions.map((sub) =>
            sub.id === subscription.id ? res.data : sub
          )
        );
        toast.success("Subscription updated successfully");
      } else {
        // Create new
        const res = await api.post("/subscriptions", subscription);
        setSubscriptions([...subscriptions, res.data]);
        toast.success("Subscription added successfully");
        sendGAEvent({ event: "add_subscription", value: "success" });
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save subscription");
      sendGAEvent({ event: "add_subscription", value: "failed" });
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/subscriptions/export");
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.subscriptions, null, 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "subscriptions.json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast.success("Export successful");
      sendGAEvent({ event: "export_subscriptions", value: "success" });
    } catch (err: any) {
      toast.error("Failed to export subscriptions");
      sendGAEvent({ event: "export_subscriptions", value: "failed" });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);
        
        // Ensure it's an array
        const subscriptionsToImport = Array.isArray(json) ? json : json.subscriptions || [json];
        
        await api.post("/subscriptions/import", { subscriptions: subscriptionsToImport });
        toast.success(`Successfully imported subscriptions`);
        sendGAEvent({ event: "import_subscriptions", value: "success" });
        
        // Refresh list
        setIsLoading(true);
        fetchSubscriptions();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to parse or import JSON file");
        sendGAEvent({ event: "import_subscriptions", value: "failed" });
      }
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const formatCurrency = (value: number) => `$${(Number(value) || 0).toFixed(2)}`;
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatBillingCycle = (cycle: string) => {
    return cycle.charAt(0) + cycle.slice(1).toLowerCase();
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

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading subscriptions...</div>;
  }

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
        <div className="flex gap-2 flex-wrap">
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImport}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2 shrink-0">
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2 shrink-0">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={handleAddNew} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Add Subscription
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search subscriptions by name or category..."
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
                    <TableHead>Service Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id} className="hover:bg-accent/50">
                      <TableCell className="font-medium">
                        {subscription.name}
                      </TableCell>
                      <TableCell>{formatCurrency(subscription.amount)}</TableCell>
                      <TableCell>{formatBillingCycle(subscription.billingCycle)}</TableCell>
                      <TableCell>{formatDate(subscription.nextBillingDate)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getCategoryColor(subscription.category)}
                        >
                          {subscription.category}
                        </Badge>
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
