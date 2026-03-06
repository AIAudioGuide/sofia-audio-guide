import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    // KrisVoice ID
    const voice_id = 'Rk1yrzF84bXvI6a9zmxU';

    // Use text-to-speech with voice_settings to force unique output
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY || '',
        },
        body: JSON.stringify({
          text: text.substring(0, 100),
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: Math.random(),  // Random to force new generation
            similarity_boost: Math.random(),
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs error:', error);
      return NextResponse.json({ error: error }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    return NextResponse.json({ audio: base64 });
  } catch (error: any) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate audio' }, { status: 500 });
  }
}
