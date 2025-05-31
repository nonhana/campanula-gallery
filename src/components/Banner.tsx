import { ChevronDown } from 'lucide-solid'
import avatar from '~/assets/images/avatar.avif'

export default function Banner() {
  return (
    <div class="relative flex flex-col items-center justify-center gap-8 h-dvh">
      <img src={avatar} alt="avatar" class="h-48 w-48 rounded-full" />
      <h1 class="text-4xl font-bold">待夕归明</h1>
      <p class="text-2xl text-neutral">我和我沉寂的灵魂，伴有十一月的初雪...</p>
      <ChevronDown class="absolute bottom-0 h-8 w-8 animate-bounce text-neutral" />
    </div>
  )
}
