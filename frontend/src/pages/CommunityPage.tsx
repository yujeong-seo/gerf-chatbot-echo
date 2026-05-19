import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as d3 from 'd3'
import PageShell from '../components/PageShell'
import AppHeader, { getVisitStatus } from '../components/AppHeader'
import { fetchTrending } from '../api'
import { EVENT_START } from '../constants'
import type { Keyword, InsightItem } from '../types'

// ── Bubble palette (design.md §8) ─────────────────────────────────────────

const BUBBLE_PALETTE = ['#2E665E', '#D19350', '#6FBF8F', '#E5C14C', '#6F8AA5']

const LIVE_TEXT_TEST = 'Moving through time: A dance experiment'

const TEST_ACTIVITIES: InsightItem[] = [
  {
    title:       'Family Stage',
    venue:       'Kensington Gardens, East Albert Lawn',
    time:        '12:00–18:00',
    description: '',
    count:       0,
    tags:        ['Performance', 'Family'],
  },
  {
    title:       'Discover Design Engineering',
    venue:       'Dyson Building, Imperial College London',
    time:        '12:00–18:00',
    description: '',
    count:       0,
    tags:        ['Exhibit', 'Engineering'],
  },
  {
    title:       'RoboFootball',
    venue:       'The Smith Centre, Science Museum',
    time:        '12:00–18:00',
    description: '',
    count:       0,
    tags:        ['Exhibit', 'Robotics'],
  },
]

const FALLBACK_KEYWORD_TEXTS = [
  'Activities for family with children',
  'Hands-on technology',
  'Events on Saturday',
  'Stage performances',
  'For Young people',
  'Creative workshops',
  'Explore science',
  'Cultural activities',
  'Adults only',
  'Interactive experience',
]

