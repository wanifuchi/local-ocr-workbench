const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    return;
  }

  const { image, prompt, model } = req.body;

  if (!image || !prompt) {
    res.status(400).json({ error: 'image and prompt are required.' });
    return;
  }

  const geminiModel = model || 'gemini-2.5-flash';
  const url = `${GEMINI_API_BASE}/models/${geminiModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const mimeType = detectMimeType(image);

  const geminiBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
    },
  };

  try {
    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      res.status(geminiResponse.status).json({
        error: `Gemini API error: ${geminiResponse.status} ${errorBody}`,
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = geminiResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        res.end();
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
    }
  } catch (fetchError) {
    if (!res.headersSent) {
      res.status(500).json({
        error: fetchError instanceof Error ? fetchError.message : 'Gemini API request failed.',
      });
    }
  }
}

function detectMimeType(base64Data) {
  if (base64Data.startsWith('/9j/')) return 'image/jpeg';
  if (base64Data.startsWith('iVBOR')) return 'image/png';
  if (base64Data.startsWith('R0lGO')) return 'image/gif';
  if (base64Data.startsWith('UklGR')) return 'image/webp';
  return 'image/png';
}
