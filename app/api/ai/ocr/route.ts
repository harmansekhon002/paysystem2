import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PDFParse } from 'pdf-parse';
import { checkAiRateLimit, logAiUsage } from "@/lib/ai-rate-limit";
import { NextResponse } from "next/server";

export const runtime = 'nodejs'; // Required for pdf-parse

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const userId = (session.user as any).id;
    const email = session.user.email || undefined;

    const rateLimit = await checkAiRateLimit(userId, "payslip_ocr", email);
    if (!rateLimit.allowed) {
        return NextResponse.json({
            error: "AI_LIMIT_REACHED",
            limit: rateLimit.limit,
            plan: rateLimit.plan,
            resetAt: rateLimit.resetAt
        }, { status: 429 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return new Response('No file uploaded', { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        let textContent = '';

        if (file.type === 'application/pdf') {
            const parser = new PDFParse({ data: buffer });
            const result = await parser.getText();
            textContent = result.text;
        } else {
            return new Response('Image processing coming soon. Please upload a PDF.', { status: 400 });
        }

        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            system: `
        You are a specialized OCR parser for Australian payslips.
        Extract the following data into a clean JSON format:
        - payPeriodStart (ISO date or null)
        - payPeriodEnd (ISO date or null)
        - grossPay (number)
        - netPay (number)
        - tax (number)
        - superannuation (number)
        - hourlyRate (number)
        - totalHours (number)
        - employerName (string)
        
        If a value is missing, return null.
        Respond ONLY with the JSON.
      `,
            prompt: `Parse this payslip content: ${textContent}`,
        });

        try {
            const parsedData = JSON.parse(text.replace(/```json|```/g, '').trim());

            // Log successful usage
            await logAiUsage(userId, "payslip_ocr");

            return new Response(JSON.stringify(parsedData), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (e) {
            return new Response('Failed to parse AI response', { status: 500 });
        }

    } catch (error) {
        console.error('OCR Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
