import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Trigger haptic feedback if supported by the device.
 * @param pattern Vibrate pattern. Default is a tiny 12ms pulse.
 */
export function hapticFeedback(pattern: number | number[] = 12) {
  if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // Ignore vibration failures (e.g. desktop safari)
    }
  }
}
