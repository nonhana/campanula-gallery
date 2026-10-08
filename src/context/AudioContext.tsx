import type { ParentComponent } from 'solid-js'
import type { WorkItem } from '~/types'
import { batch, createContext, createEffect, createSignal, onCleanup, onMount, useContext } from 'solid-js'
import { bannerInfo } from '~/data'

interface AudioContextType {
  currentAudio: () => HTMLAudioElement | null
  currentWorkId: () => string | null
  volume: () => number
  isPlaying: (workId: string) => boolean
  playAudio: (audio: HTMLAudioElement, workId: string, work: WorkItem) => Promise<void>
  pauseAudio: (workId: string) => void
  stopAudio: () => void
  stopOtherAudio: (excludeWorkId: string) => void
  setVolume: (volume: number) => void
  resetWorkState: (workId: string) => void
  registerResetCallback: (workId: string, callback: () => void) => void
  unregisterAudio: (workId: string) => void
}

// 正在播放或暂停中的曲目
interface ActiveTrack {
  audio: HTMLAudioElement
  workId: string
  work: WorkItem
}

// 这些事件会改变播放状态或进度，需要同步给系统媒体面板
const MEDIA_SESSION_SYNC_EVENTS = ['play', 'pause', 'seeked', 'durationchange', 'ratechange'] as const
const DEFAULT_SEEK_OFFSET = 10
// onMount 中注册的面板操作，卸载时逐个注销
const MEDIA_SESSION_ACTIONS: MediaSessionAction[] = ['play', 'pause', 'stop', 'seekbackward', 'seekforward', 'seekto']

// 旧浏览器没有 Media Session API
function getMediaSession() {
  return 'mediaSession' in navigator ? navigator.mediaSession : null
}

const AudioContext = createContext<AudioContextType>()

