import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sun, Moon, AlertCircle, CheckCircle2, Info, Search } from "lucide-react";
import { useTheme } from "next-themes";

import { DSSection, DSExample } from "@/components/design-system/DSSection";
import { m3Palette, m3Typography, m3Shape, m3Elevation, m3Motion, m3Spacing, M3_SEED } from "@/design-system/tokens";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const NAV_SECTIONS = [
  { group: "Foundations", items: [
    { id: "color", label: "Color" },
    { id: "typography", label: "Typography" },
    { id: "shape", label: "Shape" },
    { id: "elevation", label: "Elevation" },
    { id: "spacing", label: "Spacing" },
    { id: "motion", label: "Motion" },
  ]},
  { group: "Components", items: [
    { id: "buttons", label: "Buttons" },
    { id: "inputs", label: "Inputs & Forms" },
    { id: "selection", label: "Selection Controls" },
    { id: "containers", label: "Containers" },
    { id: "navigation", label: "Navigation" },
    { id: "feedback", label: "Feedback" },
    { id: "data", label: "Data Display" },
    { id: "overlays", label: "Overlays" },
  ]},
  { group: "Patterns", items: [
    { id: "patterns", label: "Patterns & Layouts" },
  ]},
];

function ColorRamp({ name, palette }: { name: string; palette: Record<string, string> }) {
  return (
    <div>
      <h4 className="md-label-large mb-2 capitalize">{name}</h4>
      <div className="flex flex-wrap gap-1 rounded-md overflow-hidden border border-border">
        {Object.entries(palette).map(([tone, hex]) => (
          <div key={tone} className="flex-1 min-w-[60px]">
            <div className="h-16" style={{ background: hex }} />
            <div className="px-2 py-1 text-[10px] bg-card border-t border-border">
              <div className="font-mono">{tone}</div>
              <div className="font-mono text-muted-foreground">{hex}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SystemColorChip({ name, varName, fg }: { name: string; varName: string; fg?: string }) {
  return (
    <div className="rounded-md overflow-hidden border border-border">
      <div
        className="h-16 flex items-center justify-center text-xs font-medium"
        style={{ background: `hsl(var(${varName}))`, color: fg ? `hsl(var(${fg}))` : undefined }}
      >
        {fg ? "Aa" : ""}
      </div>
      <div className="px-2 py-1.5 bg-card text-[11px]">
        <div className="font-medium truncate">{name}</div>
        <div className="font-mono text-muted-foreground truncate">{varName}</div>
      </div>
    </div>
  );
}

export default function DesignSystem() {
  const { theme, setTheme } = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top app bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 md:px-8 h-14">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="md-title-large">Design System</h1>
            <Badge variant="outline" className="hidden sm:inline-flex">Material 3</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Side nav */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto p-4">
          <nav className="space-y-6">
            {NAV_SECTIONS.map(group => (
              <div key={group.group}>
                <div className="md-label-medium text-muted-foreground uppercase tracking-wider mb-2">{group.group}</div>
                <ul className="space-y-1">
                  {group.items.map(item => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="block px-3 py-1.5 rounded-md md-body-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 px-4 md:px-8 py-8 max-w-6xl">
          <div className="mb-12">
            <h2 className="md-display-small mb-2">Design System Reference</h2>
            <p className="md-body-large text-muted-foreground max-w-3xl">
              Living styleguide baseado em Material 3. Documenta foundations (cor, tipografia, shape, elevation,
              motion, spacing) e todos os componentes shadcn/Radix usados na aplicação. Esta página é a fonte de
              verdade para a migração progressiva do frontend.
            </p>
            <p className="md-body-small text-muted-foreground mt-3">
              Seed color: <code className="font-mono">{M3_SEED}</code> · Tokens M3 expostos como CSS vars
              (<code className="font-mono">--md-sys-*</code>) coexistindo com os tokens semânticos atuais.
            </p>
          </div>

          {/* COLOR */}
          <DSSection id="color" title="Color" description="Paletas tonais (0–100) derivadas da seed e roles M3 (primary/secondary/tertiary, surface containers, outline). Cada role tem variante on-* para texto/ícones acessíveis.">
            <DSExample title="System roles (light/dark via tokens)">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SystemColorChip name="Primary"            varName="--md-sys-color-primary"            fg="--md-sys-color-on-primary" />
                <SystemColorChip name="Primary Container"  varName="--md-sys-color-primary-container"  fg="--md-sys-color-on-primary-container" />
                <SystemColorChip name="Secondary"          varName="--md-sys-color-secondary"          fg="--md-sys-color-on-secondary" />
                <SystemColorChip name="Secondary Container"varName="--md-sys-color-secondary-container"fg="--md-sys-color-on-secondary-container" />
                <SystemColorChip name="Tertiary"           varName="--md-sys-color-tertiary"           fg="--md-sys-color-on-tertiary" />
                <SystemColorChip name="Tertiary Container" varName="--md-sys-color-tertiary-container" fg="--md-sys-color-on-tertiary-container" />
                <SystemColorChip name="Error"              varName="--md-sys-color-error"              fg="--md-sys-color-on-error" />
                <SystemColorChip name="Error Container"    varName="--md-sys-color-error-container"    fg="--md-sys-color-on-error-container" />
                <SystemColorChip name="Surface"            varName="--md-sys-color-surface"            fg="--md-sys-color-on-surface" />
                <SystemColorChip name="Surface Variant"    varName="--md-sys-color-surface-variant"    fg="--md-sys-color-on-surface-variant" />
                <SystemColorChip name="Background"         varName="--md-sys-color-background"         fg="--md-sys-color-on-background" />
                <SystemColorChip name="Outline"            varName="--md-sys-color-outline" />
              </div>
            </DSExample>

            <DSExample title="Surface containers (5 levels)">
              <div className="grid grid-cols-5 gap-3">
                {["lowest","low","","high","highest"].map((lvl) => {
                  const v = lvl ? `--md-sys-color-surface-container-${lvl}` : "--md-sys-color-surface-container";
                  return <SystemColorChip key={lvl} name={`Container ${lvl||"base"}`} varName={v} fg="--md-sys-color-on-surface" />;
                })}
              </div>
            </DSExample>

            <DSExample title="Tonal palettes (gerados a partir da seed)">
              <div className="space-y-4">
                <ColorRamp name="primary"          palette={m3Palette.primary as any} />
                <ColorRamp name="secondary"        palette={m3Palette.secondary as any} />
                <ColorRamp name="tertiary"         palette={m3Palette.tertiary as any} />
                <ColorRamp name="error"            palette={m3Palette.error as any} />
                <ColorRamp name="neutral"          palette={m3Palette.neutral as any} />
                <ColorRamp name="neutral variant"  palette={m3Palette.neutralVariant as any} />
              </div>
            </DSExample>
          </DSSection>

          {/* TYPOGRAPHY */}
          <DSSection id="typography" title="Typography" description="Escala tipográfica M3 (display, headline, title, body, label × L/M/S). Aplicada via classes utilitárias .md-*.">
            <DSExample title="Type scale">
              <div className="space-y-3">
                {Object.entries(m3Typography).flatMap(([cat, sizes]) =>
                  Object.entries(sizes).map(([sz, def]) => (
                    <div key={`${cat}-${sz}`} className="flex items-baseline gap-4 border-b border-border/60 pb-2 last:border-0">
                      <span className={`md-${cat}-${sz} flex-1 truncate`}>{cat} {sz}</span>
                      <span className="md-label-small text-muted-foreground font-mono whitespace-nowrap">
                        {def.size} / {def.line} / {def.weight}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </DSExample>
          </DSSection>

          {/* SHAPE */}
          <DSSection id="shape" title="Shape" description="Sistema de corner radius M3.">
            <DSExample title="Corner scale">
              <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                {Object.entries(m3Shape).map(([k, v]) => (
                  <div key={k} className="text-center">
                    <div className="h-20 bg-primary/20 border-2 border-primary mx-auto" style={{ borderRadius: v }} />
                    <div className="md-label-medium mt-2">{k}</div>
                    <div className="md-body-small text-muted-foreground font-mono">{v}</div>
                  </div>
                ))}
              </div>
            </DSExample>
          </DSSection>

          {/* ELEVATION */}
          <DSSection id="elevation" title="Elevation" description="6 níveis de elevação (0–5) via box-shadow.">
            <DSExample title="Levels">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-6 bg-muted/40 p-6 rounded-lg">
                {Object.entries(m3Elevation).map(([k]) => (
                  <div key={k} className="text-center">
                    <div className={`h-20 bg-card rounded-lg md-elev-${k.replace("level","")}`} />
                    <div className="md-label-medium mt-2">{k}</div>
                  </div>
                ))}
              </div>
            </DSExample>
          </DSSection>

          {/* SPACING */}
          <DSSection id="spacing" title="Spacing" description="Escala 4dp para padding, gaps e margins.">
            <DSExample title="Scale">
              <div className="space-y-2">
                {Object.entries(m3Spacing).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3">
                    <span className="md-label-medium w-8 font-mono">{k}</span>
                    <div className="bg-primary h-3" style={{ width: v }} />
                    <span className="md-body-small text-muted-foreground font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </DSExample>
          </DSSection>

          {/* MOTION */}
          <DSSection id="motion" title="Motion" description="Durations e easings M3. Use .md-sys-motion-* via CSS ou as constantes TS.">
            <DSExample title="Durations">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(m3Motion.duration).map(([k, v]) => (
                  <div key={k} className="rounded-md border border-border p-3">
                    <div className="md-label-medium">{k}</div>
                    <div className="md-body-small text-muted-foreground font-mono">{v}</div>
                  </div>
                ))}
              </div>
            </DSExample>
            <DSExample title="Easings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(m3Motion.easing).map(([k, v]) => (
                  <div key={k} className="rounded-md border border-border p-3">
                    <div className="md-label-medium">{k}</div>
                    <div className="md-body-small text-muted-foreground font-mono">{v}</div>
                  </div>
                ))}
              </div>
            </DSExample>
          </DSSection>

          {/* BUTTONS */}
          <DSSection id="buttons" title="Buttons" description="Implementados via shadcn (cva). Mapping M3: default→Filled, secondary→Tonal, outline→Outlined, ghost→Text, link→Link, destructive→Error, hero→Brand gradient.">
            <DSExample title="Variants">
              <div className="flex flex-wrap gap-3">
                <Button>Filled (default)</Button>
                <Button variant="secondary">Tonal (secondary)</Button>
                <Button variant="outline">Outlined</Button>
                <Button variant="ghost">Text (ghost)</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Error</Button>
                <Button variant="hero">Hero gradient</Button>
              </div>
            </DSExample>
            <DSExample title="Sizes & states">
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" aria-label="search"><Search /></Button>
                <Button disabled>Disabled</Button>
              </div>
            </DSExample>
          </DSSection>

          {/* INPUTS */}
          <DSSection id="inputs" title="Inputs & Forms" description="Text fields, textarea, select e label. Equivalente M3: filled/outlined text field.">
            <DSExample title="Text inputs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div className="space-y-1.5">
                  <Label htmlFor="ds-name">Nome</Label>
                  <Input id="ds-name" placeholder="Digite seu nome" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ds-email">E-mail</Label>
                  <Input id="ds-email" type="email" placeholder="email@exemplo.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ds-disabled">Disabled</Label>
                  <Input id="ds-disabled" disabled value="bloqueado" />
                </div>
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
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="ds-msg">Mensagem</Label>
                  <Textarea id="ds-msg" placeholder="Escreva..." rows={3} />
                </div>
              </div>
            </DSExample>
          </DSSection>

          {/* SELECTION */}
          <DSSection id="selection" title="Selection Controls" description="Checkbox, Radio, Switch e Slider.">
            <DSExample title="Examples">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-2"><Checkbox id="c1" /><Label htmlFor="c1">Aceito os termos</Label></div>
                <div className="flex items-center gap-3"><Switch id="s1" /><Label htmlFor="s1">Notificações</Label></div>
                <RadioGroup defaultValue="a" className="flex gap-6">
                  <div className="flex items-center gap-2"><RadioGroupItem value="a" id="r1" /><Label htmlFor="r1">Opção A</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="b" id="r2" /><Label htmlFor="r2">Opção B</Label></div>
                </RadioGroup>
                <Slider defaultValue={[40]} max={100} step={1} />
              </div>
            </DSExample>
          </DSSection>

          {/* CONTAINERS */}
          <DSSection id="containers" title="Containers" description="Card (elevated/filled/outlined), Accordion, Tabs e Separator.">
            <DSExample title="Cards">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md-elev-1">
                  <CardHeader><CardTitle>Elevated</CardTitle><CardDescription>elevation level 1</CardDescription></CardHeader>
                  <CardContent>Conteúdo do card.</CardContent>
                </Card>
                <Card className="bg-secondary border-0">
                  <CardHeader><CardTitle>Filled</CardTitle><CardDescription>secondary surface</CardDescription></CardHeader>
                  <CardContent>Conteúdo do card.</CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Outlined</CardTitle><CardDescription>border only</CardDescription></CardHeader>
                  <CardContent>Conteúdo do card.</CardContent>
                </Card>
              </div>
            </DSExample>
            <DSExample title="Tabs">
              <Tabs defaultValue="a">
                <TabsList><TabsTrigger value="a">Aba A</TabsTrigger><TabsTrigger value="b">Aba B</TabsTrigger></TabsList>
                <TabsContent value="a" className="md-body-medium">Conteúdo A</TabsContent>
                <TabsContent value="b" className="md-body-medium">Conteúdo B</TabsContent>
              </Tabs>
            </DSExample>
            <DSExample title="Accordion">
              <Accordion type="single" collapsible>
                <AccordionItem value="i1"><AccordionTrigger>Item 1</AccordionTrigger><AccordionContent>Detalhe 1.</AccordionContent></AccordionItem>
                <AccordionItem value="i2"><AccordionTrigger>Item 2</AccordionTrigger><AccordionContent>Detalhe 2.</AccordionContent></AccordionItem>
              </Accordion>
            </DSExample>
          </DSSection>

          {/* NAVIGATION */}
          <DSSection id="navigation" title="Navigation" description="Top app bar (acima), sidebar, breadcrumb, pagination, tabs (ver Containers).">
            <DSExample title="Badges & chips">
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Error</Badge>
              </div>
            </DSExample>
          </DSSection>

          {/* FEEDBACK */}
          <DSSection id="feedback" title="Feedback" description="Alerts, progress, skeletons.">
            <DSExample title="Alerts">
              <div className="space-y-3">
                <Alert><Info className="h-4 w-4" /><AlertTitle>Info</AlertTitle><AlertDescription>Mensagem informativa.</AlertDescription></Alert>
                <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>Algo deu errado.</AlertDescription></Alert>
                <Alert className="border-green-500/50 text-green-700 dark:text-green-400"><CheckCircle2 className="h-4 w-4" /><AlertTitle>Sucesso</AlertTitle><AlertDescription>Operação concluída.</AlertDescription></Alert>
              </div>
            </DSExample>
            <DSExample title="Progress & skeleton">
              <div className="space-y-4">
                <Progress value={62} />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </DSExample>
          </DSSection>

          {/* DATA DISPLAY */}
          <DSSection id="data" title="Data Display" description="Avatar, Table e wrappers de domínio (KPICard, ChartCard).">
            <DSExample title="Avatars">
              <div className="flex items-center gap-3">
                <Avatar><AvatarFallback>JD</AvatarFallback></Avatar>
                <Avatar><AvatarFallback className="bg-primary text-primary-foreground">AB</AvatarFallback></Avatar>
                <Avatar><AvatarFallback className="bg-secondary text-secondary-foreground">CD</AvatarFallback></Avatar>
              </div>
            </DSExample>
            <DSExample title="Table">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Produto</TableHead><TableHead>PDV</TableHead><TableHead className="text-right">Vendas</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell>iPhone 15 Pro</TableCell><TableCell>PDV 01</TableCell><TableCell className="text-right">42</TableCell></TableRow>
                  <TableRow><TableCell>Galaxy S24</TableCell><TableCell>PDV 02</TableCell><TableCell className="text-right">31</TableCell></TableRow>
                </TableBody>
              </Table>
            </DSExample>
          </DSSection>

          {/* OVERLAYS */}
          <DSSection id="overlays" title="Overlays" description="Dialog, Tooltip, Popover, Sheet (consultar componentes em src/components/ui).">
            <DSExample title="Dialog & Tooltip">
              <div className="flex gap-3 flex-wrap">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild><Button>Abrir Dialog</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmação</DialogTitle>
                      <DialogDescription>Ação irreversível. Deseja continuar?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                      <Button onClick={() => setDialogOpen(false)}>Confirmar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Tooltip>
                  <TooltipTrigger asChild><Button variant="outline">Hover me</Button></TooltipTrigger>
                  <TooltipContent>Tooltip de exemplo</TooltipContent>
                </Tooltip>
              </div>
            </DSExample>
          </DSSection>

          {/* PATTERNS */}
          <DSSection id="patterns" title="Patterns & Layouts" description="Composições recorrentes na aplicação.">
            <DSExample title="KPI cards (mobile-first, ≥44px touch)">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

            <DSExample title="Form pattern">
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div className="space-y-1.5"><Label>Nome</Label><Input placeholder="Nome completo" /></div>
                <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" placeholder="email@exemplo.com" /></div>
                <div className="space-y-1.5 md:col-span-2"><Label>Observação</Label><Textarea rows={3} /></div>
                <div className="md:col-span-2 flex justify-end gap-2">
                  <Button variant="outline" type="button">Cancelar</Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DSExample>
          </DSSection>

          <footer className="md-body-small text-muted-foreground py-8">
            Documentação viva — atualiza automaticamente quando os componentes em <code className="font-mono">src/components/ui</code> são modificados.
          </footer>
        </main>
      </div>
    </div>
  );
}