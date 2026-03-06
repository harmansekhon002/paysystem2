"use client"

import React, { type CSSProperties } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, RATE_TYPE_LABELS, type Shift, type JobTemplate } from "@/lib/store"
import { trackEvent } from "@/lib/analytics"
import { useToast } from "@/hooks/use-toast"
import { List } from "react-window"
import { AutoSizer } from "react-virtualized-auto-sizer"

interface ShiftListViewProps {
    filteredShifts: Shift[]
    totalShiftsCount: number
    multiSelectMode: boolean
    selectedShiftIds: string[]
    allVisibleSelected: boolean
    toggleSelectAllVisible: (checked: boolean) => void
    toggleShiftSelection: (shiftId: string, checked: boolean) => void
    handleBulkDelete: () => void
    jobsById: Map<string, JobTemplate>
    currencySymbol: string
    openEditDialog: (shift: Shift) => void
    removeShift: (id: string) => void
}

export function ShiftListView({
    filteredShifts,
    totalShiftsCount,
    multiSelectMode,
    selectedShiftIds,
    allVisibleSelected,
    toggleSelectAllVisible,
    toggleShiftSelection,
    handleBulkDelete,
    jobsById,
    currencySymbol,
    openEditDialog,
    removeShift,
}: ShiftListViewProps) {
    const { toast } = useToast()

    const ShiftRow = ({ index, style, ariaAttributes }: { index: number; style: CSSProperties; ariaAttributes: any }) => {
        const shift = filteredShifts[index]
        if (!shift) return null
        const job = jobsById.get(shift.jobId)
        const isSelected = selectedShiftIds.includes(shift.id)

        return (
            <div style={style} {...ariaAttributes} className={`px-4 border-b border-border/10 ${isSelected ? "bg-primary/5" : ""}`}>
                <div className="flex items-center gap-2.5 h-full py-2">
                    {multiSelectMode && (
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => toggleShiftSelection(shift.id, checked === true)}
                            aria-label={`Select shift on ${shift.date}`}
                            className="size-4"
                        />
                    )}
                    <div className="size-2 rounded-full shrink-0" style={{ background: job?.color || "#94a3b8" }} />
                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm font-medium text-foreground truncate">{job?.name || "Unknown"}</span>
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 shrink-0 whitespace-nowrap">{RATE_TYPE_LABELS[shift.rateType]}</Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate">
                            {new Date(shift.date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric" })} &middot; {shift.startTime}-{shift.endTime}
                        </span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 ml-auto">
                        <span className="text-sm font-semibold text-foreground mr-1 whitespace-nowrap">{formatCurrency(shift.earnings, currencySymbol)}</span>
                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-primary"
                                onClick={() => openEditDialog(shift)}
                            >
                                <Pencil className="size-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive hidden sm:inline-flex"
                                onClick={() => {
                                    removeShift(shift.id)
                                    trackEvent("shift_removed")
                                    toast({ title: "Shift removed" })
                                }}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm font-medium">
                        {filteredShifts.length} shift{filteredShifts.length !== 1 ? "s" : ""}
                        {filteredShifts.length !== totalShiftsCount && ` (${totalShiftsCount} total)`}
                    </CardTitle>
                    {multiSelectMode && filteredShifts.length > 0 && (
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Checkbox
                                    checked={allVisibleSelected}
                                    onCheckedChange={(checked) => toggleSelectAllVisible(checked === true)}
                                    aria-label="Select all visible shifts"
                                />
                                Select all
                            </label>
                            <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 gap-1.5"
                                onClick={handleBulkDelete}
                                disabled={selectedShiftIds.length === 0}
                            >
                                <Trash2 className="size-3.5" />
                                Delete ({selectedShiftIds.length})
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
                {filteredShifts.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        {totalShiftsCount === 0 ? "No shifts yet. Log your first one above." : "No shifts match your filters."}
                    </p>
                ) : (
                    <div className="h-[500px] w-full min-w-0">
                        <AutoSizer
                            renderProp={({ height, width }: { height: number | undefined; width: number | undefined }) => (
                                <List<any>
                                    style={{ height: height || 500, width: width || "100%" }}
                                    rowCount={filteredShifts.length}
                                    rowHeight={64}
                                    rowComponent={ShiftRow}
                                    rowProps={{}}
                                />
                            )}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
