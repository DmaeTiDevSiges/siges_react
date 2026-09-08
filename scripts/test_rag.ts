import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY!);

async function test() {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const response = await model.embedContent("O que são SS's não programadas?");
  const embedding = response.embedding.values.slice(0, 768);

  const { data, error } = await supabase.rpc("match_knowledge", {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: 5,
  });

  if (error) {
    console.error('Erro:', error);
    return;
  }

  console.log('Resultados para "O que são SS\'s não programadas?":');
  data?.forEach((row: any) => {
    console.log(`\n--- ${row.similarity?.toFixed(3)} ---`);
    console.log(row.content.substring(0, 200));
  });
}

test();
