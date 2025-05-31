import type { ParentComponent } from 'solid-js'
import { createContext, createSignal, useContext } from 'solid-js'

interface AudioContextType {
  currentAudio: () => HTMLAudioElement | null
  currentWorkId: () => string | null
  isPlaying: (workId: string) => boolean
  playAudio: (audio: HTMLAudioElement, workId: string) => Promise<void>
  pauseAudio: (workId: string) => void
  stopAudio: () => void
  stopOtherAudio: (excludeWorkId: string) => void
}

const AudioContext = createContext<AudioContextType>()

export const AudioProvider: ParentComponent = (props) => {
  const [currentAudio, setCurrentAudio] = createSignal<HTMLAudioElement | null>(null)
  const [currentWorkId, setCurrentWorkId] = createSignal<string | null>(null)

  const isPlaying = (workId: string) => {
    const current = currentAudio()
    const currentId = currentWorkId()
    // 必须同时满足：音频存在、不是暂停状态、workId匹配
    return Boolean(current && !current.paused && currentId === workId)
  }

  const stopOtherAudio = (excludeWorkId: string) => {
    const current = currentAudio()
    const currentId = currentWorkId()

    if (current && currentId && currentId !== excludeWorkId) {
      current.pause()
      current.currentTime = 0
      // 清除状态，因为已经停止了其他音频
      setCurrentAudio(null)
      setCurrentWorkId(null)
    }
  }

  const playAudio = async (audio: HTMLAudioElement, workId: string) => {
    try {
      // 先停止其他音频
      stopOtherAudio(workId)

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
      throw error
    }
  }

  const pauseAudio = (workId: string) => {
    const current = currentAudio()
    const currentId = currentWorkId()

    if (current && currentId === workId) {
      current.pause()
      // 暂停时清除全局状态，这样 isPlaying 会返回 false
      setCurrentAudio(null)
      setCurrentWorkId(null)
    }
  }

  const stopAudio = () => {
    const current = currentAudio()
    if (current) {
      current.pause()
      current.currentTime = 0
    }
    setCurrentAudio(null)
    setCurrentWorkId(null)
  }

  return (
    <AudioContext.Provider value={{
      currentAudio,
      currentWorkId,
      isPlaying,
      playAudio,
      pauseAudio,
      stopAudio,
      stopOtherAudio,
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
