
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const MINIO_BUCKET = "supabase";
const MINIO_ENDPOINT = "https://vps.minio.s3.siges-app.com.br";
const MINIO_REGION = "eu-south";
const MINIO_ACCESS_KEY = "HHGNXEL4LN3O24BK5KCN";
const MINIO_SECRET_KEY = "W3bgWOdma3J1v8sCJ6yYdUjKEO5nrUTj4DDCdEtI";

const minioClient = new S3Client({
    region: MINIO_REGION,
    endpoint: MINIO_ENDPOINT,
    forcePathStyle: true,
    credentials: { accessKeyId: MINIO_ACCESS_KEY, secretAccessKey: MINIO_SECRET_KEY }
});

async function listMinioKeys() {
    console.log("🔍 Verificando chaves exatas no MinIO...");
    try {
        const data = await minioClient.send(new ListObjectsV2Command({
            Bucket: MINIO_BUCKET,
            Prefix: "stub/siges/companies/1/assets/1080/",
            MaxKeys: 10
        }));

        if (data.Contents) {
            data.Contents.forEach(obj => {
                console.log(`Key: [${obj.Key}] | Tamanho: ${obj.Size}`);
            });
        } else {
            console.log("Nada encontrado.");
        }
    } catch (err) {
        console.error(err);
    }
}

listMinioKeys();