function generateFallbackKeywords(): Keyword[] {
  const weights: Array<1|2|3|4|5> = [5, 3, 4, 2, 5, 3, 4, 2, 3, 4]
  return [...FALLBACK_KEYWORD_TEXTS]
    .map((t, i) => ({ t, i, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 7)
    .map(({ t, i }) => ({ id: `fb-${i}`, text: t, weight: weights[i % weights.length] }))
}

// ── Tag chip colours — one consistent palette per block index ─────────────

const BLOCK_TAG_COLORS = [
  { bg: 'rgba(41,149,113,0.18)',  text: '#299571' }, // block 0 → green
  { bg: 'rgba(192,123,88,0.20)',  text: '#C07B58' }, // block 1 → orange
  { bg: 'rgba(184,154,90,0.20)',  text: '#B89A5A' }, // block 2 → yellow/hay
]

function blockTagColor(blockIndex: number) {
  return BLOCK_TAG_COLORS[blockIndex % BLOCK_TAG_COLORS.length]
}

// ── D3 pack types ─────────────────────────────────────────────────────────

interface BubbleItem { id: string; label: string; value: number }
interface PackedNode extends d3.HierarchyCircularNode<BubbleItem> { data: BubbleItem }

// ── BubblePack ────────────────────────────────────────────────────────────

interface BubblePackProps {
  items:      Keyword[]
  selectedId: string | null
  expanded:   boolean
  onSelect:   (id: string) => void
  onExpand:   () => void
}

function BubblePack({ items, selectedId, expanded, onSelect, onExpand }: BubblePackProps) {
  const containerRef                = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(0)
  const [containerH, setContainerH] = useState(0)
  const [nodes,      setNodes]      = useState<PackedNode[]>([])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width
      const h = expanded ? e.contentRect.height : w * 0.75
      setContainerW(w)
      setContainerH(h)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [expanded])

  useEffect(() => {
    if (!containerW || !containerH || !items.length) return
    const visible     = expanded ? items.slice(0, 7) : items.slice(0, 3)
    const bubbleItems = visible.map(k => ({ id: k.id, label: k.text, value: k.weight }))
    const root        = d3.hierarchy<{ children: BubbleItem[] }>({ children: bubbleItems } as never)
      .sum(d => (d as unknown as BubbleItem).value ?? 0)
    d3.pack<BubbleItem>().size([containerW, containerH]).padding(8)(root as never)
    setNodes(root.leaves() as unknown as PackedNode[])
  }, [items, expanded, containerW, containerH])

  const cx = containerW / 2
  const cy = containerH / 2

  // Render the selected bubble last so it paints on top
  const sortedNodes = selectedId
    ? [...nodes].sort((a, b) => (a.data.id === selectedId ? 1 : 0) - (b.data.id === selectedId ? 1 : 0))
    : nodes

  return (
    <div
      ref={containerRef}
      style={expanded ? { position: 'absolute', inset: 0 } : {
        width: '100%',
        height: containerW ? containerW * 0.75 : undefined,
        aspectRatio: !containerW ? '4/3' : undefined,
      }}
    >
      {containerW > 0 && (
        <svg width={containerW} height={containerH} style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <filter id="bubble-inner-glow" x="-10%" y="-10%" width="110%" height="110%">
              <feFlood floodColor="white" floodOpacity="0.8" result="glow-color"/>
              <feComposite in="glow-color" in2="SourceAlpha" operator="out" result="outside-glow"/>
              <feGaussianBlur in="outside-glow" stdDeviation="10" result="blurred"/>
              <feComposite in="blurred" in2="SourceAlpha" operator="in"/>
            </filter>
          </defs>

          {!expanded && (
            <rect x={0} y={0} width={containerW} height={containerH}
              fill="transparent" style={{ cursor: 'pointer' }} onClick={onExpand} />
          )}

          {sortedNodes.map((node) => {
            const sel      = selectedId === node.data.id
            const dimmed   = selectedId !== null && !sel
            const origIdx  = nodes.findIndex(n => n.data.id === node.data.id)
            const color    = BUBBLE_PALETTE[origIdx % BUBBLE_PALETTE.length]
            const fontSize = Math.max(10, Math.min(15, node.r * 0.26))
            const popDelay = origIdx * 0.06

            const tx = sel ? cx : node.x
            const ty = sel ? cy : node.y

            return (
              <g
                key={node.data.id}
                style={{
                  transform:  `translate(${tx}px, ${ty}px) scale(${sel ? 1.75 : 1})`,
                  transition: 'transform 0.45s cubic-bezier(0.34, 1.4, 0.64, 1)',
                  cursor:     'pointer',
                }}
                onClick={e => { e.stopPropagation(); onSelect(node.data.id) }}
              >
                <g style={{ animation: `bubble-pop 0.35s ease-out ${popDelay}s both` }}>
                  {/* Base color */}
                  <circle r={node.r} fill={color} opacity={dimmed ? 0.35 : 1}
                    style={{ transition: 'opacity 0.15s' }} />
                  {/* Inset glow overlay */}
                  <circle r={node.r} fill="white" filter="url(#bubble-inner-glow)"
                    opacity={dimmed ? 0.35 : 1}
                    style={{ pointerEvents: 'none', transition: 'opacity 0.15s' }} />

                  <foreignObject
                    x={-(node.r * 0.78)} y={-(node.r * 0.78)}
                    width={node.r * 1.56} height={node.r * 1.56}
                    style={{ pointerEvents: 'none', overflow: 'visible' }}
                  >
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      textAlign: 'center',
                      fontSize: `${fontSize}px`,
                      fontFamily: 'var(--font-main)',
                      fontWeight: 500,
                      letterSpacing: '-0.02em',
                      color: dimmed ? 'rgba(255,255,255,0.4)' : '#FFFFFF',
                      wordBreak: 'break-word',
                      lineHeight: 1.25,
                      padding: '4px',
                      userSelect: 'none',
                      transition: 'color 0.15s',
                    }}>
                      {node.data.label}
                    </div>
                  </foreignObject>
                </g>
              </g>
            )
          })}

          {!expanded && items.length > 4 && (
            <g transform={`translate(${containerW - 12}, ${containerH - 12})`}
              onClick={onExpand} style={{ cursor: 'pointer' }}>
              <text textAnchor="end" dominantBaseline="auto"
                fontSize={17} fontFamily="var(--font-accent)" fontWeight={700}
                fill="var(--stone-500)" opacity={0.65}
                style={{ pointerEvents: 'none', userSelect: 'none' }}>
                +{items.length - 4}
              </text>
            </g>
          )}
        </svg>
      )}
    </div>
  )
}

// ── Round chip (type C: white bg, shadow, icon + label) ───────────────────

