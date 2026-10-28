export default function Stepper({ label, hint, value, canMinus, canPlus, onMinus, onPlus }: {
  label: string; hint: string; value: number; canMinus: boolean; canPlus: boolean; onMinus: () => void; onPlus: () => void
}) {
  const b = 'grid h-9 w-9 place-items-center rounded-full border border-line text-lg disabled:opacity-30'
  return (
    <div className="flex items-center justify-between">
      <div><p className="font-medium">{label}</p><p className="text-sm text-muted">{hint}</p></div>
      <div className="flex items-center gap-3">
        <button type="button" className={b} onClick={onMinus} disabled={!canMinus} aria-label={`Fewer ${label}`}>−</button>
        <span className="w-6 text-center font-semibold">{value}</span>
        <button type="button" className={b} onClick={onPlus} disabled={!canPlus} aria-label={`More ${label}`}>+</button>
      </div>
    </div>
  )
}