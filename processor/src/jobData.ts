export interface JobData {
  searchId: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kitspaceYaml: Record<string, any>
  repoFullName: string
  hash: string
  inputDir: string
  outputDir: string
  subprojectName?: string
}
