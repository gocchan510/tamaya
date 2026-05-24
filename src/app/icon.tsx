import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
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
            width: 360,
            height: 360,
            borderRadius: 360,
            background: 'radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(251,191,36,0.15) 35%, rgba(251,191,36,0) 70%)',
            display: 'flex',
          }}
        />
        <div style={{ fontSize: 300, lineHeight: 1, filter: 'drop-shadow(0 0 30px rgba(251,191,36,0.8))', display: 'flex' }}>
          🎆
        </div>
      </div>
    ),
    { ...size }
  )
}
