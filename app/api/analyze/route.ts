import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CANONICAL_FIELDS = [
  "id", "name", "category", "subcategory", "cost", 
  "price", "color", "brand", "year", "image"
];

export async function POST(request: Request) {
  try {
    const { headers, preview } = await request.json();

    if (!headers || headers.length === 0) {
      return NextResponse.json({ error: "No headers provided" }, { status: 400 });
    }

    const prompt = `
      You are a Data Mapping Expert.
      
      I have a CSV file with the following columns: ${JSON.stringify(headers)}.
      Here is a data preview (first 3 rows): ${JSON.stringify(preview.slice(0, 3))}.

      Your task is to map these CSV columns to my Canonical Product Model.
      
      The Canonical Model has these exact fields:
      ${JSON.stringify(CANONICAL_FIELDS)}

      Rules:
      1. Analyze the column names and the preview data to understand the content.
      2. Return a JSON object where keys are Canonical Fields and values are the matching CSV Column names.
      3. If a canonical field cannot be found in the CSV, map it to null.
      4. Do not invent columns. Only use exact column names from the CSV.
      
      Example output format:
      {
        "id": "product_id",
        "name": "Title",
        "price": null
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini", 
      messages: [
        { role: "system", content: "You are a helpful assistant that outputs only valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0].message.content;
    
    return NextResponse.json(JSON.parse(result || "{}"));

  } catch (error) {
    console.error("OpenAI Error:", error);

    return NextResponse.json(
      { error: "Failed to analyze CSV", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}