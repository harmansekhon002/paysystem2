"use client"

import { useTheme } from "next-themes"
import { type TooltipProps } from "recharts"

// Shared custom tooltip for recharts (BarChart)
function CustomChartTooltip({
  active,
  payload,
  label,
  formatter,
  theme,
}: TooltipProps<number, string> & {
  theme: "light" | "dark"
  formatter?: (value: number, name: string) => [string, string]
}) {
  if (!active || !payload || !payload.length) return null;
  const isDark = theme === 'dark';
  const bg = isDark ? '#111827' : '#fff';
  const color = isDark ? '#f9fafb' : '#111827';
  const titleColor = isDark ? '#22d3aa' : '#059669';
  const numericValue = Number(payload[0]?.value ?? 0)
  const seriesName = String(payload[0]?.name ?? "")
  const value = formatter
    ? formatter(numericValue, seriesName)
    : [`$${numericValue}`, seriesName]
  const displayValue = String(value[0]).replace(/^\$\$/, "$")
  return (
    <div
      style={{
        background: bg,
        color,
        border: 'none',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 700,
        boxShadow: isDark ? '0 4px 16px 0 rgba(0,0,0,0.85)' : '0 2px 8px 0 rgba(0,0,0,0.08)',
        padding: '12px 18px',
        minWidth: 90,
        textAlign: 'center',
        letterSpacing: '0.01em',
      }}
    >
      <div style={{ color: titleColor, fontWeight: 700 }}>{String(label ?? "")}</div>
      <div style={{ color, fontWeight: 700 }}>{displayValue}</div>
    </div>
  );
}

import { useState, useMemo } from "react"
import { Plus, Trash2, Briefcase, Settings2, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { useAppData } from "@/components/data-provider"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, JOB_TEMPLATES, RATE_TYPE_LABELS, type RateType, type PenaltyRates, type JobTemplate } from "@/lib/store"
import { trackEvent } from "@/lib/analytics"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Cell, Rectangle
} from "recharts"
import { PieChart } from "@/components/ui/pie-chart"

function RateEditor({ rates, onChange }: { rates: PenaltyRates; onChange: (r: PenaltyRates) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(Object.keys(RATE_TYPE_LABELS) as RateType[]).map(rt => (
        <div key={rt} className="flex flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">{RATE_TYPE_LABELS[rt]}</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={rates[rt]}
            onChange={e => onChange({ ...rates, [rt]: parseFloat(e.target.value) || 0 })}
            className="h-8 text-sm"
          />
        </div>
      ))}
    </div>
  )
}

