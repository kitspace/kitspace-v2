import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import zlib from 'node:zlib'
import {
  DATA_DIR,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_ENDPOINT,
  S3_PROCESSOR_BUCKET_NAME,
  USE_LOCAL_MINIO,
} from './env.js'

const gzip = util.promisify(zlib.gzip)

const s3ClientConfig = {
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  region: 'eu-west-2',
  endpoint: S3_ENDPOINT,
  forcePathStyle: true,
}
const bucketName = S3_PROCESSOR_BUCKET_NAME

export class S3 {
  #s3Client: S3Client

  constructor(s3Client: S3Client) {
    this.#s3Client = s3Client
  }

  async uploadFileContents(
    filepath: string,
    contents: string | Uint8Array | Buffer,
    contentType: MimeType,
  ): Promise<void> {
    const filename = path.relative(DATA_DIR, filepath)
    let contentEncoding: undefined | 'gzip'
    if (useGzip(contentType)) {
      contents = await gzip(contents)
      contentEncoding = 'gzip'
    }
    await Promise.all([
      this.#s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: filename,
          Body: contents,
          ContentType: contentType,
          ContentEncoding: contentEncoding,
        }),
      ),
      // make a copy that you can access with user/project/HEAD instead of
      // the exact hash
      this.#s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: getHeadPath(filename),
          Body: contents,
          ContentType: contentType,
          ContentEncoding: contentEncoding,
        }),
      ),
    ])
  }

  async uploadFile(filepath: string, contentType: MimeType): Promise<void> {
    const contents = await fs.readFile(filepath)
    return this.uploadFileContents(filepath, contents, contentType)
  }

  async getFileContents(
    filepath: string,
    encoding: BufferEncoding = 'utf8',
  ): Promise<string> {
    const filename = path.relative(DATA_DIR, filepath)
    const response = await this.#s3Client.send(
      new GetObjectCommand({ Bucket: bucketName, Key: filename }),
    )
    let stream = response.Body
    if (response.ContentEncoding === 'gzip') {
      // @ts-ignore
      stream = response.Body.pipe(zlib.createGunzip())
    }
    return streamToString(stream, encoding)
  }

  async exists(filepath: string): Promise<boolean> {
    const filename = path.relative(DATA_DIR, filepath)
    try {
      await this.#s3Client.send(
        new HeadObjectCommand({ Bucket: bucketName, Key: filename }),
      )
      return true
    } catch (err) {
      if (err?.$metadata?.httpStatusCode === 404) {
        return false
      }
      throw err
    }
  }

  async existsAll(paths: Array<string>): Promise<boolean> {
    let allDoExist = true
    for (const p of paths) {
      allDoExist = allDoExist && (await this.exists(p))
    }
    return allDoExist
  }
}

async function createS3(): Promise<S3> {
  const s3Client = new S3Client(s3ClientConfig)

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
                AllowedMethods: ['GET', 'HEAD'],
                AllowedHeaders: ['*'],
                AllowedOrigins: ['*'],
              },
            ],
          },
        }),
      )
    }
  }

  return new S3(s3Client)
}

export const s3 = await createS3()

export type MimeType =
  | 'application/json'
  | 'application/zip'
  | 'image/png'
  | 'image/svg+xml'
  | 'text/html'
  | 'text/tab-seperated-values'

function useGzip(contentType: MimeType): boolean {
  return (
    contentType.startsWith('text/') ||
    contentType === 'image/svg+xml' ||
    contentType === 'application/json'
  )
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
