import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const LANDMARKS_INFO = `
You are a knowledgeable tour guide for Sofia, Bulgaria. Here are the main landmarks on this audio tour:

1. Sveta Nedelya Cathedral - One of Sofia's oldest churches dating to the 10th century
2. Statue of Sofia - Iconic bronze monument depicting the goddess Sofia, unveiled in 2000
3. St. Petka of the Saddlemakers - 14th-century medieval church with beautiful frescoes
4. Roman Ruins - Ancient Serdica remains from the 2nd-4th century AD beneath modern streets
5. Square of Tolerance - Unique square where mosque, synagogue, and church stand near each other
6. Central Public Bath - Historic thermal bath with Neo-Byzantine architecture
7. Mineral Springs - Natural thermal water springs used for healing for centuries
8. Triangle of Power - Administrative heart of Bulgaria
9. Eastern Gate - Ancient Roman gate dating to the 2nd century AD
10. Presidency - Official office of the President of Bulgaria
11. Rotunda St George - One of Sofia's oldest buildings, 4th-century Roman temple
12. City Garden - Oldest public park in Sofia, opened in 1878
13. National Theatre Ivan Vazov - Bulgaria's oldest national theatre, built in 1907
14. National Art Gallery - Houses over 50,000 works of Bulgarian art
15. St. Sofia Church - 6th-century Byzantine church that gave Sofia its name
16. St. Alexander Nevski Cathedral - Iconic gold-domed Orthodox cathedral built in 1882
`;

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  });
  const data = await res.json();
  return data.data?.[0]?.embedding ?? [];
}

async function getRelevantContext(question: string): Promise<string> {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    const embedding = await getEmbedding(question);
    const { data, error } = await supabase.rpc('match_blog_chunks', {
      query_embedding: embedding,
      match_count: 5,
      min_similarity: 0.3,
    });
    if (error || !data?.length) return '';
    return data
      .map((chunk: { title: string; content: string; url: string }) =>
        `[From: ${chunk.title}]\n${chunk.content}`)
      .join('\n\n');
  } catch {
    return ''; // RAG is optional — chat still works without it
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    // Try to get relevant blog context
    const ragContext = await getRelevantContext(message);

    const systemPrompt = `${LANDMARKS_INFO}

You are a friendly, informative tour guide and assistant for tourists in Sofia, Bulgaria. Answer questions about Sofia's history, culture, landmarks, food, and tips.
Keep answers concise but interesting — you're talking to someone on a walking tour, so 2-4 sentences is ideal.
You also help with translation: if a tourist shows you Bulgarian text (menus, signs, notices) or asks you to translate something, translate it to English clearly and naturally. If asked to translate English to Bulgarian, do that too.
${ragContext ? `\nHere is some relevant local knowledge from the Free Sofia Tour blog to help you answer:\n\n${ragContext}\n\nUse this information to give a richer, more specific answer.` : ''}
When a user asks for a link, website, tickets, or opening hours, ONLY use URLs from this verified list — never invent or guess a URL:
- National Archaeological Museum: https://naim.bg/?lang=en
- National History Museum: https://historymuseum.org/?lang=en
- National Art Gallery: https://nationalgallery.bg/?lang=en
- National Theatre Ivan Vazov: https://nationaltheatre.bg/en
- Boyana Church: https://www.boyanachurch.org/en/
- Sofia History Museum: https://www.sofiahistorymuseum.bg/en
- Free Sofia Tour (walking tours): https://freesofiatour.com
- All other tours and activities in Sofia: https://www.getyourguide.com/sofia-l189/
If the attraction is NOT in this list, use the GetYourGuide link as fallback. NEVER invent a URL.
If you don't know something, admit it honestly.`;

    const messages = [
      { role: 'system', content: systemPrompt },
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
        messages,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;
    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}
