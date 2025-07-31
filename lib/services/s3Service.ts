import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Environment variables
const region = process.env.AWS_REGION || "eu-north-1";
const bucketName = process.env.S3_BUCKET_NAME || "amize-uploads";

// Create S3 client
const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

// Type definitions for upload parameters
interface S3UploadParams {
    file: Buffer;
    key: string;
    contentType?: string;
    metadata?: Record<string, string>;
}

interface S3UploadResult {
    key: string;
    url: string;
    etag?: string;
}

// Upload a file to S3
export async function uploadToS3({
                                     file,
                                     key,
                                     contentType = "application/octet-stream",
                                     metadata = {},
                                 }: S3UploadParams): Promise<S3UploadResult> {
    try {
        // Configure the upload parameters
        const uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: file,
            ContentType: contentType,
            Metadata: metadata,
        };

        // Use multipart upload for large files
        const upload = new Upload({
            client: s3Client,
            params: uploadParams,
        });

        // Execute the upload
        const result = await upload.done();

        // Generate the public URL or signed URL based on access permissions
        const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

        return {
            key,
            url,
            etag: result.ETag,
        };
    } catch (error) {
        console.error("S3 upload error:", error);
        throw new Error(`Failed to upload file to S3: ${(error as Error).message}`);
    }
}

// Delete a file from S3
export async function deleteFromS3(key: string): Promise<boolean> {
    try {
        const deleteParams = {
            Bucket: bucketName,
            Key: key,
        };

        await s3Client.send(new DeleteObjectCommand(deleteParams));
        return true;
    } catch (error) {
        console.error("S3 delete error:", error);
        throw new Error(`Failed to delete file from S3: ${(error as Error).message}`);
    }
}

// Check if a file exists in S3
export async function fileExistsInS3(key: string): Promise<boolean> {
    try {
        const headParams = {
            Bucket: bucketName,
            Key: key,
        };

        await s3Client.send(new HeadObjectCommand(headParams));
        return true;
    } catch (error) {
        return false;
    }
}

// Get a file from S3
export async function getFileFromS3(key: string): Promise<Buffer> {
    try {
        const getParams = {
            Bucket: bucketName,
            Key: key,
        };

        const response = await s3Client.send(new GetObjectCommand(getParams));

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        const stream = response.Body as any;

        return new Promise((resolve, reject) => {
            stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    } catch (error) {
        console.error("S3 get file error:", error);
        throw new Error(`Failed to get file from S3: ${(error as Error).message}`);
    }
}

// Generate a presigned URL for direct upload from client
export async function getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
}

// Generate a public URL for a file
export function getPublicUrl(key: string): string {
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

// Helper function to sanitize file names for S3 keys
export function sanitizeKey(fileName: string): string {
    // Remove special characters and spaces
    return fileName
        .replace(/[^\w\d.-]/g, '-')
        .replace(/\s+/g, '-')
        .toLowerCase();
}

// Generate a unique key for S3 storage
export function generateS3Key(userId: string, uploadType: string, fileName: string): string {
    const timestamp = Date.now();
    const sanitizedFileName = sanitizeKey(fileName);

    return `${userId}/${uploadType.toLowerCase()}/${timestamp}-${sanitizedFileName}`;
}