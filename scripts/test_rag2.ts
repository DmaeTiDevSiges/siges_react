import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY!);

async function test(query: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const response = await model.embedContent(query);
  const embedding = response.embedding.values.slice(0, 768);

  const { data, error } = await supabase.rpc("match_knowledge", {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: 3,
  });

  if (error) {
    console.error('Erro:', error);
    return;
  }

  console.log(`\n=== "${query}" ===`);
  data?.forEach((row: any) => {
    console.log(`\n--- ${row.similarity?.toFixed(3)} ---`);
    console.log(row.content.substring(0, 250));
  });
}

await test("O que é OS?");
await test("diferença entre SS e OS");
await test("o que são unidades");
