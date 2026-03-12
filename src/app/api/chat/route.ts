import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY not set in environment');
}

const LANDMARKS_INFO = `
You are a knowledgeable tour guide for Sofia, Bulgaria. Here are the main landmarks on the tour:

1. Sveta Nedelya Cathedral - One of Sofia's oldest churches dating to the 10th century, located in the city center
2. Statue of Sofia - Iconic bronze monument depicting the goddess Sofia, unveiled in 2000
3. Catholic Cathedral St. Josef - Main Roman Catholic cathedral in Sofia, built in French Gothic style
4. St. Petka of the Saddlemakers - 14th-century medieval church known for beautiful frescoes
5. Roman Ruins - Ancient Serdica remains from the 2nd-4th century AD beneath Sofia's streets
6. Square of Tolerance - Unique square where mosque, synagogue, and church stand near each other
7. Banya Basho Mosque - Ottoman-era mosque built in 1576 by Mimar Sinan, the only functioning mosque in Sofia
8. Sofia Synagogue - One of the largest Jewish synagogues in Europe, built in 1909
9. Central Public Bath - Historic thermal bath facility with Neo-Byzantine architecture
10. Mineral Springs - Natural thermal water springs that have been used for healing for centuries
11. Triangle of Power - Administrative heart of Bulgaria between Presidency, Council of Ministers, and National Assembly
12. Eastern Gate - Ancient Roman gate dating to the 2nd century AD, one of the best-preserved gates
13. Presidency - Official office of the President of Bulgaria, housed in the former royal palace
14. Rotunda St George - One of Sofia's oldest buildings, 4th-century Roman temple converted to Christian church
15. Archaeological Museum - Houses over 650,000 artifacts from prehistoric to medieval times
16. City Garden - Oldest public park in Sofia, opened in 1878
17. National Theatre Ivan Vazov - Bulgaria's oldest national theatre, built in 1907
18. National Art Gallery - Houses over 50,000 works of Bulgarian art in the former royal palace
19. Dutch Embassy - Modern embassy architecture near Vitosha Boulevard
20. St. Sofia Church - 6th-century Byzantine church that gave Sofia its name
21. St. Alexander Nevski Cathedral - Iconic gold-domed Orthodox cathedral built in 1882
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
