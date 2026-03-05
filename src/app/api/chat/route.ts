import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const LANDMARKS_INFO = `
You are a knowledgeable tour guide for Sofia, Bulgaria. Here are the main landmarks:

1. Alexander Nevsky Cathedral - Iconic gold-domed Orthodox cathedral built in 1882
2. St. George Rotunda - 4th-century Roman church, one of Sofia's oldest buildings
3. National Palace of Culture (NDK) - Sofia's largest conference center, built in 1981
4. St. Sofia Church - 6th-century medieval church, gives the city its name
5. Banya Bashi Mosque - Ottoman-era mosque, now houses National Archaeological Museum
6. City Garden - Oldest public park in Sofia, opened in 1878
7. Vitosha Boulevard - Main shopping street with historic cafes
8. Tsar Osvoboditel Monument - Monument to the Russian Tsar who liberated Bulgaria
`;

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    const messages = [
      { 
        role: 'system', 
        content: `${LANDMARKS_INFO}

You are a friendly, informative tour guide. Answer questions about Sofia's history, culture, landmarks, and attractions. 
Keep answers concise but interesting. If you don't know something, admit it.`
      },
      ...(history || []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return NextResponse.json({ error: error }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}
