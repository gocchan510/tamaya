'use client'

export function OfficialLinkButton({ url }: { url: string }) {
  return (
    <button
      type="button"
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        window.open(url, '_blank', 'noopener,noreferrer')
      }}
      className="absolute bottom-2.5 right-3 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-amber-400/10 text-amber-300/90 border border-amber-400/20 hover:bg-amber-400/25 hover:text-amber-300 transition-colors z-10"
      title="公式サイトを開く"
    >
      <span>🔗</span>
      <span>公式</span>
    </button>
  )
}
