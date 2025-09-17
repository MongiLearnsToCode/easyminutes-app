import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const getApiKey = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable not set");
    }
    if (!apiKey.startsWith('AIza')) {
        throw new Error("GEMINI_API_KEY appears to be invalid (should start with 'AIza')");
    }
    return apiKey;
};

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Testing Gemini API key...');

    const apiKey = getApiKey();
    console.log('API key format valid, length:', apiKey.length);

    const ai = new GoogleGenAI({ apiKey });

    // Simple test call
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "Say 'Hello, world!' in exactly 3 words.",
    });

    console.log('Test successful:', result.text);

    return NextResponse.json({
      success: true,
      message: "Gemini API key is valid",
      response: result.text.trim()
    });
  } catch (error) {
    console.error("Gemini API test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error
      },
      { status: 500 }
    );
  }
}