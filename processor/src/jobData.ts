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
  subprojectName?: string
}
