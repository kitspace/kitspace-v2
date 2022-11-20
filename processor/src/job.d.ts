import { Job as BullMQJob } from 'bullmq'
import { KitspaceYaml } from './kitspaceYaml'

export interface JobData {
  giteaId: string | null
  kitspaceYaml: KitspaceYaml
  originalUrl: string
  defaultBranch: string
  ownerName: string
  repoName: string
  hash: string
  inputDir: string
  outputDir: string
  subprojectName: string
}

export interface JobProgress {
  status: string
  outputDir: string
  file: string
  error?: Error
}

export interface Job extends BullMQJob {
  data: JobData
  updateProgress(jobProgress: JobProgress): Promise<void>
}