function RoundChip({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          6,
      padding:      '8px 16px 8px 14px',
      borderRadius: 9999,
      background:   '#FFFFFF',
      boxShadow:    'var(--shadow-chip-round)',
      flexShrink:   0,
    }}>
      {icon}
      <span style={{
        fontFamily:    'var(--font-main)',
        fontWeight:    500,
        fontSize:      14,
        color,
        letterSpacing: 'var(--tr-main)',
        whiteSpace:    'nowrap',
      }}>
        {label}
      </span>
    </div>
  )
}

// ── Activity card ─────────────────────────────────────────────────────────

function formatCount(count: number, index: number): string {
  if (count < 10) return index === 0 ? 'Most popular' : 'Popular'
  return `${Math.floor(count / 10) * 10}+`
}

const eventDateLabel = EVENT_START.toLocaleDateString('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric',
})

interface ActivityCardProps {
  item:        InsightItem
  index:       number
  blockIndex:  number
  isSelected?: boolean
  isLive?:     boolean
}

function ActivityCard({ item, index, blockIndex, isSelected, isLive }: ActivityCardProps) {
  const label = formatCount(item.count, index)

  const chip = isLive ? (
    <RoundChip
      color="#299571"
      label="Live Now"
      icon={
        <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: '#299571', animation: 'radiate-pulse 1.8s ease-out infinite',
          }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#299571' }} />
        </div>
      }
    />
  ) : (
    <RoundChip
      color="#C07B58"
      label={label}
      icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#C07B58">
          <path fillRule="evenodd" clipRule="evenodd" d="M10.9825 0C11.158 0.111716 11.3706 0.217413 11.5557 0.326172C11.8974 0.524977 12.2263 0.745101 12.541 0.984375C14.3158 2.3511 15.5537 4.29888 16.0362 6.48633C16.2716 7.55223 16.3255 8.65057 16.1953 9.73438C16.6291 9.21743 17.0772 8.67692 17.3877 8.07422C18.0313 6.82543 18.8166 7.82987 19.3565 8.48535C20.5813 9.9684 21.3195 11.7925 21.4707 13.71C21.6824 16.2617 20.853 18.7912 19.1709 20.7217C17.7352 22.3851 15.6492 23.5723 13.4717 23.8828C13.3358 23.9023 12.9863 23.945 12.8809 24H11.1651C11.0123 23.9407 10.079 23.8134 9.82229 23.7529C7.3665 23.1689 5.24185 21.6348 3.91507 19.4873C1.62123 15.7691 2.15464 10.9664 5.20804 7.8418C5.83632 7.1914 6.33688 6.89035 7.01858 6.35449C7.70504 5.81702 8.30124 5.1718 8.78323 4.44531C9.35578 3.57841 9.75482 2.6087 9.95804 1.58984C10.0263 1.23753 10.0462 0.884036 10.1172 0.53418C10.174 0.254504 10.3482 0.142682 10.5811 0H10.9825Z" />
        </svg>
      }
    />
  )

  const tc = blockTagColor(blockIndex)

  return (
    <div style={{
      background:    '#FFFFFF',
      border:        isSelected ? '2px solid var(--primary-500)' : '1px solid #F0F0F0',
      borderRadius:  12,
      boxShadow:     'var(--shadow-card-light)',
      overflow:      'hidden',
      transition:    'border-color 0.15s',
    }}>
      {/* Header row */}
      <div style={{
        padding:        '16px 16px 0',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            12,
      }}>
        <p style={{
          margin:        0,
          fontFamily:    'var(--font-accent)',
          fontWeight:    600,
          fontSize:      18,
          color:         'var(--stone-900)',
          letterSpacing: 'var(--tr-main)',
          lineHeight:    1.3,
          flex:          1,
        }}>
          {item.title}
        </p>
        {chip}
      </div>

      {/* Body */}
      <div style={{ padding: '16px' }}>
        {/* Tag chips */}
        {item.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {item.tags.map(tag => (
                <span key={tag} style={{
                  padding:       '6px 12px',
                  borderRadius:  8,
                  background:    tc.bg,
                  color:         tc.text,
                  fontFamily:    'var(--font-main)',
                  fontSize:      14,
                  fontWeight:    500,
                  letterSpacing: 'var(--tr-main)',
                }}>
                  {tag}
                </span>
            ))}
          </div>
        )}

        {/* Location */}
        {item.venue && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--stone-300)" style={{ flexShrink: 0 }}>
              <path fillRule="evenodd" clipRule="evenodd" d="M12 0C14.6522 0 17.1959 1.05335 19.0713 2.92871C20.9467 4.80407 22 7.34784 22 10C22 13.9019 19.5154 17.3955 17.2256 19.8125C16.0603 21.0425 14.8988 22.043 14.0293 22.7354C13.594 23.082 13.2299 23.3533 12.9727 23.5391C12.8442 23.6318 12.7419 23.7037 12.6709 23.7529C12.6355 23.7774 12.6073 23.7964 12.5879 23.8096C12.5782 23.8162 12.57 23.8215 12.5645 23.8252C12.5618 23.827 12.5576 23.8301 12.5576 23.8301L12.5557 23.8311C12.5557 23.8311 12.5548 23.8293 12.5527 23.8262L12.5547 23.832C12.2188 24.056 11.7812 24.056 11.4453 23.832L11.4443 23.8311L11.4424 23.8301C11.4424 23.8301 11.4382 23.827 11.4355 23.8252C11.43 23.8215 11.4218 23.8162 11.4121 23.8096C11.3927 23.7964 11.3645 23.7774 11.3291 23.7529C11.2581 23.7037 11.1558 23.6318 11.0273 23.5391C10.7701 23.3533 10.406 23.082 9.9707 22.7354C9.10124 22.043 7.93969 21.0425 6.77441 19.8125C4.48463 17.3955 2 13.9019 2 10C2 7.34784 3.05335 4.80407 4.92871 2.92871C6.80407 1.05335 9.34784 0 12 0ZM12 6C9.79086 6 8 7.79086 8 10C8 12.2091 9.79086 14 12 14C14.2091 14 16 12.2091 16 10C16  7.79086 14.2091 6 12 6Z" />
            </svg>
            <span style={{
              fontFamily:    'var(--font-main)',
              fontWeight:    400,
              fontSize:      14,
              color:         'var(--stone-500)',
              letterSpacing: 'var(--tr-main)',
            }}>
              {item.venue}
            </span>
          </div>
        )}

        {/* Date + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path fillRule="evenodd" clipRule="evenodd" d="M12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1ZM12 5C11.4477 5 11 5.44772 11 6V12C11 12.3788 11.214 12.7251 11.5527 12.8945L15.5527 14.8945C16.0467 15.1415 16.6475 14.9412 16.8945 14.4473C17.1415 13.9533 16.9412 13.3525 16.4473 13.1055L13 11.3818V6C13 5.44772 12.5523 5 12 5Z" fill="var(--stone-300)" />
          </svg>
          <span style={{
            fontFamily:    'var(--font-main)',
            fontWeight:    400,
            fontSize:      14,
            color:         'var(--stone-500)',
            letterSpacing: 'var(--tr-main)',
          }}>
            {eventDateLabel}, {item.time}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Live card ─────────────────────────────────────────────────────────────

function LiveCard({ text, isSelected, onClick }: { text: string; isSelected?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background:   '#d4e6df',
        border:       isSelected ? '2px solid var(--primary-500)' : '1px solid #F0F0F0',
        borderRadius: 12,
        boxShadow:    'var(--shadow-card-light)',
        overflow:     'hidden',
        cursor:       onClick ? 'pointer' : 'default',
        transition:   'border-color 0.15s',
      }}>
      <div style={{
        padding:        '16px 16px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            12,
      }}>
        <p style={{
          margin:        0,
          fontFamily:    'var(--font-accent)',
          fontWeight:    500,
          fontSize:      14,
          color:         'var(--stone-900)',
          letterSpacing: 'var(--tr-main)',
          lineHeight:    1.5,
          flex:          1,
        }}>
          {text}
        </p>
        <RoundChip
          color="#299571"
          label="Live Now"
          icon={
            <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: '#299571', animation: 'radiate-pulse 1.8s ease-out infinite',
              }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#299571' }} />
            </div>
          }
        />
      </div>
    </div>
  )
}

// ── Decorative rising chart ───────────────────────────────────────────────

function RisingChart() {
  return (
    <svg width="84" height="46" viewBox="0 0 84 46" fill="none" aria-hidden="true">
      <style>{`
        @keyframes rising-line-draw {
          from { stroke-dashoffset: 150; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes rising-fill-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes rising-dot-pop {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.35); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <defs>
        <filter id="filter0_f_431_2657" x="0" y="3" width="82" height="43"
          filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="1" result="effect1_foregroundBlur_431_2657" />
        </filter>
        <linearGradient id="paint0_linear_431_2657" x1="41" y1="5" x2="41" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#358D80" stopOpacity="0.6" />
          <stop offset="1" stopColor="#358D80" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="paint1_linear_431_2657" x1="36.5" y1="5" x2="6.5" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#358D80" />
          <stop offset="1" stopColor="#358D80" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Fill area — fades in after line completes */}
      <g filter="url(#filter0_f_431_2657)"
        style={{ opacity: 0, animation: 'rising-fill-in 0.4s ease-out 0.8s forwards' }}>
        <path
          d="M27.8344 19C17.1032 19 6.14013 37 2 44H80V5C68.5732 5 57.1465 31.5 50.1911 31.5C43.2357 31.5 41.2484 19 27.8344 19Z"
          fill="url(#paint0_linear_431_2657)"
        />
      </g>

      {/* Stroke line — draws from bottom-left to top-right */}
      <path
        d="M2 44C6.14013 37 17.1032 19 27.8344 19C41.2484 19 43.2357 31.5 50.1911 31.5C57.1465 31.5 68.5732 5 80 5"
        stroke="url(#paint1_linear_431_2657)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="150"
        strokeDashoffset="150"
        style={{ animation: 'rising-line-draw 0.75s ease-in-out 0.05s forwards' }}
      />

      {/* Endpoint dot — pops in as line arrives */}
      <circle
        cx="80" cy="4" r="3" fill="#358D80"
        style={{
          transformOrigin: '80px 4px',
          transform: 'scale(0)',
          opacity: 0,
          animation: 'rising-dot-pop 0.3s ease-out 0.75s forwards',
        }}
      />
    </svg>
  )
}

