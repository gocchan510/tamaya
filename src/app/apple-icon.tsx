import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 50% 55%, #1a1030 0%, #03030f 70%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 130,
            height: 130,
            borderRadius: 130,
            background: 'radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(251,191,36,0.15) 35%, rgba(251,191,36,0) 70%)',
            display: 'flex',
          }}
        />
        <div style={{ fontSize: 110, lineHeight: 1, filter: 'drop-shadow(0 0 14px rgba(251,191,36,0.8))', display: 'flex' }}>
          🎆
        </div>
      </div>
    ),
    { ...size }
  )
}
