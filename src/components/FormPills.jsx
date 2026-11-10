export default function FormPills({ form = [], size = 'sm' }) {
  const dimensions = size === 'xs' ? 'h-4 w-4 text-[8px]' : 'h-5 w-5 text-[9px]'
  if (!form.length) {
    return <span className="text-[10px] text-mist-dim">No matches</span>
  }
  return (
    <div className="flex items-center gap-1">
      {form.map((result, index) => (
        <span
          key={`${result}-${index}`}
          className={`inline-flex items-center justify-center rounded font-bold ${dimensions} form-${result}`}
          title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
        >
          {result}
        </span>
      ))}
    </div>
  )
}
