import cp from 'node:child_process'
import util from 'node:util'

const exec = util.promisify(cp.exec)

export interface ExecReturn {
  stdout: string
  stderr: string
}

/*
 * Tagged template that escapes inputs and executes via the shell
 * example: sh`echo ${userName}`
 */
export async function sh(
  strings: TemplateStringsArray,
  ...values: Array<unknown>
): Promise<ExecReturn> {
  const escaped = values.map(String).map(shellEscape)
  const cmd = recombineTemplate(strings, escaped)
  return exec(cmd)
}

// adapted from https://github.com/xxorax/node-shell-escape
function shellEscape(s: string): string {
  if (/[^A-Za-z0-9_\/:=-]/.test(s)) {
    s = "'" + s.replace(/'/g, "'\\''") + "'"
    // unduplicate single-quote at the beginning
    s = s
      .replace(/^(?:'')+/g, '')
      // remove non-escaped single-quote if there are enclosed between 2 escaped
      .replace(/\\'''/g, "\\'")
  }
  return s
}

function recombineTemplate(
  strings: TemplateStringsArray,
  values: Array<string>,
): string {
  return strings.reduce((acc, str, i) => {
    return `${acc}${str}${values[i] || ''}`
  }, '')
}