export const AudioProvider: ParentComponent = (props) => {
  const [currentAudio, setCurrentAudio] = createSignal<HTMLAudioElement | null>(null)
  const [currentWorkId, setCurrentWorkId] = createSignal<string | null>(null)
  const [volume, setVolumeSignal] = createSignal<number>(0.7) // 默认音量 70%

  // 当前曲目：开始播放时设置，暂停时保留，停止或播放结束（作品回到初始状态）时清空。
  // 系统媒体面板（浏览器媒体控件、系统媒体中心、耳机按键）完全由它驱动
  const [activeTrack, setActiveTrack] = createSignal<ActiveTrack | null>(null, {
    equals: (prev, next) => prev?.audio === next?.audio,
  })

  // 存储所有音频元素的引用，用于状态重置
  const audioElements = new Map<string, HTMLAudioElement>()
  const workStateResetCallbacks = new Map<string, () => void>()

  // 追踪所有活跃的音频状态（包括暂停的）
  const activeWorkIds = new Set<string>()

  const syncMediaSessionState = (audio: HTMLAudioElement) => {
    const mediaSession = getMediaSession()
    if (!mediaSession || activeTrack()?.audio !== audio)
      return

    mediaSession.playbackState = audio.paused ? 'paused' : 'playing'

    // 元数据加载前 duration 为 NaN，此时无法设置进度
    if (Number.isFinite(audio.duration)) {
      mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate,
        position: Math.min(audio.currentTime, audio.duration),
      })
    }
  }

  createEffect(() => {
    const mediaSession = getMediaSession()
    if (!mediaSession)
      return

    const track = activeTrack()
    if (!track) {
      mediaSession.metadata = null
      mediaSession.playbackState = 'none'
      mediaSession.setPositionState()
      return
    }

    mediaSession.metadata = new MediaMetadata({
      title: track.work.title,
      artist: bannerInfo.name,
      album: track.work.album.name,
      artwork: [{ src: track.work.album.cover }],
    })
    syncMediaSessionState(track.audio)
  })

  const isPlaying = (workId: string) => {
    const current = currentAudio()
    const currentId = currentWorkId()
    // 必须同时满足：音频存在、不是暂停状态、workId匹配
    return Boolean(current && !current.paused && currentId === workId)
  }

  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setVolumeSignal(clampedVolume)

    // 立即应用到当前播放的音频
    const current = currentAudio()
    if (current) {
      current.volume = clampedVolume
    }

    // 应用到所有已注册的音频元素
    audioElements.forEach((audio) => {
      audio.volume = clampedVolume
    })
  }

  const unregisterAudio = (workId: string) => {
    audioElements.delete(workId)
    workStateResetCallbacks.delete(workId)
    activeWorkIds.delete(workId)
    if (activeTrack()?.workId === workId)
      setActiveTrack(null)
  }

  const registerResetCallback = (workId: string, callback: () => void) => {
    workStateResetCallbacks.set(workId, callback)
  }

  const resetWorkState = (workId: string) => {
    const callback = workStateResetCallbacks.get(workId)
    if (callback) {
      callback()
    }
  }

  const stopOtherAudio = (excludeWorkId: string) => {
    // 重置所有其他活跃的音频状态
    activeWorkIds.forEach((workId) => {
      if (workId !== excludeWorkId) {
        const audio = audioElements.get(workId)
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
        resetWorkState(workId)
        activeWorkIds.delete(workId)
      }
    })

    // 清除全局状态
    setCurrentAudio(null)
    setCurrentWorkId(null)
  }

  const pauseAudio = (workId: string) => {
    const current = currentAudio()
    const currentId = currentWorkId()

    if (current && currentId === workId) {
      current.pause()
      setCurrentAudio(null)
      setCurrentWorkId(null)
    }
  }

  // 回到初始状态：停止按钮、面板停止、播放结束都走这里
  const stopAudio = () => {
    // 暂停后 currentAudio 已被清空，所以以当前曲目为准，暂停状态下也能停止
    const track = activeTrack()
    if (track) {
      // load() 会暂停并回到开头，同时释放浏览器里的播放器，系统媒体面板会像播放结束时一样移除这一项
      track.audio.load()

      // 重置当前播放的音频项状态
      resetWorkState(track.workId)
      activeWorkIds.delete(track.workId)
    }

    setCurrentAudio(null)
    setCurrentWorkId(null)
    setActiveTrack(null)
  }

  const registerAudio = (workId: string, audio: HTMLAudioElement) => {
    if (!audioElements.has(workId)) {
      const sync = () => syncMediaSessionState(audio)
      MEDIA_SESSION_SYNC_EVENTS.forEach(type => audio.addEventListener(type, sync))

      // 播放结束时回到初始状态。触发 ended 时 audio.paused 已经是 true，只能按当前曲目判断
      audio.addEventListener('ended', () => {
        if (activeTrack()?.audio === audio)
          stopAudio()
      })
    }
    audioElements.set(workId, audio)
    audio.volume = volume() // 设置初始音量
  }

  const playAudio = async (audio: HTMLAudioElement, workId: string, work: WorkItem) => {
    try {
      // 先停止其他音频
      stopOtherAudio(workId)

      // 注册音频元素
      registerAudio(workId, audio)

      // 将此音频标记为活跃状态
      activeWorkIds.add(workId)

      // 设置音量
      audio.volume = volume()

      // 设置当前音频并开始播放。audio.paused 不是响应式的，放进同一个 batch，
      // 等 play() 把 paused 置为 false 后界面再计算 isPlaying；否则从系统媒体面板恢复播放时按钮会停在「播放」
      const playing = batch(() => {
        setCurrentAudio(audio)
        setCurrentWorkId(workId)
        setActiveTrack({ audio, workId, work })
        return audio.play()
      })

      await playing
    }
    catch (error) {
      // 如果播放失败，清理状态
      if (currentWorkId() === workId) {
        setCurrentAudio(null)
        setCurrentWorkId(null)
      }
      activeWorkIds.delete(workId)
      throw error
    }
  }

  // 系统媒体面板 / 耳机按键的操作统一走 context，保证页面上的播放状态同步
  onMount(() => {
    const mediaSession = getMediaSession()
    if (!mediaSession)
      return

    // 面板回调在用户操作时才执行，读取的就是当时的状态；eslint-plugin-solid 不认识 setActionHandler 这种事件注册方式
    /* eslint-disable solid/reactivity */
    const seekBy = (offset: number) => {
      const track = activeTrack()
      if (track)
        track.audio.currentTime += offset
    }

    mediaSession.setActionHandler('play', () => {
      const track = activeTrack()
      if (track)
        playAudio(track.audio, track.workId, track.work).catch(error => console.error('播放失败:', error))
    })
    mediaSession.setActionHandler('pause', () => {
      const track = activeTrack()
      if (track)
        pauseAudio(track.workId)
    })
    mediaSession.setActionHandler('stop', stopAudio)
    mediaSession.setActionHandler('seekbackward', details => seekBy(-(details.seekOffset ?? DEFAULT_SEEK_OFFSET)))
    mediaSession.setActionHandler('seekforward', details => seekBy(details.seekOffset ?? DEFAULT_SEEK_OFFSET))
    mediaSession.setActionHandler('seekto', (details) => {
      const track = activeTrack()
      if (track && details.seekTime !== undefined)
        track.audio.currentTime = details.seekTime
    })
    /* eslint-enable solid/reactivity */

    onCleanup(() => {
      MEDIA_SESSION_ACTIONS.forEach(action => mediaSession.setActionHandler(action, null))
    })
  })

  return (
    <AudioContext.Provider value={{
      currentAudio,
      currentWorkId,
      volume,
      isPlaying,
      playAudio,
      pauseAudio,
      stopAudio,
      stopOtherAudio,
      setVolume,
      resetWorkState,
      registerResetCallback,
      unregisterAudio,
    }}
    >
      {props.children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider')
  }
  return context
}
