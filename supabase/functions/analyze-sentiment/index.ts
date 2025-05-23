
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openAIApiKey) {
    console.error('OpenAI API key not configured');
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { text, mode } = await req.json()
    console.log(`Request received: mode=${mode}, text length=${text?.length || 0}`);
    
    if (!text || text.trim() === '') {
      console.error('No text provided for analysis');
      return new Response(
        JSON.stringify({ error: 'No text provided for analysis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (mode === 'topics') {
      console.log('Analyzing topics for text');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          messages: [
            {
              role: 'system',
              content: 'You are a topic modeling expert. Analyze the text and identify key themes/topics. For each topic, provide a short label and list of related comments. Return the result as a valid JSON array where each object has properties: "topic" (string), "comments" (array of strings). Make sure each comment is assigned to exactly one most relevant topic. Every comment must be assigned to a topic. Important: Return ONLY the JSON array with no markdown or code block formatting.'
            },
            { role: 'user', content: text }
          ],
          temperature: 0.3,
        }),
      })

      const data = await response.json()
      console.log('OpenAI topics response received');
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid response from OpenAI API:', JSON.stringify(data));
        throw new Error('Invalid response from OpenAI API');
      }
      
      let topicsContent = data.choices[0].message.content;
      console.log('Topics raw content:', topicsContent);
      
      topicsContent = topicsContent.replace(/```json\n|\n```|```/g, '');
      
      try {
        const topics = JSON.parse(topicsContent);
        console.log(`Successfully parsed topics: ${topics.length} topics found`);
        
        return new Response(
          JSON.stringify({ topics }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (parseError) {
        console.error('Error parsing topics JSON:', parseError, 'Content was:', topicsContent);
        return new Response(
          JSON.stringify({ error: 'Failed to parse topics response', details: parseError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
    
    console.log(`Analyzing sentiment for text (length: ${text.length})`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Analyze the sentiment of the text and return a score between -1 (very negative) and 1 (very positive). Return only the number, no explanation.'
          },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
      }),
    })

    const data = await response.json()
    console.log('OpenAI sentiment response received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response from OpenAI API:', JSON.stringify(data));
      throw new Error('Invalid response from OpenAI API');
    }
    
    const aiScore = parseFloat(data.choices[0].message.content.trim())
    
    if (isNaN(aiScore)) {
      console.error('Failed to parse sentiment score from OpenAI response:', data.choices[0].message.content);
      throw new Error('Failed to parse sentiment score from OpenAI response');
    }

    console.log(`Sentiment analysis complete, score: ${aiScore}`);
    return new Response(
      JSON.stringify({ score: aiScore }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
