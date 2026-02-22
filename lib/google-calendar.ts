// Google Calendar API integration

import { type Shift } from "./store"

export interface GoogleCalendarConfig {
  apiKey: string
  clientId: string
  calendarId: string // Usually 'primary'
}

export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  colorId?: string
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: "email" | "popup"
      minutes: number
    }>
  }
}

// Convert shift to Google Calendar event
export function shiftToCalendarEvent(
  shift: Shift,
  jobName: string,
  timeZone: string = "Australia/Sydney"
): CalendarEvent {
  const startDateTime = `${shift.date}T${shift.startTime}:00`
  const endDateTime = `${shift.date}T${shift.endTime}:00`

  return {
    summary: `${jobName} - Shift`,
    description: `Hours: ${shift.hours}h\nEarnings: $${shift.earnings.toFixed(2)}\nRate Type: ${shift.rateType}${shift.note ? `\n\nNote: ${shift.note}` : ""}`,
    start: {
      dateTime: startDateTime,
      timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone,
    },
    colorId: "9", // Blue color for work events
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 30 },
        { method: "popup", minutes: 1440 }, // 24 hours before
      ],
    },
  }
}

// Note: Actual Google Calendar API calls would require OAuth2 authentication
// This is a mock implementation showing the structure

export class GoogleCalendarSync {
  private config: GoogleCalendarConfig
  private accessToken: string | null = null

  constructor(config: GoogleCalendarConfig) {
    this.config = config
  }

  async authenticate(): Promise<boolean> {
    // In a real implementation, this would:
    // 1. Open OAuth2 consent screen
    // 2. Get authorization code
    // 3. Exchange for access token
    // 4. Store tokens (access + refresh)
    
    // Mock implementation
    console.log("Google Calendar authentication would happen here")
    return false
  }

  async syncShift(shift: Shift, jobName: string): Promise<{ success: boolean; eventId?: string; error?: string }> {
    if (!this.accessToken) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      const event = shiftToCalendarEvent(shift, jobName)
      void event
      
      // Mock API call
      // In real implementation:
      // const response = await fetch(
      //   `https://www.googleapis.com/calendar/v3/calendars/${this.config.calendarId}/events`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Authorization': `Bearer ${this.accessToken}`,
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify(event),
      //   }
      // )

      return {
        success: true,
        eventId: `mock-event-${shift.id}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async syncAllShifts(
    shifts: Shift[],
    getJobName: (jobId: string) => string
  ): Promise<{ synced: number; failed: number; errors: string[] }> {
    const results = { synced: 0, failed: 0, errors: [] as string[] }

    for (const shift of shifts) {
      const jobName = getJobName(shift.jobId)
      const result = await this.syncShift(shift, jobName)

      if (result.success) {
        results.synced++
      } else {
        results.failed++
        if (result.error) results.errors.push(result.error)
      }
    }

    return results
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.accessToken) return false
    void eventId

    // Mock implementation
    // In real implementation:
    // await fetch(
    //   `https://www.googleapis.com/calendar/v3/calendars/${this.config.calendarId}/events/${eventId}`,
    //   {
    //     method: 'DELETE',
    //     headers: { 'Authorization': `Bearer ${this.accessToken}` },
    //   }
    // )

    return true
  }

  async updateEvent(eventId: string, shift: Shift, jobName: string): Promise<boolean> {
    if (!this.accessToken) return false

    const event = shiftToCalendarEvent(shift, jobName)
    void eventId
    void event

    // Mock implementation
    // In real implementation:
    // await fetch(
    //   `https://www.googleapis.com/calendar/v3/calendars/${this.config.calendarId}/events/${eventId}`,
    //   {
    //     method: 'PUT',
    //     headers: {
    //       'Authorization': `Bearer ${this.accessToken}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(event),
    //   }
    // )

    return true
  }
}

// Webhook for 2-way sync
export interface CalendarWebhookPayload {
  kind: string
  id: string
  resourceId: string
  resourceUri: string
  channelId: string
  expiration: string
}

export function handleCalendarWebhook(payload: CalendarWebhookPayload): void {
  // Handle incoming calendar updates
  // This would be called from an API route
  console.log("Calendar webhook received", payload)
  
  // In real implementation:
  // 1. Fetch the updated event
  // 2. Convert back to Shift
  // 3. Update local data
  // 4. Trigger UI refresh
}

// Setup webhook channel
export async function setupCalendarWebhook(
  accessToken: string,
  calendarId: string,
  webhookUrl: string
): Promise<{ channelId: string; resourceId: string } | null> {
  void accessToken
  void calendarId
  void webhookUrl
  // Mock implementation
  // In real implementation:
  // const response = await fetch(
  //   `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/watch`,
  //   {
  //     method: 'POST',
  //     headers: {
  //       'Authorization': `Bearer ${accessToken}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       id: crypto.randomUUID(),
  //       type: 'web_hook',
  //       address: webhookUrl,
  //     }),
  //   }
  // )

  return null
}
