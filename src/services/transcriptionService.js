import { GoogleGenAI } from "@google/genai";

/**
 * Transcribes audio blob using Gemini API via @google/genai SDK
 * @param {Blob} audioBlob 
 * @param {string} apiKey 
 * @param {string} modelName
 * @returns {Promise<Array<{startTime: number, endTime: number, text: string}>>}
 */
export const transcribeAudio = async (audioBlob, apiKey, modelName = 'gemini-2.0-flash-exp') => {
  if (!apiKey) {
    throw new Error('API Key is required');
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const base64Audio = await blobToBase64(audioBlob);
    const mimeType = audioBlob.type || 'audio/mp4';

    const prompt = `
    Generate a highly accurate transcript for this audio.
    1. Output a valid JSON array of objects.
    2. Each object must have 'startTime', 'endTime', and 'text'.
    3. Split the text into natural semantic segments (sentences or logical phrases).
    4. Timestamps must be precise floats in seconds.
    5. Ensure the entire audio content is covered.
    6. Do not include filler words like "um" or "uh" unless they are significant.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              startTime: { type: 'NUMBER' },
              endTime: { type: 'NUMBER' },
              text: { type: 'STRING' }
            }
          }
        }
      },
      contents: [
        {
          role: 'user',
          parts: [
             { text: prompt },
             {
               inlineData: {
                 mimeType: mimeType,
                 data: base64Audio
               }
             }
          ]
        }
      ]
    });

    // With structured output, the response text is guaranteed to be valid JSON
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.log('Gemini Response:', JSON.stringify(response, null, 2));
      throw new Error('No transcript generated');
    }

    return JSON.parse(text);

  } catch (error) {
    console.error("Transcription failed", error);
    throw new Error(error.message || 'Failed to transcribe audio');
  }
};

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
