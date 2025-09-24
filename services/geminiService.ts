
import { MeetingSummary, SummarizeAudioInput } from '../types';

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


export const summarizeMinutes = async (input: string | SummarizeAudioInput): Promise<Omit<MeetingSummary, 'id' | 'createdAt'>> => {
    try {
        let content: string;

        if (typeof input === 'string') {
            content = `Based on the following meeting notes or transcription, please generate a structured summary.
---
${input}
---
`;
        } else {
            // For audio input, we'll need to handle transcription separately
            // For now, throw an error as OpenRouter Gemini might not support audio directly
            throw new Error("Audio input is not currently supported with OpenRouter. Please provide text transcription.");
        }

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
            throw new Error(`OpenRouter API error: ${response.status} ${errorData}`);
        }

        const data = await response.json();
        const jsonText = data.choices[0].message.content.trim();
        const parsedJson = JSON.parse(jsonText);
        return parsedJson as Omit<MeetingSummary, 'id' | 'createdAt'>;
    } catch (error) {
        console.error("Error summarizing minutes:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate summary: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the summary.");
    }
};
