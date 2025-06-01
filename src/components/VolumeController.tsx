import { ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-solid'
import { createSignal, onMount } from 'solid-js'
import { useAudio } from '~/context/AudioContext'

export default function VolumeController() {
  const audioContext = useAudio()
  const [isExpanded, setIsExpanded] = createSignal(false)
  const [isDragging, setIsDragging] = createSignal(false)
  const [previousVolume, setPreviousVolume] = createSignal(0.7)
  const [isHovered, setIsHovered] = createSignal(false)

  let sliderRef: HTMLDivElement | undefined

  const volume = () => audioContext.volume()
  const isMuted = () => volume() === 0
  const hasCurrentAudio = () => audioContext.currentAudio() !== null

  const toggleMute = () => {
    if (isMuted()) {
      audioContext.setVolume(previousVolume())
    }
    else {
      setPreviousVolume(volume())
      audioContext.setVolume(0)
    }
  }

  const handleVolumeClick = (e: MouseEvent & { currentTarget: HTMLDivElement }) => {
    e.stopPropagation()
    if (!sliderRef)
      return

    const rect = sliderRef.getBoundingClientRect()
    const y = rect.bottom - e.clientY
    const percentage = Math.max(0, Math.min(1, y / rect.height))

    if (percentage > 0 && isMuted()) {
      setPreviousVolume(percentage)
    }

    audioContext.setVolume(percentage)
  }

  const handleMouseDown = (e: MouseEvent & { currentTarget: HTMLDivElement }) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)

    if (!sliderRef)
      return

    const rect = sliderRef.getBoundingClientRect()

    const updateVolume = (clientY: number) => {
      const y = rect.bottom - clientY
      const percentage = Math.max(0, Math.min(1, y / rect.height))

      if (percentage > 0 && isMuted()) {
        setPreviousVolume(percentage)
      }

      audioContext.setVolume(percentage)
    }

    const handleMouseMove = (e: MouseEvent) => {
      updateVolume(e.clientY)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    updateVolume(e.clientY)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  onMount(() => {
    if (volume() > 0) {
      setPreviousVolume(volume())
    }
  })

  return (
    <div
      class="fixed bottom-6 right-6 z-50"
      style={{
        'opacity': hasCurrentAudio() ? '1' : '0',
        'transform': hasCurrentAudio()
          ? 'translateY(0) scale(1)'
          : 'translateY(16px) scale(0.95)',
        'pointer-events': hasCurrentAudio() ? 'auto' : 'none',
        'transition': 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'will-change': 'opacity, transform',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        class="flex flex-col items-center rounded-2xl bg-white/90 shadow-2xl backdrop-blur-md dark:bg-neutral-900/90"
        style={{
          'transform': isHovered() ? 'scale(1.05)' : 'scale(1)',
          'backdrop-filter': 'blur(20px)',
          'transition': 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.2s ease',
          'box-shadow': isHovered()
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(168, 230, 207, 0.1)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          class="overflow-hidden transition-all duration-300 ease-out"
          style={{
            'height': isExpanded() ? '120px' : '0px',
            'opacity': isExpanded() ? '1' : '0',
            'padding-bottom': isExpanded() ? '8px' : '0px',
          }}
        >
          <div class="flex flex-col items-center p-4 pb-0">
            <div
              ref={sliderRef}
              class="group relative h-20 w-3 cursor-pointer overflow-hidden rounded-full bg-neutral-200 transition-all duration-200 hover:w-4 dark:bg-neutral-700"
              onClick={handleVolumeClick}
              onMouseDown={handleMouseDown}
            >
              <div
                class="pointer-events-none absolute bottom-0 left-0 right-0 rounded-full bg-primary-500 transition-all duration-200"
                style={{
                  height: `${volume() * 100}%`,
                  background: isMuted() ? 'rgb(156 163 175)' : undefined,
                }}
              />

              {!isMuted() && (
                <div
                  class="pointer-events-none absolute bottom-0 left-0 right-0 animate-pulse rounded-full bg-primary-400 opacity-30"
                  style={{ height: `${volume() * 100}%` }}
                />
              )}

              <div
                class="pointer-events-none absolute left-1/2 h-3 w-3 rounded-full bg-white shadow-md transition-all duration-200 -translate-x-1/2 group-hover:scale-110"
                style={{
                  'bottom': `calc(${volume() * 100}% - 6px)`,
                  'transform': isDragging()
                    ? 'translateX(-50%) scale(1.3)'
                    : isHovered()
                      ? 'translateX(-50%) scale(1.1)'
                      : 'translateX(-50%)',
                  'box-shadow': isDragging()
                    ? '0 4px 12px rgba(168, 230, 207, 0.4)'
                    : '0 2px 4px rgba(0, 0, 0, 0.1)',
                  'border': isDragging() || isHovered()
                    ? '2px solid rgb(168, 230, 207)'
                    : '2px solid white',
                }}
              />
            </div>

            <div class="mt-2 text-xs text-neutral-600 font-mono dark:text-neutral-400">
              {Math.round(volume() * 100)}
              %
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 p-3">
          <button
            onClick={() => setIsExpanded(!isExpanded())}
            class="h-8 w-8 flex items-center justify-center rounded-lg text-neutral-600 transition-all duration-200 active:scale-95 hover:bg-neutral-100 dark:text-neutral-400 hover:text-primary-600 dark:hover:bg-neutral-800 dark:hover:text-primary-400"
            aria-label={isExpanded() ? '收起音量控制' : '展开音量控制'}
          >
            {isExpanded() ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>

          <button
            onClick={toggleMute}
            class="h-10 w-10 flex items-center justify-center rounded-lg text-neutral-600 transition-all duration-200 active:scale-95 hover:bg-neutral-100 dark:text-neutral-400 hover:text-primary-600 dark:hover:bg-neutral-800 dark:hover:text-primary-400"
            aria-label={isMuted() ? '取消静音' : '静音'}
          >
            {isMuted() ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </div>
    </div>
  )
}
