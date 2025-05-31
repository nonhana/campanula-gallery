export interface WorkItem {
  title: string
  album: {
    name: string
    cover: string
    description: string
  }
  source: string
  total_seconds: number
}
