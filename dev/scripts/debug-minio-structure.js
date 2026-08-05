
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

async function listRoot() {
    console.log("Listing root of bucket:", MINIO_BUCKET);
    try {
        const cmd = new ListObjectsV2Command({
            Bucket: MINIO_BUCKET,
            Delimiter: '/',
            MaxKeys: 20
        });
        const data = await minioClient.send(cmd);
        console.log("CommonPrefixes (Folders):");
        data.CommonPrefixes?.forEach(p => console.log(' - ' + p.Prefix));
        console.log("Contents (Files):");
        data.Contents?.forEach(c => console.log(' - ' + c.Key));
    } catch (e) {
        console.error(e);
    }
}

async function listSiges() {
    console.log("\nListing 'siges/':");
    try {
        const cmd = new ListObjectsV2Command({
            Bucket: MINIO_BUCKET,
            Prefix: 'siges/',
            Delimiter: '/',
            MaxKeys: 20
        });
        const data = await minioClient.send(cmd);
        console.log("CommonPrefixes (Folders):");
        data.CommonPrefixes?.forEach(p => console.log(' - ' + p.Prefix));
        console.log("Contents (Files):");
        data.Contents?.forEach(c => console.log(' - ' + c.Key));
    } catch (e) {
        console.error(e);
    }
}

async function listStubSiges() {
    console.log("\nListing 'stub/siges/':");
    try {
        const cmd = new ListObjectsV2Command({
            Bucket: MINIO_BUCKET,
            Prefix: 'stub/siges/',
            Delimiter: '/',
            MaxKeys: 20
        });
        const data = await minioClient.send(cmd);
        console.log("CommonPrefixes (Folders):");
        data.CommonPrefixes?.forEach(p => console.log(' - ' + p.Prefix));
        console.log("Contents (Files):");
        data.Contents?.forEach(c => console.log(' - ' + c.Key));
    } catch (e) {
        console.error(e);
    }
}

(async () => {
    await listRoot();
    await listSiges();
    await listStubSiges();
})();
