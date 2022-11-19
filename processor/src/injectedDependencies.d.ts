import { Index } from 'meilisearch'
import { GiteaDB } from './giteaDB.js'

export interface InjectedDependencies {
  meiliIndex: Index
  giteaDB: GiteaDB
}
