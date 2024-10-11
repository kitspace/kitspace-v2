export {}

declare global {
  interface Window {
    plausible: (
      tag: string,
      data: { props: { project: string; vendor: string; multiplier?: number } },
    ) => void
  }
}
