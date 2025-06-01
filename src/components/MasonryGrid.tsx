import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'

interface MasonryGridProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => JSX.Element
  minColumnWidth?: number
  gap?: number
  class?: string
}

interface MasonryItem<T> {
  item: T
  column: number
  originalIndex: number
}

// 宽度变化阈值
const WIDTH_THRESHOLD = 10

export function MasonryGrid<T,>(props: MasonryGridProps<T>) {
  const minColumnWidth = () => props.minColumnWidth || 300
  const gap = () => props.gap || 24

  let containerRef: HTMLDivElement | undefined
  const [columns, setColumns] = createSignal(1)
  const [layoutItems, setLayoutItems] = createSignal<MasonryItem<T>[]>([])
  const [isLayoutReady, setIsLayoutReady] = createSignal(false)
  const [lastWidth, setLastWidth] = createSignal(0)

  // 计算列数
  const calculateColumns = () => {
    if (!containerRef)
      return

    const containerWidth = containerRef.offsetWidth

    // 忽略抖动
    if (Math.abs(containerWidth - lastWidth()) < WIDTH_THRESHOLD)
      return

    setLastWidth(containerWidth)
    const cols = Math.max(1, Math.floor((containerWidth + gap()) / (minColumnWidth() + gap())))

    if (cols !== columns())
      setColumns(cols)
  }

  // 找到最矮列
  const getShortestColumn = (heights: number[]): number => {
    let minHeight = heights[0]
    let minIndex = 0

    for (let i = 1; i < heights.length; i++) {
      if (heights[i] < minHeight) {
        minHeight = heights[i]
        minIndex = i
      }
    }

    return minIndex
  }

  // 分配 item
  const redistributeItems = () => {
    const cols = columns()
    const items = props.items

    if (cols === 0 || items.length === 0) {
      setLayoutItems([])
      setIsLayoutReady(false)
      return
    }

    const heights = Array.from({ length: cols }, () => 0)
    const distributed: MasonryItem<T>[] = []

    items.forEach((item, index) => {
      const shortestCol = getShortestColumn(heights)

      distributed.push({
        item,
        column: shortestCol,
        originalIndex: index,
      })

      heights[shortestCol] += 400 + gap()
    })

    setLayoutItems(distributed)
    setIsLayoutReady(true)
  }

  // 按列分组 item
  const columnGroups = createMemo(() => {
    const cols = columns()
    const items = layoutItems()

    const groups: MasonryItem<T>[][] = Array.from({ length: cols }, () => [])

    items.forEach((item) => {
      if (item.column < cols) {
        groups[item.column].push(item)
      }
    })

    return groups
  })

  createEffect(calculateColumns)

  createEffect(() => {
    if (columns() > 0) {
      redistributeItems()
    }
  })

  let resizeObserver: ResizeObserver | null = null

  onMount(() => {
    calculateColumns()

    window.addEventListener('resize', calculateColumns)

    if (window.ResizeObserver && containerRef) {
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (entry) {
          const { width } = entry.contentRect
          if (Math.abs(width - lastWidth()) >= WIDTH_THRESHOLD) {
            calculateColumns()
          }
        }
      })

      resizeObserver.observe(containerRef)
    }

    onCleanup(() => {
      window.removeEventListener('resize', calculateColumns)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    })
  })

  return (
    <div
      ref={containerRef}
      class={`relative ${props.class || ''}`}
    >
      <Show
        when={isLayoutReady()}
        fallback={(
          <div class="grid gap-6" style={{ 'grid-template-columns': `repeat(${columns()}, 1fr)` }}>
            <For each={Array.from({ length: Math.min(columns(), props.items.length) })}>
              {() => (
                <div class="aspect-[3/4] animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
              )}
            </For>
          </div>
        )}
      >
        <div
          class="grid"
          style={{
            'grid-template-columns': `repeat(${columns()}, 1fr)`,
            'gap': `${gap()}px`,
          }}
        >
          <For each={columnGroups()}>
            {columnItems => (
              <div class="flex flex-col" style={{ gap: `${gap()}px` }}>
                <For each={columnItems}>
                  {layoutItem => (
                    <div
                      // 使用稳定的key来避免不必要的组件重建

                      class="fade-in slide-in-from-bottom-4 animate-in"
                      style={{
                        'animation-delay': `${layoutItem.originalIndex * 50}ms`,
                        'animation-duration': '600ms',
                        'animation-fill-mode': 'backwards',
                      }}
                    >
                      {props.renderItem(layoutItem.item, layoutItem.originalIndex)}
                    </div>
                  )}
                </For>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
