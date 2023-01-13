export const fetcher = (url: string) =>
  fetch(url, { method: 'HEAD', mode: 'cors', cache: 'no-store' }).then(r => r.ok)
