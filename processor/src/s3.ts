import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import {
  DATA_DIR,
  S3_CLIENT_CONFIG,
  S3_PROCESSOR_BUCKET_NAME,
  USE_LOCAL_MINIO,
} from './env.js'

export interface S3 {
  uploadFile(filepath: string, contentType: string): Promise<void>
  uploadFileContents(
    filename: string,
    contents: string | Uint8Array | Buffer,
    contentType: string,
  ): Promise<void>
  getFileContents(filpath: string, encoding?: BufferEncoding): Promise<string>
  exists(filepath: string): Promise<boolean>
  existsAll(paths: Array<string>): Promise<boolean>
}

export async function createS3(): Promise<S3> {
  const s3Client = new S3Client(S3_CLIENT_CONFIG)
  const bucketName = S3_PROCESSOR_BUCKET_NAME

  try {
    // check if it exists already
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
  } catch (err) {
    // if it doesn't exist create it
    await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }))

    const publicReadPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
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
    // we need cors on all assets, minio doesn't support this command so for
    // development it's handled in nginx instead
    if (!USE_LOCAL_MINIO) {
      await s3Client.send(
        new PutBucketCorsCommand({
          Bucket: bucketName,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
                AllowedHeaders: ['*'],
                AllowedOrigins: ['*'],
              },
            ],
          },
        }),
      )
    }
  }

  return {
    async uploadFileContents(filepath, contents, contentType) {
      const filename = path.relative(DATA_DIR, filepath)
      await Promise.all([
        s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: filename,
            Body: contents,
            ContentType: contentType,
          }),
        ),
        // make a copy that you can access with user/project/HEAD instead of
        // the exact hash
        s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: getHeadPath(filename),
            Body: contents,
            ContentType: contentType,
          }),
        ),
      ])
    },
    async uploadFile(filepath, contentType) {
      const contents = await fs.readFile(filepath)
      return this.uploadFileContents(filepath, contents, contentType)
    },
    async getFileContents(filepath, encoding = 'utf-8') {
      const filename = path.relative(DATA_DIR, filepath)
      const response = await s3Client.send(
        new GetObjectCommand({ Bucket: bucketName, Key: filename }),
      )
      return streamToString(response.Body, encoding)
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

function getHeadPath(x) {
  // path is: files/user/project/${hash}/file so we replace the hash with "HEAD"
  const p = x.split('/')
  p[3] = 'HEAD'
  return p.join('/')
}

function streamToString(stream, encoding: BufferEncoding): Promise<string> {
  const chunks = []
  stream.on('data', chunk => chunks.push(Buffer.from(chunk)))
  return new Promise((resolve, reject) => {
    stream.on('error', err => reject(err))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString(encoding)))
  })
}
