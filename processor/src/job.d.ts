import { Job as BullMQJob } from 'bullmq'
import { KitspaceYaml } from './kitspaceYaml'

export interface RepoJobData {
  defaultBranch: string
  giteaId: string | null
  hash: string
  inputDir: string
  kitspaceYamlArray: Array<KitspaceYaml>
  originalUrl: string
  outputDir: string
  ownerName: string
  repoName: string
  repoDescription: string
  createdUnix: string
  updatedUnix: string
}

export interface ProjectJobData
  extends Omit<RepoJobData, 'kitspaceYamlArray' | 'repoDescription'> {
  kitspaceYaml: KitspaceYaml
  subprojectName: string
}

export interface JobProgress {
  status: string
  outputDir: string
  file: string
  error?: Error
}

export interface Job extends BullMQJob {
  data: ProjectJobData
  updateProgress(jobProgress: JobProgress): Promise<void>
}
