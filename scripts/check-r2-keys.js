
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
    }
});

async function checkR2() {
    const data = await r2Client.send(new ListObjectsV2Command({
        Bucket: process.env.VITE_R2_BUCKET_NAME,
        Prefix: 'companies/1/assets/1080/',
        MaxKeys: 10
    }));

    if (data.Contents) {
        data.Contents.forEach(obj => {
            console.log(`KEY_JSON: ${JSON.stringify(obj.Key)} | SIZE: ${obj.Size}`);
        });
    }
}
checkR2();
