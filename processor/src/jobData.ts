export interface JobData {
  giteaId: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kitspaceYaml: Record<string, any>
  ownerName: string
  repoName: string
  hash: string
  inputDir: string
  outputDir: string
  subprojectName?: string
}
