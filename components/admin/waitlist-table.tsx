
"use client"

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download } from "lucide-react"
import { format } from "date-fns"

export function WaitlistTable() {
    const [entries, setEntries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchWaitlist = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/waitlist")
            if (res.ok) {
                const data = await res.json()
                setEntries(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const exportCsv = () => {
        const headers = ["Email", "Plan", "Joined At"]
        const rows = entries.map(e => [e.email, e.plan, format(new Date(e.createdAt), "yyyy-MM-dd HH:mm:ss")])
        const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `waitlist-${format(new Date(), "yyyy-MM-dd")}.csv`
        a.click()
    }

    useEffect(() => {
        fetchWaitlist()
    }, [])

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={exportCsv} disabled={entries.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Desired Plan</TableHead>
                            <TableHead>Joined At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    Loading waitlist...
                                </TableCell>
                            </TableRow>
                        ) : entries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No waitlist entries yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            entries.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>{entry.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {entry.plan}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(entry.createdAt), "MMM d, yyyy HH:mm")}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
