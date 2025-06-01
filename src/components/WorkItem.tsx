import type { WorkItem as WorkItemType } from '~/types'
import { Clock, Pause, Play, Square, Volume2 } from 'lucide-solid'
import { createSignal, onCleanup, Show } from 'solid-js'
import { useAudio } from '~/context/AudioContext'
import { formatTime } from '~/utils'
import AudioController from './AudioController'

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

  const workId = () => `${props.work.title}-${props.work.album.name}`

  const isPlaying = () => audioContext.isPlaying(workId())

  const resetAudio = () => {
    const audioElement = audio()
    if (audioElement) {
      audioElement.pause()
      audioElement.currentTime = 0
    }
    setCurrentTime(0)
    setHasBeenPlayed(false)
    setIsLoading(false)
  }

  // 停止播放
  const handleStop = (e?: MouseEvent) => {
    if (e)
      e.stopPropagation()

    resetAudio()
    audioContext.stopAudio()
  }

  // 初始化音频
  const initAudio = () => {
    if (!audio()) {
      const audioElement = new Audio()

      audioElement.src = props.work.source
      audioElement.preload = 'metadata'
      audioElement.crossOrigin = 'anonymous'

      // 开始加载
      audioElement.addEventListener('loadstart', () => {
        if (audioContext.isPlaying(workId())) {
          setIsLoading(true)
        }
      })

      // 能够开始播放
      audioElement.addEventListener('canplay', () => {
        if (audioContext.isPlaying(workId())) {
          setIsLoading(false)
        }
      })

      // 加载元数据
      audioElement.addEventListener('loadedmetadata', () => {
        if (audioContext.isPlaying(workId())) {
          setIsLoading(false)
        }
      })

      // 时间更新时更新进度条
      audioElement.addEventListener('timeupdate', () => {
        if (!isDragging() && audioContext.isPlaying(workId())) {
          setCurrentTime(audioElement.currentTime)
        }
      })

      // 播放结束时停止播放
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

        if (audioElement.error?.code === MediaError.MEDIA_ERR_NETWORK) {
          console.warn('网络错误，尝试重新加载音频')
        }
      })

      setAudio(audioElement)

      audioContext.registerResetCallback(workId(), resetAudio)

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
        audioContext.pauseAudio(workId())
        setIsLoading(false)
      }
      else {
        setIsLoading(true)

        if (!hasBeenPlayed()) {
          setHasBeenPlayed(true)
        }

        await audioContext.playAudio(audioElement, workId())
        setIsLoading(false)
      }
    }
    catch (error) {
      console.error('播放失败:', error)
      setIsLoading(false)
    }
  }

  onCleanup(() => {
    const audioElement = audio()
    if (audioElement) {
      audioElement.pause()

      audioElement.removeEventListener('loadstart', () => {})
      audioElement.removeEventListener('canplay', () => {})
      audioElement.removeEventListener('loadedmetadata', () => {})
      audioElement.removeEventListener('timeupdate', () => {})
      audioElement.removeEventListener('ended', () => {})
      audioElement.removeEventListener('error', () => {})

      audioElement.src = ''
      audioElement.load()
    }

    audioContext.unregisterAudio(workId())
  })

  return (
    <article
      class="group relative flex flex-col cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:scale-[1.02] dark:bg-neutral-900 hover:shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div class="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <img
          src={props.work.album.cover}
          alt={props.work.album.name}
          class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />

        <div class="absolute inset-0 from-black/70 via-black/20 to-transparent bg-gradient-to-t opacity-0 transition-all duration-300 group-hover:opacity-100" />

        <div class="absolute inset-0 flex items-center justify-center">
          <div
            class="relative flex scale-0 items-center justify-center opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
          >
            <button
              onClick={togglePlay}
              disabled={isLoading()}
              class="h-16 w-16 flex items-center justify-center rounded-full bg-primary-500 text-white shadow-2xl transition-all duration-200 active:scale-95 hover:bg-primary-600 disabled:opacity-50"
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

            <button
              onClick={handleStop}
              class="absolute left-full ml-4 h-12 w-12 flex items-center justify-center rounded-full bg-neutral-800 text-white shadow-xl transition-all duration-300 active:scale-95 hover:bg-neutral-700"
              style={{
                'transform': hasBeenPlayed()
                  ? 'translateX(0) scale(1)'
                  : 'translateX(-20px) scale(0)',
                'opacity': hasBeenPlayed() ? '0.9' : '0',
                'pointer-events': hasBeenPlayed() ? 'auto' : 'none',
              }}
              aria-label="停止"
            >
              <Square size={18} />
            </button>
          </div>
        </div>

        <div class="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
          <Clock size={12} />
          <span>{formatTime(props.work.total_seconds)}</span>
        </div>

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

      <div class="flex flex-1 flex-col p-5">
        <h3 class="line-clamp-2 mb-2 text-lg text-neutral-900 font-bold transition-colors dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
          {props.work.title}
        </h3>

        <p class="line-clamp-1 mb-3 text-sm text-neutral-600 dark:text-neutral-400">
          {props.work.album.name}
        </p>

        <div class="mt-auto">
          <AudioController
            audio={audio()}
            currentTime={currentTime()}
            setCurrentTime={setCurrentTime}
            totalSeconds={props.work.total_seconds}
            isPlaying={isPlaying()}
            isDragging={isDragging()}
            setIsDragging={setIsDragging}
            hasBeenPlayed={hasBeenPlayed()}
          />
        </div>
      </div>

      <div
        class="pointer-events-none absolute size-32 rounded-full bg-neutral-200 blur-3xl transition-all duration-500 -right-16 -top-16"
        style={{
          transform: isHovered() ? 'scale(2)' : 'scale(0)',
          opacity: isHovered() ? '1' : '0',
        }}
      />
    </article>
  )
}
