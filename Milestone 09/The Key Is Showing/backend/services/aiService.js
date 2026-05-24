export async function summarizeNotes(notes) {
  if (!notes || typeof notes !== 'string') {
    throw new Error('Invalid notes provided');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured on server');
  }

  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a concise study note summariser. Return a bullet-point summary of the key concepts.' },
      { role: 'user', content: notes }
    ]
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI request failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned an unexpected response');
  }

  return content;
}
