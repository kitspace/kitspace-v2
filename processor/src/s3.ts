import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { DATA_DIR, S3_CLIENT_CONFIG, S3_PROCESSOR_BUCKET_NAME } from './env.js'

export interface S3 {
  uploadFile(filepath: string): Promise<PutObjectCommandOutput>
  uploadFileContents(
    filename: string,
    contents: string | Uint8Array | Buffer,
  ): Promise<PutObjectCommandOutput>
}

export async function createS3(): Promise<S3> {
  const s3Client = new S3Client(S3_CLIENT_CONFIG)
  const bucketName = S3_PROCESSOR_BUCKET_NAME

  try {
    // check if it exists aleady
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
  } catch (err) {
    // if it doesn't exist create it
    await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }))
  }

  return {
    uploadFileContents(filename, contents) {
      return s3Client.send(
        new PutObjectCommand({ Bucket: bucketName, Key: filename, Body: contents }),
      )
    },
    async uploadFile(filepath) {
      const contents = await fs.readFile(filepath)
      const filename = path.relative(DATA_DIR, filepath)
      return this.uploadFileContents(filename, contents)
    },
  }
}
