import { z } from 'zod'
import jsYaml from 'js-yaml'
import path from 'node:path'
import { promises as fs } from 'fs'
import log from 'loglevel'

const eda = z.object({ type: z.enum(['kicad', 'eagle']), pcb: z.string() })

export const singleKitspaceYaml = z.object({
  summary: z.string().default(''),
  site: z.string().url().or(z.literal('')).default(''),
  color: z
    .enum(['green', 'red', 'blue', 'black', 'white', 'orange', 'purple', 'yellow'])
    .default('green'),
  bom: z.string().optional(),
  gerbers: z.string().optional(),
  eda: eda.optional(),
  readme: z.string().optional(),
  'pcb-services': z
    .enum(['aisler', 'pcbway', 'oshpark', 'jlcpcb'])
    .array()
    .optional(),
  'ibom-enabled': z.boolean().default(true),
  multi: z.undefined(),
})

export type SingleKitspaceYaml = z.infer<typeof singleKitspaceYaml>

const multiKey = z
  .string()
  .refine(key => key !== '_', { message: 'Cannot use "_" as project name.' })

export const multiKitspaceYaml = z.object({
  multi: z.record(multiKey, singleKitspaceYaml),
})

export type MultiKitspaceYaml = z.infer<typeof multiKitspaceYaml>

export const kitspaceYamlInput = multiKitspaceYaml.or(singleKitspaceYaml)

export type KitspaceYamlInput = z.infer<typeof kitspaceYamlInput>

export const kitspaceYaml = singleKitspaceYaml.extend({ name: z.string() })

export type KitspaceYaml = z.infer<typeof kitspaceYaml>

export async function getKitspaceYaml(
  inputDir: string,
): Promise<Array<KitspaceYaml>> {
  const filePaths = [
    'kitspace.yaml',
    'kitspace.yml',
    'kitnic.yaml',
    'kitnic.yml',
  ].map(p => path.join(inputDir, p))
  const yamlFile = await Promise.all(filePaths.map(tryReadFile)).then(
    ([yaml, yml, kitnicYaml, kitnicYml]) => yaml || yml || kitnicYaml || kitnicYml,
  )
  const result = kitspaceYamlInput.safeParse(jsYaml.safeLoad(yamlFile) || {})

  if (result.success === false) {
    log.warn('Could not parse kitspace YAML file:', result.error)
    return [kitspaceYaml.parse({ name: '_' })]
  }

  const parsedData = result.data

  if (!parsedData.multi) {
    return [{ ...parsedData, name: '_' } as KitspaceYaml]
  }

  const arr: Array<KitspaceYaml> = []
  for (const key of Object.keys(parsedData.multi)) {
    arr.push({ ...parsedData.multi[key], name: formatAsGiteaRepoName(key) })
  }
  return arr
}

function tryReadFile(filePath: string): Promise<string | Buffer> {
  return fs.readFile(filePath).catch(err => {
    // just return an empty string if the file doesn't exist
    if (err.code === 'ENOENT') {
      return ''
    }
    throw err
  })
}

/**
 * format subproject name as a valid gitea repo name.
 * This replaces any **non* (alphanumeric, -, _, and .) with a '-',
 * see https://github.com/go-gitea/gitea/blob/b59b0cad0a550223f74add109ff13c0d2f4309f3/services/forms/repo_form.go#L35
 * @param subProjectName
 */
function formatAsGiteaRepoName(subProjectName: string) {
  return subProjectName.replace(/[^\w\d-_.]/g, '-').slice(0, 100)
}
