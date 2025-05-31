import { For } from 'solid-js'
import { publishedWorks } from '~/data'
import WorkItem from './WorkItem'

export function WorkList() {
  return (
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3 md:grid-cols-2 xl:grid-cols-4">
      <For each={publishedWorks}>
        {work => (
          <WorkItem work={work} />
        )}
      </For>
    </div>
  )
}
