# 🗑️ Como Deletar um Bucket R2

O Cloudflare R2 exige que o bucket esteja **completamente vazio** antes de ser deletado.

## Passo a Passo (Via Dashboard)

1. **Acesse o Dashboard**: [https://dash.cloudflare.com](https://dash.cloudflare.com) > **R2**.
2. Clique no nome do bucket que deseja excluir.
3. **Esvaziar o Bucket:**
   - Vá na aba **Object browser** (Arquivos).
   - Selecione todos os arquivos.
   - Clique em **Delete** (Excluir).
   - *Se tiver muitos arquivos, repita o processo até zerar.*
4. **Deletar o Bucket:**
   - Vá na aba **Settings** (Configurações).
   - Role até o final da página (**Danger Zone**).
   - Clique em **Delete Bucket**.
   - Digite o nome do bucket para confirmar.
   - Clique em **Delete**.

## Passo a Passo (Via Script Node.js)

Se você tiver permissão **Admin Read & Write**, pode usar este script para esvaziar e deletar:

1. Crie um arquivo `scripts/nuke-bucket.js`.
2. Conteúdo:

```javascript
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand, DeleteBucketCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
    },
});

const bucket = process.env.VITE_R2_BUCKET_NAME;

async function nuke() {
    console.log(`🚨 DELETING ALL OBJECTS IN: ${bucket}`);
    
    // Lista objetos
    const list = await client.send(new ListObjectsV2Command({ Bucket: bucket }));
    
    if (list.Contents && list.Contents.length > 0) {
        const objects = list.Contents.map(k => ({ Key: k.Key }));
        await client.send(new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: objects }
        }));
        console.log(`🗑️ Deleted ${objects.length} objects.`);
    } else {
        console.log("✅ Bucket is empty.");
    }

    console.log(`💣 Deleting Bucket: ${bucket}`);
    await client.send(new DeleteBucketCommand({ Bucket: bucket }));
    console.log("✅ Bucket Deleted!");
}

nuke().catch(console.error);
```
