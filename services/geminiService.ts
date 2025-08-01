
import { GoogleGenAI, Type } from "@google/genai";
import { MeetingSummary, SummarizeAudioInput } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

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


export const summarizeMinutes = async (input: string | SummarizeAudioInput): Promise<Omit<MeetingSummary, 'id' | 'createdAt'>> => {
    try {
        let contents: any;

        if (typeof input === 'string') {
            contents = `Based on the following meeting notes or transcription, please generate a structured summary.
---
${input}
---
`;
        } else {
            const promptText = `This is an audio recording of a meeting. Please transcribe the audio and then generate a structured summary based on the transcription.`;
            contents = {
                parts: [
                    { inlineData: { mimeType: input.mimeType, data: input.data } },
                    { text: promptText }
                ]
            };
        }

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });

        const jsonText = result.text.trim();
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
