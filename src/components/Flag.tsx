import { useState } from 'react'

export default function Flag({ code, emoji, className = 'h-10 w-14' }: { code?: string; emoji: string; className?: string }) {
  const [bad, setBad] = useState(false)
  if (!code || bad) return <span className="text-4xl leading-none">{emoji}</span>
  return (
    <img src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`} alt="" loading="lazy" onError={() => setBad(true)}
      className={`${className} rounded-md object-cover shadow-sm`} />
  )
}
