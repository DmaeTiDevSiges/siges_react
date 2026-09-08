import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY!);

async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const response = await model.embedContent(text);
  return response.embedding.values.slice(0, 768);
}

async function fix() {
  // Buscar entradas sem embedding
  const { data: entries, error } = await supabase
    .from('ai_knowledge')
    .select('id, content')
    .is('embedding', null);

  if (error) {
    console.error('Erro ao buscar:', error);
    return;
  }

  console.log(`Encontradas ${entries.length} entradas sem embedding`);

  for (const entry of entries) {
    try {
      console.log(`Gerando embedding para ${entry.id}...`);
      const embedding = await generateEmbedding(entry.content);
      
      const { error: updateError } = await supabase
        .from('ai_knowledge')
        .update({ embedding })
        .eq('id', entry.id);

      if (updateError) {
        console.error(`Erro ao atualizar ${entry.id}:`, updateError);
      } else {
        console.log(`✓ ${entry.id} atualizado`);
      }
      
      // Delay para evitar rate limit
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`Falha em ${entry.id}:`, err);
    }
  }
  
  console.log('Concluído!');
}

fix();
