import cp from 'node:child_process'
import util from 'node:util'

const exec = util.promisify(cp.exec)

export interface ExecReturn {
  stdout: string
  stderr: string
}

/*
 * Tagged template that escapes inputs and executes given command via the shell.
 * example: await sh`echo hello ${name}`
 */
export function sh(
  strings: TemplateStringsArray,
  ...values: Array<unknown>
): Promise<ExecReturn> {
  const escaped = values
    // since having "undefined" or "null" in a command is never useful we turn
    // them into empty strings
    .map(x => (x == null ? '' : x))
    .map(String)
    .map(shellEscape)
    // we use empty quotes for empty strings so that they still appear in the
    // command
    .map(s => (s === '' ? "''" : s))
  const cmd = recombineTemplate(strings, escaped)
  return exec(cmd)
}

// adapted from https://github.com/xxorax/node-shell-escape
function shellEscape(s: string): string {
  if (/[^A-Za-z0-9_/:=-]/.test(s)) {
    s = `'${s.replace(/'/g, "'\\''")}'`
    s = s
      // unduplicate single-quote at the beginning
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
  const combined = strings.reduce((acc, str, i) => {
    return `${acc}${str}${values[i] || ''}`
  }, '')
  return combined.replace(/\n\s*/g, ' ')
}
