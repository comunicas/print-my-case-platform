import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  ArrowLeft, Sun, Moon, AlertCircle, CheckCircle2, Info, Search, Menu,
  Inbox, Smartphone, ChevronRight, Bold, Italic, Underline,
  Calendar as CalendarIcon, Settings, User, LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { DSSection, DSExample } from "@/components/design-system/DSSection";
import {
  m3Palette, m3Typography, m3Shape, m3Elevation, m3Motion, m3Spacing, M3_SEED,
} from "@/design-system/tokens";

// Primitives
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/ui/Logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger,
} from "@/components/ui/menubar";
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink,
  NavigationMenuList, NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { DataPagination } from "@/components/ui/data-pagination";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Calendar } from "@/components/ui/calendar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

// Project wrappers
import { EmptyState } from "@/components/ui/empty-state";
import { PhoneInput } from "@/components/ui/phone-input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ProductDisplay } from "@/components/ui/ProductDisplay";
import { SearchFilter } from "@/components/ui/SearchFilter";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { FilterBar } from "@/components/ui/FilterBar";
import { format } from "date-fns";

// Dashboard / charts
import {
  KPICard, QuickStats, FinancialSummaryCard, LossAnalysisCard,
  ChartCard, ChartEmptyState, ChartSkeleton,
  SalesByDayChart, SalesHeatmapChart, TopProductsChart,
  LossesByDayChart, StockAlertsTable, DateRangeFilter,
} from "@/components/dashboard";
import { ProductSalesByDayChart } from "@/components/stock/ProductSalesByDayChart";
import { ProductSalesByHourChart } from "@/components/stock/ProductSalesByHourChart";
import { ProductSalesHistoryChart } from "@/components/stock/ProductSalesHistoryChart";
import { History, Package, DollarSign, ShoppingCart, TrendingUp as TrendingUpIcon } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell as RCell, YAxis as RYAxis } from "recharts";
import {
  salesByDayMock, lossesByDayMock, topProductsMock, stockByBrandMock,
  heatmapMock, stockAlertsMock, productSalesByDayMock, productSalesByHourMock,
  stockHistoryMock,
} from "@/pages/ds/chartMocks";

// ------------------------------------------------------------------
// Navigation structure (used by both desktop sidebar and mobile sheet)
// ------------------------------------------------------------------
const NAV_SECTIONS: Array<{ group: string; items: Array<{ id: string; label: string }> }> = [
  { group: "Foundations", items: [
    { id: "color", label: "Color" },
    { id: "typography", label: "Typography" },
    { id: "shape", label: "Shape" },
    { id: "elevation", label: "Elevation" },
    { id: "spacing", label: "Spacing" },
    { id: "motion", label: "Motion" },
  ]},
  { group: "Actions", items: [
    { id: "buttons", label: "Buttons" },
    { id: "toggles", label: "Toggle / ToggleGroup" },
    { id: "menus", label: "Dropdown / Context / Menubar" },
  ]},
  { group: "Inputs", items: [
    { id: "inputs", label: "Text fields" },
    { id: "form", label: "Form (RHF)" },
    { id: "input-otp", label: "InputOTP" },
    { id: "phone-password", label: "Phone & Password" },
    { id: "datepicker", label: "Calendar / Date picker" },
  ]},
  { group: "Selection", items: [
    { id: "selection", label: "Checkbox / Radio / Switch / Slider" },
  ]},
  { group: "Containers", items: [
    { id: "cards", label: "Cards" },
    { id: "tabs-accordion", label: "Tabs / Accordion / Collapsible" },
    { id: "layouts", label: "AspectRatio / ScrollArea / Resizable / Separator" },
  ]},
  { group: "Navigation", items: [
    { id: "breadcrumb", label: "Breadcrumb" },
    { id: "pagination", label: "Pagination" },
    { id: "navmenu", label: "NavigationMenu" },
    { id: "badges", label: "Badges" },
  ]},
  { group: "Feedback", items: [
    { id: "alerts", label: "Alerts" },
    { id: "progress-skeleton", label: "Progress / Skeleton" },
    { id: "sonner", label: "Sonner (toast)" },
    { id: "empty", label: "EmptyState" },
  ]},
  { group: "Overlays", items: [
    { id: "dialog", label: "Dialog / AlertDialog" },
    { id: "sheet-drawer", label: "Sheet / Drawer" },
    { id: "popover-tooltip", label: "Popover / Tooltip / HoverCard" },
    { id: "command", label: "Command palette" },
  ]},
  { group: "Data", items: [
    { id: "avatar-table", label: "Avatar / Table" },
    { id: "carousel", label: "Carousel" },
    { id: "chart", label: "Chart" },
    { id: "domain", label: "BrandLogo / ProductDisplay" },
  ]},
  { group: "Utilities", items: [
    { id: "utilities", label: "VisuallyHidden / ErrorBoundary / PullToRefresh" },
  ]},
  { group: "Patterns", items: [
    { id: "patterns", label: "KPI / Filters / Page header" },
  ]},
  { group: "Data viz (dashboard)", items: [
    { id: "kpi-cards", label: "KPI / Summary cards" },
    { id: "chart-wrappers", label: "Chart wrappers" },
    { id: "sales-charts", label: "Sales charts" },
    { id: "stock-charts", label: "Stock charts" },
    { id: "loss-charts", label: "Loss charts" },
    { id: "product-charts", label: "Product charts" },
    { id: "tables-filters", label: "Alerts table / Date filter" },
  ]},
];

