
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

async function inspectAssets() {
    console.log("Inspecting 'stub/siges/assets/'...");
    let token = undefined;
    let count = 0;
    const weirdFiles = [];

    // Only list first 1000 items to avoid spamming
    do {
        const cmd = new ListObjectsV2Command({
            Bucket: MINIO_BUCKET,
            Prefix: 'stub/siges/assets/',
            ContinuationToken: token,
            MaxKeys: 1000
        });
        const data = await minioClient.send(cmd);

        if (data.Contents) {
            for (const obj of data.Contents) {
                count++;
                // Check if key contains .jpg/ (nested structure)
                if (obj.Key.match(/\.(jpg|jpeg|png|webp|gif)\//i)) {
                    weirdFiles.push(obj.Key);
                }
            }
        }
        token = data.NextContinuationToken;
        if (count >= 1000) break;
    } while (token);

    console.log(`Scanned ${count} items.`);
    if (weirdFiles.length > 0) {
        console.log(`Found ${weirdFiles.length} files with nested image structure. Examples:`);
        weirdFiles.slice(0, 10).forEach(k => console.log(k));
    } else {
        console.log("No nested image structures found in first 1000 items.");
    }
}

inspectAssets().catch(console.error);
