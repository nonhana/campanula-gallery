import type { Component, JSX } from 'solid-js'
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
  index: number
  height: number
}

// 防抖函数
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: number | undefined
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = window.setTimeout(() => func(...args), wait)
  }) as T
}

export function MasonryGrid<T,>(props: MasonryGridProps<T>) {
  const minColumnWidth = () => props.minColumnWidth || 300
  const gap = () => props.gap || 24

  let containerRef: HTMLDivElement | undefined
  const [columns, setColumns] = createSignal(1)
  const [layoutItems, setLayoutItems] = createSignal<MasonryItem<T>[]>([])
  const [isLayoutReady, setIsLayoutReady] = createSignal(false)
  const itemRefs = new Map<number, HTMLDivElement>()

  // 使用 createMemo 缓存渲染的组件，避免重复创建
  const renderedItems = createMemo(() => {
    return props.items.map((item, index) => ({
      item,
      index,
      element: props.renderItem(item, index),
    }))
  })

  // 计算列数
  const calculateColumns = () => {
    if (!containerRef)
      return
    const containerWidth = containerRef.offsetWidth
    const cols = Math.max(1, Math.floor((containerWidth + gap()) / (minColumnWidth() + gap())))
    setColumns(cols)
  }

  // 找到最矮的列
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

  // 重新分配项目到列
  const redistributeItems = () => {
    const items = renderedItems()
    const cols = columns()
    if (cols === 0 || items.length === 0)
      return

    const heights = Array.from({ length: cols }, () => 0)
    const distributed: MasonryItem<T>[] = []

    // 简单分配到列（不依赖实际高度测量）
    items.forEach(({ item, index }) => {
      const shortestCol = getShortestColumn(heights)

      distributed.push({
        item,
        column: shortestCol,
        index,
        height: 0, // 初始高度，后续可以优化
      })

      // 使用估算高度进行分配
      heights[shortestCol] += 400 + gap()
    })

    setLayoutItems(distributed)
    setIsLayoutReady(true)
  }

  // 响应式调整
  createEffect(() => {
    calculateColumns()
  })

  createEffect(() => {
    if (columns() > 0 && props.items.length > 0) {
      redistributeItems()
    }
  })

  // 监听窗口大小变化
  onMount(() => {
    // 使用防抖处理 resize
    const handleResize = debounce(() => {
      calculateColumns()
      redistributeItems()
    }, 150)

    window.addEventListener('resize', handleResize)

    // 使用 ResizeObserver 监听容器大小变化，添加错误处理
    let resizeObserver: ResizeObserver | null = null

    try {
      resizeObserver = new ResizeObserver((entries) => {
        // 使用 requestAnimationFrame 避免 ResizeObserver 循环
        window.requestAnimationFrame(() => {
          if (!entries[0])
            return
          handleResize()
        })
      })

      if (containerRef) {
        resizeObserver.observe(containerRef)
      }
    }
    catch (error) {
      console.warn('ResizeObserver not supported:', error)
    }

    onCleanup(() => {
      window.removeEventListener('resize', handleResize)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      itemRefs.clear()
    })
  })

  // 按列分组项目，使用缓存的渲染结果
  const getColumnItems = (columnIndex: number) => {
    const items = renderedItems()
    return layoutItems()
      .filter(layoutItem => layoutItem.column === columnIndex)
      .map(layoutItem => ({
        ...layoutItem,
        element: items[layoutItem.index]?.element,
      }))
  }

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
          <For each={Array.from({ length: columns() })}>
            {(_, colIndex) => (
              <div class="flex flex-col" style={{ gap: `${gap()}px` }}>
                <For each={getColumnItems(colIndex())}>
                  {layoutItem => (
                    <div
                      ref={el => itemRefs.set(layoutItem.index, el)}
                      class="animate-in fade-in slide-in-from-bottom-4"
                      style={{
                        'animation-delay': `${layoutItem.index * 50}ms`,
                        'animation-duration': '600ms',
                        'animation-fill-mode': 'backwards',
                      }}
                    >
                      {layoutItem.element}
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
