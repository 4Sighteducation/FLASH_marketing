'use client'

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, any>) => string
  execute: (widgetId: string) => void
  reset: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const TURNSTILE_SCRIPT_ATTR = 'data-turnstile-script'

let scriptPromise: Promise<boolean> | null = null

function loadTurnstileScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.turnstile) return Promise.resolve(true)

  if (!scriptPromise) {
    scriptPromise = new Promise<boolean>((resolve) => {
      const existing = document.querySelector(`script[${TURNSTILE_SCRIPT_ATTR}]`) as HTMLScriptElement | null
      if (existing) {
        const done = () => resolve(!!window.turnstile)
        existing.addEventListener('load', done, { once: true })
        existing.addEventListener('error', () => resolve(false), { once: true })
      } else {
        const script = document.createElement('script')
        script.src = TURNSTILE_SCRIPT_SRC
        script.async = true
        script.defer = true
        script.setAttribute(TURNSTILE_SCRIPT_ATTR, 'true')
        script.onload = () => resolve(!!window.turnstile)
        script.onerror = () => resolve(false)
        document.head.appendChild(script)
      }

      window.setTimeout(() => resolve(!!window.turnstile), 3500)
    })
  }

  return scriptPromise
}

function waitForToken(timeoutMs: number, resolverRef: MutableRefObject<(token: string | null) => void>) {
  return new Promise<string | null>((resolve) => {
    resolverRef.current = resolve
    window.setTimeout(() => resolve(null), timeoutMs)
  })
}

export function useTurnstile(options: { siteKey?: string; action?: string; cdata?: string }) {
  const [fallbackVisible, setFallbackVisible] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [fallbackToken, setFallbackToken] = useState<string | null>(null)

  const invisibleRef = useRef<HTMLDivElement | null>(null)
  const fallbackRef = useRef<HTMLDivElement | null>(null)

  const invisibleWidgetIdRef = useRef<string | null>(null)
  const fallbackWidgetIdRef = useRef<string | null>(null)

  const invisibleResolveRef = useRef<(token: string | null) => void>(() => undefined)
  const fallbackResolveRef = useRef<(token: string | null) => void>(() => undefined)

  useEffect(() => {
    setFallbackVisible(false)
    setBlocked(false)
    setFallbackToken(null)
  }, [options.siteKey])

  const getToken = useCallback(async () => {
    if (!options.siteKey) return null

    if (fallbackToken) {
      const token = fallbackToken
      setFallbackToken(null)
      if (fallbackWidgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(fallbackWidgetIdRef.current)
        } catch {
          // ignore reset errors
        }
      }
      return token
    }

    const loaded = await loadTurnstileScript()
    if (!loaded || !window.turnstile) {
      setBlocked(true)
      return null
    }

    const turnstile = window.turnstile
    if (!invisibleWidgetIdRef.current && invisibleRef.current) {
      invisibleWidgetIdRef.current = turnstile.render(invisibleRef.current, {
        sitekey: options.siteKey,
        size: 'normal',
        execution: 'execute',
        action: options.action,
        cdata: options.cdata,
        callback: (token: string) => invisibleResolveRef.current(token || null),
        'error-callback': () => invisibleResolveRef.current(null),
        'expired-callback': () => invisibleResolveRef.current(null),
      })
    } else if (invisibleWidgetIdRef.current) {
      try {
        turnstile.reset(invisibleWidgetIdRef.current)
      } catch {
        // ignore reset errors
      }
    }

    const invisibleToken = invisibleWidgetIdRef.current
      ? await waitForToken(1500, invisibleResolveRef)
      : null

    if (invisibleToken) return invisibleToken

    setFallbackVisible(true)

    if (!fallbackRef.current) return null
    if (!fallbackWidgetIdRef.current) {
      fallbackWidgetIdRef.current = turnstile.render(fallbackRef.current, {
        sitekey: options.siteKey,
        size: 'normal',
        action: options.action,
        cdata: options.cdata,
        callback: (token: string) => {
          const resolved = token || null
          setFallbackToken(resolved)
          fallbackResolveRef.current(resolved)
        },
        'error-callback': () => fallbackResolveRef.current(null),
        'expired-callback': () => fallbackResolveRef.current(null),
      })
    } else {
      turnstile.reset(fallbackWidgetIdRef.current)
    }

    return null
  }, [fallbackToken, options.action, options.cdata, options.siteKey])

  const reset = useCallback(() => {
    setFallbackVisible(false)
    setBlocked(false)
    setFallbackToken(null)
    if (fallbackWidgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(fallbackWidgetIdRef.current)
      } catch {
        // ignore reset errors
      }
    }
  }, [])

  return {
    blocked,
    fallbackVisible,
    invisibleRef,
    fallbackRef,
    getToken,
    reset,
  }
}
