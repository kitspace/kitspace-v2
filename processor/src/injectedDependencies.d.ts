import { Index } from 'meilisearch'
import { GiteaDB } from './giteaDB.js'
import { S3 } from './s3.js'

export interface InjectedDependencies {
  meiliIndex: Index
  giteaDB: GiteaDB
  s3: S3
}
