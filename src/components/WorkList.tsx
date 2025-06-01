import { Music } from 'lucide-solid'
import { createSignal, onMount } from 'solid-js'
import { publishedWorks } from '~/data'
import { MasonryGrid } from './MasonryGrid'
import WorkItem from './WorkItem'

export function WorkList() {
  const [isLoaded, setIsLoaded] = createSignal(false)

  onMount(() => {
    setTimeout(() => setIsLoaded(true), 100)
  })

  return (
    <section class="relative">
      <div class="mb-12 text-center">
        <div class="mb-4 inline-flex items-center gap-3">
          <Music class="text-primary-600" size={28} />
          <h2 class="text-3xl text-neutral-900 font-bold dark:text-neutral-100">
            音乐作品集
          </h2>
        </div>
        <p class="mx-auto max-w-2xl text-neutral-600 dark:text-neutral-400">
          一些仅仅用于宣泄的旋律
        </p>
      </div>

      <div
        class={isLoaded() ? 'opacity-100' : 'opacity-0'}
        style={{ transition: 'opacity 600ms ease-out' }}
      >
        <MasonryGrid
          items={publishedWorks}
          minColumnWidth={280}
          gap={24}
          renderItem={work => <WorkItem work={work} />}
        />
      </div>
    </section>
  )
}
