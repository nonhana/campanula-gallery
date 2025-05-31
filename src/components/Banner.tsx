import { ChevronDown } from 'lucide-solid'
import avatar from '~/assets/images/avatar.avif'
import { bannerInfo } from '~/data'

export default function Banner() {
  return (
    <div class="relative flex flex-col items-center justify-center gap-8 h-dvh">
      <img src={avatar} alt="avatar" class="h-48 w-48 rounded-full" />
      <h1 class="text-4xl font-bold">{bannerInfo.name}</h1>
      <p class="text-lg text-neutral">{bannerInfo.description}</p>
      <ChevronDown class="absolute bottom-0 h-8 w-8 animate-bounce text-neutral" />
    </div>
  )
}
