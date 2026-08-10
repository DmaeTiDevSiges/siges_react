
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import dotenv from 'dotenv';

// Load env
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const check = async () => {
    const bucketName = process.env.VITE_R2_BUCKET_NAME;
    const accountId = process.env.VITE_R2_ACCOUNT_ID;

    const r2 = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
        },
    });

    try {
        await r2.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: `check-${Date.now()}.txt`,
            Body: "OK"
        }));
        fs.writeFileSync('r2_result.txt', 'SUCCESS: Write permission OK');
        console.log('SUCCESS: Write permission OK');
    } catch (err) {
        const errorMsg = `FAILURE: ${err.name} - ${err.message}`;
        fs.writeFileSync('r2_result.txt', errorMsg);
        console.error(errorMsg);
    }
};

check();
