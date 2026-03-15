import { Injectable, Logger } from "@nestjs/common";
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand
} from "@aws-sdk/client-s3";

@Injectable()
export class S3Service {
    private readonly logger = new Logger(S3Service.name);
    private readonly s3: S3Client;
    private readonly bucket: string;
    private readonly publicBase: string;

    constructor() {
        const region = process.env.AWS_REGION!;
        this.bucket = process.env.BUCKET_NAME!;
        this.publicBase =
            process.env.PUBLIC_BASE_URL ??
            `https://${this.bucket}.s3.${region}.amazonaws.com`;

        this.s3 = new S3Client({
            region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
            }
        });
    }

    async putProfileAvatar(
        userId: string,
        data: Buffer,
        contentType: string
    ): Promise<{ key: string; url: string }> {
        const key = `user/${userId}/avatar_${Date.now()}`;

        await this.s3.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: data,
                ContentType: contentType,
                CacheControl: "public, max-age=31536000, immutable"
            })
        );

        return { key, url: `${this.publicBase}/${key}` };
    }

    async putObject(
        data: Buffer,
        contentType: string,
        destination: string
    ): Promise<{ url: string }> {
        await this.s3.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: destination,
                Body: data,
                ContentType: contentType,
                CacheControl: "public, max-age=31536000, immutable"
            })
        );
        return { url: `${this.publicBase}/${destination}` };
    }

    async deleteObject(key: string): Promise<void> {
        try {
            await this.s3.send(
                new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: key
                })
            );
        } catch (err) {
            this.logger.error(`Failed to delete key: ${key}`, err);
        }
    }

    getKeyFromUrl(url: string): string | null {
        if (!url || !url.startsWith(this.publicBase)) return null;
        return url.substring(this.publicBase.length + 1);
    }
}
