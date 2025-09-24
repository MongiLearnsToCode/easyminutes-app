import { NextRequest, NextResponse } from 'next/server';

const getApiKey = () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY environment variable not set");
    }
    return apiKey;
};

const schema = {
  type: "json_schema",
  json_schema: {
    name: "meeting_summary",
    schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "A concise, descriptive title for the meeting." },
        attendees: {
          type: "array",
          items: { type: "string" },
          description: "List of people who attended the meeting. Infer from context."
        },
        summary: { type: "string", description: "A brief, one-paragraph overview of the meeting's purpose and key outcomes." },
        keyPoints: {
          type: "array",
          items: { type: "string" },
          description: "A bulleted list of the most important topics discussed."
        },
        actionItems: {
          type: "array",
          items: {
            type: "object",
            properties: {
              task: { type: "string", description: "The specific action item or task." },
              owner: { type: "string", description: "The person or group the task is assigned to. Default to 'Unassigned' if not explicitly mentioned." },
            },
            required: ["task", "owner"]
          },
          description: "A list of tasks to be completed, including who is responsible."
        },
        decisions: {
          type: "array",
          items: { type: "string" },
          description: "A bulleted list of key decisions made during the meeting."
        }
      },
      required: ["title", "attendees", "summary", "keyPoints", "actionItems", "decisions"]
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log('Summarize API called');

    const body = await request.json();
    const { input, type } = body;

    console.log('Input type:', type, 'Input length:', input?.length);

    if (!input) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    let content: string;

    if (type === 'text') {
      content = `Based on the following meeting notes or transcription, please generate a structured summary.
---
${input}
---
`;
    } else if (type === 'audio') {
      // For audio input, we'll need to handle transcription separately
      // For now, return an error as OpenRouter Gemini might not support audio directly
      return NextResponse.json({ error: 'Audio input is not currently supported with OpenRouter. Please provide text transcription.' }, { status: 400 });
    } else {
      return NextResponse.json({ error: 'Invalid input type' }, { status: 400 });
    }

    console.log('Making OpenRouter API call with model: google/gemini-2.5-flash-lite');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Easy Minutes App'
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "user",
            content: content
          }
        ],
        response_format: schema
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', response.status, errorData);
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status} ${errorData}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('OpenRouter API call successful');

    const jsonText = data.choices[0].message.content.trim();
    const parsedJson = JSON.parse(jsonText);

    return NextResponse.json(parsedJson);
  } catch (error) {
    console.error("Error in summarize API:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to generate summary: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "An unknown error occurred while generating the summary." },
      { status: 500 }
    );
  }
}