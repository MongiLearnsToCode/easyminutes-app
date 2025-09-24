import { NextResponse } from 'next/server';

const getApiKey = () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY environment variable not set");
    }
    return apiKey;
};

export async function GET() {
  try {
    console.log('Testing OpenRouter API key...');

    const apiKey = getApiKey();
    console.log('API key present, length:', apiKey.length);

    // Simple test call to OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Easy Minutes App'
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "user",
            content: "Say 'Hello, world!' in exactly 3 words."
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content.trim();

    console.log('Test successful:', result);

    return NextResponse.json({
      success: true,
      message: "OpenRouter API key is valid",
      response: result
    });
  } catch (error) {
    console.error("OpenRouter API test failed:", error);
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