
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

async function findWeirdExtensions() {
    console.log("🔍 Inspecting for folders that look like files (extensions)...");
    let token = undefined;
    let count = 0;
    const foundExtensions = new Set();
    const weirdPaths = [];

    do {
        const cmd = new ListObjectsV2Command({
            Bucket: MINIO_BUCKET,
            Prefix: 'stub/siges/',
            ContinuationToken: token
        });
        const data = await minioClient.send(cmd);

        if (data.Contents) {
            for (const obj of data.Contents) {
                count++;
                const parts = obj.Key.split('/');
                if (parts.length > 2) {
                    const secondToLast = parts[parts.length - 2];
                    const match = secondToLast.match(/\.([a-z0-9]+)$/i);
                    if (match) {
                        const ext = match[1].toLowerCase();
                        if (!foundExtensions.has(ext)) {
                            foundExtensions.add(ext);
                            console.log(`Found extension: ${ext}`);
                        }
                        if (weirdPaths.length < 10) {
                            weirdPaths.push(obj.Key);
                            console.log(`Found weird path: ${obj.Key}`);
                        }
                    }
                }
            }
        }
        token = data.NextContinuationToken;
        if (count >= 10000) break;
    } while (token);

    console.log(`\n--- SUMMARY ---`);
    console.log(`Scanned ${count} items.`);
    console.log(`Found "directory-like" extensions:`, Array.from(foundExtensions));
}

findWeirdExtensions().catch(console.error);
