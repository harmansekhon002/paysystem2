import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkAiRateLimit, logAiUsage } from "@/lib/ai-rate-limit";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const userId = (session.user as any).id;
    const email = session.user.email || undefined;

    const rateLimit = await checkAiRateLimit(userId, "care_plan", email);
    if (!rateLimit.allowed) {
        return NextResponse.json({
            error: "AI_LIMIT_REACHED",
            limit: rateLimit.limit,
            plan: rateLimit.plan,
            resetAt: rateLimit.resetAt
        }, { status: 429 });
    }

    // Log usage (as it's a stream, we log at start of stream)
    await logAiUsage(userId, "care_plan");

    const { messages, context } = await req.json();

    const systemPrompt = `
    You are "Wifey", a student's prime financial and wellness companion.
    Your goal is to be motivational, supportive, and data-driven.
    
    Current User Context:
    - User Name: ${session.user.name}
    - Recent Earnings: ${context?.recentEarnings || 0}
    - Unread Notifications: ${context?.unreadCount || 0}
    - Next Goal Status: ${context?.goalStatus || 'On Track'}
    
    Behavior Rules:
    1. If the user is falling behind on a goal, be encouraging but firm with actionable steps.
    2. If the user just completed a heavy shift week, focus on wellness and "Care Plan" suggestions (rest, meal prep).
    3. Use a friendly, casual tone, but keep financial advice professional.
    4. Keep responses concise and mobile-friendly.
  `;

    const result = await streamText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        messages,
    });

    return result.toTextStreamResponse();
}
