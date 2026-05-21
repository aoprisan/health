import { useInstallPrompt } from '../hooks/useInstallPrompt'

export function InstallButton() {
  const { canInstall, promptInstall } = useInstallPrompt()
  if (!canInstall) return null

  return (
    <button type="button" className="install-button" onClick={promptInstall}>
      <span className="arrow" aria-hidden="true">↓</span> install app
    </button>
  )
}
