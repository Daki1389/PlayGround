import { motion } from 'framer-motion'

const TONES = {
  lime: 'bg-lime',
  sky: 'bg-sky-400',
  rose: 'bg-rose-400',
  amber: 'bg-amber-400',
  violet: 'bg-violet-400',
  white: 'bg-white/70'
}

export default function StatBar({ label, value, max = 100, tone = 'lime', suffix = '', compact = false }) {
  const percent = Math.max(0, Math.min(100, (Number(value) / max) * 100))
  return (
    <div>
      {label && (
        <div className={`flex items-center justify-between ${compact ? 'mb-1' : 'mb-1.5'}`}>
          <span className="text-[11px] font-medium text-mist">{label}</span>
          <span className="num text-[11px] font-semibold text-slate-200">{value}{suffix}</span>
        </div>
      )}
      <div className={`overflow-hidden rounded-full bg-white/[0.07] ${compact ? 'h-1' : 'h-1.5'}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full ${TONES[tone] || TONES.lime}`}
        />
      </div>
    </div>
  )
}
