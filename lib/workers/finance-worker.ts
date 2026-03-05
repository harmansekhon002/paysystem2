import { type Shift, type Expense } from "@/lib/store"

self.onmessage = (e: MessageEvent<{ shifts: Shift[], expenses: Expense[] }>) => {
    const { shifts, expenses } = e.data;

    // Perform heavy calculations
    const totalEarnings = (shifts || []).reduce((sum: number, s: Shift) => sum + s.earnings, 0);
    const totalHours = (shifts || []).reduce((sum: number, s: Shift) => sum + s.hours, 0);
    const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;
    const totalExpenses = (expenses || []).reduce((sum: number, ex: Expense) => sum + ex.amount, 0);
    const netIncome = totalEarnings - totalExpenses;

    // Grouping by job
    const earningsByJobMap = new Map<string, { earnings: number; hours: number }>();
    (shifts || []).forEach((s: Shift) => {
        const existing = earningsByJobMap.get(s.jobId) || { earnings: 0, hours: 0 };
        existing.earnings += s.earnings;
        existing.hours += s.hours;
        earningsByJobMap.set(s.jobId, existing);
    });

    self.postMessage({
        totalEarnings,
        totalHours,
        avgHourlyRate,
        totalExpenses,
        netIncome,
        earningsByJob: Array.from(earningsByJobMap.entries()).map(([jobId, data]) => ({ jobId, ...data }))
    });
};
