
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const MINIO_ENDPOINT = "https://vps.minio.s3.siges-app.com.br";
const MINIO_ACCESS_KEY = "HHGNXEL4LN3O24BK5KCN";
const MINIO_SECRET_KEY = "W3bgWOdma3J1v8sCJ6yYdUjKEO5nrUTj4DDCdEtI";
const MINIO_BUCKET = "supabase";

const minioClient = new S3Client({
    region: "eu-south",
    endpoint: MINIO_ENDPOINT,
    forcePathStyle: true,
    credentials: { accessKeyId: MINIO_ACCESS_KEY, secretAccessKey: MINIO_SECRET_KEY }
});

async function list() {
    try {
        const cmd = new ListObjectsV2Command({
            Bucket: MINIO_BUCKET,
            Prefix: 'stub/siges/',
            Delimiter: '/'
        });
        const data = await minioClient.send(cmd);
        console.log(JSON.stringify({
            prefixes: data.CommonPrefixes?.map(p => p.Prefix),
            files: data.Contents?.map(c => c.Key)
        }, null, 2));
    } catch (e) {
        console.error(e);
    }
}

list();
