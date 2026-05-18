import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as d3 from 'd3'
import PageShell from '../components/PageShell'
import AppHeader from '../components/AppHeader'
import { fetchTrending } from '../api'
import type { Keyword, InsightItem } from '../types'

// ── Bubble colour palette and animation constants ─────────────────────────

const LIVE_BUBBLE_COLORS = [
  { bg: 'var(--hay-inactive)',   border: 'rgba(184,154,90,0.3)',  text: 'var(--echo-900)' },
  { bg: 'var(--slate-inactive)', border: 'rgba(94,126,156,0.25)', text: 'var(--echo-900)' },
  { bg: 'var(--hay-active)',     border: 'rgba(184,154,90,0.5)',  text: 'white' },
  { bg: 'var(--slate-active)',   border: 'rgba(94,126,156,0.5)',  text: 'white' },
  { bg: '#ffffff',               border: 'rgba(34,36,34,0.06)',   text: 'var(--echo-900)' },
  { bg: 'var(--orange-inactive)',border: 'rgba(192,123,88,0.25)', text: 'var(--echo-900)' },
  { bg: 'var(--primary-300)',    border: 'var(--primary-500)',    text: 'white' },
]

const FALLBACK_BUBBLE_COLORS = [
  { bg: 'var(--primary-500)', border: 'var(--primary-700)',   text: 'white' },
  { bg: 'var(--primary-300)', border: 'var(--primary-500)',   text: 'white' },
  { bg: 'var(--hay-active)',  border: 'rgba(184,154,90,0.5)', text: 'white' },
  { bg: 'var(--slate-active)',border: 'rgba(94,126,156,0.5)', text: 'white' },
  { bg: 'var(--primary-700)', border: 'rgba(20,60,56,0.4)',   text: 'white' },
  { bg: 'var(--hay-inactive)',border: 'rgba(184,154,90,0.3)', text: 'var(--echo-900)' },
]

const LIVE_TEXT_DEFAULT = 'Live update placeholder text'
const LIVE_TEXT_TEST    = 'Moving through time: A dance experiment'