// ── Section heading ───────────────────────────────────────────────────────

function SectionHeading({ eyebrow, title, right }: { eyebrow: string; title: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <div>
        <p style={{
          margin:        '0 0 8px',
          fontFamily:    'var(--font-main)',
          fontWeight:    500,
          fontSize:      14,
          letterSpacing: 0.2,
          textTransform: 'uppercase',
          color:         'var(--stone-500)',
          lineHeight:    1,
        }}>
          {eyebrow}
        </p>
        <h2 style={{
          margin:        0,
          fontFamily:    'var(--font-accent)',
          fontWeight:    700,
          fontSize:      24,
          color:         'var(--stone-900)',
          letterSpacing: 'var(--tr-main)',
          lineHeight:    1,
        }}>
          {title}
        </h2>
      </div>
      {right}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const navigate = useNavigate()

  const [keywords,        setKeywords]        = useState<Keyword[]>([])
  const [insights,        setInsights]        = useState<InsightItem[]>([])
  const [selectedKwId,    setSelectedKwId]    = useState<string | null>(null)
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null)
  const [expanded,        setExpanded]        = useState(false)
  const [modalMounted,    setModalMounted]    = useState(false)
  const [modalShowing,    setModalShowing]    = useState(false)

  const isTestMode = sessionStorage.getItem('echo_visit_type') === 'test'
  const visitStatus = getVisitStatus()

  useEffect(() => {
    if (isTestMode) {
      setKeywords(generateFallbackKeywords())
      setInsights(TEST_ACTIVITIES)
      return
    }
    fetchTrending().then(({ popular_now, insights: ins }) => {
      setKeywords(popular_now.length ? popular_now : generateFallbackKeywords())
      setInsights(ins)
    })
  }, [])

  const canExpand      = keywords.length > 4
  const selectedKw     = keywords.find(k => k.id === selectedKwId)
  const exploreLabel   = selectedKw?.text ?? selectedInsight ?? ''
  const showExploreBar = !!(selectedKw || selectedInsight)

  function handleBubble(id: string) {
    setSelectedKwId(p => p === id ? null : id)
    setSelectedInsight(null)
  }

  function handleInsight(title: string) {
    setSelectedInsight(p => p === title ? null : title)
    setSelectedKwId(null)
  }

  function handleExpand() {
    if (!expanded) {
      setExpanded(true)
      setModalMounted(true)
      setTimeout(() => setModalShowing(true), 10)
      setSelectedKwId(null)
    } else {
      setModalShowing(false)
      setTimeout(() => {
        setModalMounted(false)
        setExpanded(false)
        setSelectedKwId(null)
      }, 320)
    }
  }

  function handleExplore() {
    if (!exploreLabel) return
    const marker = selectedKw ? '<<P>>' : '<<C>>'
    sessionStorage.setItem('echo_community_query', JSON.stringify({
      display: `Tell me more about ${exploreLabel}`,
      agent:   `${marker} Tell me more about ${exploreLabel}`,
    }))
    navigate('/chat')
  }

  const liveText: string | null = isTestMode ? LIVE_TEXT_TEST : null

  const SECTION_PY = 30

  return (
    <PageShell>
      <AppHeader />

      <div className="flex-1 overflow-y-auto no-scroll">

        {/* ── 3-1: Greeting ── */}
        <section style={{ padding: `${SECTION_PY}px 20px` }}>
          {/* D-X row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
            <span style={{
              fontFamily:    'var(--font-accent)',
              fontWeight:    700,
              fontSize:      40,
              lineHeight:    1,
              color:         'var(--stone-500)',
              letterSpacing: 'var(--tr-accent)',
            }}>
              {visitStatus.label}
            </span>
            {/* Context chip */}
            <span style={{
              padding:       '8px 16px',
              borderRadius:  9999,
              background:    'var(--primary-tint)',
              color:         'var(--primary-700)',
              fontFamily:    'var(--font-main)',
              fontWeight:    500,
              fontSize:      15,
              letterSpacing: 'var(--tr-main)',
              whiteSpace:    'nowrap',
            }}>
              {visitStatus.chip}
            </span>
          </div>
          {/* Description */}
          <p style={{
            margin:        0,
            fontFamily:    'var(--font-accent)',
            fontWeight:    700,
            fontSize:      24,
            lineHeight:    1.3,
            color:         'var(--stone-900)',
            letterSpacing: 'var(--tr-accent)',
          }}>
            Explore what people are interested in
          </p>
        </section>

        <hr style={{ margin: '0 20px', border: 'none', borderTop: '1.5px solid var(--stone-200)' }} />

        {/* ── 3-2: Popular Keywords ── */}
        <section style={{ padding: `${SECTION_PY}px 20px` }}>
          <div style={{ marginBottom: 24 }}>
            <SectionHeading
              eyebrow="What Crowd Asks"
              title="Popular Keywords"
              right={canExpand ? (
                <button
                  onClick={handleExpand}
                  style={{
                    width:        36,
                    height:       36,
                    borderRadius: '50%',
                    border:       '1px solid var(--stone-200)',
                    background:   '#FFFFFF',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    cursor:       'pointer',
                    flexShrink:   0,
                  }}
                  aria-label={expanded ? 'Collapse' : 'Expand'}
                >
                  {expanded ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="var(--stone-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                      <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="var(--stone-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  )}
                </button>
              ) : undefined}
            />
          </div>

          {/* Mid card container */}
          <div style={{ borderRadius: 12, background: 'var(--card-mid-bg)', padding: 8 }}>
            <BubblePack
              items={keywords}
              selectedId={selectedKwId}
              expanded={false}
              onSelect={handleBubble}
              onExpand={handleExpand}
            />
          </div>
        </section>

        {/* ── 3-3: Popular Activities ── */}
        <section style={{ padding: `${SECTION_PY}px 20px` }}>
          <div style={{ marginBottom: 24 }}>
            <SectionHeading
              eyebrow="Where Crowd Is Heading"
              title="Popular Activities"
              right={<RisingChart />}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {liveText !== null && (
              <LiveCard
                text={liveText}
                isSelected={selectedInsight === liveText}
                onClick={() => handleInsight(liveText)}
              />
            )}
            {insights.slice(0, 3).map((item, i) => (
              <div key={item.title} onClick={() => handleInsight(item.title)} style={{ cursor: 'pointer' }}>
                <ActivityCard item={item} index={i} blockIndex={i} isSelected={selectedInsight === item.title} />
              </div>
            ))}
          </div>
        </section>

        <div style={{ height: 96 }} />
      </div>

      {/* ── Expanded modal ── */}
      {modalMounted && (
        <div
          onClick={handleExpand}
          style={{
            position:             'absolute',
            inset:                0,
            zIndex:               30,
            background:           'rgba(0,0,0,0.06)',
            backdropFilter:       'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            opacity:              modalShowing ? 1 : 0,
            transition:           'opacity 0.3s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position:        'absolute',
              top:             16,
              left:            16,
              right:           16,
              bottom:          16,
              background:      'linear-gradient(180deg, #FFFFFF 0%, #F7F7F7 100%)',
              borderRadius:    20,
              boxShadow:       '0 8px 40px rgba(0,0,0,0.12)',
              display:         'flex',
              flexDirection:   'column',
              overflow:        'hidden',
              transform:       modalShowing ? 'scale(1) translateY(0px)' : 'scale(0.95) translateY(16px)',
              opacity:         modalShowing ? 1 : 0,
              transition:      'transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1), opacity 0.25s ease',
            }}
          >
            {/* Modal header */}
            <div style={{
              padding:        '20px 20px 0',
              display:        'flex',
              alignItems:     'flex-end',
              justifyContent: 'space-between',
              flexShrink:     0,
            }}>
              <div>
                <p style={{
                  margin:        '0 0 8px',
                  fontFamily:    'var(--font-main)',
                  fontWeight:    500,
                  fontSize:      14,
                  letterSpacing: 0.2,
                  textTransform: 'uppercase',
                  color:         'var(--stone-500)',
                  lineHeight:    1,
                }}>
                  What Crowd Asks
                </p>
                <h2 style={{
                  margin:        0,
                  fontFamily:    'var(--font-accent)',
                  fontWeight:    700,
                  fontSize:      24,
                  color:         'var(--stone-900)',
                  letterSpacing: 'var(--tr-main)',
                  lineHeight:    1,
                }}>
                  Popular Keywords
                </h2>
              </div>
              <button
                onClick={handleExpand}
                style={{
                  width:          36,
                  height:         36,
                  borderRadius:   '50%',
                  border:         '1px solid var(--stone-200)',
                  background:     '#FFFFFF',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  cursor:         'pointer',
                  flexShrink:     0,
                }}
                aria-label="Minimize"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="var(--stone-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                  <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
                </svg>
              </button>
            </div>

            {/* Bubble pack */}
            <div style={{ flex: 1, padding: 8, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
              <BubblePack
                items={keywords}
                selectedId={selectedKwId}
                expanded={true}
                onSelect={handleBubble}
                onExpand={handleExpand}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Explore bar ── */}
      {showExploreBar && (
        <div className="absolute bottom-0 left-0 right-0 animate-pop-in"
        style={{ zIndex: 40, padding: `${SECTION_PY}px 20px` }}>
          <div
            style={{
              borderRadius: 12,
              padding:      '16px 20px',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'space-between',
              gap:          16,
              background:   'var(--primary-500)',
              border:       '1px solid var(--primary-700)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{
                margin:        '0 0 4px',
                fontFamily:    'var(--font-main)',
                fontWeight:    600,
                fontSize:      10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color:         'rgba(255,255,255,0.55)',
              }}>
                Ask ECHO about
              </p>
              <p style={{
                margin:        0,
                fontFamily:    'var(--font-main)',
                fontWeight:    600,
                fontSize:      15,
                color:         '#FFFFFF',
                letterSpacing: 'var(--tr-main)',
                overflow:      'hidden',
                textOverflow:  'ellipsis',
                whiteSpace:    'nowrap',
              }}>
                {exploreLabel}
              </p>
            </div>
            <button
              onClick={handleExplore}
              style={{
                flexShrink:   0,
                display:      'flex',
                alignItems:   'center',
                gap:          8,
                padding:      '11px 22px',
                borderRadius: 9999,
                border:       '1px solid rgba(255,255,255,0.28)',
                background:   'rgba(255,255,255,0.16)',
                color:        '#FFFFFF',
                fontFamily:   'var(--font-main)',
                fontSize:     14,
                fontWeight:   600,
                cursor:       'pointer',
                letterSpacing: 'var(--tr-main)',
              }}
            >
              Explore more
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </PageShell>
  )
}
