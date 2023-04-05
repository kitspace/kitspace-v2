import jsYaml from 'js-yaml'
import fs from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { log } from './log.js'

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
  // a single kitspaceYaml doesn't have the multi key
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
  let input: KitspaceYamlInput
  try {
    const yamlContents = await Promise.all(filePaths.map(tryReadFile)).then(
      ([yaml, yml, kitnicYaml, kitnicYml]) =>
        yaml || yml || kitnicYaml || kitnicYml,
    )
    const obj = jsYaml.load(yamlContents)
    input = kitspaceYamlInput.parse(obj)
  } catch (e) {
    log.warn(`Could not parse Kitspace YAML file for ${inputDir}: `, e)
    // return the default
    return [kitspaceYaml.parse({ name: '_' })]
  }

  // if we have a single project then name the project "_" and return it in a
  // length 1 array
  if (!input.multi) {
    return [{ ...input, name: '_' } as KitspaceYaml]
  }

  // if the kitspacey yaml uses `multi` then return an array of all the
  // sub-projects under `multi`, using their keys as names
  const arr: Array<KitspaceYaml> = []
  for (const key of Object.keys(input.multi)) {
    arr.push({ ...input.multi[key], name: formatAsGiteaRepoName(key) })
  }
  return arr
}

function tryReadFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8').catch(err => {
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