export function Earnings() {
  const { data, addJob, updateJob, removeJob } = useAppData()
    // Edit job dialog state
    const [editJobId, setEditJobId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<null | JobTemplate>(null);

    const openEditJob = (job: JobTemplate) => {
      setEditJobId(job.id);
      setEditForm({ ...job });
    };
    const closeEditJob = () => {
      setEditJobId(null);
      setEditForm(null);
    };
    const handleEditJobSave = () => {
      if (editJobId && editForm) {
        updateJob(editJobId, {
          name: editForm.name,
          category: editForm.category,
          baseRate: editForm.baseRate,
          rates: editForm.rates,
        });
        toast({ title: "Job updated", description: editForm.name });
        closeEditJob();
      }
    };
  const { toast } = useToast()
  const currencySymbol = data.settings.currencySymbol
  const { resolvedTheme } = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [template, setTemplate] = useState("custom")
  const hasJobs = data.jobs.length > 0
  const hasShifts = data.shifts.length > 0
  const [form, setForm] = useState({
    name: "",
    category: "custom" as JobTemplate["category"],
    baseRate: 25,
    rates: { weekday: 25, saturday: 30, sunday: 35, public_holiday: 50, overtime: 37.5 } as PenaltyRates,
  })

  const applyTemplate = (idx: string) => {
    setTemplate(idx)
    if (idx === "custom") return
    const t = JOB_TEMPLATES[parseInt(idx)]
    if (t) {
      setForm({ name: t.name, category: t.category, baseRate: t.baseRate, rates: { ...t.rates } })
    }
  }

  const handleAddJob = () => {
    if (!form.name) return
    addJob({ name: form.name, category: form.category, baseRate: form.baseRate, rates: form.rates })
    trackEvent("workplace_added", { category: form.category })
    toast({ title: "Workplace added", description: form.name })
    setDialogOpen(false)
    setForm({ name: "", category: "custom", baseRate: 25, rates: { weekday: 25, saturday: 30, sunday: 35, public_holiday: 50, overtime: 37.5 } })
    setTemplate("custom")
  }

  // Stats
  const stats = useMemo(() => {
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
    const weekStart = monday.toISOString().split("T")[0]

    const monthShifts = data.shifts.filter(s => s.date >= monthStart)
    const weekShifts = data.shifts.filter(s => s.date >= weekStart)

    const monthEarnings = monthShifts.reduce((s, sh) => s + sh.earnings, 0)
    const weekEarnings = weekShifts.reduce((s, sh) => s + sh.earnings, 0)
    const fortnightStart = new Date(monday)
    fortnightStart.setDate(monday.getDate() - 7)
    const fnStart = fortnightStart.toISOString().split("T")[0]
    const fnShifts = data.shifts.filter(s => s.date >= fnStart)
    const fnEarnings = fnShifts.reduce((s, sh) => s + sh.earnings, 0)

    return { monthEarnings, weekEarnings, fnEarnings }
  }, [data.shifts])

  // Earnings by rate type pie chart
  const rateTypePie = useMemo(() => {
    const byRate: Record<RateType, number> = { weekday: 0, saturday: 0, sunday: 0, public_holiday: 0, overtime: 0 }
    data.shifts.forEach(s => { byRate[s.rateType] += s.earnings })
    const colors = ["#0d9488", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6"]
    return (Object.keys(byRate) as RateType[])
      .filter(rt => byRate[rt] > 0)
      .map((rt, i) => ({ name: RATE_TYPE_LABELS[rt], value: Math.round(byRate[rt] * 100) / 100, color: colors[i] }))
  }, [data.shifts])

  // Earnings by job bar chart
  const jobBarData = useMemo(() => {
    return data.jobs.map(job => {
      const jobShifts = data.shifts.filter(s => s.jobId === job.id)
      const total = jobShifts.reduce((s, sh) => s + sh.earnings, 0)
      const hours = jobShifts.reduce((s, sh) => s + sh.hours, 0)
      return { name: job.name, earnings: Math.round(total * 100) / 100, hours, color: job.color }
    })
  }, [data.jobs, data.shifts])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Earnings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage jobs and track income with penalty rates.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="size-4" /><span className="hidden sm:inline">Add Job</span></Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Job</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-4">
              {/* Template picker */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Start from template</Label>
                <Select value={template} onValueChange={applyTemplate}>
                  <SelectTrigger><SelectValue placeholder="Choose a template or custom" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Job</SelectItem>
                    {JOB_TEMPLATES.map((t, i) => (
                      <SelectItem key={i} value={String(i)}>{t.name} - {formatCurrency(t.baseRate, currencySymbol)}/hr</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Job Name</Label>
                <Input placeholder="e.g. My Cafe Job" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as JobTemplate["category"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospitality">Food & Hospitality</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="tutoring">Tutoring / Freelance</SelectItem>
                    <SelectItem value="delivery">Delivery / Gig</SelectItem>
                    <SelectItem value="custom">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Penalty rates editor */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs flex items-center gap-1"><Settings2 className="size-3" />Hourly Rates ({data.settings.currency})</Label>
                <RateEditor rates={form.rates} onChange={r => setForm(f => ({ ...f, rates: r, baseRate: r.weekday }))} />
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-border bg-secondary/30 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Rate Preview</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {(Object.keys(RATE_TYPE_LABELS) as RateType[]).map(rt => (
                    <div key={rt} className="flex justify-between py-0.5">
                      <span className="text-muted-foreground">{RATE_TYPE_LABELS[rt]}</span>
                      <span className="font-medium text-foreground">{formatCurrency(form.rates[rt], currencySymbol)}/hr</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
              <Button onClick={handleAddJob} disabled={!form.name.trim()}>Add Job</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">This Week</span>
            <p className="mt-1 text-xl font-semibold text-foreground">{formatCurrency(stats.weekEarnings, currencySymbol)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Fortnight</span>
            <p className="mt-1 text-xl font-semibold text-foreground">{formatCurrency(stats.fnEarnings, currencySymbol)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">This Month</span>
            <p className="mt-1 text-xl font-semibold text-foreground">{formatCurrency(stats.monthEarnings, currencySymbol)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* By rate type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By Rate Type</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
            {rateTypePie.length > 0 ? (
              <>
                <PieChart
                  data={rateTypePie}
                  tooltipFormatter={(value) => ["$" + formatCurrency(value, currencySymbol).replace(/^\$/, ''), "Earned"]}
                />
                <div className="flex flex-col gap-1.5">
                  {rateTypePie.map(e => (
                    <div key={e.name} className="flex items-center gap-2 text-xs text-muted-foreground dark:text-[#888]">
                      <div className="size-2 rounded-full" style={{ background: e.color }} />
                      <span>{e.name}</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(e.value, currencySymbol)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-6 text-sm text-muted-foreground">Log shifts to see rate breakdowns.</p>
            )}
          </CardContent>
        </Card>

        {/* By job */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By Job</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] pt-0">
            {hasJobs && hasShifts ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jobBarData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#888' : '#e5e7eb'} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#888' : '#222' }} tickLine={false} axisLine={false} stroke={typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#888' : '#222'} />
                  <YAxis tick={{ fontSize: 11, fill: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#888' : '#222' }} tickLine={false} axisLine={false} stroke={typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#888' : '#222'} tickFormatter={v => `${currencySymbol}${v}`} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.12)", stroke: "transparent" }}
                    content={
                      <CustomChartTooltip
                        theme={resolvedTheme === "dark" ? "dark" : "light"}
                        formatter={(v: number) => [formatCurrency(v, currencySymbol), "Earnings"]}
                      />
                    }
                  />
                  <Bar
                    dataKey="earnings"
                    radius={[6, 6, 0, 0]}
                    stroke="transparent"
                    activeBar={
                      <Rectangle stroke="hsl(var(--border) / 0.35)" strokeWidth={1} />
                    }
                  >
                    {jobBarData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Add jobs and log shifts to see earnings by workplace.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Jobs list with expandable rate tables */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Your Jobs</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {hasJobs ? (
            <div className="flex flex-col divide-y divide-border">
              {data.jobs.map(job => {
                const isExpanded = expandedJob === job.id;
                const jobShifts = data.shifts.filter(s => s.jobId === job.id);
                const totalEarnings = jobShifts.reduce((s, sh) => s + sh.earnings, 0);
                const totalHours = jobShifts.reduce((s, sh) => s + sh.hours, 0);
                return (
                  <div key={job.id} className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${job.color}18` }}>
                        <Briefcase className="size-4" style={{ color: job.color }} />
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{job.name}</span>
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 capitalize">{job.category}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(job.baseRate, currencySymbol)}/hr base &middot; {totalHours}h &middot; {formatCurrency(totalEarnings, currencySymbol)} earned
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => setExpandedJob(isExpanded ? null : job.id)}>
                          {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-primary" onClick={() => openEditJob(job)} aria-label={`Edit ${job.name}`}>
                          <Settings2 className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => {
                          removeJob(job.id);
                          trackEvent("workplace_removed");
                          toast({ title: "Workplace removed" });
                        }} aria-label={`Remove ${job.name}`}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 ml-12 rounded-xl border border-border bg-secondary/30 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Penalty Rate Table</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
                          {(Object.keys(RATE_TYPE_LABELS) as RateType[]).map(rt => (
                            <div key={rt} className="flex justify-between py-0.5">
                              <span className="text-muted-foreground">{RATE_TYPE_LABELS[rt]}</span>
                              <span className="font-medium text-foreground">{formatCurrency(job.rates[rt], currencySymbol)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            {/* Edit Job Dialog */}
            <Dialog open={!!editJobId} onOpenChange={v => !v && closeEditJob()}>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Edit Job</DialogTitle></DialogHeader>
                {editForm && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Job Name</Label>
                      <Input value={editForm.name} onChange={e => setEditForm(f => f ? { ...f, name: e.target.value } : f)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Category</Label>
                      <Select value={editForm.category} onValueChange={v => setEditForm(f => f ? { ...f, category: v as JobTemplate["category"] } : f)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hospitality">Food & Hospitality</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="tutoring">Tutoring / Freelance</SelectItem>
                          <SelectItem value="delivery">Delivery / Gig</SelectItem>
                          <SelectItem value="custom">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Base Rate</Label>
                      <Input type="number" min={0} step={0.01} value={editForm.baseRate} onChange={e => setEditForm(f => f ? { ...f, baseRate: parseFloat(e.target.value) || 0 } : f)} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs flex items-center gap-1"><Settings2 className="size-3" />Hourly Rates</Label>
                      <RateEditor rates={editForm.rates} onChange={r => setEditForm(f => f ? { ...f, rates: r } : f)} />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                  <Button onClick={handleEditJobSave} disabled={!editForm?.name.trim()}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No workplaces yet. Add a job to start tracking earnings.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
