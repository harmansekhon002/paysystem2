import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import {
    type AppData, type Shift, type JobTemplate, type Expense, type Goal,
    type BudgetCategory, type AppSettings, type AttendanceEvent,
    defaultData, generateId, getJobColor
} from "@/lib/store"

interface AppStore {
    data: AppData
    setData: (data: AppData | ((prev: AppData) => AppData)) => void

    // Shifts
    addShift: (shift: Omit<Shift, "id">) => string
    removeShift: (id: string) => void
    updateShift: (id: string, updates: Partial<Shift>) => void

    // Jobs
    addJob: (job: Omit<JobTemplate, "id" | "color">) => string
    updateJob: (id: string, updates: Partial<JobTemplate>) => void
    removeJob: (id: string) => void

    // Expenses
    addExpense: (expense: Omit<Expense, "id">) => void
    updateExpense: (id: string, updates: Partial<Expense>) => void
    removeExpense: (id: string) => void

    // Attendance
    addAttendanceEvent: (event: Omit<AttendanceEvent, "id">) => void
    removeAttendanceEvent: (id: string) => void

    // Budget
    addBudgetCategory: (cat: Omit<BudgetCategory, "id">) => void
    updateBudgetCategory: (id: string, updates: Partial<BudgetCategory>) => void
    removeBudgetCategory: (id: string) => void

    // Goals
    addGoal: (goal: Omit<Goal, "id">) => void
    updateGoal: (id: string, updates: Partial<Goal>) => void
    removeGoal: (id: string) => void

    // Settings
    updateSettings: (settings: Partial<AppSettings>) => void
    updateSpecialCompanion: (settings: Partial<AppSettings["specialCompanion"]>) => void

    // Public holidays
    addPublicHoliday: (date: string) => void
    removePublicHoliday: (date: string) => void
}

export const useAppStore = create<AppStore>()(
    subscribeWithSelector((set) => ({
        data: defaultData,
        setData: (data) => set((state) => ({
            data: typeof data === "function" ? data(state.data) : data
        })),

        addShift: (shift) => {
            const id = generateId()
            set((state) => ({
                data: {
                    ...state.data,
                    shifts: [...state.data.shifts, { ...shift, id, updatedAt: new Date().toISOString() }]
                }
            }))
            return id
        },
        removeShift: (id) => set((state) => ({
            data: {
                ...state.data,
                shifts: state.data.shifts.filter(s => s.id !== id)
            }
        })),
        updateShift: (id, updates) => set((state) => ({
            data: {
                ...state.data,
                shifts: state.data.shifts.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s)
            }
        })),

        addJob: (job) => {
            const id = generateId()
            set((state) => ({
                data: {
                    ...state.data,
                    jobs: [...state.data.jobs, { ...job, id, color: getJobColor(state.data.jobs.length), updatedAt: new Date().toISOString() }]
                }
            }))
            return id
        },
        updateJob: (id, updates) => set((state) => ({
            data: {
                ...state.data,
                jobs: state.data.jobs.map(j => j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j)
            }
        })),
        removeJob: (id) => set((state) => ({
            data: {
                ...state.data,
                jobs: state.data.jobs.filter(j => j.id !== id),
                shifts: state.data.shifts.filter(s => s.jobId !== id)
            }
        })),

        addExpense: (expense) => set((state) => ({
            data: {
                ...state.data,
                expenses: [...state.data.expenses, { ...expense, id: generateId(), updatedAt: new Date().toISOString() }]
            }
        })),
        updateExpense: (id, updates) => set((state) => ({
            data: {
                ...state.data,
                expenses: state.data.expenses.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e)
            }
        })),
        removeExpense: (id) => set((state) => ({
            data: {
                ...state.data,
                expenses: state.data.expenses.filter(e => e.id !== id)
            }
        })),

        addAttendanceEvent: (event) => set((state) => ({
            data: {
                ...state.data,
                attendanceEvents: [...state.data.attendanceEvents, { ...event, id: generateId(), updatedAt: new Date().toISOString() }]
            }
        })),
        removeAttendanceEvent: (id) => set((state) => ({
            data: {
                ...state.data,
                attendanceEvents: state.data.attendanceEvents.filter(e => e.id !== id)
            }
        })),

        addBudgetCategory: (cat) => set((state) => ({
            data: {
                ...state.data,
                budgetCategories: [...state.data.budgetCategories, { ...cat, id: generateId(), updatedAt: new Date().toISOString() }]
            }
        })),
        updateBudgetCategory: (id, updates) => set((state) => ({
            data: {
                ...state.data,
                budgetCategories: state.data.budgetCategories.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)
            }
        })),
        removeBudgetCategory: (id) => set((state) => ({
            data: {
                ...state.data,
                budgetCategories: state.data.budgetCategories.filter(c => c.id !== id)
            }
        })),

        addGoal: (goal) => set((state) => ({
            data: {
                ...state.data,
                goals: [...state.data.goals, { ...goal, id: generateId(), updatedAt: new Date().toISOString() }]
            }
        })),
        updateGoal: (id, updates) => set((state) => ({
            data: {
                ...state.data,
                goals: state.data.goals.map(g => g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g)
            }
        })),
        removeGoal: (id) => set((state) => ({
            data: {
                ...state.data,
                goals: state.data.goals.filter(g => g.id !== id)
            }
        })),

        updateSettings: (settings) => set((state) => ({
            data: {
                ...state.data,
                settings: { ...state.data.settings, ...settings }
            }
        })),
        updateSpecialCompanion: (settings) => set((state) => ({
            data: {
                ...state.data,
                settings: {
                    ...state.data.settings,
                    specialCompanion: {
                        ...state.data.settings.specialCompanion,
                        ...settings
                    }
                }
            }
        })),

        addPublicHoliday: (date) => set((state) => ({
            data: {
                ...state.data,
                publicHolidays: [...state.data.publicHolidays, date]
            }
        })),
        removePublicHoliday: (date) => set((state) => ({
            data: {
                ...state.data,
                publicHolidays: state.data.publicHolidays.filter(d => d !== date)
            }
        }))
    }))
)
