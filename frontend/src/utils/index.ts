export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export type WaitForFunction<T> = () => Promise<T>
export type WaitForCheckFunction<T> = (x: T) => boolean
export interface WaitForOptions<T> {
  timeoutMs: number
  intervalMs?: number
  checkFn?: WaitForCheckFunction<T>
}
const defaultCheckFn: WaitForCheckFunction<unknown> = x => Boolean(x)

/**
 * Retry function until it returns a promise that resolves to a truthy value.
 * Alternatively you can provide your own `checkFn` which should return `true`
 * when you want to stop or `false` to continue retrying.
 */
export function waitFor<T>(
  fn: WaitForFunction<T>,
  { timeoutMs, intervalMs = 1000, checkFn = defaultCheckFn }: WaitForOptions<T>,
): Promise<T | null> {
  const controller = new AbortController()

  const loop = async (): Promise<T> => {
    let r = await fn()
    while (!checkFn(r) && !controller.signal.aborted) {
      await delay(intervalMs)
      r = await fn()
    }
    return r
  }

  const timer = async (): Promise<null> => {
    await delay(timeoutMs)
    controller.abort()
    return null
  }

  return Promise.race([timer(), loop()])
}
