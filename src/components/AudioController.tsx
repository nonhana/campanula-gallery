import { Show } from 'solid-js'
import { formatTime } from '~/utils'

interface AudioControllerProps {
  audio: HTMLAudioElement | null
  currentTime: number
  setCurrentTime: (time: number) => void
  totalSeconds: number
  isPlaying: boolean
  isDragging: boolean
  setIsDragging: (isDragging: boolean) => void
  hasBeenPlayed: boolean
}

export default function AudioController(props: AudioControllerProps) {
  // 处理进度条点击
  const handleProgressClick = (e: MouseEvent & { currentTarget: HTMLDivElement }) => {
    e.stopPropagation()
    const audioElement = props.audio
    if (!audioElement)
      return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const newTime = percentage * props.totalSeconds

    audioElement.currentTime = newTime
    props.setCurrentTime(newTime)
  }

  // 处理进度条拖动
  const handleProgressMouseDown = (e: MouseEvent & { currentTarget: HTMLDivElement }) => {
    e.stopPropagation()
    props.setIsDragging(true)

    const audioElement = props.audio
    if (!audioElement)
      return

    const rect = e.currentTarget.getBoundingClientRect()

    const updateProgress = (clientX: number) => {
      const x = clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const newTime = percentage * props.totalSeconds
      props.setCurrentTime(newTime)
    }

    const handleMouseMove = (e: MouseEvent) => {
      updateProgress(e.clientX)
    }

    const handleMouseUp = () => {
      const audioElement = props.audio
      if (audioElement) {
        audioElement.currentTime = props.currentTime
      }
      props.setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    updateProgress(e.clientX)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      class="overflow-hidden transition-all duration-500 ease-out"
      style={{
        height: props.hasBeenPlayed ? '36px' : '0px',
        opacity: props.hasBeenPlayed ? '1' : '0',
        transform: props.hasBeenPlayed ? 'translateY(0)' : 'translateY(-10px)',
      }}
    >
      <div
        class="group/progress relative h-2 w-full cursor-pointer overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
        onClick={handleProgressClick}
        onMouseDown={handleProgressMouseDown}
      >
        <div
          class="pointer-events-none absolute inset-y-0 left-0 bg-primary-500 transition-all duration-300 ease-out"
          style={{
            width: `${(props.currentTime / props.totalSeconds) * 100}%`,
            transition: props.isDragging ? 'none' : 'width 300ms ease-out',
          }}
        />

        <Show when={props.isPlaying}>
          <div
            class="pointer-events-none absolute inset-y-0 left-0 animate-pulse bg-primary-400 opacity-50"
            style={{ width: `${(props.currentTime / props.totalSeconds) * 100}%` }}
          />
        </Show>

        <div
          class="pointer-events-none absolute top-1/2 h-4 w-4 scale-0 rounded-full bg-primary-500 opacity-0 shadow-md transition-all -translate-y-1/2 group-hover/progress:scale-100 group-hover/progress:opacity-100"
          style={{
            left: `calc(${(props.currentTime / props.totalSeconds) * 100}% - 8px)`,
            opacity: props.isDragging ? '1' : undefined,
            transform: props.isDragging ? 'translateY(-50%) scale(1.2)' : undefined,
          }}
        />
      </div>

      <div class="mt-2 flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
        <span class="font-mono">{formatTime(props.currentTime)}</span>
        <span class="font-mono">{formatTime(props.totalSeconds)}</span>
      </div>
    </div>
  )
}
