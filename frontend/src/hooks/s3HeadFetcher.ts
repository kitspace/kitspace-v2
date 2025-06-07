export function s3HeadFetcher(url: string) {
  return fetch(url, { method: 'HEAD', mode: 'cors', cache: 'no-store' }).then(
    r => r.ok,
  )
}
