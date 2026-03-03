export type DbFailureCategory =
  | "storage_full"
  | "connection_unavailable"
  | "table_not_ready"
  | "unknown_write_failure"

type CounterState = {
  totalWriteFailures: number
  byCategory: Record<DbFailureCategory, number>
  byScope: Record<string, number>
  lastFailureAt: string | null
}

const state: CounterState = {
  totalWriteFailures: 0,
  byCategory: {
    storage_full: 0,
    connection_unavailable: 0,
    table_not_ready: 0,
    unknown_write_failure: 0,
  },
  byScope: {},
  lastFailureAt: null,
}

export function recordDbWriteFailure(category: DbFailureCategory, scope: string) {
  state.totalWriteFailures += 1
  state.byCategory[category] += 1
  state.byScope[scope] = (state.byScope[scope] ?? 0) + 1
  state.lastFailureAt = new Date().toISOString()
}

export function getDbMetricsSnapshot() {
  return {
    totalWriteFailures: state.totalWriteFailures,
    byCategory: { ...state.byCategory },
    byScope: { ...state.byScope },
    lastFailureAt: state.lastFailureAt,
  }
}
