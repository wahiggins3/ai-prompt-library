import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSuggestions(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that analyzes AI prompts and suggests concise titles and descriptions. Title should be max 50 chars, description max 120 chars."
        },
        {
          role: "user",
          content: `Analyze this AI prompt and suggest a concise title and brief description:
          
${prompt}

Return the response in JSON format like this:
{
  "title": "Short, clear title (max 50 chars)",
  "description": "Brief, informative description (max 120 chars)"
}`
        }
      ],
      temperature: 0.7,
    });

    // Parse the JSON response
    const suggestion = JSON.parse(completion.choices[0].message.content);
    return {
      title: suggestion.title.slice(0, 50),
      description: suggestion.description.slice(0, 120)
    };
  } catch (error) {
    console.error('Error generating suggestions:', error);
    throw error;
  }
}
