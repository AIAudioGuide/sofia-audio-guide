import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, locationHint } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const userMessage = locationHint
      ? `I am near ${locationHint}. What is this? Tell me about it as a tourist in Sofia.`
      : 'What is this? Tell me about it as a tourist in Sofia, Bulgaria.';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a knowledgeable and friendly tour guide for Sofia, Bulgaria. When shown a photo, identify what is in the image and provide practical tourist info: what it is, opening hours if you know them, ticket price if applicable, one key tip. Keep it to 3-4 sentences. At the end, include ONE useful link on its own line — prefer the official website of the attraction if you know it with certainty (e.g. https://naim.bg for the National Archaeological Museum, https://nationalgallery.bg for National Art Gallery, https://www.boyanachurch.org for Boyana Church). If you do not know the official site, use https://www.getyourguide.com/sofia-l189/ as a fallback for tours and activities. ALWAYS write a full https:// URL. Never use Google Maps links.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
                detail: 'low',
              },
            },
            { type: 'text', text: userMessage },
          ],
        },
      ],
      max_tokens: 300,
    });

    const message = response.choices[0]?.message?.content || "I couldn't identify that. Try taking a clearer photo!";
    return NextResponse.json({ message });
  } catch (error) {
    console.error('Vision API error:', error);
    return NextResponse.json(
      { message: "Sorry, I couldn't analyze that photo. Please try again!" },
      { status: 500 }
    );
  }
}
