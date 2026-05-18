import type { Keyword } from '../types'

interface Props {
  keyword: Keyword
  selected: boolean
  dimmed: boolean
  onClick: (id: string) => void
  chip?: boolean
}

const sizeMap: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'text-[12px] px-3 py-[9px]',
  2: 'text-[13px] px-4 py-[10px]',
  3: 'text-[15px] px-5 py-[11px]',
  4: 'text-[17px] px-6 py-[13px]',
  5: 'text-[19px] px-7 py-[15px]',
}

export default function KeywordBubble({ keyword, selected, dimmed, onClick, chip = false }: Props) {
  const shape = chip ? 'rounded-[12px]' : 'rounded-full'
  return (
    <button
      onClick={() => onClick(keyword.id)}
      className={`
        ${shape} font-semibold tracking-main border transition-all duration-200
        ${sizeMap[keyword.weight]}
        ${selected
          ? 'bg-primary-300 text-echo-900 border-primary-300 scale-[1.06] shadow-md'
          : dimmed
            ? 'bg-echo-100 text-echo-300 border-echo-200 opacity-40 scale-[0.97]'
            : 'bg-echo-100 text-echo-900 border-echo-200 hover:border-primary-300 hover:bg-echo-50 active:scale-95'
        }
      `}
    >
      {keyword.text}
    </button>
  )
}
