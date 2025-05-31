import type { WorkItem as WorkItemType } from '~/types'

interface WorkItemProps {
  work: WorkItemType
}

export default function WorkItem(props: WorkItemProps) {
  return (
    <div class="flex flex-col cursor-pointer rounded-lg font-noto">
      <img src={props.work.album.cover} alt={props.work.album.name} class="rounded-lg object-cover" />
      <div class="py-4">
        <span class="line-clamp-1 text-lg font-bold">{props.work.title}</span>
      </div>
    </div>
  )
}
