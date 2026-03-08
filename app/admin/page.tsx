
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, CreditCard, Sparkles, Clock } from "lucide-react"
import { UserTable } from "@/components/admin/user-table"
import { WaitlistTable } from "@/components/admin/waitlist-table"
import { AiUsageChart } from "@/components/admin/ai-usage-chart"
import { RecentSignups } from "@/components/admin/recent-signups"

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions)

    // Role check
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        redirect("/dashboard")
    }

    // Fetch Stats
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
        totalUsers,
        newUsersThisWeek,
        freeUsers,
        plusUsers,
        proUsers,
        totalAiCallsToday,
        recentUsers,
        waitlistCount
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: lastWeek } } }),
        prisma.user.count({ where: { isPremium: false } }),
        // Plus/Pro counts would need subscription lookups or joined query, 
        // for MVP we can use a simpler approach or skip specific plan counts if too complex
        prisma.subscription.count({ where: { status: "active" } }), // Total active subs
        prisma.user.count({ where: { isPremium: true } }), // Total premium
        prisma.aiUsage.count({
            where: {
                timestamp: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        }),
        prisma.user.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, email: true, createdAt: true, role: true, isPremium: true }
        }),
        prisma.waitlist.count()
    ])

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 pb-20">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Admin Overview</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                        <p className="text-xs text-muted-foreground">+{newUsersThisWeek} from last week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{plusUsers}</div>
                        <p className="text-xs text-muted-foreground">{Math.round((plusUsers / totalUsers) * 100)}% conversion rate</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">AI Calls (Today)</CardTitle>
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAiCallsToday}</div>
                        <p className="text-xs text-muted-foreground tracking-tight">GPT-4o-mini usage</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Waitlist</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{waitlistCount}</div>
                        <p className="text-xs text-muted-foreground">Pending invites</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>AI Usage Analytics</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <AiUsageChart />
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Signups</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RecentSignups users={recentUsers} />
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">User Management</h3>
                <UserTable />
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Waitlist Management</h3>
                <WaitlistTable />
            </div>
        </div>
    )
}
