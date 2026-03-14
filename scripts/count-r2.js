
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

async function countR2() {
    let token = undefined;
    let totalCount = 0;

    console.log("Counting objects in R2 bucket...");

    do {
        const data = await r2Client.send(new ListObjectsV2Command({
            Bucket: process.env.VITE_R2_BUCKET_NAME,
            ContinuationToken: token
        }));

        if (data.Contents) {
            totalCount += data.Contents.length;
        }
        token = data.NextContinuationToken;
    } while (token);

    console.log(`\nTotal objects in R2: ${totalCount}`);
}

countR2();
