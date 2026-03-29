import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, maxTokens = 500 } = await req.json();
    if (!prompt) {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
    });

    return Response.json({ text: aiResponse });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});