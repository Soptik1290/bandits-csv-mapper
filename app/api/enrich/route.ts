import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { products } = await request.json();

    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const cleanProducts = products.map(p => {
      const clean: any = {};
      Object.entries(p).forEach(([k, v]) => {
        if (v !== null && k !== 'enriched_description' && k !== 'image') clean[k] = v;
      });
      return clean;
    });

    const prompt = `
      You are an E-commerce Copywriter.
      
      I will provide a list of products (JSON).
      Your task is to write a SHORT, factual description (1-3 sentences) for each product.
      
      Rules:
      1. Use ONLY the provided data. Do not hallucinate features not listed.
      2. If data is scarce (e.g. only ID), just write "Standard product info not available."
      3. Tone: Professional, engaging.
      4. Return a JSON object where the Key is the Product ID and the Value is the description.
      
      Products:
      ${JSON.stringify(cleanProducts)}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini", 
      messages: [
        { role: "system", content: "You represent data as a JSON object strictly." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0].message.content;
    return NextResponse.json(JSON.parse(result || "{}"));

  } catch (error) {
    console.error("Enrichment Error:", error);
    return NextResponse.json({ error: "Failed to enrich data" }, { status: 500 });
  }
}