import {
  CreateBucketCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  PutObjectCommandOutput,
  PutBucketPolicyCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { DATA_DIR, S3_CLIENT_CONFIG, S3_PROCESSOR_BUCKET_NAME } from './env.js'

export interface S3 {
  uploadFile(filepath: string, contentType: string): Promise<PutObjectCommandOutput>
  uploadFileContents(
    filename: string,
    contents: string | Uint8Array | Buffer,
    contentType: string,
  ): Promise<PutObjectCommandOutput>
  exists(filepath: string): Promise<boolean>
  existsAll(paths: Array<string>): Promise<boolean>
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

    const publicReadPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AddPerm',
          Effect: 'Allow',
          Principal: {
            AWS: ['*'],
          },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    }
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(publicReadPolicy),
      }),
    )
  }

  return {
    uploadFileContents(filename, contents, contentType) {
      return s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: filename,
          Body: contents,
          ContentType: contentType,
        }),
      )
    },
    async uploadFile(filepath, contentType) {
      const contents = await fs.readFile(filepath)
      const filename = path.relative(DATA_DIR, filepath)
      return this.uploadFileContents(filename, contents, contentType)
    },
    async exists(filepath) {
      const filename = path.relative(DATA_DIR, filepath)
      try {
        await s3Client.send(
          new HeadObjectCommand({ Bucket: bucketName, Key: filename }),
        )
        return true
      } catch (err) {
        if (err?.$metadata?.httpStatusCode === 404) {
          return false
        }
        throw err
      }
    },
    async existsAll(paths) {
      let allDoExist = true
      for (const p of paths) {
        allDoExist = allDoExist && (await this.exists(p))
      }
      return allDoExist
    },
  }
}