const TEST_ACTIVITIES: InsightItem[] = [
  {
    title:       'Family Stage',
    venue:       'Exhibition Road',
    time:        '10:00–18:00',
    description: 'Live performances and activities for the whole family.',
    count:       0,
    tags:        ['Family', 'Performance'],
  },
  {
    title:       'Discover Design Engineering',
    venue:       'Imperial College London',
    time:        '10:00–17:00',
    description: 'Explore design thinking and engineering in practice.',
    count:       0,
    tags:        ['Engineering', 'Workshop'],
  },
  {
    title:       'RoboFootball',
    venue:       'Science Museum',
    time:        '10:00–17:00',
    description: 'Watch robots compete in a game of football.',
    count:       0,
    tags:        ['Robotics', 'Interactive'],
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
  const shuffled = [...FALLBACK_KEYWORD_TEXTS]
    .map((t, i) => ({ t, i, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 7)
  return shuffled.map(({ t, i }) => ({
    id:     `fb-${i}`,
    text:   t,
    weight: weights[i % weights.length],
  }))
}

const FLOAT_NAMES     = ['float-a', 'float-b', 'float-c']
const FLOAT_DURATIONS = [3.5, 3.9, 3.2, 4.1, 3.7, 3.4]

// ── D3 pack types ─────────────────────────────────────────────────────────

interface BubbleItem { id: string; label: string; value: number }

interface PackedNode extends d3.HierarchyCircularNode<BubbleItem> {
  data: BubbleItem
}

// ── BubblePack component ──────────────────────────────────────────────────

interface BubblePackProps {
  items:      Keyword[]
  selectedId: string | null
  expanded:   boolean
  isFallback: boolean
  onSelect:   (id: string) => void
  onExpand:   () => void
}

function BubblePack({ items, selectedId, expanded, isFallback, onSelect, onExpand }: BubblePackProps) {
  const containerRef              = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(0)
  const [containerH, setContainerH] = useState(0)
  const [nodes,      setNodes]      = useState<PackedNode[]>([])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width
      const h = expanded ? e.contentRect.height * 1.15 : w
      setContainerW(w)
      setContainerH(h)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [expanded])

  useEffect(() => {
    if (!containerW || !containerH || !items.length) return

    const visible = expanded ? items : items.slice(0, 3)
    const bubbleItems: BubbleItem[] = visible.map(k => ({
      id:    k.id,
      label: k.text,
      value: k.weight,
    }))

    const root = d3.hierarchy<{ children: BubbleItem[] }>({ children: bubbleItems } as never)
      .sum((d) => (d as unknown as BubbleItem).value ?? 0)

    d3.pack<BubbleItem>()
      .size([containerW, containerH])
      .padding(6)(root as never)

    setNodes(root.leaves() as unknown as PackedNode[])
  }, [items, expanded, containerW, containerH])

  const colorPalette = isFallback ? FALLBACK_BUBBLE_COLORS : LIVE_BUBBLE_COLORS

  return (
    <div
      ref={containerRef}
      style={expanded ? {
        position: 'absolute',
        inset:    0,
      } : {
        width:       '100%',
        height:      containerW ? containerW : undefined,
        aspectRatio: !containerW ? '1/1' : undefined,
      }}
    >
      {containerW > 0 && (
        <svg width={containerW} height={containerH} style={{ display: 'block', overflow: 'visible' }}>
          {/* Transparent background — clicking empty space expands when collapsed */}
          {!expanded && (
            <rect
              x={0} y={0} width={containerW} height={containerH}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={onExpand}
            />
          )}

          {nodes.map((node, i) => {
            const sel       = selectedId === node.data.id
            const dimmed    = selectedId !== null && !sel
            const colorIdx  = i % colorPalette.length
            const color     = colorPalette[colorIdx]
            const fontSize  = Math.max(10, Math.min(16, node.r * 0.28))
            const floatAnim = FLOAT_NAMES[i % 3]
            const floatDur  = FLOAT_DURATIONS[i % FLOAT_DURATIONS.length]
            const popDelay  = i * 0.06

            const textColor = dimmed
              ? 'var(--echo-300)'
              : (color as typeof FALLBACK_BUBBLE_COLORS[0]).text ?? 'var(--echo-900)'

            return (
              <g
                key={node.data.id}
                style={{
                  transform:  `translate(${node.x}px, ${node.y}px)`,
                  transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
                  cursor:     'pointer',
                }}
                onClick={(e) => { e.stopPropagation(); onSelect(node.data.id) }}
              >
                <g style={{
                  animation: `bubble-pop 0.35s ease-out ${popDelay}s both, ${floatAnim} ${floatDur}s ease-in-out ${popDelay + 0.35}s infinite`,
                  animationPlayState: sel || dimmed ? 'paused, paused' : 'running, running',
                }}>
                  <circle
                    r={node.r}
                    fill={color.bg}
                    stroke={color.border}
                    strokeWidth={sel ? 2 : 1}
                    opacity={dimmed ? 0.4 : 1}
                    style={{
                      transition: 'fill 0.3s, stroke 0.3s, opacity 0.15s',
                      filter: 'drop-shadow(0 1px 1.5px rgba(20,22,20,0.06)) drop-shadow(0 2px 6px rgba(20,22,20,0.04))',
                    }}
                  />
                  <foreignObject
                    x={-(node.r * 0.78)}
                    y={-(node.r * 0.78)}
                    width={node.r * 1.56}
                    height={node.r * 1.56}
                    style={{ pointerEvents: 'none', overflow: 'visible' }}
                  >
                    <div style={{
                      width:          '100%',
                      height:         '100%',
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      textAlign:      'center',
                      fontSize:       `${fontSize}px`,
                      fontFamily:     'var(--font-main)',
                      fontWeight:     500,
                      letterSpacing:  '-0.02em',
                      color:          textColor,
                      wordBreak:      'break-word',
                      lineHeight:     1.25,
                      padding:        '4px',
                      userSelect:     'none',
                      opacity:        dimmed ? 0.5 : 1,
                      transition:     'color 0.3s, opacity 0.15s',
                    }}>
                      {node.data.label}
                    </div>
                  </foreignObject>
                </g>
              </g>
            )
          })}

          {/* +N counter — fixed bottom-right, outside D3 pack */}
          {!expanded && items.length > 3 && (
            <g
              transform={`translate(${containerW - 10}, ${containerH - 10})`}
              onClick={onExpand}
              style={{ cursor: 'pointer' }}
            >
              <text
                textAnchor="end"
                dominantBaseline="auto"
                fontSize={12}
                fontFamily="var(--font-accent)"
                fontWeight={700}
                fill="var(--echo-500)"
                opacity={0.55}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                +{items.length - 3}
              </text>
            </g>
          )}
        </svg>
      )}
    </div>
  )
}

// ── Activity card ─────────────────────────────────────────────────────────

const HEADER_H = 52

function formatCount(count: number, index: number): string {
  if (count < 10) return index === 0 ? 'Most popular' : 'Popular'
  return `${Math.floor(count / 10) * 10}+`
}

interface ActivityCardProps {
  item:       InsightItem
  index:      number
  isSelected?: boolean
}

const ActivityCard = ({ item, index, isSelected }: ActivityCardProps) => {
  const label       = formatCount(item.count, index)
  const isTextLabel = item.count < 10

  return (
    <div style={{
      borderRadius: 16,
      background:   isSelected ? 'rgba(78,140,132,0.07)' : 'white',
      boxShadow:    isSelected
        ? '0 0 0 1.5px var(--primary-500), var(--sh-card)'
        : 'var(--sh-card)',
      transition:   'box-shadow 0.15s, background 0.15s',
    }}>
      {/* Header */}
      <div style={{
        height:         HEADER_H,
        padding:        '0 16px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            12,
      }}>
        <p style={{
          margin:        0,
          fontFamily:    'var(--font-main)',
          fontWeight:    600,
          fontSize:      15,
          color:         'var(--echo-900)',
          letterSpacing: '-0.02em',
          overflow:      'hidden',
          textOverflow:  'ellipsis',
          whiteSpace:    'nowrap',
          flex:          1,
        }}>
          {item.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <svg width="11" height="13" viewBox="0 0 24 24"
            fill="var(--echo-900)"
            style={{ flexShrink: 0 }}>
            <path fillRule="evenodd" clipRule="evenodd" d="M10.9825 0C11.158 0.111716 11.3706 0.217413 11.5557 0.326172C11.8974 0.524977 12.2263 0.745101 12.541 0.984375C14.3158 2.3511 15.5537 4.29888 16.0362 6.48633C16.2716 7.55223 16.3255 8.65057 16.1953 9.73438C16.6291 9.21743 17.0772 8.67692 17.3877 8.07422C18.0313 6.82543 18.8166 7.82987 19.3565 8.48535C20.5813 9.9684 21.3195 11.7925 21.4707 13.71C21.6824 16.2617 20.853 18.7912 19.1709 20.7217C17.7352 22.3851 15.6492 23.5723 13.4717 23.8828C13.3358 23.9023 12.9863 23.945 12.8809 24H11.1651C11.0123 23.9407 10.079 23.8134 9.82229 23.7529C7.3665 23.1689 5.24185 21.6348 3.91507 19.4873C1.62123 15.7691 2.15464 10.9664 5.20804 7.8418C5.83632 7.1914 6.33688 6.89035 7.01858 6.35449C7.70504 5.81702 8.30124 5.1718 8.78323 4.44531C9.35578 3.57841 9.75482 2.6087 9.95804 1.58984C10.0263 1.23753 10.0462 0.884036 10.1172 0.53418C10.174 0.254504 10.3482 0.142682 10.5811 0H10.9825ZM11.4082 12C11.31 12.0595 11.2359 12.1061 11.2119 12.2227C11.182 12.3683 11.1743 12.5154 11.1455 12.6621C11.0599 13.0868 10.8909 13.4912 10.6494 13.8525C10.4463 14.1551 10.1956 14.4236 9.90628 14.6475C9.61877 14.8708 9.40755 14.9965 9.14261 15.2676C7.85539 16.5694 7.63078 18.57 8.59769 20.1191C9.15706 21.0139 10.0525 21.6531 11.0879 21.8965C11.1959 21.9217 11.5899 21.9753 11.6543 22H12.378C12.4226 21.9771 12.5698 21.9593 12.627 21.9512C13.545 21.8217 14.5178 21.3298 15.1231 20.6367C15.8322 19.8324 16.0127 18.8183 15.9991 17.7129C15.9868 16.7207 15.396 15.6165 14.8116 14.917C14.0696 14.0292 12.9827 12.9796 12.2344 12.4102C12.1017 12.3104 11.9625 12.2186 11.8184 12.1357C11.7405 12.0905 11.6511 12.0465 11.5772 12H11.4082Z" />
          </svg>
          <span style={{
            fontFamily: 'var(--font-main)',
            fontSize:   isTextLabel ? 11 : 13,
            fontWeight: isTextLabel ? 500 : 600,
            color:      'var(--echo-900)',
            whiteSpace: 'nowrap',
          }}>
            {label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '0 16px 16px' }}>
        {item.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {item.tags.map(tag => (
              <span key={tag} style={{
                padding:       '3px 9px',
                borderRadius:  6,
                background:    'var(--echo-100)',
                color:         'var(--echo-500)',
                fontFamily:    'var(--font-main)',
                fontSize:      11,
                fontWeight:    500,
                letterSpacing: '-0.01em',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {item.venue && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <svg width="11" height="13" viewBox="0 0 24 24" fill="var(--echo-400)" style={{ flexShrink: 0 }}>
              <path fillRule="evenodd" clipRule="evenodd" d="M12 0C14.6522 0 17.1959 1.05335 19.0713 2.92871C20.9467 4.80407 22 7.34784 22 10C22 13.9019 19.5154 17.3955 17.2256 19.8125C16.0603 21.0425 14.8988 22.043 14.0293 22.7354C13.594 23.082 13.2299 23.3533 12.9727 23.5391C12.8442 23.6318 12.7419 23.7037 12.6709 23.7529C12.6355 23.7774 12.6073 23.7964 12.5879 23.8096C12.5782 23.8162 12.57 23.8215 12.5645 23.8252C12.5618 23.827 12.5576 23.8301 12.5576 23.8301L12.5557 23.8311C12.5557 23.8311 12.5548 23.8293 12.5527 23.8262L12.5547 23.832C12.2188 24.056 11.7812 24.056 11.4453 23.832L11.4443 23.8311L11.4424 23.8301C11.4424 23.8301 11.4382 23.827 11.4355 23.8252C11.43 23.8215 11.4218 23.8162 11.4121 23.8096C11.3927 23.7964 11.3645 23.7774 11.3291 23.7529C11.2581 23.7037 11.1558 23.6318 11.0273 23.5391C10.7701 23.3533 10.406 23.082 9.9707 22.7354C9.10124 22.043 7.93969 21.0425 6.77441 19.8125C4.48463 17.3955 2 13.9019 2 10C2 7.34784 3.05335 4.80407 4.92871 2.92871C6.80407 1.05335 9.34784 0 12 0ZM12 6C9.79086 6 8 7.79086 8 10C8 12.2091 9.79086 14 12 14C14.2091 14 16 12.2091 16 10C16 7.79086 14.2091 6 12 6Z" />
            </svg>
            <span style={{ fontFamily: 'var(--font-main)', fontSize: 13, color: 'var(--echo-400)', letterSpacing: '-0.02em' }}>
              {item.venue}
            </span>
          </div>
        )}

        {item.description && (
          <p style={{ margin: 0, fontFamily: 'var(--font-main)', fontSize: 13, color: 'var(--echo-500)', lineHeight: 1.5, letterSpacing: '-0.02em' }}>
            {item.description}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const navigate = useNavigate()

  const [keywords,        setKeywords]        = useState<Keyword[]>([])
  const [insights,        setInsights]        = useState<InsightItem[]>([])
  const [isFallback,      setIsFallback]      = useState(false)
  const [selectedKwId,    setSelectedKwId]    = useState<string | null>(null)
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const isTestMode = sessionStorage.getItem('echo_visit_type') === 'test'

  useEffect(() => {
    if (isTestMode) {
      setKeywords(generateFallbackKeywords())
      setIsFallback(true)
      setInsights(TEST_ACTIVITIES)
      return
    }
    fetchTrending().then(({ popular_now, insights: ins }) => {
      if (popular_now.length === 0) {
        setKeywords(generateFallbackKeywords())
        setIsFallback(true)
      } else {
        setKeywords(popular_now)
        setIsFallback(false)
      }
      setInsights(ins)
    })
  }, [])

  const canExpand     = keywords.length > 3
  const selectedKw    = keywords.find(k => k.id === selectedKwId)
  const exploreLabel  = selectedKw?.text ?? selectedInsight ?? ''
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
    setExpanded(e => !e)
    setSelectedKwId(null)
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

  return (
    <PageShell>
      <AppHeader />

      <div className={[
        'flex-1 overflow-y-auto no-scroll px-5 pt-5 pb-4 gap-4',
        expanded ? 'flex flex-col min-h-0' : 'block',
      ].join(' ')}>

        {/* ── Popular Keywords ── */}
        <section className={`flex flex-col gap-3 ${expanded ? 'flex-1' : 'mb-4'}`}>
          <div className="flex items-end justify-between">
            <div>
              <p className="t-label text-echo-500 mb-1">What people are asking</p>
              <h2 className="t-h2 text-echo-900 m-0">Popular Keywords</h2>
            </div>
            {canExpand && (
              <button
                onClick={handleExpand}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-echo-200 bg-echo-50 hover:bg-echo-100 active:scale-95 transition-all"
                aria-label={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="#82847F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                    <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="#82847F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                )}
              </button>
            )}
          </div>

          <div className={[
            'rounded-[20px] bg-echo-100 p-2',
            expanded ? 'flex-1 min-h-0 overflow-hidden relative' : '',
          ].join(' ')}>
            <BubblePack
              items={keywords}
              selectedId={selectedKwId}
              expanded={expanded}
              isFallback={isFallback}
              onSelect={handleBubble}
              onExpand={handleExpand}
            />
          </div>
        </section>

        {!expanded && (
          <>
            {/* ── Popular Activities ── */}
            <section className="flex flex-col gap-3">
              <div>
                <p className="t-label text-echo-500 mb-1">Where crowd is heading</p>
                <h2 className="t-h2 text-echo-900 m-0">Popular Activities</h2>
              </div>
              
              {/* ── Live banner ── */}
              <div style={{
                display:      'flex',
                alignItems:   'center',
                gap:          10,
                padding:      '11px 14px',
                borderRadius: 12,
                background:   'white',
                boxShadow:    'var(--sh-card)',
                marginBottom: 2,
              }}>
                <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
                  <div style={{
                    position:     'absolute',
                    inset:        0,
                    borderRadius: '50%',
                    background:   'var(--primary-500)',
                    animation:    'radiate-pulse 1.8s ease-out infinite',
                  }} />
                  <div style={{
                    position:     'absolute',
                    inset:        0,
                    borderRadius: '50%',
                    background:   'var(--primary-500)',
                  }} />
                </div>
                <p style={{
                  margin:        0,
                  fontFamily:    'var(--font-main)',
                  fontSize:      13,
                  color:         'var(--echo-500)',
                  letterSpacing: '-0.02em',
                  lineHeight:    1.4,
                }}>
                  {isTestMode ? LIVE_TEXT_TEST : LIVE_TEXT_DEFAULT}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {insights.slice(0, 3).map((item, i) => (
                  <div key={item.title} onClick={() => handleInsight(item.title)}>
                    <ActivityCard item={item} index={i} isSelected={selectedInsight === item.title} />
                  </div>
                ))}
              </div>
            </section>

            <div style={{ height: 96 }} />
          </>
        )}
      </div>

      {/* ── Explore more — floating teal bar ── */}
      {showExploreBar && (
        <div className="absolute bottom-0 left-0 right-0 z-20 animate-pop-in px-4 pb-6">
          <div
            className="rounded-[18px] px-5 py-4 flex items-center justify-between gap-4"
            style={{
              background: 'var(--primary-grad)',
              boxShadow:  '0 8px 32px rgba(46,104,96,0.32)',
            }}
          >
            <div className="min-w-0">
              <p className="t-label text-white/55 mb-1">Ask ECHO about</p>
              <p className="t-h3 text-white m-0 truncate">{exploreLabel}</p>
            </div>
            <button
              onClick={handleExplore}
              className="flex-shrink-0 flex items-center gap-2 btn btn-md"
              style={{
                background: 'rgba(255,255,255,0.16)',
                color:      'white',
                border:     '1px solid rgba(255,255,255,0.28)',
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
