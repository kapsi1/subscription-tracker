import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { EmptyState } from "../components/empty-state";
import { LoadingState } from "../components/loading-state";
import { ErrorState } from "../components/error-state";
import { 
  Download, 
  Upload, 
  Trash2, 
  Heart, 
  Mail,
  Check,
  X,
  Info,
  AlertCircle,
  Inbox,
  Moon,
  Sun
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export function ComponentLibraryPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Component Library</h1>
        <p className="text-muted-foreground mt-1">
          Reusable components and design system
        </p>
      </div>

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="states">States</TabsTrigger>
        </TabsList>

        {/* Theme */}
        <TabsContent value="theme" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Dark Mode</CardTitle>
              <CardDescription>Toggle between light and dark themes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-6 border rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label className="text-base">Current Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    {theme === "dark" ? "Dark mode is enabled" : "Light mode is enabled"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="gap-2"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-5 w-5" />
                      Switch to Light
                    </>
                  ) : (
                    <>
                      <Moon className="h-5 w-5" />
                      Switch to Dark
                    </>
                  )}
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Light Theme</h3>
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="space-y-3">
                      <div className="h-8 bg-[#4F46E5] rounded"></div>
                      <div className="h-6 bg-[#F8FAFC] border border-[#e2e8f0] rounded"></div>
                      <div className="h-6 bg-[#f1f5f9] rounded"></div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-4 bg-[#e0e7ff] rounded"></div>
                        <div className="h-4 bg-[#f1f5f9] rounded"></div>
                        <div className="h-4 bg-[#0f172a] rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Dark Theme</h3>
                  <div className="border rounded-lg p-4 bg-[#0f172a]">
                    <div className="space-y-3">
                      <div className="h-8 bg-[#6366f1] rounded"></div>
                      <div className="h-6 bg-[#1e293b] border border-[#334155] rounded"></div>
                      <div className="h-6 bg-[#334155] rounded"></div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-4 bg-[#312e81] rounded"></div>
                        <div className="h-4 bg-[#1e293b] rounded"></div>
                        <div className="h-4 bg-[#f8fafc] rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Theme Color Tokens</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-2">Background</div>
                    <div className="h-8 bg-background border rounded"></div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-2">Foreground</div>
                    <div className="h-8 bg-foreground rounded"></div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-2">Card</div>
                    <div className="h-8 bg-card border rounded"></div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-2">Primary</div>
                    <div className="h-8 bg-primary rounded"></div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-2">Muted</div>
                    <div className="h-8 bg-muted border rounded"></div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-2">Border</div>
                    <div className="h-8 border-4 border-border rounded"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors */}
        <TabsContent value="colors" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>Design system color tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary Colors */}
              <div>
                <h3 className="text-sm font-medium mb-3">Primary Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="h-20 rounded-lg bg-primary shadow-sm"></div>
                    <p className="text-sm font-medium">Primary</p>
                    <p className="text-xs text-muted-foreground">#4F46E5</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-20 rounded-lg bg-secondary shadow-sm border"></div>
                    <p className="text-sm font-medium">Secondary</p>
                    <p className="text-xs text-muted-foreground">#f1f5f9</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-20 rounded-lg bg-accent shadow-sm border"></div>
                    <p className="text-sm font-medium">Accent</p>
                    <p className="text-xs text-muted-foreground">#e0e7ff</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-20 rounded-lg bg-muted shadow-sm border"></div>
                    <p className="text-sm font-medium">Muted</p>
                    <p className="text-xs text-muted-foreground">#f1f5f9</p>
                  </div>
                </div>
              </div>

              {/* Semantic Colors */}
              <div>
                <h3 className="text-sm font-medium mb-3">Semantic Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="h-20 rounded-lg bg-destructive shadow-sm"></div>
                    <p className="text-sm font-medium">Destructive</p>
                    <p className="text-xs text-muted-foreground">#ef4444</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-20 rounded-lg bg-green-500 shadow-sm"></div>
                    <p className="text-sm font-medium">Success</p>
                    <p className="text-xs text-muted-foreground">#10b981</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-20 rounded-lg bg-yellow-500 shadow-sm"></div>
                    <p className="text-sm font-medium">Warning</p>
                    <p className="text-xs text-muted-foreground">#eab308</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-20 rounded-lg bg-blue-500 shadow-sm"></div>
                    <p className="text-sm font-medium">Info</p>
                    <p className="text-xs text-muted-foreground">#3b82f6</p>
                  </div>
                </div>
              </div>

              {/* Chart Colors */}
              <div>
                <h3 className="text-sm font-medium mb-3">Chart Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <div className="h-20 rounded-lg shadow-sm" style={{ backgroundColor: '#4F46E5' }}></div>
                    <p className="text-sm font-medium">Chart 1</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-20 rounded-lg shadow-sm" style={{ backgroundColor: '#8b5cf6' }}></div>
                    <p className="text-sm font-medium">Chart 2</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-20 rounded-lg shadow-sm" style={{ backgroundColor: '#ec4899' }}></div>
                    <p className="text-sm font-medium">Chart 3</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-20 rounded-lg shadow-sm" style={{ backgroundColor: '#06b6d4' }}></div>
                    <p className="text-sm font-medium">Chart 4</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-20 rounded-lg shadow-sm" style={{ backgroundColor: '#10b981' }}></div>
                    <p className="text-sm font-medium">Chart 5</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Text styles and spacing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h1>Heading 1 - The quick brown fox jumps</h1>
                <p className="text-xs text-muted-foreground">text-2xl, font-medium</p>
              </div>
              <div className="space-y-2">
                <h2>Heading 2 - The quick brown fox jumps</h2>
                <p className="text-xs text-muted-foreground">text-xl, font-medium</p>
              </div>
              <div className="space-y-2">
                <h3>Heading 3 - The quick brown fox jumps</h3>
                <p className="text-xs text-muted-foreground">text-lg, font-medium</p>
              </div>
              <div className="space-y-2">
                <p>Body text - The quick brown fox jumps over the lazy dog</p>
                <p className="text-xs text-muted-foreground">text-base, font-normal</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Small text - The quick brown fox jumps over the lazy dog
                </p>
                <p className="text-xs text-muted-foreground">text-sm, muted-foreground</p>
              </div>
            </CardContent>
          </Card>

          {/* Spacing */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Spacing System</CardTitle>
              <CardDescription>8px grid system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4, 6, 8, 12, 16].map((multiplier) => (
                  <div key={multiplier} className="flex items-center gap-4">
                    <div
                      className="bg-primary h-4"
                      style={{ width: `${multiplier * 8}px` }}
                    ></div>
                    <span className="text-sm text-muted-foreground">
                      {multiplier * 8}px (space-{multiplier === 1 ? '1' : multiplier === 2 ? '2' : multiplier === 3 ? '3' : multiplier === 4 ? '4' : multiplier === 6 ? '6' : multiplier === 8 ? '8' : multiplier === 12 ? '12' : '16'})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Buttons */}
        <TabsContent value="buttons" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>Different button styles and sizes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Variants</h3>
                <div className="flex flex-wrap gap-3">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Sizes</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">With Icons</h3>
                <div className="flex flex-wrap gap-3">
                  <Button className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">States</h3>
                <div className="flex flex-wrap gap-3">
                  <Button disabled>Disabled</Button>
                  <Button className="gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Labels and tags</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Variants</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">With Icons</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge className="gap-1">
                    <Check className="w-3 h-3" />
                    Success
                  </Badge>
                  <Badge variant="destructive" className="gap-1">
                    <X className="w-3 h-3" />
                    Error
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Info className="w-3 h-3" />
                    Info
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Warning
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Category Badges</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                    Entertainment
                  </Badge>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                    Productivity
                  </Badge>
                  <Badge variant="outline" className="bg-cyan-100 text-cyan-700 border-cyan-200">
                    Cloud Services
                  </Badge>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                    Development
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forms */}
        <TabsContent value="forms" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Form Components</CardTitle>
              <CardDescription>Input fields and controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 max-w-md">
                <h3 className="text-sm font-medium">Text Input</h3>
                <div className="space-y-2">
                  <Label htmlFor="demo-input">Email</Label>
                  <Input id="demo-input" type="email" placeholder="you@example.com" />
                </div>
              </div>

              <div className="space-y-3 max-w-md">
                <h3 className="text-sm font-medium">Select Dropdown</h3>
                <div className="space-y-2">
                  <Label htmlFor="demo-select">Category</Label>
                  <Select>
                    <SelectTrigger id="demo-select">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="productivity">Productivity</SelectItem>
                      <SelectItem value="cloud">Cloud Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 max-w-md">
                <h3 className="text-sm font-medium">Date Picker</h3>
                <div className="space-y-2">
                  <Label htmlFor="demo-date">Next Billing Date</Label>
                  <Input id="demo-date" type="date" />
                </div>
              </div>

              <div className="space-y-3 max-w-md">
                <h3 className="text-sm font-medium">Switch Toggle</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="demo-switch">Enable notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts for upcoming payments
                    </p>
                  </div>
                  <Switch id="demo-switch" />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Toast Notifications</h3>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => toast.success("Changes saved successfully!")}>
                    Success Toast
                  </Button>
                  <Button variant="destructive" onClick={() => toast.error("Something went wrong!")}>
                    Error Toast
                  </Button>
                  <Button variant="outline" onClick={() => toast.info("Here's some information")}>
                    Info Toast
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cards */}
        <TabsContent value="cards" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Basic Card</CardTitle>
                <CardDescription>Simple card with header and content</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This is a basic card component with a header and content area.
                  Cards use rounded corners (12px) and subtle shadows.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>Card with hover effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Hover over this card to see the shadow transition effect.
                  Great for clickable card components.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Metric Card
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">$127.48</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">+2.5%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-primary border-2">
              <CardHeader>
                <CardTitle>Highlighted Card</CardTitle>
                <CardDescription>Card with accent border</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Use colored borders to highlight important cards or indicate status.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* States */}
        <TabsContent value="states" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Empty State</CardTitle>
              <CardDescription>No data available</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<Inbox className="w-10 h-10 text-muted-foreground" />}
                title="No subscriptions found"
                description="Get started by adding your first subscription to track"
                actionLabel="Add Subscription"
                onAction={() => toast.info("Add subscription clicked")}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Loading State</CardTitle>
              <CardDescription>Data is being fetched</CardDescription>
            </CardHeader>
            <CardContent>
              <LoadingState message="Loading your subscriptions..." />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Error State</CardTitle>
              <CardDescription>Something went wrong</CardDescription>
            </CardHeader>
            <CardContent>
              <ErrorState
                title="Failed to load subscriptions"
                message="We couldn't load your subscriptions. Please check your connection and try again."
                onRetry={() => toast.info("Retry clicked")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}