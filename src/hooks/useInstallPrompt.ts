import { useState, useEffect } from 'react'

interface InstallPromptState {
  isIOS: boolean       // iOS Safari: show manual "Add to Home Screen" instructions
  isInstalled: boolean // Already running as installed PWA
}

export function useInstallPrompt(): InstallPromptState {
  const [isInstalled, setIsInstalled] = useState(false)

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as Record<string, unknown>).MSStream

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }
  }, [])

  return { isIOS, isInstalled }
}
