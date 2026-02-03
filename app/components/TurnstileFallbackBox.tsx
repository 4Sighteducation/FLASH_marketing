'use client'

import type { RefObject } from 'react'

type Props = {
  blocked: boolean
  fallbackVisible: boolean
  invisibleRef: RefObject<HTMLDivElement>
  fallbackRef: RefObject<HTMLDivElement>
  mailto?: string
  contactLabel?: string
  contextLabel?: string
}

export default function TurnstileFallbackBox({
  blocked,
  fallbackVisible,
  invisibleRef,
  fallbackRef,
  mailto = 'support@fl4shcards.com',
  contactLabel = 'email us',
  contextLabel = 'spam protection',
}: Props) {
  const showBox = blocked || fallbackVisible

  return (
    <>
      <div ref={invisibleRef} style={{ display: 'none' }} />
      {showBox ? (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 12,
            border: '1px solid rgba(148,163,184,0.35)',
            background: 'rgba(15,23,42,0.55)',
            color: '#E2E8F0',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <div style={{ marginBottom: 10 }}>
            {blocked
              ? `We can’t load ${contextLabel} on this network. Please ${contactLabel} directly.`
              : `Please complete the quick check below, then submit again.`}
          </div>
          {blocked ? (
            <div>
              <a href={`mailto:${mailto}`} style={{ color: '#00E5FF', fontWeight: 800 }}>
                {mailto}
              </a>
            </div>
          ) : (
            <div ref={fallbackRef} />
          )}
        </div>
      ) : null}
    </>
  )
}
