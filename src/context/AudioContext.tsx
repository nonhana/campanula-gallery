import type { ParentComponent } from 'solid-js'
import { createContext, createSignal, useContext } from 'solid-js'

interface AudioContextType {
  currentAudio: () => HTMLAudioElement | null
  currentWorkId: () => string | null
  volume: () => number
  isPlaying: (workId: string) => boolean
  playAudio: (audio: HTMLAudioElement, workId: string) => Promise<void>
  pauseAudio: (workId: string) => void
  stopAudio: () => void
  stopOtherAudio: (excludeWorkId: string) => void
  setVolume: (volume: number) => void
  resetWorkState: (workId: string) => void
  registerResetCallback: (workId: string, callback: () => void) => void
  unregisterAudio: (workId: string) => void
}

const AudioContext = createContext<AudioContextType>()

export const AudioProvider: ParentComponent = (props) => {
  const [currentAudio, setCurrentAudio] = createSignal<HTMLAudioElement | null>(null)
  const [currentWorkId, setCurrentWorkId] = createSignal<string | null>(null)
  const [volume, setVolumeSignal] = createSignal<number>(0.7) // 默认音量 70%

  // 存储所有音频元素的引用，用于状态重置
  const audioElements = new Map<string, HTMLAudioElement>()
  const workStateResetCallbacks = new Map<string, () => void>()

  // 追踪所有活跃的音频状态（包括暂停的）
  const activeWorkIds = new Set<string>()

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

  const registerAudio = (workId: string, audio: HTMLAudioElement) => {
    audioElements.set(workId, audio)
    audio.volume = volume() // 设置初始音量
  }

  const unregisterAudio = (workId: string) => {
    audioElements.delete(workId)
    workStateResetCallbacks.delete(workId)
    activeWorkIds.delete(workId)
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

  const playAudio = async (audio: HTMLAudioElement, workId: string) => {
    try {
      // 先停止其他音频
      stopOtherAudio(workId)

      // 注册音频元素
      registerAudio(workId, audio)

      // 将此音频标记为活跃状态
      activeWorkIds.add(workId)

      // 设置音量
      audio.volume = volume()

      // 设置当前音频
      setCurrentAudio(audio)
      setCurrentWorkId(workId)

      // 播放音频
      await audio.play()
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

  const pauseAudio = (workId: string) => {
    const current = currentAudio()
    const currentId = currentWorkId()

    if (current && currentId === workId) {
      current.pause()
      setCurrentAudio(null)
      setCurrentWorkId(null)
    }
  }

  const stopAudio = () => {
    const current = currentAudio()
    const currentId = currentWorkId()

    if (current) {
      current.pause()
      current.currentTime = 0
    }

    // 重置当前播放的音频项状态
    if (currentId) {
      resetWorkState(currentId)
      activeWorkIds.delete(currentId)
    }

    setCurrentAudio(null)
    setCurrentWorkId(null)
  }

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
