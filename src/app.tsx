import { MetaProvider } from '@solidjs/meta'
import { Router } from '@solidjs/router'
import { FileRoutes } from '@solidjs/start/router'
import { Suspense } from 'solid-js'
import VolumeController from '~/components/VolumeController'
import { AudioProvider } from '~/context/AudioContext'
import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <AudioProvider>
            <Suspense>{props.children}</Suspense>
            <VolumeController />
          </AudioProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  )
}
