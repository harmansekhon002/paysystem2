type Inputs = {
  usedGb: number
  totalGb: number
  kbPerUserYearLow: number
  kbPerUserYearMid: number
  kbPerUserYearHigh: number
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function toGbFromKb(kb: number): number {
  return kb / (1024 * 1024)
}

function formatInt(value: number): string {
  return Math.floor(value).toLocaleString("en-US")
}

function estimateUserYears(availableGb: number, kbPerUserYear: number): number {
  const gbPerUserYear = toGbFromKb(kbPerUserYear)
  return gbPerUserYear > 0 ? availableGb / gbPerUserYear : 0
}

function readInputs(): Inputs {
  const args = process.argv.slice(2)
  const argMap = new Map<string, string>()

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]
    const value = args[i + 1]
    if (key?.startsWith("--") && value) {
      argMap.set(key, value)
    }
  }

  return {
    usedGb: parseNumber(argMap.get("--used-gb") ?? process.env.DB_USED_GB, 0.03),
    totalGb: parseNumber(argMap.get("--total-gb") ?? process.env.DB_TOTAL_GB, 0.5),
    kbPerUserYearLow: parseNumber(argMap.get("--kb-low") ?? process.env.KB_PER_USER_YEAR_LOW, 100),
    kbPerUserYearMid: parseNumber(argMap.get("--kb-mid") ?? process.env.KB_PER_USER_YEAR_MID, 175),
    kbPerUserYearHigh: parseNumber(argMap.get("--kb-high") ?? process.env.KB_PER_USER_YEAR_HIGH, 250),
  }
}

function main() {
  const input = readInputs()

  const usedPercent = (input.usedGb / input.totalGb) * 100
  const remainingGb = Math.max(input.totalGb - input.usedGb, 0)
  const remainingPercent = 100 - usedPercent

  const currentUserYears = {
    low: estimateUserYears(input.usedGb, input.kbPerUserYearLow),
    mid: estimateUserYears(input.usedGb, input.kbPerUserYearMid),
    high: estimateUserYears(input.usedGb, input.kbPerUserYearHigh),
  }

  const remainingUserYears = {
    low: estimateUserYears(remainingGb, input.kbPerUserYearLow),
    mid: estimateUserYears(remainingGb, input.kbPerUserYearMid),
    high: estimateUserYears(remainingGb, input.kbPerUserYearHigh),
  }

  const totalUserYears = {
    low: estimateUserYears(input.totalGb, input.kbPerUserYearLow),
    mid: estimateUserYears(input.totalGb, input.kbPerUserYearMid),
    high: estimateUserYears(input.totalGb, input.kbPerUserYearHigh),
  }

  console.log(
    JSON.stringify(
      {
        input,
        storage: {
          usedGb: input.usedGb,
          totalGb: input.totalGb,
          usedPercent: Number(usedPercent.toFixed(2)),
          remainingGb: Number(remainingGb.toFixed(3)),
          remainingPercent: Number(remainingPercent.toFixed(2)),
        },
        estimatedUserYears: {
          currentDataAtUsage: {
            lowKbPerUserYear: {
              kb: input.kbPerUserYearLow,
              users: formatInt(currentUserYears.low),
            },
            midKbPerUserYear: {
              kb: input.kbPerUserYearMid,
              users: formatInt(currentUserYears.mid),
            },
            highKbPerUserYear: {
              kb: input.kbPerUserYearHigh,
              users: formatInt(currentUserYears.high),
            },
          },
          remainingCapacity: {
            lowKbPerUserYear: {
              kb: input.kbPerUserYearLow,
              users: formatInt(remainingUserYears.low),
            },
            midKbPerUserYear: {
              kb: input.kbPerUserYearMid,
              users: formatInt(remainingUserYears.mid),
            },
            highKbPerUserYear: {
              kb: input.kbPerUserYearHigh,
              users: formatInt(remainingUserYears.high),
            },
          },
          maxTotalAtPlanLimit: {
            lowKbPerUserYear: {
              kb: input.kbPerUserYearLow,
              users: formatInt(totalUserYears.low),
            },
            midKbPerUserYear: {
              kb: input.kbPerUserYearMid,
              users: formatInt(totalUserYears.mid),
            },
            highKbPerUserYear: {
              kb: input.kbPerUserYearHigh,
              users: formatInt(totalUserYears.high),
            },
          },
        },
      },
      null,
      2
    )
  )
}

main()
