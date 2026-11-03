/** UI shared by the Claude panels: sending a prompt out, and reading the reply back in. */
import { useEffect, useState } from 'react'
import { claudeChatUrl, clearSharedReply, peekSharedReply, replyKind } from './claude'

const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
const canReadClipboard =
  typeof navigator !== 'undefined' && typeof navigator.clipboard?.readText === 'function'

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** A status line that clears itself. */
export function useFlash(): [string | null, (msg: string | null) => void] {
  const [flash, setFlash] = useState<string | null>(null)
  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), 2600)
    return () => window.clearTimeout(t)
  }, [flash])
  return [flash, setFlash]
}

/**
 * A reply shared into the installed app, if it belongs to this panel (a menu reply goes to the
 * menu planner, anything else to the meal estimate). Read once on mount, then forgotten.
 */
export function useSharedReply(kind: 'menu' | 'meal'): string | null {
  const [mine] = useState(() => {
    const text = peekSharedReply()
    return text !== null && replyKind(text) === kind ? text : null
  })
  useEffect(() => {
    if (mine !== null) clearSharedReply()
  }, [mine])
  return mine
}

/** Text kept in sessionStorage so it survives the trip to the Claude app and back. */
export function useSessionDraft(key: string): [string, (v: string) => void] {
  const [value, setValue] = useState(() => {
    try {
      return sessionStorage.getItem(key) ?? ''
    } catch {
      return ''
    }
  })
  useEffect(() => {
    try {
      if (value) sessionStorage.setItem(key, value)
      else sessionStorage.removeItem(key)
    } catch {
      // storage blocked — the draft just won't survive a reload
    }
  }, [key, value])
  return [value, setValue]
}

type SendProps = {
  prompt: string
  disabled?: boolean
  photo?: File | null
  onFlash: (msg: string) => void
}

/** Share sheet → Claude app where available; claude.ai (pre-filled, prompt also copied) otherwise. */
export function SendToClaude({ prompt, disabled, photo = null, onFlash }: SendProps) {
  const openWeb = async () => {
    const copied = await copyText(prompt)
    window.open(claudeChatUrl(prompt), '_blank', 'noopener')
    if (copied) onFlash('prompt copied — paste it if the chat opens empty')
  }

  const send = async () => {
    if (!canShare) return openWeb()
    const withFile = photo ? { text: prompt, files: [photo] } : null
    const data: ShareData = withFile && navigator.canShare?.(withFile) ? withFile : { text: prompt }
    try {
      await navigator.share(data)
      if (photo && data !== withFile) onFlash('this browser can’t share photos — attach it in claude')
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') void openWeb()
    }
  }

  return (
    <div className="cut-claude-row">
      <button type="button" className="cut-primary" disabled={disabled} onClick={send}>
        {canShare ? 'send to claude' : 'open claude'}
      </button>
      {canShare ? (
        <button type="button" className="cut-secondary" disabled={disabled} onClick={openWeb}>
          claude.ai
        </button>
      ) : null}
      <button
        type="button"
        className="cut-secondary"
        disabled={disabled}
        onClick={async () => onFlash((await copyText(prompt)) ? 'prompt copied' : 'couldn’t copy')}
      >
        copy prompt
      </button>
    </div>
  )
}

type ReplyProps = {
  reply: string
  error: string | null
  onReply: (text: string) => void
  onError: (msg: string) => void
  placeholder?: string
}

/** Paste button, the reply box, its parse error, and the Android share-back hint. */
export function ClaudeReply({ reply, error, onReply, onError, placeholder }: ReplyProps) {
  const paste = async () => {
    try {
      onReply(await navigator.clipboard.readText())
    } catch {
      onError('couldn’t read the clipboard — long-press the box below and paste')
    }
  }

  return (
    <>
      <div className="cut-claude-row">
        {canReadClipboard ? (
          <button type="button" className="cut-primary" onClick={paste}>
            paste reply
          </button>
        ) : null}
        {reply ? (
          <button type="button" className="cut-secondary" onClick={() => onReply('')}>
            clear
          </button>
        ) : null}
      </div>
      <label className="cut-field cut-claude-desc">
        <span className="cut-field-label">reply</span>
        <textarea
          rows={3}
          value={reply}
          placeholder={placeholder ?? 'the whole answer is fine — the json block is picked out'}
          onChange={(e) => onReply(e.target.value)}
        />
      </label>
      {error ? <p className="cut-claude-error">{error}</p> : null}
      <p className="cut-note">on android, with this app installed, share claude’s answer straight back to it instead.</p>
    </>
  )
}
