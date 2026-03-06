"use client"

import { Briefcase, CheckSquare, Download, Filter, FileText, Loader2, MoreHorizontal, Plus, Repeat, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RATE_TYPE_LABELS, type RateType, type JobTemplate } from "@/lib/store"
import { useState, useRef } from "react"
import { useToast } from "@/hooks/use-toast"

interface ShiftFilters {
    jobId: string
    rateType: string
    dateFrom: string
    dateTo: string
}

interface ShiftHeaderActionsProps {
    isMobile: boolean
    jobs: JobTemplate[]
    filters: ShiftFilters
    setFilters: React.Dispatch<React.SetStateAction<ShiftFilters>>
    mobileFilterOpen: boolean
    setMobileFilterOpen: React.Dispatch<React.SetStateAction<boolean>>
    mobileToolsOpen: boolean
    setMobileToolsOpen: React.Dispatch<React.SetStateAction<boolean>>
    multiSelectMode: boolean
    setMultiSelectMode: React.Dispatch<React.SetStateAction<boolean>>
    setSelectedShiftIds: React.Dispatch<React.SetStateAction<string[]>>
    exportToICalendar: () => void
    setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
    setJobDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
    setRecurringDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function ShiftHeaderActions({
    isMobile,
    jobs,
    filters,
    setFilters,
    mobileFilterOpen,
    setMobileFilterOpen,
    mobileToolsOpen,
    setMobileToolsOpen,
    multiSelectMode,
    setMultiSelectMode,
    setSelectedShiftIds,
    exportToICalendar,
    setDialogOpen,
    setJobDialogOpen,
    setRecurringDialogOpen,
}: ShiftHeaderActionsProps) {
    const { toast } = useToast()
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handlePayslipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const response = await fetch("/api/ai/ocr", {
                method: "POST",
                body: formData,
            })

            if (response.ok) {
                const data = await response.json()
                toast({
                    title: "Payslip Processed",
                    description: `Extracted ${data.totalHours || 0} hours for ${data.employerName || "unknown employer"}.`,
                })
                // In a real app, we would open a dialog to confirm the extracted data
                // For now, let's just log it or show a toast
                console.log("Extracted Data:", data)
            } else {
                toast({
                    title: "OCR Failed",
                    description: "Could not parse payslip. Please try again.",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Something went wrong during upload.",
                variant: "destructive",
            })
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const hasActiveFilters = filters.jobId !== "all" || filters.rateType !== "all" || filters.dateFrom || filters.dateTo

    return (
        <div className="sticky top-14 z-30 flex flex-wrap items-center gap-2 bg-background/80 pb-3 pt-2 border-b border-border/40 px-0 backdrop-blur-md lg:relative lg:top-0 lg:flex-nowrap lg:overflow-visible lg:bg-transparent lg:p-0 lg:border-none">
            <input
                type="file"
                accept=".pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handlePayslipUpload}
            />
            {isMobile ? (
                <>
                    <Button
                        size="sm"
                        className="h-9 shrink-0 justify-center gap-1.5 whitespace-nowrap px-4 font-bold shadow-md shadow-primary/20 active:scale-95"
                        onClick={() => setDialogOpen(true)}
                    >
                        <Plus className="size-4" />
                        <span>Log Shift</span>
                    </Button>


                    <Button
                        size="sm"
                        variant="secondary"
                        className="h-9 shrink-0 justify-center gap-1.5 whitespace-nowrap px-4 font-bold bg-primary/10 text-primary border-none"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                        <span>AI Upload</span>
                    </Button>

                    <div className="h-4 w-px bg-border/60 mx-1 shrink-0" />

                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 shrink-0 justify-center gap-1.5 whitespace-nowrap px-2.5"
                        aria-label="Filter shifts"
                        onClick={() => setMobileFilterOpen(true)}
                    >
                        <Filter className="size-4" />
                        <span>Filter</span>
                        {hasActiveFilters && <Badge variant="secondary" className="ml-1 size-4 rounded-full p-0 flex justify-center items-center text-[9px]">!</Badge>}
                    </Button>

                    <Drawer open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                        <DrawerContent className="max-h-[85vh]">
                            <DrawerHeader>
                                <DrawerTitle>Filter Shifts</DrawerTitle>
                            </DrawerHeader>
                            <div className="grid gap-4 overflow-y-auto px-4 pb-8">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs">Workplace</Label>
                                    <Select value={filters.jobId} onValueChange={(v) => setFilters((f) => ({ ...f, jobId: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Workplaces</SelectItem>
                                            {jobs.map((j) => (
                                                <SelectItem key={`mobile-filter-${j.id}`} value={j.id}>{j.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs">Rate Type</Label>
                                    <Select value={filters.rateType} onValueChange={(v) => setFilters((f) => ({ ...f, rateType: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            {(Object.keys(RATE_TYPE_LABELS) as RateType[]).map((rt) => (
                                                <SelectItem key={`mobile-filter-rate-${rt}`} value={rt}>{RATE_TYPE_LABELS[rt]}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-3 xs:grid-cols-1">
                                    <div className="grid gap-1.5 min-w-0">
                                        <Label htmlFor="mobile-filter-date-from" className="text-xs">From</Label>
                                        <Input
                                            id="mobile-filter-date-from"
                                            data-testid="filter-date-from"
                                            type="date"
                                            className="h-10 sm:h-9 w-full"
                                            value={filters.dateFrom}
                                            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                                        />
                                    </div>
                                    <div className="grid gap-1.5 min-w-0">
                                        <Label htmlFor="mobile-filter-date-to" className="text-xs">To</Label>
                                        <Input
                                            id="mobile-filter-date-to"
                                            type="date"
                                            className="h-10 sm:h-9 w-full"
                                            value={filters.dateTo}
                                            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="mt-1 grid grid-cols-2 gap-2">
                                    <Button variant="outline" onClick={() => setFilters({ jobId: "all", rateType: "all", dateFrom: "", dateTo: "" })}>
                                        Clear
                                    </Button>
                                    <Button onClick={() => setMobileFilterOpen(false)}>Apply</Button>
                                </div>
                            </div>
                        </DrawerContent>
                    </Drawer>

                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 shrink-0 justify-center gap-1.5 whitespace-nowrap px-2.5"
                        aria-label="More shift tools"
                        onClick={() => setMobileToolsOpen(true)}
                    >
                        <MoreHorizontal className="size-4" />
                        <span>Tools</span>
                    </Button>
                    <Drawer open={mobileToolsOpen} onOpenChange={setMobileToolsOpen}>
                        <DrawerContent className="max-h-[80vh]">
                            <DrawerHeader>
                                <DrawerTitle>Shift Tools</DrawerTitle>
                            </DrawerHeader>
                            <div className="grid gap-2 overflow-y-auto px-4 pb-4">
                                <Button variant="outline" className="justify-start gap-2" onClick={() => { exportToICalendar(); setMobileToolsOpen(false) }}>
                                    <Download className="size-3.5" />
                                    Export calendar
                                </Button>
                                <Button variant="outline" className="justify-start gap-2" data-testid="tools-export" onClick={() => { setMultiSelectMode((prev) => !prev); setSelectedShiftIds([]); setMobileToolsOpen(false) }}>
                                    <CheckSquare className="size-3.5" />
                                    {multiSelectMode ? "Disable multi-select" : "Enable multi-select"}
                                </Button>
                                <Button variant="outline" className="justify-start gap-2" data-testid="tools-recurring" onClick={() => { setRecurringDialogOpen(true); setMobileToolsOpen(false) }}>
                                    <Repeat className="size-3.5" />
                                    Recurring shifts
                                </Button>
                                <Button variant="outline" className="justify-start gap-2" data-testid="tools-add-workplace" onClick={() => { setJobDialogOpen(true); setMobileToolsOpen(false) }}>
                                    <Briefcase className="size-3.5" />
                                    Add workplace
                                </Button>
                            </div>
                        </DrawerContent>
                    </Drawer>
                </>
            ) : null}

            {/* Desktop Filter Popover */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button size="sm" variant="outline" className="hidden h-8 shrink-0 justify-center gap-1.5 whitespace-nowrap px-2.5 sm:inline-flex sm:h-9 sm:px-3" aria-label="Filter shifts">
                        <Filter className="size-4" />
                        <span className="hidden sm:inline">Filter</span>
                        {hasActiveFilters && <Badge variant="secondary" className="ml-1 size-4 p-0 flex items-center justify-center rounded-full text-[9px]">!</Badge>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                    <div className="flex flex-col gap-4">
                        <div>
                            <h4 className="mb-3 text-sm font-medium">Filter Shifts</h4>
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs">Workplace</Label>
                                    <Select value={filters.jobId} onValueChange={v => setFilters(f => ({ ...f, jobId: v }))}>
                                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Workplaces</SelectItem>
                                            {jobs.map(j => (
                                                <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs">Rate Type</Label>
                                    <Select value={filters.rateType} onValueChange={v => setFilters(f => ({ ...f, rateType: v }))}>
                                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            {(Object.keys(RATE_TYPE_LABELS) as RateType[]).map(rt => (
                                                <SelectItem key={rt} value={rt}>{RATE_TYPE_LABELS[rt]}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="filter-date-from" className="text-xs">From</Label>
                                        <Input id="filter-date-from" type="date" className="h-8" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="filter-date-to" className="text-xs">To</Label>
                                        <Input id="filter-date-to" type="date" className="h-8" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
                                    </div>
                                </div>
                                {hasActiveFilters && (
                                    <Button size="sm" variant="ghost" onClick={() => setFilters({ jobId: "all", rateType: "all", dateFrom: "", dateTo: "" })}>
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Desktop Export & Multi-select */}
            <Button size="sm" variant="outline" className="hidden h-8 shrink-0 justify-center gap-1.5 whitespace-nowrap px-2.5 sm:inline-flex sm:h-9 sm:px-3" onClick={exportToICalendar}>
                <Download className="size-4" />
                <span className="hidden sm:inline">Export</span>
            </Button>

            <Button
                size="sm"
                variant="outline"
                className="hidden h-8 shrink-0 justify-center gap-1.5 whitespace-nowrap px-2.5 sm:inline-flex sm:h-9 sm:px-3 text-primary border-primary/20 hover:bg-primary/5"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
            >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                <span className="hidden sm:inline">AI Payslip Upload</span>
            </Button>

            <Button
                size="sm"
                variant={multiSelectMode ? "default" : "outline"}
                className="hidden h-8 shrink-0 justify-center gap-1.5 whitespace-nowrap px-2.5 sm:inline-flex sm:h-9 sm:px-3"
                onClick={() => {
                    setMultiSelectMode((prev) => !prev)
                    setSelectedShiftIds([])
                }}
            >
                <CheckSquare className="size-4" />
                <span className="hidden sm:inline">Multi-select</span>
            </Button>

            <Button size="sm" variant="outline" className="hidden h-8 shrink-0 justify-center gap-1.5 whitespace-nowrap px-2.5 sm:inline-flex sm:h-9 sm:px-3" onClick={() => setRecurringDialogOpen(true)}>
                <Repeat className="size-4" />
                <span className="hidden sm:inline">Recurring</span>
            </Button>

            <Button size="sm" variant="outline" className="hidden h-8 shrink-0 justify-center gap-1.5 whitespace-nowrap px-2.5 sm:inline-flex sm:h-9 sm:px-3" onClick={() => setJobDialogOpen(true)}>
                <Briefcase className="size-4" />
                <span className="hidden sm:inline">Add Workplace</span>
            </Button>
        </div>
    )
}