// ------------------------------------------------------------------
// Reusable bits
// ------------------------------------------------------------------
function NavList({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <nav className="space-y-5">
      {NAV_SECTIONS.map(group => (
        <div key={group.group}>
          <div className="md-label-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">{group.group}</div>
          <ul className="space-y-0.5">
            {group.items.map(item => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={onItemClick}
                  className="block px-3 py-2.5 min-h-[44px] rounded-md md-body-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function ColorRamp({ name, palette }: { name: string; palette: Record<string, string> }) {
  return (
    <div>
      <h4 className="md-label-large mb-2 capitalize">{name}</h4>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 rounded-md overflow-hidden border border-border min-w-max sm:min-w-0">
          {Object.entries(palette).map(([tone, hex]) => (
            <div key={tone} className="w-[60px] sm:flex-1 sm:min-w-[44px]">
              <div className="h-14" style={{ background: hex }} />
              <div className="px-1.5 py-1 text-[10px] bg-card border-t border-border text-center">
                <div className="font-mono">{tone}</div>
                <div className="font-mono text-muted-foreground truncate">{hex}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SystemColorChip({ name, varName, fg }: { name: string; varName: string; fg?: string }) {
  return (
    <div className="rounded-md overflow-hidden border border-border">
      <div
        className="h-14 sm:h-16 flex items-center justify-center text-xs font-medium"
        style={{ background: `hsl(var(${varName}))`, color: fg ? `hsl(var(${fg}))` : undefined }}
      >
        {fg ? "Aa" : ""}
      </div>
      <div className="px-2 py-1.5 bg-card text-[11px] min-w-0">
        <div className="font-medium truncate">{name}</div>
        <div className="font-mono text-muted-foreground truncate">{varName}</div>
      </div>
    </div>
  );
}

// Form demo schema
function FormDemo() {
  const form = useForm<{ email: string }>({ defaultValues: { email: "" } });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(v => toast.success(`E-mail: ${v.email}`))} className="space-y-3 max-w-sm">
        <FormField
          control={form.control}
          name="email"
          rules={{ required: "Obrigatório", pattern: { value: /.+@.+/, message: "E-mail inválido" } }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl><Input placeholder="email@exemplo.com" {...field} /></FormControl>
              <FormDescription>Validação via react-hook-form.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto">Enviar</Button>
      </form>
    </Form>
  );
}

function CalendarDemo() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return (
    <div className="space-y-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full sm:w-[260px] justify-start">
            <CalendarIcon className="h-4 w-4" />
            {date ? format(date, "dd/MM/yyyy") : "Selecionar data"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar mode="single" selected={date} onSelect={setDate} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function PasswordDemo() {
  const [pw, setPw] = useState("");
  return (
    <div className="space-y-2 max-w-sm">
      <Label>Senha</Label>
      <Input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Digite uma senha" />
      <PasswordStrengthIndicator password={pw} />
    </div>
  );
}

function PhoneDemo() {
  const [v, setV] = useState("");
  return (
    <div className="space-y-1.5 max-w-sm">
      <Label>Telefone</Label>
      <PhoneInput value={v} onChange={setV} placeholder="(11) 91234-5678" />
    </div>
  );
}

const chartData = [
  { day: "Seg", v: 12 }, { day: "Ter", v: 18 }, { day: "Qua", v: 9 },
  { day: "Qui", v: 22 }, { day: "Sex", v: 16 },
];

function DateRangeFilterDemo() {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 13);
  const [range, setRange] = useState<{ from: Date; to: Date }>({ from: start, to: today });
  return (
    <DateRangeFilter dateRange={range} onDateRangeChange={setRange} />
  );
}

function StockHistoryPreview() {
  return (
    <ChartCard
      title="Histórico de Estoque"
      description="Preview com dados mock — componente real busca via useStockHistory"
      icon={History}
      iconColor="text-purple-500"
    >
      <ChartContainer
        config={{
          APPLE: { label: "APPLE", color: "hsl(var(--chart-1))" },
          SAMSUNG: { label: "SAMSUNG", color: "hsl(var(--chart-2))" },
          XIAOMI: { label: "XIAOMI", color: "hsl(var(--chart-3))" },
        }}
        className="h-[260px] md:h-[300px] w-full"
      >
        <LineChart data={stockHistoryMock}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="dateDisplay" tickLine={false} axisLine={false} fontSize={11} />
          <RYAxis tickLine={false} axisLine={false} fontSize={11} width={28} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="APPLE" stroke="var(--color-APPLE)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="SAMSUNG" stroke="var(--color-SAMSUNG)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="XIAOMI" stroke="var(--color-XIAOMI)" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  );
}

function StockByBrandPreview() {
  const total = stockByBrandMock.reduce((a, d) => a + d.quantity, 0);
  const config = stockByBrandMock.reduce((acc, item) => {
    acc[item.brand] = { label: item.brand, color: item.fill };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);
  return (
    <ChartCard
      title="Estoque por Marca"
      description={`Total: ${total} unidades — preview com mock`}
      icon={Package}
      iconColor="text-blue-500"
    >
      <ChartContainer config={config} className="h-[260px] md:h-[300px] w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="brand" />} />
          <Pie data={stockByBrandMock} dataKey="quantity" nameKey="brand" innerRadius={50} outerRadius={90}>
            {stockByBrandMock.map((d) => <RCell key={d.brand} fill={d.fill} />)}
          </Pie>
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------
export default function DesignSystem() {
  const { theme, setTheme } = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [selectFilterValue, setSelectFilterValue] = useState("all");
  const [page, setPage] = useState(1);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-clip">
      {/* Top app bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 md:px-8 h-14">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile menu trigger */}
            <Sheet open={navOpen} onOpenChange={setNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir navegação">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-xs p-0">
                <SheetHeader className="p-4 border-b border-border">
                  <SheetTitle>Design System</SheetTitle>
                  <SheetDescription className="md-body-small">Navegação</SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-5rem)] p-2">
                  <NavList onItemClick={() => setNavOpen(false)} />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Button asChild variant="ghost" size="icon" className="sm:hidden" aria-label="Voltar">
              <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <h1 className="md-title-medium sm:md-title-large truncate">Design System</h1>
            <Badge variant="outline" className="hidden md:inline-flex shrink-0">Material 3</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Alternar tema">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar (desktop only) */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto p-4">
          <NavList />
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 px-3 sm:px-4 md:px-8 py-6 md:py-8 max-w-6xl">
          <div className="mb-8 md:mb-12">
            <h2 className="md-headline-medium md:md-display-small mb-2">Design System Reference</h2>
            <p className="md-body-medium md:md-body-large text-muted-foreground">
              Living styleguide baseado em Material 3. Documenta foundations e os 61 componentes em
              <code className="font-mono"> src/components/ui</code>. Mobile-first, ≥44px touch targets, sem scroll horizontal.
            </p>
            <p className="md-body-small text-muted-foreground mt-2">
              Seed: <code className="font-mono">{M3_SEED}</code> · Tokens M3 em <code className="font-mono">--md-sys-*</code> coexistem com tokens semânticos atuais.
            </p>
          </div>

          {/* ============== FOUNDATIONS ============== */}
          <DSSection id="color" title="Color" description="Roles M3 (primary/secondary/tertiary, surface containers, outline). Cada role tem variante on-* para texto/ícones acessíveis.">
            <DSExample title="System roles">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                <SystemColorChip name="Primary"             varName="--md-sys-color-primary"             fg="--md-sys-color-on-primary" />
                <SystemColorChip name="Primary Container"   varName="--md-sys-color-primary-container"   fg="--md-sys-color-on-primary-container" />
                <SystemColorChip name="Secondary"           varName="--md-sys-color-secondary"           fg="--md-sys-color-on-secondary" />
                <SystemColorChip name="Secondary Container" varName="--md-sys-color-secondary-container" fg="--md-sys-color-on-secondary-container" />
                <SystemColorChip name="Tertiary"            varName="--md-sys-color-tertiary"            fg="--md-sys-color-on-tertiary" />
                <SystemColorChip name="Tertiary Container"  varName="--md-sys-color-tertiary-container"  fg="--md-sys-color-on-tertiary-container" />
                <SystemColorChip name="Error"               varName="--md-sys-color-error"               fg="--md-sys-color-on-error" />
                <SystemColorChip name="Error Container"     varName="--md-sys-color-error-container"     fg="--md-sys-color-on-error-container" />
                <SystemColorChip name="Surface"             varName="--md-sys-color-surface"             fg="--md-sys-color-on-surface" />
                <SystemColorChip name="Surface Variant"     varName="--md-sys-color-surface-variant"     fg="--md-sys-color-on-surface-variant" />
                <SystemColorChip name="Background"          varName="--md-sys-color-background"          fg="--md-sys-color-on-background" />
                <SystemColorChip name="Outline"             varName="--md-sys-color-outline" />
              </div>
            </DSExample>

            <DSExample title="Surface containers">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                {["lowest","low","","high","highest"].map((lvl) => {
                  const v = lvl ? `--md-sys-color-surface-container-${lvl}` : "--md-sys-color-surface-container";
                  return <SystemColorChip key={lvl} name={`Container ${lvl||"base"}`} varName={v} fg="--md-sys-color-on-surface" />;
                })}
              </div>
            </DSExample>

            <DSExample title="Tonal palettes (role horizontal em mobile)">
              <div className="space-y-4">
                <ColorRamp name="primary"         palette={m3Palette.primary as any} />
                <ColorRamp name="secondary"       palette={m3Palette.secondary as any} />
                <ColorRamp name="tertiary"        palette={m3Palette.tertiary as any} />
                <ColorRamp name="error"           palette={m3Palette.error as any} />
                <ColorRamp name="neutral"         palette={m3Palette.neutral as any} />
                <ColorRamp name="neutral variant" palette={m3Palette.neutralVariant as any} />
              </div>
            </DSExample>
          </DSSection>

          <DSSection id="typography" title="Typography" description="Escala M3: display/headline/title/body/label × L/M/S. Classes utilitárias .md-*.">
            <DSExample title="Type scale">
              <div className="space-y-3">
                {Object.entries(m3Typography).flatMap(([cat, sizes]) =>
                  Object.entries(sizes).map(([sz, def]) => (
                    <div key={`${cat}-${sz}`} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 border-b border-border/60 pb-2 last:border-0">
                      <span className={`md-${cat}-${sz} flex-1 min-w-0 break-words`}>{cat} {sz}</span>
                      <span className="md-label-small text-muted-foreground font-mono">
                        {def.size} / {def.line} / {def.weight}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </DSExample>
          </DSSection>

          <DSSection id="shape" title="Shape" description="Sistema de corner radius M3.">
            <DSExample title="Corner scale">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 md:gap-4">
                {Object.entries(m3Shape).map(([k, v]) => (
                  <div key={k} className="text-center">
                    <div className="h-16 md:h-20 bg-primary/20 border-2 border-primary mx-auto" style={{ borderRadius: v }} />
                    <div className="md-label-medium mt-2">{k}</div>
                    <div className="md-body-small text-muted-foreground font-mono">{v}</div>
                  </div>
                ))}
              </div>
            </DSExample>
          </DSSection>

          <DSSection id="elevation" title="Elevation" description="6 níveis (0–5) via box-shadow.">
            <DSExample title="Levels">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-6 bg-muted/40 p-4 md:p-6 rounded-lg">
                {Object.entries(m3Elevation).map(([k]) => (
                  <div key={k} className="text-center">
                    <div className={`h-16 md:h-20 bg-card rounded-lg md-elev-${k.replace("level","")}`} />
                    <div className="md-label-medium mt-2">{k}</div>
                  </div>
                ))}
              </div>
            </DSExample>
          </DSSection>

          <DSSection id="spacing" title="Spacing" description="Escala 4dp.">
            <DSExample title="Scale">
              <div className="space-y-2 overflow-x-auto">
                {Object.entries(m3Spacing).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3">
                    <span className="md-label-medium w-8 font-mono shrink-0">{k}</span>
                    <div className="bg-primary h-3 shrink-0" style={{ width: v }} />
                    <span className="md-body-small text-muted-foreground font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </DSExample>
          </DSSection>

          <DSSection id="motion" title="Motion" description="Durations e easings M3.">
            <DSExample title="Durations">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                {Object.entries(m3Motion.duration).map(([k, v]) => (
                  <div key={k} className="rounded-md border border-border p-3">
                    <div className="md-label-medium">{k}</div>
                    <div className="md-body-small text-muted-foreground font-mono">{v}</div>
                  </div>
                ))}
              </div>
            </DSExample>
            <DSExample title="Easings">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {Object.entries(m3Motion.easing).map(([k, v]) => (
                  <div key={k} className="rounded-md border border-border p-3 min-w-0">
                    <div className="md-label-medium">{k}</div>
                    <div className="md-body-small text-muted-foreground font-mono break-all">{v}</div>
                  </div>
                ))}
              </div>
            </DSExample>
          </DSSection>

          {/* ============== ACTIONS ============== */}
          <DSSection id="buttons" title="Buttons" description="Mapping M3: default→Filled, secondary→Tonal, outline→Outlined, ghost→Text, link→Link, destructive→Error, hero→Brand gradient.">
            <DSExample title="Variants">
              <div className="flex flex-wrap gap-2 md:gap-3">
                <Button>Filled</Button>
                <Button variant="secondary">Tonal</Button>
                <Button variant="outline">Outlined</Button>
                <Button variant="ghost">Text</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Error</Button>
                <Button variant="hero">Hero</Button>
              </div>
            </DSExample>
            <DSExample title="Sizes & states">
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" aria-label="search"><Search /></Button>
                <Button disabled>Disabled</Button>
              </div>
            </DSExample>
          </DSSection>

          <DSSection id="toggles" title="Toggle / ToggleGroup" description="Botões on/off e grupos exclusivos.">
            <DSExample title="Toggle">
              <div className="flex flex-wrap gap-2">
                <Toggle aria-label="Bold"><Bold className="h-4 w-4" /></Toggle>
                <Toggle aria-label="Italic" defaultPressed><Italic className="h-4 w-4" /></Toggle>
                <Toggle aria-label="Underline"><Underline className="h-4 w-4" /></Toggle>
              </div>
            </DSExample>
            <DSExample title="ToggleGroup (single)">
              <ToggleGroup type="single" defaultValue="b">
                <ToggleGroupItem value="a">A</ToggleGroupItem>
                <ToggleGroupItem value="b">B</ToggleGroupItem>
                <ToggleGroupItem value="c">C</ToggleGroupItem>
              </ToggleGroup>
            </DSExample>
          </DSSection>

          <DSSection id="menus" title="Dropdown / Context / Menubar" description="Menus contextuais e barras de menu.">
            <DSExample title="DropdownMenu">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline">Abrir menu</Button></DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem><User className="h-4 w-4" /> Perfil</DropdownMenuItem>
                  <DropdownMenuItem><Settings className="h-4 w-4" /> Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem><LogOut className="h-4 w-4" /> Sair</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </DSExample>
            <DSExample title="ContextMenu (clique direito na área)">
              <ContextMenu>
                <ContextMenuTrigger className="flex h-24 items-center justify-center rounded-md border border-dashed border-border md-body-medium text-muted-foreground">
                  Clique com o botão direito
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>Copiar</ContextMenuItem>
                  <ContextMenuItem>Colar</ContextMenuItem>
                  <ContextMenuItem>Excluir</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </DSExample>
            <DSExample title="Menubar">
              <Menubar className="max-w-full overflow-x-auto">
                <MenubarMenu>
                  <MenubarTrigger>Arquivo</MenubarTrigger>
                  <MenubarContent><MenubarItem>Novo</MenubarItem><MenubarItem>Abrir</MenubarItem></MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger>Editar</MenubarTrigger>
                  <MenubarContent><MenubarItem>Desfazer</MenubarItem><MenubarItem>Refazer</MenubarItem></MenubarContent>
                </MenubarMenu>
              </Menubar>
            </DSExample>
          </DSSection>

          {/* ============== INPUTS ============== */}
          <DSSection id="inputs" title="Text fields" description="Input, Textarea, Select e Label. Equivalente M3: filled/outlined text field.">
            <DSExample title="Examples">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-2xl">
                <div className="space-y-1.5"><Label htmlFor="ds-name">Nome</Label><Input id="ds-name" placeholder="Digite seu nome" /></div>
                <div className="space-y-1.5"><Label htmlFor="ds-email">E-mail</Label><Input id="ds-email" type="email" placeholder="email@exemplo.com" /></div>
                <div className="space-y-1.5"><Label htmlFor="ds-disabled">Disabled</Label><Input id="ds-disabled" disabled value="bloqueado" /></div>
                <div className="space-y-1.5">
                  <Label htmlFor="ds-select">Select</Label>
                  <Select>
                    <SelectTrigger id="ds-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">Opção A</SelectItem>
                      <SelectItem value="b">Opção B</SelectItem>
                      <SelectItem value="c">Opção C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="ds-msg">Mensagem</Label><Textarea id="ds-msg" placeholder="Escreva..." rows={3} /></div>
              </div>
            </DSExample>
          </DSSection>

          <DSSection id="form" title="Form (react-hook-form)" description="Wrapper Form + FormField com validação e mensagens.">
            <DSExample title="Validação inline"><FormDemo /></DSExample>
          </DSSection>

          <DSSection id="input-otp" title="InputOTP" description="Entrada segmentada para códigos de verificação.">
            <DSExample title="6 dígitos">
              <InputOTP maxLength={6}>
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, i) => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
              </InputOTP>
            </DSExample>
          </DSSection>

          <DSSection id="phone-password" title="PhoneInput & PasswordStrength" description="Wrappers do projeto.">
            <DSExample title="Phone (BR mask)"><PhoneDemo /></DSExample>
            <DSExample title="Password strength"><PasswordDemo /></DSExample>
          </DSSection>

          <DSSection id="datepicker" title="Calendar / Date picker" description="Calendar dentro de Popover (mobile-friendly).">
            <DSExample title="Date picker pattern"><CalendarDemo /></DSExample>
          </DSSection>

          {/* ============== SELECTION ============== */}
          <DSSection id="selection" title="Selection Controls" description="Checkbox, Radio, Switch, Slider.">
            <DSExample title="Examples">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="flex items-center gap-2"><Checkbox id="c1" /><Label htmlFor="c1">Aceito os termos</Label></div>
                <div className="flex items-center gap-3"><Switch id="s1" /><Label htmlFor="s1">Notificações</Label></div>
                <RadioGroup defaultValue="a" className="flex gap-6">
                  <div className="flex items-center gap-2"><RadioGroupItem value="a" id="r1" /><Label htmlFor="r1">A</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="b" id="r2" /><Label htmlFor="r2">B</Label></div>
                </RadioGroup>
                <Slider defaultValue={[40]} max={100} step={1} />
              </div>
            </DSExample>
          </DSSection>

          {/* ============== CONTAINERS ============== */}
          <DSSection id="cards" title="Cards" description="Variants Elevated / Filled / Outlined.">
            <DSExample title="Cards">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <Card className="md-elev-1">
                  <CardHeader><CardTitle>Elevated</CardTitle><CardDescription>elevation 1</CardDescription></CardHeader>
                  <CardContent>Conteúdo.</CardContent>
                </Card>
                <Card className="bg-secondary border-0">
                  <CardHeader><CardTitle>Filled</CardTitle><CardDescription>secondary surface</CardDescription></CardHeader>
                  <CardContent>Conteúdo.</CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Outlined</CardTitle><CardDescription>border only</CardDescription></CardHeader>
                  <CardContent>Conteúdo.</CardContent>
                </Card>
              </div>
            </DSExample>
          </DSSection>

          <DSSection id="tabs-accordion" title="Tabs / Accordion / Collapsible" description="Disclosure patterns.">
            <DSExample title="Tabs">
              <Tabs defaultValue="a">
                <TabsList><TabsTrigger value="a">Aba A</TabsTrigger><TabsTrigger value="b">Aba B</TabsTrigger></TabsList>
                <TabsContent value="a" className="md-body-medium pt-3">Conteúdo A</TabsContent>
                <TabsContent value="b" className="md-body-medium pt-3">Conteúdo B</TabsContent>
              </Tabs>
            </DSExample>
            <DSExample title="Accordion">
              <Accordion type="single" collapsible>
                <AccordionItem value="i1"><AccordionTrigger>Item 1</AccordionTrigger><AccordionContent>Detalhe 1.</AccordionContent></AccordionItem>
                <AccordionItem value="i2"><AccordionTrigger>Item 2</AccordionTrigger><AccordionContent>Detalhe 2.</AccordionContent></AccordionItem>
              </Accordion>
            </DSExample>
            <DSExample title="Collapsible">
              <Collapsible>
                <CollapsibleTrigger asChild><Button variant="outline" size="sm">Mostrar mais</Button></CollapsibleTrigger>
                <CollapsibleContent className="pt-2 md-body-medium">Conteúdo expandido aqui.</CollapsibleContent>
              </Collapsible>
            </DSExample>
          </DSSection>

          <DSSection id="layouts" title="AspectRatio / ScrollArea / Resizable / Separator" description="Primitivos de layout.">
            <DSExample title="AspectRatio 16:9">
              <div className="max-w-md">
                <AspectRatio ratio={16/9} className="bg-muted rounded-md flex items-center justify-center md-body-medium text-muted-foreground">16:9</AspectRatio>
              </div>
            </DSExample>
            <DSExample title="ScrollArea">
              <ScrollArea className="h-32 w-full rounded-md border border-border p-3">
                <ul className="space-y-1 md-body-medium">
                  {Array.from({ length: 30 }).map((_, i) => <li key={i}>Linha {i + 1}</li>)}
                </ul>
              </ScrollArea>
            </DSExample>
            <DSExample title="Resizable (horizontal — desktop)">
              <ResizablePanelGroup direction="horizontal" className="min-h-[120px] rounded-md border border-border">
                <ResizablePanel defaultSize={40}><div className="p-3 md-body-medium">Painel A</div></ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={60}><div className="p-3 md-body-medium">Painel B</div></ResizablePanel>
              </ResizablePanelGroup>
            </DSExample>
            <DSExample title="Separator">
              <div className="space-y-3">
                <div className="md-body-medium">Acima</div>
                <Separator />
                <div className="md-body-medium">Abaixo</div>
              </div>
            </DSExample>
          </DSSection>

          {/* ============== NAVIGATION ============== */}
          <DSSection id="breadcrumb" title="Breadcrumb">
            <DSExample title="Trail">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem><BreadcrumbLink href="#">Home</BreadcrumbLink></BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem><BreadcrumbLink href="#">Estoque</BreadcrumbLink></BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem><BreadcrumbPage>Tabela</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </DSExample>
          </DSSection>

          <DSSection id="pagination" title="Pagination & DataPagination">
            <DSExample title="Pagination (rolável em mobile)">
              <div className="overflow-x-auto">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                    <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
                    <PaginationItem><PaginationLink href="#">2</PaginationLink></PaginationItem>
                    <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
                    <PaginationItem><PaginationEllipsis /></PaginationItem>
                    <PaginationItem><PaginationNext href="#" /></PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </DSExample>
            <DSExample title="DataPagination (wrapper do projeto)">
              <DataPagination
                page={page} totalPages={5} pageSize={10} totalCount={42}
                hasNextPage={page < 5} hasPrevPage={page > 1}
                onPageChange={setPage}
              />
            </DSExample>
          </DSSection>

          <DSSection id="navmenu" title="NavigationMenu">
            <DSExample title="Mega menu">
              <div className="overflow-x-auto">
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid gap-2 p-3 w-[260px]">
                          <li><NavigationMenuLink href="#" className="block p-2 rounded hover:bg-accent">Estoque</NavigationMenuLink></li>
                          <li><NavigationMenuLink href="#" className="block p-2 rounded hover:bg-accent">Vendas</NavigationMenuLink></li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            </DSExample>
          </DSSection>

          <DSSection id="badges" title="Badges & Chips">
            <DSExample title="Variants">
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Error</Badge>
              </div>
            </DSExample>
          </DSSection>

          {/* ============== FEEDBACK ============== */}
          <DSSection id="alerts" title="Alerts">
            <DSExample title="Variants">
              <div className="space-y-3">
                <Alert><Info className="h-4 w-4" /><AlertTitle>Info</AlertTitle><AlertDescription>Mensagem informativa.</AlertDescription></Alert>
                <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>Algo deu errado.</AlertDescription></Alert>
                <Alert className="border-green-500/50 text-green-700 dark:text-green-400"><CheckCircle2 className="h-4 w-4" /><AlertTitle>Sucesso</AlertTitle><AlertDescription>Operação concluída.</AlertDescription></Alert>
              </div>
            </DSExample>
          </DSSection>

          <DSSection id="progress-skeleton" title="Progress / Skeleton">
            <DSExample title="Progress">
              <Progress value={62} />
            </DSExample>
            <DSExample title="Skeleton">
              <div className="space-y-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </DSExample>
            <DSExample title="SkeletonShimmer">
              <SkeletonShimmer className="h-6 w-full" />
            </DSExample>
          </DSSection>

          <DSSection id="sonner" title="Sonner (toast)">
            <DSExample title="Triggers">
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => toast("Mensagem padrão")}>Default</Button>
                <Button variant="outline" onClick={() => toast.success("Tudo certo!")}>Success</Button>
                <Button variant="destructive" onClick={() => toast.error("Algo deu errado")}>Error</Button>
              </div>
            </DSExample>
          </DSSection>

          <DSSection id="empty" title="EmptyState">
            <DSExample title="Sem dados">
              <EmptyState
                icon={Inbox}
                title="Nenhum registro"
                description="Adicione um novo item para começar."
                action={{ label: "Adicionar", onClick: () => toast("Adicionar clicado") }}
              />
            </DSExample>
          </DSSection>

          {/* ============== OVERLAYS ============== */}
          <DSSection id="dialog" title="Dialog / AlertDialog">
            <DSExample title="Triggers">
              <div className="flex flex-wrap gap-2">
                <Dialog>
                  <DialogTrigger asChild><Button>Dialog</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmação</DialogTitle>
                      <DialogDescription>Ação irreversível.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline">Cancelar</Button>
                      <Button>Confirmar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="destructive">AlertDialog</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </DSExample>
          </DSSection>

          <DSSection id="sheet-drawer" title="Sheet / Drawer">
            <DSExample title="Sheet (lateral, desktop)">
              <Sheet>
                <SheetTrigger asChild><Button variant="outline">Abrir Sheet</Button></SheetTrigger>
                <SheetContent>
                  <SheetHeader><SheetTitle>Sheet</SheetTitle><SheetDescription>Painel lateral.</SheetDescription></SheetHeader>
                </SheetContent>
              </Sheet>
            </DSExample>
            <DSExample title="Drawer (mobile bottom sheet)">
              <Drawer>
                <DrawerTrigger asChild><Button variant="outline">Abrir Drawer</Button></DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader><DrawerTitle>Drawer</DrawerTitle><DrawerDescription>Bottom sheet.</DrawerDescription></DrawerHeader>
                  <DrawerFooter><Button>Confirmar</Button></DrawerFooter>
                </DrawerContent>
              </Drawer>
            </DSExample>
          </DSSection>

          <DSSection id="popover-tooltip" title="Popover / Tooltip / HoverCard">
            <DSExample title="Examples">
              <div className="flex flex-wrap gap-2">
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline">Popover</Button></PopoverTrigger>
                  <PopoverContent className="md-body-medium">Conteúdo flutuante.</PopoverContent>
                </Popover>
                <Tooltip>
                  <TooltipTrigger asChild><Button variant="outline">Tooltip</Button></TooltipTrigger>
                  <TooltipContent>Texto curto</TooltipContent>
                </Tooltip>
                <HoverCard>
                  <HoverCardTrigger asChild><Button variant="outline">HoverCard</Button></HoverCardTrigger>
                  <HoverCardContent className="md-body-medium">Card rico no hover.</HoverCardContent>
                </HoverCard>
              </div>
            </DSExample>
          </DSSection>

          <DSSection id="command" title="Command palette">
            <DSExample title="Inline">
              <Command className="rounded-lg border border-border">
                <CommandInput placeholder="Pesquisar..." />
                <CommandList>
                  <CommandEmpty>Nenhum resultado.</CommandEmpty>
                  <CommandGroup heading="Sugestões">
                    <CommandItem><Search className="h-4 w-4" /> Buscar produto</CommandItem>
                    <CommandItem><Settings className="h-4 w-4" /> Abrir settings</CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Conta">
                    <CommandItem><User className="h-4 w-4" /> Perfil</CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </DSExample>
          </DSSection>

          {/* ============== DATA ============== */}
          <DSSection id="avatar-table" title="Avatar / Table">
            <DSExample title="Avatars">
              <div className="flex items-center gap-3">
                <Avatar><AvatarFallback>JD</AvatarFallback></Avatar>
                <Avatar><AvatarFallback className="bg-primary text-primary-foreground">AB</AvatarFallback></Avatar>
                <Avatar><AvatarFallback className="bg-secondary text-secondary-foreground">CD</AvatarFallback></Avatar>
              </div>
            </DSExample>
            <DSExample title="Table (rolável em mobile)">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Produto</TableHead><TableHead>PDV</TableHead><TableHead className="text-right">Vendas</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow><TableCell>iPhone 15 Pro</TableCell><TableCell>PDV 01</TableCell><TableCell className="text-right">42</TableCell></TableRow>
                    <TableRow><TableCell>Galaxy S24</TableCell><TableCell>PDV 02</TableCell><TableCell className="text-right">31</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
            </DSExample>
          </DSSection>

          <DSSection id="carousel" title="Carousel">
            <DSExample title="Slides">
              <Carousel className="max-w-md mx-auto">
                <CarouselContent>
                  {[1,2,3].map(i => (
                    <CarouselItem key={i}>
                      <Card><CardContent className="flex h-32 items-center justify-center md-headline-small">{i}</CardContent></Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </DSExample>
          </DSSection>

          <DSSection id="chart" title="Chart (Recharts wrapper)">
            <DSExample title="Bar chart">
              <ChartContainer
                className="h-[200px] w-full"
                config={{ v: { label: "Vendas", color: "hsl(var(--primary))" } }}
              >
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="v" fill="var(--color-v)" radius={4} />
                </BarChart>
              </ChartContainer>
            </DSExample>
          </DSSection>

          <DSSection id="domain" title="BrandLogo / ProductDisplay" description="Wrappers de domínio.">
            <DSExample title="BrandLogo">
              <div className="flex flex-wrap items-center gap-3">
                {(["xs","sm","md","lg"] as const).map(s => <BrandLogo key={s} brand="APPLE" size={s} />)}
                <BrandLogo brand="SAMSUNG" />
                <BrandLogo brand="XIAOMI" />
              </div>
            </DSExample>
            <DSExample title="ProductDisplay">
              <div className="flex flex-wrap gap-6">
                <ProductDisplay brand="APPLE" model="iPhone 15 Pro" />
                <ProductDisplay brand="SAMSUNG" model="Galaxy S24" layout="stacked" logoSize="md" />
              </div>
            </DSExample>
          </DSSection>

          {/* ============== UTILITIES ============== */}
          <DSSection id="utilities" title="VisuallyHidden / ErrorBoundary / PullToRefresh" description="Utilidades não-visuais.">
            <DSExample title="VisuallyHidden">
              <Button variant="outline" size="icon" aria-label="Configurações">
                <Settings className="h-4 w-4" />
                <VisuallyHidden>Configurações</VisuallyHidden>
              </Button>
              <p className="md-body-small text-muted-foreground mt-2">Texto invisível para leitores de tela.</p>
            </DSExample>
            <DSExample title="ErrorBoundary">
              <p className="md-body-medium">
                Componente <code className="font-mono">ErrorBoundary</code> envolve árvores React para capturar erros de render.
                Já aplicado em <code className="font-mono">src/App.tsx</code>. Use em rotas/áreas que podem falhar isoladamente.
              </p>
            </DSExample>
            <DSExample title="PullToRefresh">
              <p className="md-body-medium">
                Wrapper para recarregar dados via gesto de "puxar para baixo" em mobile.
                Usar em listas/feeds via <code className="font-mono">{"<PullToRefresh onRefresh={...}>"}</code>.
              </p>
            </DSExample>
          </DSSection>

          {/* ============== PATTERNS ============== */}
          <DSSection id="patterns" title="Patterns & Layouts" description="Composições recorrentes (mobile-first).">
            <DSExample title="Page header (breadcrumb + título + actions)">
              <div className="space-y-3">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="#">Home</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>Estoque</BreadcrumbPage></BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="md-headline-small">Estoque</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Exportar</Button>
                    <Button size="sm">Novo item</Button>
                  </div>
                </div>
              </div>
            </DSExample>

            <DSExample title="KPI cards (mobile-first)">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {[
                  { t: "Receita", v: "R$ 128.4k" },
                  { t: "Vendas", v: "1.284" },
                  { t: "Margem", v: "32%" },
                  { t: "CPM", v: "R$ 4,21" },
                ].map(k => (
                  <Card key={k.t} className="md-elev-1">
                    <CardHeader className="pb-2"><CardTitle className="md-label-medium text-muted-foreground">{k.t}</CardTitle></CardHeader>
                    <CardContent className="md-headline-small">{k.v}</CardContent>
                  </Card>
                ))}
              </div>
            </DSExample>

            <DSExample title="FilterBar + SearchFilter + SelectFilter (collapsible em mobile)">
              <FilterBar onClear={() => { setFilterValue(""); setSelectFilterValue("all"); }} hasActiveFilters={!!filterValue || selectFilterValue !== "all"}>
                <SearchFilter value={filterValue} onChange={setFilterValue} placeholder="Buscar produto..." />
                <SelectFilter
                  value={selectFilterValue}
                  onChange={setSelectFilterValue}
                  placeholder="Marca"
                  options={[
                    { value: "all", label: "Todas as marcas" },
                    { value: "apple", label: "Apple" },
                    { value: "samsung", label: "Samsung" },
                  ]}
                />
              </FilterBar>
            </DSExample>

            <DSExample title="PDVFilter (referência)">
              <p className="md-body-medium text-muted-foreground">
                Wrapper <code className="font-mono">PDVFilter</code> usa <code className="font-mono">usePreferences</code> para auto-seleção;
                renderizado nas páginas de Dashboard / Estoque / Financeiro. Ver <code className="font-mono">src/components/ui/PDVFilter.tsx</code>.
              </p>
            </DSExample>

            <DSExample title="Mobile card list (substitui tabela em <md)">
              <div className="space-y-2">
                {[
                  { p: "iPhone 15 Pro", pdv: "PDV 01", v: 42 },
                  { p: "Galaxy S24",    pdv: "PDV 02", v: 31 },
                ].map(r => (
                  <Card key={r.p}>
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="md-title-small truncate">{r.p}</div>
                        <div className="md-body-small text-muted-foreground">{r.pdv}</div>
                      </div>
                      <Badge variant="secondary">{r.v} vendas</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DSExample>

            <DSExample title="Responsive form">
              <form className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-2xl">
                <div className="space-y-1.5"><Label>Nome</Label><Input placeholder="Nome completo" /></div>
                <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" placeholder="email@exemplo.com" /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Observação</Label><Textarea rows={3} /></div>
                <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <Button variant="outline" type="button">Cancelar</Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DSExample>
          </DSSection>

          {/* ============== DATA VIZ (DASHBOARD) ============== */}
          <DSSection id="kpi-cards" title="KPI / Summary cards" description="Cards de métrica usados no Dashboard e Financeiro.">
            <DSExample title="KPICard (variants)">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {(() => {
                  const today = new Date();
                  const start = new Date(); start.setDate(today.getDate() - 13);
                  const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 14);
                  const prevEnd = new Date(start); prevEnd.setDate(prevEnd.getDate() - 1);
                  const mkTrend = (cur: number, prev: number) => ({
                    percentage: Math.round(((cur - prev) / prev) * 1000) / 10,
                    hasPreviousData: true,
                    isPositive: cur >= prev,
                    currentPeriod: { start, end: today },
                    previousPeriod: { start: prevStart, end: prevEnd },
                    currentValue: cur,
                    previousValue: prev,
                  });
                  return (
                    <>
                      <KPICard title="Receita" value="R$ 128.4k" icon={DollarSign} variant="success" trend={mkTrend(128400, 114200)} />
                      <KPICard title="Vendas" value="1.284" icon={ShoppingCart} trend={mkTrend(1284, 1325)} />
                    </>
                  );
                })()}
                <KPICard title="Ticket médio" value="R$ 99,9" icon={TrendingUpIcon} variant="warning" />
                <KPICard title="Perda" value="R$ 4.2k" icon={Package} variant="danger" subtitle="3.2% do total" />
              </div>
            </DSExample>
            <DSExample title="QuickStats (badges)">
              <QuickStats peakTimeRange="14h-16h" peakTimeRangeRevenue={4820} bestDay="Sex" bestDayRevenue={6240} />
            </DSExample>
            <DSExample title="FinancialSummaryCard">
              <FinancialSummaryCard margemOperacional={24.6} custoporMaquina={1850} taxaPerda={3.2} referenceMonth={new Date()} />
            </DSExample>
            <DSExample title="LossAnalysisCard">
              <LossAnalysisCard totalCancellations={840} cancelledTransactions={6} totalRefunds={520} refundedTransactions={4} />
            </DSExample>
          </DSSection>

          <DSSection id="chart-wrappers" title="Chart wrappers" description="Containers compartilhados por todos os charts.">
            <DSExample title="ChartCard (placeholder)">
              <ChartCard title="Título do gráfico" description="Subtítulo descritivo curto." icon={TrendingUpIcon} iconColor="text-primary">
                <div className="h-32 flex items-center justify-center md-body-medium text-muted-foreground">[ conteúdo do gráfico ]</div>
              </ChartCard>
            </DSExample>
            <DSExample title="ChartSkeleton">
              <ChartSkeleton />
            </DSExample>
            <DSExample title="ChartEmptyState">
              <div className="rounded-lg border border-border">
                <ChartEmptyState />
              </div>
            </DSExample>
          </DSSection>

          <DSSection id="sales-charts" title="Sales charts" description="Visualizações de receita.">
            <DSExample title="SalesByDayChart"><SalesByDayChart data={salesByDayMock} /></DSExample>
            <DSExample title="SalesHeatmapChart"><SalesHeatmapChart data={heatmapMock} /></DSExample>
            <DSExample title="TopProductsChart"><TopProductsChart data={topProductsMock} /></DSExample>
          </DSSection>

          <DSSection id="stock-charts" title="Stock charts" description="Estado e evolução do estoque.">
            <DSExample title="StockHistoryChart (preview standalone)"><StockHistoryPreview /></DSExample>
            <DSExample title="StockByBrandChart (preview standalone)"><StockByBrandPreview /></DSExample>
          </DSSection>

          <DSSection id="loss-charts" title="Loss charts" description="Cancelamentos e reembolsos.">
            <DSExample title="LossesByDayChart"><LossesByDayChart data={lossesByDayMock} /></DSExample>
          </DSSection>

          <DSSection id="product-charts" title="Product charts" description="Charts em modal de produto (src/components/stock/).">
            <DSExample title="ProductSalesByDayChart">
              <ProductSalesByDayChart data={productSalesByDayMock} bestDay={{ day: 5, dayName: "Sex", count: 14 }} />
            </DSExample>
            <DSExample title="ProductSalesByHourChart">
              <ProductSalesByHourChart data={productSalesByHourMock} peakHour={{ hour: 14, count: 9 }} />
            </DSExample>
            <DSExample title="ProductSalesHistoryChart (estado vazio)">
              <ProductSalesHistoryChart productName={null} />
            </DSExample>
          </DSSection>

          <DSSection id="tables-filters" title="Alerts table / Date filter">
            <DSExample title="StockAlertsTable"><StockAlertsTable data={stockAlertsMock} /></DSExample>
            <DSExample title="DateRangeFilter"><DateRangeFilterDemo /></DSExample>
          </DSSection>

          {/* ─── DS Novo (Sprint refresh) ─── */}
          <DSSection id="brand-logo" title="Brand — Logo" description="Logo oficial PrintMyCase em SVG vetorial. Use sempre via componente <Logo />.">
            <DSExample title="Variant: full (fundo claro)">
              <div className="flex items-center justify-center p-8 bg-background border border-border rounded-[var(--radius)]">
                <Logo className="h-16" />
              </div>
            </DSExample>
            <DSExample title="Variant: full + mono (fundo escuro / sidebar)">
              <div className="flex items-center justify-center p-8 bg-primary rounded-[var(--radius)]">
                <Logo className="h-16" mono />
              </div>
            </DSExample>
            <DSExample title="Variant: icon (símbolo compacto)">
              <div className="flex items-center gap-6 p-6 bg-card border border-border rounded-[var(--radius)]">
                <Logo variant="icon" className="h-8 w-8" />
                <Logo variant="icon" className="h-12 w-12" />
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                  <Logo variant="icon" className="h-7 w-7" mono />
                </div>
              </div>
            </DSExample>
            <DSExample title="Uso">
              <pre className="text-[12px] font-mono bg-muted rounded-[8px] p-4 overflow-x-auto">
{`import { Logo } from "@/components/ui/Logo";

<Logo className="h-10" />              // padrão
<Logo className="h-10" mono />         // fundo escuro
<Logo variant="icon" className="h-6" /> // símbolo`}
              </pre>
            </DSExample>
            <DSExample title="Regras de uso">
              <ul className="text-[13px] text-foreground/80 space-y-1.5 list-disc pl-5">
                <li>Tamanho mínimo recomendado: <strong>32px</strong> de altura.</li>
                <li>Clear-space mínimo ao redor: <strong>50%</strong> da altura do logo.</li>
                <li>Em fundos escuros use <code className="font-mono text-primary">mono</code> (filtro inverso).</li>
                <li>Nunca aplicar sombras, contornos ou rotação ao logo.</li>
                <li>Sempre via <code className="font-mono text-primary">&lt;Logo /&gt;</code> — nunca <code className="font-mono">&lt;img&gt;</code> direto.</li>
              </ul>
            </DSExample>
          </DSSection>

          <DSSection id="ds-novo-tokens" title="DS Novo — Tokens de Cor" description="Paleta semântica do refresh.">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: "--primary", cls: "bg-primary" },
                { name: "--background", cls: "bg-background border border-border" },
                { name: "--card", cls: "bg-card border border-border" },
                { name: "--muted", cls: "bg-muted" },
                { name: "--border", cls: "bg-border" },
                { name: "--foreground", cls: "bg-foreground" },
                { name: "--muted-foreground", cls: "bg-muted-foreground" },
                { name: "--destructive", cls: "bg-destructive" },
              ].map((t) => (
                <div key={t.name} className="rounded-[var(--radius)] border border-border overflow-hidden">
                  <div className={`${t.cls} h-16`} />
                  <div className="px-3 py-2 text-[12px] font-mono text-muted-foreground">{t.name}</div>
                </div>
              ))}
            </div>
          </DSSection>

          <DSSection id="ds-novo-typography" title="Tipografia — DM Sans" description="Escalas em uso no refresh.">
            <div className="space-y-3">
              {[
                { size: "28px", weight: 800, label: "Auth title" },
                { size: "22px", weight: 700, label: "KPI value" },
                { size: "17px", weight: 700, label: "Page title" },
                { size: "14.5px", weight: 700, label: "Card title" },
                { size: "13.5px", weight: 600, label: "Button" },
                { size: "12px", weight: 500, label: "Label / badge" },
                { size: "11px", weight: 600, label: "Table header" },
              ].map((t) => (
                <div key={t.label} className="flex items-baseline gap-4 border-b border-border pb-2">
                  <span style={{ fontSize: t.size, fontWeight: t.weight }}>Aa Bb 123</span>
                  <span className="text-[12px] text-muted-foreground font-mono">
                    {t.size} / {t.weight} — {t.label}
                  </span>
                </div>
              ))}
            </div>
          </DSSection>

          <DSSection id="ds-novo-shell" title="Shell — Sidebar Sólida" description="Preview estático.">
            <div className="flex h-64 rounded-[var(--radius)] border border-border overflow-hidden">
              <div className="w-[200px] bg-primary text-white p-4 flex flex-col gap-2">
                <div className="text-[14px] font-bold mb-3">Logo</div>
                {["Dashboard", "Estoque", "Vendas", "Marketing", "Financeiro"].map((l, i) => (
                  <div
                    key={l}
                    className={`px-3 py-2 rounded-[8px] text-[13.5px] ${i === 0 ? "bg-white/15 font-semibold" : "text-white/80"}`}
                  >
                    {l}
                  </div>
                ))}
              </div>
              <div className="flex-1 bg-background p-4 text-[12px] text-muted-foreground">conteúdo…</div>
            </div>
          </DSSection>

          <DSSection id="ds-novo-kpi" title="KPI Card" description="4 variants.">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Receita", value: "R$ 12.4k", color: "hsl(158 64% 36%)" },
                { label: "Vendas", value: "1.234", color: "hsl(var(--primary))" },
                { label: "Visitas", value: "8.7k", color: "hsl(217 91% 50%)" },
                { label: "Perdas", value: "R$ 320", color: "hsl(var(--destructive))" },
              ].map((k) => (
                <div key={k.label} className="bg-card border border-border rounded-[var(--radius)] p-4">
                  <div className="text-[11px] uppercase tracking-[0.04em] text-muted-foreground font-semibold">{k.label}</div>
                  <div className="text-[22px] font-extrabold mt-1" style={{ color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>
          </DSSection>

          <DSSection id="ds-novo-status" title="Status Badges" description="Estados semânticos.">
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[hsl(158_64%_36%/0.15)] text-[hsl(158_64%_28%)]">ok</span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[hsl(38_92%_50%/0.18)] text-[hsl(38_92%_38%)]">low</span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-destructive/15 text-destructive">out</span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/15 text-primary">processing</span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-destructive/15 text-destructive">error</span>
            </div>
          </DSSection>

          <DSSection id="ds-novo-sync" title="Sync Card" description="Estados estáticos.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { state: "idle", color: "hsl(var(--muted-foreground))", label: "Pronto", btn: "Sincronizar" },
                { state: "loading", color: "hsl(var(--primary))", label: "Sincronizando…", btn: "Sincronizando…" },
                { state: "success", color: "hsl(158 64% 36%)", label: "Sincronizado", btn: "Sincronizar" },
                { state: "error", color: "hsl(var(--destructive))", label: "Falha", btn: "Tentar novamente" },
              ].map((s) => (
                <div key={s.state} className="bg-card border border-border rounded-[var(--radius)] p-4 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-[13.5px] font-semibold">Sync {s.state}</div>
                    <div className="text-[12px]" style={{ color: s.color }}>{s.label}</div>
                  </div>
                  <button className="px-3 py-1.5 rounded-[8px] bg-primary text-white text-[12.5px] font-semibold disabled:opacity-60" disabled={s.state === "loading"}>
                    {s.btn}
                  </button>
                </div>
              ))}
            </div>
          </DSSection>

          <footer className="md-body-small text-muted-foreground py-8 flex items-start gap-2 flex-wrap">
            <Smartphone className="h-3.5 w-3.5 mt-1 shrink-0" />
            <span className="min-w-0 break-words">
              61 UI + 18 dashboard componentes documentados · espelho vivo de{" "}
              <code className="font-mono break-all">src/components/ui</code>.
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}