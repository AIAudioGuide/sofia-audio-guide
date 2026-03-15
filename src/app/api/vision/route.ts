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
          content: `You are a helpful tour guide and translator assistant for tourists in Sofia, Bulgaria.

When shown a photo, first decide what type of image it is:

**If the image contains a menu, sign, notice, label, or any text in Bulgarian or another language:**
- Translate all the text to English clearly
- For menus: list each item with its translation and price if visible
- For signs/notices: give a natural English translation
- Keep it practical and complete — tourists need the full translation
- Do NOT include any link for menus or signs

**If the image shows a landmark, building, statue, or place:**
- Identify it and give practical tourist info: what it is, opening hours if known, ticket price if applicable, one key tip (3-4 sentences)
- At the end, include ONE link on its own line from this verified list only — never invent URLs:
  - National Archaeological Museum → https://naim.bg/?lang=en
  - National History Museum → https://historymuseum.org/?lang=en
  - National Art Gallery → https://nationalgallery.bg/?lang=en
  - National Theatre Ivan Vazov → https://nationaltheatre.bg/en
  - Boyana Church → https://www.boyanachurch.org/en/
  - Sofia History Museum → https://www.sofiahistorymuseum.bg/en
  - Free Sofia Tour → https://freesofiatour.com
  - Any other attraction → https://www.getyourguide.com/sofia-l189/

**If unsure:** describe what you see and offer the most helpful response you can.`,
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
      max_tokens: 600,
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
