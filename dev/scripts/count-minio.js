
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const SOURCE_PREFIX = "stub/siges/";
const MINIO_BUCKET = "supabase";
const MINIO_ENDPOINT = "https://vps.minio.s3.siges-app.com.br";
const MINIO_ACCESS_KEY = "HHGNXEL4LN3O24BK5KCN";
const MINIO_SECRET_KEY = "W3bgWOdma3J1v8sCJ6yYdUjKEO5nrUTj4DDCdEtI";

const minioClient = new S3Client({
    region: "eu-south",
    endpoint: MINIO_ENDPOINT,
    forcePathStyle: true,
    credentials: { accessKeyId: MINIO_ACCESS_KEY, secretAccessKey: MINIO_SECRET_KEY }
});

async function countMinio() {
    let token = undefined;
    let totalCount = 0;

    console.log(`Counting objects in MinIO bucket '${MINIO_BUCKET}' with prefix '${SOURCE_PREFIX}'...`);

    do {
        const data = await minioClient.send(new ListObjectsV2Command({
            Bucket: MINIO_BUCKET,
            Prefix: SOURCE_PREFIX,
            ContinuationToken: token
        }));

        if (data.Contents) {
            totalCount += data.Contents.length;
        }
        token = data.NextContinuationToken;
    } while (token);

    console.log(`\nTotal objects in MinIO (stub/siges/): ${totalCount}`);
}

countMinio();
