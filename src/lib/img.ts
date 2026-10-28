const proxy = import.meta.env.VITE_IMG_PROXY !== 'off'

export function optimize(url: string, width: number): string {
  try {
    const u = new URL(url)
    if (u.hostname === 'images.unsplash.com') {
      u.searchParams.set('w', String(width)); u.searchParams.set('q', '70')
      u.searchParams.set('auto', 'format'); u.searchParams.set('fit', 'crop')
      return u.toString()
    }
    if (!proxy) return url
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=72&output=webp&we`
  } catch { return url }
}
