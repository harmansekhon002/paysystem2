"use client"

import { useMemo, useState } from "react"

type FontOption = {
  id: string
  label: string
  className: string
}

type FontPreviewProps = {
  options: FontOption[]
}

export function FontPreview({ options }: FontPreviewProps) {
  const [selectedId, setSelectedId] = useState(options[0]?.id ?? "")

  const selected = useMemo(
    () => options.find((option) => option.id === selectedId) ?? options[0],
    [options, selectedId]
  )

  if (!selected) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-10 text-foreground">
        No font options configured.
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 text-foreground">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Font Preview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare fonts live before setting a global app font.
          </p>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Choose font</span>
          <select
            className="h-10 min-w-[220px] rounded-lg border border-border bg-card px-3 text-sm"
            value={selected.id}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={`${selected.className} space-y-6`}>
        <section className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Display</p>
          <h2 className="mt-2 text-4xl font-semibold leading-tight">ShiftWise Typography Test</h2>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Track shifts, earnings, and goals with a readable and consistent type system across
            dashboards, charts, and forms.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">UI Sample</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Weekly earnings are up 12.4% compared with last period.
            </p>
            <div className="mt-4 flex gap-2">
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Primary Action
              </button>
              <button className="rounded-md border border-border px-4 py-2 text-sm font-medium">
                Secondary
              </button>
            </div>
          </article>

          <article className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Data Sample</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Today</span>
                <span className="font-medium">$124.00</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">This Week</span>
                <span className="font-medium">$782.50</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">This Month</span>
                <span className="font-medium">$2,940.20</span>
              </li>
            </ul>
          </article>
        </section>
      </div>
    </div>
  )
}
