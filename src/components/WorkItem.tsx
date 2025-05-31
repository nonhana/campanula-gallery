import type { WorkItem as WorkItemType } from '~/types'
import { Clock, Pause, Play, Square, Volume2 } from 'lucide-solid'
import { createSignal, onCleanup, Show } from 'solid-js'
import { useAudio } from '~/context/AudioContext'

interface WorkItemProps {
  work: WorkItemType
}

export default function WorkItem(props: WorkItemProps) {
  const audioContext = useAudio()
  const [isHovered, setIsHovered] = createSignal(false)
  const [audio, setAudio] = createSignal<HTMLAudioElement | null>(null)
  const [currentTime, setCurrentTime] = createSignal(0)
  const [isLoading, setIsLoading] = createSignal(false)
  const [hasBeenPlayed, setHasBeenPlayed] = createSignal(false)
  const [isDragging, setIsDragging] = createSignal(false)

  // 生成唯一 ID
  const workId = () => `${props.work.title}-${props.work.album.name}`

  // 检查是否正在播放
  const isPlaying = () => audioContext.isPlaying(workId())

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 停止播放
  const handleStop = (e?: MouseEvent) => {
    if (e)
      e.stopPropagation()

    const audioElement = audio()
    if (audioElement) {
      audioElement.pause()
      audioElement.currentTime = 0
    }

    setCurrentTime(0)
    setHasBeenPlayed(false)
    audioContext.stopAudio()
  }

  // 初始化音频
  const initAudio = () => {
    if (!audio()) {
      // 验证音频源
      if (!props.work.source || props.work.source.trim() === '') {
        console.error('音频源为空:', props.work)
        return null
      }

      const audioElement = new Audio()

      // 设置基本属性
      audioElement.preload = 'metadata'
      audioElement.crossOrigin = 'anonymous'

      // 先设置事件监听器，再设置 src
      // 基础音频事件
      audioElement.addEventListener('loadstart', () => {
        if (audioContext.isPlaying(workId())) {
          setIsLoading(true)
        }
      })

      audioElement.addEventListener('canplay', () => {
        if (audioContext.isPlaying(workId())) {
          setIsLoading(false)
        }
      })

      audioElement.addEventListener('loadedmetadata', () => {
        if (audioContext.isPlaying(workId())) {
          setIsLoading(false)
        }
      })

      // 时间更新
      audioElement.addEventListener('timeupdate', () => {
        if (!isDragging() && audioContext.isPlaying(workId())) {
          setCurrentTime(audioElement.currentTime)
        }
      })

      // 播放结束
      audioElement.addEventListener('ended', () => {
        if (audioContext.isPlaying(workId())) {
          handleStop()
        }
      })

      // 播放错误
      audioElement.addEventListener('error', (e) => {
        console.error('音频加载失败:', {
          error: audioElement.error,
          src: audioElement.src,
          work: props.work.title,
          event: e,
        })
        setIsLoading(false)

        // 如果是网络错误，可以尝试重新加载
        if (audioElement.error?.code === MediaError.MEDIA_ERR_NETWORK) {
          console.warn('网络错误，尝试重新加载音频')
        }
      })

      // 最后设置 src 属性
      try {
        audioElement.src = props.work.source
      }
      catch (error) {
        console.error('设置音频源失败:', error, props.work.source)
        return null
      }

      setAudio(audioElement)
      return audioElement
    }
    return audio()!
  }

  // 播放/暂停控制
  const togglePlay = async (e: MouseEvent) => {
    e.stopPropagation()

    try {
      const audioElement = initAudio()

      if (!audioElement) {
        console.error('无法初始化音频元素')
        return
      }

      if (isPlaying()) {
        // 暂停当前播放
        audioContext.pauseAudio(workId())
        setIsLoading(false)
      }
      else {
        // 开始播放
        setIsLoading(true)

        // 只在首次播放时设置 hasBeenPlayed
        if (!hasBeenPlayed()) {
          setHasBeenPlayed(true)
        }

        // 使用新的异步播放方法
        await audioContext.playAudio(audioElement, workId())
        setIsLoading(false)
      }
    }
    catch (error) {
      console.error('播放失败:', error)
      setIsLoading(false)

      // 播放失败时的错误处理
      if (error instanceof Error && error.name === 'AbortError') {
        // 延迟重试一次
        setTimeout(async () => {
          try {
            const audioElement = audio()
            if (audioElement && !isPlaying()) {
              await audioContext.playAudio(audioElement, workId())
              setIsLoading(false)
            }
          }
          catch (retryError) {
            console.error('重试播放失败:', retryError)
            setIsLoading(false)
          }
        }, 100)
      }
    }
  }

  // 处理进度条点击
  const handleProgressClick = (e: MouseEvent & { currentTarget: HTMLDivElement }) => {
    e.stopPropagation()
    const audioElement = audio()
    if (!audioElement)
      return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const newTime = percentage * props.work.total_seconds

    audioElement.currentTime = newTime
    setCurrentTime(newTime)
  }

  // 处理进度条拖动
  const handleProgressMouseDown = (e: MouseEvent & { currentTarget: HTMLDivElement }) => {
    e.stopPropagation()
    setIsDragging(true)

    const audioElement = audio()
    if (!audioElement)
      return

    const rect = e.currentTarget.getBoundingClientRect()

    const updateProgress = (clientX: number) => {
      const x = clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const newTime = percentage * props.work.total_seconds
      setCurrentTime(newTime)
    }

    const handleMouseMove = (e: MouseEvent) => {
      updateProgress(e.clientX)
    }

    const handleMouseUp = () => {
      const audioElement = audio()
      if (audioElement) {
        audioElement.currentTime = currentTime()
      }
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    updateProgress(e.clientX)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 清理音频资源
  onCleanup(() => {
    const audioElement = audio()
    if (audioElement) {
      // 先暂停
      audioElement.pause()

      // 移除所有事件监听器
      audioElement.removeEventListener('loadstart', () => {})
      audioElement.removeEventListener('canplay', () => {})
      audioElement.removeEventListener('loadedmetadata', () => {})
      audioElement.removeEventListener('timeupdate', () => {})
      audioElement.removeEventListener('ended', () => {})
      audioElement.removeEventListener('error', () => {})

      // 清空源并重新加载以完全清理
      audioElement.src = ''
      audioElement.load()
    }
  })

  return (
    <article
      class="group relative flex flex-col cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:scale-[1.02] dark:bg-neutral-900 hover:shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 封面图片容器 */}
      <div class="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {/* 封面图片 */}
        <img
          src={props.work.album.cover}
          alt={props.work.album.name}
          class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />

        {/* 渐变遮罩 */}
        <div class="absolute inset-0 from-black/70 via-black/20 to-transparent bg-gradient-to-t opacity-0 transition-all duration-300 group-hover:opacity-100" />

        {/* 播放控制按钮容器 */}
        <div class="absolute inset-0 flex items-center justify-center gap-4">
          <button
            onClick={togglePlay}
            disabled={isLoading()}
            class="h-16 w-16 flex scale-0 items-center justify-center rounded-full bg-primary-500 text-white opacity-0 shadow-2xl transition-all duration-300 active:scale-95 group-hover:scale-100 hover:bg-primary-600 disabled:opacity-50 group-hover:opacity-100"
            aria-label={isPlaying() ? '暂停' : '播放'}
          >
            <Show
              when={!isLoading()}
              fallback={
                <div class="h-5 w-5 animate-spin border-2 border-white border-t-transparent rounded-full" />
              }
            >
              <Show when={isPlaying()} fallback={<Play size={24} />}>
                <Pause size={24} />
              </Show>
            </Show>
          </button>

          {/* 停止按钮 */}
          <Show when={hasBeenPlayed()}>
            <button
              onClick={handleStop}
              class="h-12 w-12 flex scale-0 items-center justify-center rounded-full bg-neutral-800 text-white opacity-0 shadow-xl transition-all duration-300 active:scale-95 group-hover:scale-100 hover:bg-neutral-700 group-hover:opacity-90"
              aria-label="停止"
            >
              <Square size={18} />
            </button>
          </Show>
        </div>

        {/* 时长标签 */}
        <div class="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
          <Clock size={12} />
          <span>{formatTime(props.work.total_seconds)}</span>
        </div>

        {/* 播放指示器 */}
        <Show when={isPlaying()}>
          <div class="absolute bottom-3 left-3 flex items-center gap-1.5">
            <div class="flex gap-0.5">
              <div class="h-3 w-0.5 animate-pulse bg-primary-400" style={{ 'animation-delay': '0ms' }} />
              <div class="h-4 w-0.5 animate-pulse bg-primary-400" style={{ 'animation-delay': '150ms' }} />
              <div class="h-2 w-0.5 animate-pulse bg-primary-400" style={{ 'animation-delay': '300ms' }} />
              <div class="h-5 w-0.5 animate-pulse bg-primary-400" style={{ 'animation-delay': '450ms' }} />
            </div>
            <Volume2 size={14} class="text-primary-400" />
          </div>
        </Show>
      </div>

      {/* 信息区域 */}
      <div class="flex flex-1 flex-col p-5">
        {/* 标题 */}
        <h3 class="line-clamp-2 mb-2 text-lg text-neutral-900 font-bold transition-colors dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
          {props.work.title}
        </h3>

        {/* 专辑名 */}
        <p class="line-clamp-1 mb-3 text-sm text-neutral-600 dark:text-neutral-400">
          {props.work.album.name}
        </p>

        {/* 播放进度条容器 - 固定高度，使用 opacity 和 transform 控制显示 */}
        <div class="mt-auto">
          <div
            class="overflow-hidden transition-all duration-500 ease-out"
            style={{
              height: hasBeenPlayed() ? '36px' : '0px',
              opacity: hasBeenPlayed() ? '1' : '0',
              transform: hasBeenPlayed() ? 'translateY(0)' : 'translateY(-10px)',
            }}
          >
            {/* 可交互的进度条 */}
            <div
              class="group/progress relative h-2 w-full cursor-pointer overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
            >
              <div
                class="pointer-events-none absolute inset-y-0 left-0 bg-primary-500 transition-all duration-300 ease-out"
                style={{
                  width: `${(currentTime() / props.work.total_seconds) * 100}%`,
                  transition: isDragging() ? 'none' : 'width 300ms ease-out',
                }}
              />

              {/* 进度条动画效果 */}
              <Show when={isPlaying()}>
                <div
                  class="pointer-events-none absolute inset-y-0 left-0 animate-pulse bg-primary-400 opacity-50"
                  style={{ width: `${(currentTime() / props.work.total_seconds) * 100}%` }}
                />
              </Show>

              {/* 拖动手柄 */}
              <div
                class="pointer-events-none absolute top-1/2 h-4 w-4 scale-0 rounded-full bg-primary-500 opacity-0 shadow-md transition-all -translate-y-1/2 group-hover/progress:scale-100 group-hover/progress:opacity-100"
                style={{
                  left: `calc(${(currentTime() / props.work.total_seconds) * 100}% - 8px)`,
                  opacity: isDragging() ? '1' : undefined,
                  transform: isDragging() ? 'translateY(-50%) scale(1.2)' : undefined,
                }}
              />
            </div>

            <div class="mt-2 flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
              <span class="font-mono">{formatTime(currentTime())}</span>
              <span class="font-mono">{formatTime(props.work.total_seconds)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 悬浮时的装饰元素 */}
      <div
        class="pointer-events-none absolute h-32 w-32 rounded-full bg-primary-400/20 blur-3xl transition-all duration-500 -right-16 -top-16"
        style={{
          transform: isHovered() ? 'scale(2)' : 'scale(0)',
          opacity: isHovered() ? '1' : '0',
        }}
      />

      {/* Material Design 风格的涟漪效果 */}
      <div
        class="pointer-events-none absolute inset-0"
        style={{
          background: isHovered()
            ? 'radial-gradient(circle at center, transparent 0%, rgba(168, 230, 207, 0.05) 100%)'
            : 'transparent',
        }}
      />
    </article>
  )
}
