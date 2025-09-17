import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const getApiKey = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable not set");
    }
    // Validate API key format (should start with 'AIza')
    if (!apiKey.startsWith('AIza')) {
        throw new Error("GEMINI_API_KEY appears to be invalid (should start with 'AIza')");
    }
    return apiKey;
};

const getAI = () => {
    return new GoogleGenAI({ apiKey: getApiKey() });
};

const schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A concise, descriptive title for the meeting." },
    attendees: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of people who attended the meeting. Infer from context."
    },
    summary: { type: Type.STRING, description: "A brief, one-paragraph overview of the meeting's purpose and key outcomes." },
    keyPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A bulleted list of the most important topics discussed."
    },
    actionItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          task: { type: Type.STRING, description: "The specific action item or task." },
          owner: { type: Type.STRING, description: "The person or group the task is assigned to. Default to 'Unassigned' if not explicitly mentioned." },
        },
        required: ["task", "owner"]
      },
      description: "A list of tasks to be completed, including who is responsible."
    },
    decisions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A bulleted list of key decisions made during the meeting."
    }
  },
  required: ["title", "attendees", "summary", "keyPoints", "actionItems", "decisions"]
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Summarize API called');

    const body = await request.json();
    const { input, type } = body;

    console.log('Input type:', type, 'Input length:', input?.length);

    if (!input) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    let contents: any;

    if (type === 'text') {
      contents = `Based on the following meeting notes or transcription, please generate a structured summary.
---
${input}
---
`;
    } else if (type === 'audio') {
      const promptText = `This is an audio recording of a meeting. Please transcribe the audio and then generate a structured summary based on the transcription.`;
      contents = {
        parts: [
          { inlineData: { mimeType: input.mimeType, data: input.data } },
          { text: promptText }
        ]
      };
    } else {
      return NextResponse.json({ error: 'Invalid input type' }, { status: 400 });
    }

    console.log('Making Gemini API call with model: gemini-1.5-flash');

    const result = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    console.log('Gemini API call successful');

    const jsonText = result.text.trim();
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