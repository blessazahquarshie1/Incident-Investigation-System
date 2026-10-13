import { useMemo, useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
} from '@xyflow/react'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { buildGraph, getNeighbors } from '../lib/graph'
import {
  getCasePeople,
  getCaseEvidence,
  getCaseIncidents,
  getCaseVehicles,
  getCaseLocations,
} from '../lib/caseScope'
import { computeLayout } from '../lib/graphLayout'
import { findAllShortestConnections, type ConnectionPath } from '../lib/pathfinding'
import { calculateConnection, type PairConnection } from '../lib/connections'
import { buildCaseMap, layoutCaseMap } from '../lib/caseMap'
import type { CaseComparison, ComparisonLevel } from '../lib/caseComparison'
import { ENTITY_STYLE } from '../lib/entityStyle'
import { getPersonName, getOfficerName } from '../lib/lookup'
import { formatDateTime } from '../lib/dates'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EntityIcon from '../components/EntityIcon'
import EntityTypeBadge from '../components/EntityTypeBadge'
import ConnectionPathView from '../components/ConnectionPathView'
import ConnectionScoreCard from '../components/ConnectionScoreCard'
import type { EntityType, Case, InvestigationData } from '../types'
import {
  Search, RotateCcw, Plus, X, Users, Compass, Eye, EyeOff,
  Briefcase, Network, GitCompare, Info, ArrowRight,
} from 'lucide-react'

// ==========================================
// 1. CASE MAP: CUSTOM REACT FLOW NODE & EDGE
// ==========================================

interface CaseCircleNodeData extends Record<string, unknown> {
  id: string
  title: string
  status: Case['status']
  priority: Case['priority']
  isPast: boolean
  isCentre: boolean
  isHighlighted: boolean
  isDimmed: boolean
  onClick: (id: string) => void
}

function CaseCircleCustomNode({ data }: NodeProps<Node<CaseCircleNodeData>>) {
  const { id, title, status, isPast, isCentre, isHighlighted, isDimmed, onClick } = data

  return (
    <div
      onClick={() => onClick(id)}
      style={{ width: isCentre ? 175 : 155, height: isCentre ? 175 : 155 }}
      className={`rounded-full flex flex-col items-center justify-center text-center p-3 cursor-pointer select-none transition-all duration-150 ${
        isCentre
          ? 'border-4 border-blue-700 bg-blue-50/95 shadow-lg ring-4 ring-blue-200 z-30'
          : isPast
            ? 'border-2 border-slate-400 bg-slate-50 hover:border-slate-600 hover:shadow-md'
            : 'border-2 border-blue-600 bg-white hover:border-blue-700 hover:shadow-md'
      } ${
        isHighlighted && !isCentre ? 'ring-4 ring-blue-400 shadow-lg scale-105 z-20' : ''
      } ${
        isDimmed ? 'opacity-25' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!opacity-0 !w-1 !h-1"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!opacity-0 !w-1 !h-1"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />

      {/* Current / Past Badge */}
      <span
        className={`rounded-full px-2.5 py-0.5 text-[13px] font-semibold mb-0.5 ${
          isPast ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-800'
        }`}
      >
        {isPast ? 'Past' : 'Current'}
      </span>

      {/* Case ID */}
      <div className="font-mono text-[16px] font-bold text-slate-900 leading-tight">
        {id}
      </div>

      {/* Title (shortened to one line) */}
      <div
        className="truncate text-[14px] text-slate-600 font-medium leading-tight mt-0.5 max-w-[125px]"
        title={title}
      >
        {title}
      </div>

      {/* Status */}
      <div className="text-[13px] text-slate-500 capitalize mt-0.5 font-medium">
        {status}
      </div>
    </div>
  )
}

interface CaseMapEdgeData extends Record<string, unknown> {
  id: string
  source: string
  target: string
  score: number
  level: ComparisonLevel
  label: string
  comparison: CaseComparison
  isSelected: boolean
  isDimmed: boolean
  onClick: (comparison: CaseComparison) => void
}

function CaseMapCustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps<Edge<CaseMapEdgeData>>) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  if (!data) return null
  const { level, label, isSelected, isDimmed, onClick, comparison } = data

  const colors: Record<ComparisonLevel, string> = {
    'WEAK': '#94a3b8',
    'MODERATE': '#2563eb',
    'STRONG': '#ea580c',
    'VERY STRONG': '#dc2626',
  }

  const widths: Record<ComparisonLevel, number> = {
    'WEAK': 1,
    'MODERATE': 2,
    'STRONG': 4,
    'VERY STRONG': 6,
  }

  const strokeColor = colors[level] || '#94a3b8'
  const strokeWidth = widths[level] || 2

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: isSelected ? strokeWidth + 2 : strokeWidth,
          opacity: isDimmed ? 0.15 : 1,
          cursor: 'pointer',
        }}
        interactionWidth={24}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              opacity: isDimmed ? 0.15 : 1,
            }}
            onClick={() => onClick(comparison)}
            className={`cursor-pointer select-none rounded-md px-2.5 py-1 text-[13px] font-semibold transition-all shadow-xs ${
              isSelected
                ? 'bg-blue-600 text-white ring-2 ring-blue-300 shadow-md'
                : 'bg-white/95 text-slate-800 border border-slate-200 hover:border-slate-400 hover:shadow-sm'
            }`}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const caseMapNodeTypes = {
  caseCircle: CaseCircleCustomNode,
}

const caseMapEdgeTypes = {
  caseLink: CaseMapCustomEdge,
}

// ==========================================
// 2. CASE MAP VIEW COMPONENT
// ==========================================

function getComparisonSharedList(comp: CaseComparison, data: InvestigationData): string[] {
  const lines: string[] = []

  // Same car
  for (const vid of comp.sharedVehicleIds) {
    const v = data.vehicles.find(x => x.id === vid)
    lines.push(`Same car: ${v ? `${v.registration} ${v.make} ${v.model}` : vid}`)
  }

  // Same person
  for (const pid of comp.sharedPersonIds) {
    const p = data.persons.find(x => x.id === pid)
    lines.push(`Same person: ${p ? p.fullName : pid}`)
  }

  // Same method
  for (const tag of comp.sharedEvidenceTags) {
    lines.push(`Same method: ${tag}`)
  }

  // Same place
  for (const lid of comp.sharedLocationIds) {
    const l = data.locations.find(x => x.id === lid)
    lines.push(`Same place: ${l ? l.name : lid}`)
  }

  // Same phone
  for (const phone of comp.sharedPhoneNumbers) {
    lines.push(`Same phone: ${phone}`)
  }

  // Similar name
  for (const m of comp.nameMatches) {
    const nameA = getPersonName(data, m.personAId)
    const nameB = getPersonName(data, m.personBId)
    lines.push(`Similar name: ${nameA} ≈ ${nameB}`)
  }

  // Similar time
  if (comp.similarTimeOfDay) {
    lines.push('Similar time: Incidents occurred within 90 minutes of the same time of day')
  }

  // Same type
  if (comp.sameType) {
    const c = data.cases.find(x => x.id === comp.caseAId)
    lines.push(`Same type: Both classified as ${c?.type ?? 'theft'}`)
  }

  return lines
}

function CaseMapView({ initialCaseId }: { initialCaseId?: string }) {
  const data = useInvestigationStore(s => s.data)
  const reactFlowInstance = useReactFlow()

  // Controls state
  const [caseMapMode, setCaseMapMode] = useState<'focus' | 'all'>('focus')
  const [focusCaseId, setFocusCaseId] = useState<string>(initialCaseId || 'CASE-00123')
  const [showWeakLinks, setShowWeakLinks] = useState(false)

  // Selection state
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [selectedComparison, setSelectedComparison] = useState<CaseComparison | null>(null)

  // Build map nodes and edges via pure caseMap helper
  const mapData = useMemo(() => {
    return buildCaseMap(data, {
      focusCaseId: caseMapMode === 'focus' ? focusCaseId : undefined,
      minScore: showWeakLinks ? 0 : 4,
    })
  }, [data, caseMapMode, focusCaseId, showWeakLinks])

  // Deterministic radial / circle layout
  const layoutPositions = useMemo(() => {
    return layoutCaseMap(mapData.nodes, caseMapMode)
  }, [mapData.nodes, caseMapMode])

  // Connected neighbors set for all-cases mode selection
  const connectedCaseIds = useMemo(() => {
    if (!selectedCaseId) return new Set<string>()
    const set = new Set<string>()
    for (const edge of mapData.edges) {
      if (edge.source === selectedCaseId) set.add(edge.target)
      if (edge.target === selectedCaseId) set.add(edge.source)
    }
    return set
  }, [selectedCaseId, mapData.edges])

  // React Flow nodes
  const rfNodes: Node<CaseCircleNodeData>[] = useMemo(() => {
    return mapData.nodes.map(n => {
      const pos = layoutPositions[n.id] ?? { x: 400, y: 300 }
      const isSelected = selectedCaseId === n.id
      const isNeighbor = selectedCaseId ? connectedCaseIds.has(n.id) : false

      let isDimmed = false
      if (caseMapMode === 'all' && selectedCaseId) {
        isDimmed = !isSelected && !isNeighbor
      }

      return {
        id: n.id,
        type: 'caseCircle',
        position: pos,
        draggable: false,
        data: {
          id: n.id,
          title: n.title,
          status: n.status,
          priority: n.priority,
          isPast: n.isPast,
          isCentre: n.isCentre,
          isHighlighted: isSelected || isNeighbor,
          isDimmed,
          onClick: (id: string) => {
            setSelectedCaseId(id)
            if (caseMapMode === 'focus') {
              if (id === focusCaseId) {
                setSelectedComparison(null)
              } else {
                const edge = mapData.edges.find(e => e.target === id || e.source === id)
                if (edge) {
                  setSelectedComparison(edge.comparison)
                }
              }
            } else {
              setSelectedComparison(null)
            }
          },
        },
      }
    })
  }, [mapData.nodes, layoutPositions, selectedCaseId, connectedCaseIds, caseMapMode, focusCaseId, mapData.edges])

  // React Flow edges
  const rfEdges: Edge<CaseMapEdgeData>[] = useMemo(() => {
    return mapData.edges.map(e => {
      const isSelected = selectedComparison
        ? (selectedComparison.caseAId === e.source && selectedComparison.caseBId === e.target) ||
          (selectedComparison.caseAId === e.target && selectedComparison.caseBId === e.source)
        : false

      let isDimmed = false
      if (caseMapMode === 'all' && selectedCaseId) {
        const touches = e.source === selectedCaseId || e.target === selectedCaseId
        isDimmed = !touches
      }

      return {
        id: e.id,
        type: 'caseLink',
        source: e.source,
        target: e.target,
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          score: e.score,
          level: e.level,
          label: e.label,
          comparison: e.comparison,
          isSelected,
          isDimmed,
          onClick: (comp: CaseComparison) => {
            setSelectedComparison(comp)
            setSelectedCaseId(null)
          },
        },
      }
    })
  }, [mapData.edges, selectedComparison, caseMapMode, selectedCaseId])

  // Auto-fitView on load and when configuration changes
  useEffect(() => {
    const timer = setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.25, duration: 400 })
    }, 60)
    return () => clearTimeout(timer)
  }, [caseMapMode, focusCaseId, showWeakLinks, reactFlowInstance])

  // Selected case details for "All cases" mode side panel
  const activeSelectedCase = useMemo(() => {
    if (!selectedCaseId) return null
    return data.cases.find(c => c.id === selectedCaseId) ?? null
  }, [selectedCaseId, data.cases])

  const activeCaseLinks = useMemo(() => {
    if (!selectedCaseId) return []
    return mapData.edges.filter(
      e => e.source === selectedCaseId || e.target === selectedCaseId
    )
  }, [selectedCaseId, mapData.edges])

  const hasDetailPanel = selectedComparison !== null || activeSelectedCase !== null

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Focus on one case / All cases switch */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => {
                setCaseMapMode('focus')
                setSelectedCaseId(null)
                setSelectedComparison(null)
              }}
              className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                caseMapMode === 'focus'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Focus on one case
            </button>
            <button
              type="button"
              onClick={() => {
                setCaseMapMode('all')
                setSelectedCaseId(null)
                setSelectedComparison(null)
              }}
              className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                caseMapMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All cases
            </button>
          </div>

          {/* Case Picker (focus mode only) */}
          {caseMapMode === 'focus' && (
            <div className="flex items-center gap-2">
              <label className="text-[13px] font-semibold text-slate-600 whitespace-nowrap">Case:</label>
              <select
                value={focusCaseId}
                onChange={e => {
                  setFocusCaseId(e.target.value)
                  setSelectedCaseId(null)
                  setSelectedComparison(null)
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-base font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {data.cases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.id} ({c.title})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Show weak links checkbox */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-[13px] font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showWeakLinks}
              onChange={e => setShowWeakLinks(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Show weak links</span>
          </label>
        </div>
      </div>

      {/* Map & Detail Side Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* React Flow Map Canvas */}
        <div className={hasDetailPanel ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <div className="relative h-[650px] w-full rounded-t-xl border border-slate-200 bg-slate-50/50 shadow-inner overflow-hidden">
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              nodeTypes={caseMapNodeTypes}
              edgeTypes={caseMapEdgeTypes}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              minZoom={0.2}
              maxZoom={2}
              nodesDraggable={false}
              onPaneClick={() => {
                setSelectedCaseId(null)
                setSelectedComparison(null)
              }}
            >
              <Background gap={24} size={1} color="#cbd5e1" />
              <Controls position="top-right" showInteractive={false} />
              <MiniMap
                position="bottom-right"
                nodeStrokeWidth={3}
                nodeColor={n => {
                  const nodeData = n.data as unknown as CaseCircleNodeData
                  return nodeData.isPast ? '#94a3b8' : '#2563eb'
                }}
                className="!bg-white/80 !border-slate-200"
              />
            </ReactFlow>

            {/* Empty State for Case with 0 links */}
            {caseMapMode === 'focus' && mapData.edges.length === 0 && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/80 p-6 pointer-events-none">
                <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-md pointer-events-auto">
                  <p className="text-[15px] font-semibold text-slate-800">
                    This case is not linked to any other case yet. That does not prove it has no links, only that no shared details are recorded.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Mandatory Single Line Legend */}
          <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white py-2 text-center text-[13px] font-medium text-slate-600 shadow-xs">
            Blue = current case · Grey = past case · Thicker line = stronger link
          </div>
        </div>

        {/* Side Panel (Right on Desktop, Below on Mobile) */}
        {hasDetailPanel && (
          <div className="lg:col-span-4 space-y-4">
            {/* Panel 1: Specific Link Selected */}
            {selectedComparison && (
              <Card className="space-y-4 max-h-[690px] overflow-y-auto">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[16px] font-bold text-slate-900">
                        {selectedComparison.caseAId} ↔ {selectedComparison.caseBId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[13px] font-bold">
                        {selectedComparison.level}
                      </span>
                      <span className="text-[13px] font-semibold text-slate-500">
                        Score: {selectedComparison.score}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedComparison(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    title="Close panel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* What they share */}
                <div className="space-y-2">
                  <h4 className="text-[14px] font-bold text-slate-900">What they share</h4>
                  <ul className="space-y-1.5 rounded-lg bg-slate-50 p-3 border border-slate-200">
                    {getComparisonSharedList(selectedComparison, data).map((item, idx) => (
                      <li key={idx} className="text-[13px] font-medium text-slate-700 flex items-start gap-1.5">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Where to look (first 3 leads) */}
                {selectedComparison.leads.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[14px] font-bold text-slate-900">Where to look</h4>
                    <div className="space-y-2">
                      {selectedComparison.leads.slice(0, 3).map((lead, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-slate-200 p-2.5 bg-white text-[13px] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">Lead #{idx + 1}</span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[12px] font-bold uppercase ${
                                lead.priority === 'high'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {lead.priority}
                            </span>
                          </div>
                          <p className="text-slate-600">{lead.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compare Button */}
                <Link
                  to={`/cases/${selectedComparison.caseAId}/compare/${selectedComparison.caseBId}`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-[14px] font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <GitCompare className="h-4 w-4" />
                  <span>Compare</span>
                </Link>
              </Card>
            )}

            {/* Panel 2: Case Circle Clicked in "All Cases" Mode with no link selected */}
            {!selectedComparison && activeSelectedCase && (
              <Card className="space-y-4 max-h-[690px] overflow-y-auto">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[16px] font-bold text-slate-900">
                        {activeSelectedCase.id}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[13px] font-semibold ${
                          activeSelectedCase.status === 'closed'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {activeSelectedCase.status === 'closed' ? 'Past' : 'Current'}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-slate-800 mt-1">
                      {activeSelectedCase.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedCaseId(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    title="Close panel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[14px] font-bold text-slate-900">
                    Linked cases ({activeCaseLinks.length})
                  </h4>
                  {activeCaseLinks.length === 0 ? (
                    <p className="text-[13px] text-slate-500 italic p-2 bg-slate-50 rounded-lg">
                      No connected cases with score ≥ {showWeakLinks ? 0 : 4}.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeCaseLinks.map(edge => {
                        const otherId = edge.source === activeSelectedCase.id ? edge.target : edge.source
                        const otherCase = data.cases.find(c => c.id === otherId)
                        return (
                          <div
                            key={edge.id}
                            className="rounded-lg border border-slate-200 p-2.5 bg-slate-50 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-blue-600 text-[14px]">
                                {otherId}
                              </span>
                              <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.2 text-[12px] font-bold">
                                {edge.level} ({edge.score})
                              </span>
                            </div>
                            <p className="text-[13px] font-medium text-slate-800 truncate">
                              {otherCase?.title}
                            </p>
                            <p className="text-[13px] text-slate-500 italic">
                              {edge.label}
                            </p>
                            <button
                              type="button"
                              onClick={() => setSelectedComparison(edge.comparison)}
                              className="text-[13px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-1"
                            >
                              <span>View connection details</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// 3. DETAILED ENTITY GRAPH (EXISTING STEP 08 VIEW)
// ==========================================

interface CustomNodeData extends Record<string, unknown> {
  id: string
  label: string
  entityType: EntityType
  subLabel?: string
  isDimmed: boolean
  isHighlighted: boolean
  isPathNode: boolean
  onClick: (id: string) => void
}

function InvestigationCustomNode({ data }: NodeProps<Node<CustomNodeData>>) {
  const { label, entityType, subLabel, isDimmed, isHighlighted, isPathNode, onClick } = data
  const style = ENTITY_STYLE[entityType]
  const Icon = style.icon

  return (
    <div
      onClick={() => onClick(data.id)}
      className={`rounded-xl border shadow-sm p-2.5 min-w-[140px] max-w-[210px] flex items-center gap-2.5 cursor-pointer select-none transition-all duration-150 ${
        isPathNode
          ? 'ring-2 ring-blue-600 bg-blue-50/90 border-blue-500 scale-105 z-30 shadow-md'
          : isHighlighted
            ? 'ring-2 ring-blue-500 bg-white border-blue-400 scale-105 z-20 shadow-md'
            : isDimmed
              ? 'opacity-25 bg-white/70 border-slate-200'
              : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-1 !h-1" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-1 !h-1" />

      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.bgColor} ${style.color}`}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-slate-900 leading-tight" title={label}>
          {label}
        </div>
        {subLabel && (
          <div className="truncate text-[13px] text-slate-500 capitalize leading-tight mt-0.5">
            {subLabel}
          </div>
        )}
      </div>
    </div>
  )
}

const entityNodeTypes = {
  investigationNode: InvestigationCustomNode,
}

const RELATIONSHIP_CONFIGS: Record<string, { stroke: string; strokeWidth: number; strokeDasharray?: string }> = {
  'owns': { stroke: '#2563eb', strokeWidth: 2 },
  'visited': { stroke: '#ec4899', strokeWidth: 2, strokeDasharray: '5,5' },
  'witnessed': { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '2,3' },
  'involved-in': { stroke: '#ea580c', strokeWidth: 3 },
  'connected-to': { stroke: '#64748b', strokeWidth: 2, strokeDasharray: '8,4' },
}

function EntityGraphView() {
  const data = useInvestigationStore(s => s.data)
  const reactFlowInstance = useReactFlow()

  // State: single case selection (All Cases removed per Step 14)
  const [selectedCase, setSelectedCase] = useState<string>('CASE-00123')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set())
  const [visibleTypes, setVisibleTypes] = useState<Set<EntityType>>(
    new Set<EntityType>(['person', 'incident', 'vehicle', 'evidence', 'location'])
  )
  const [legendOpen, setLegendOpen] = useState(false)

  // Search / Find on graph
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Compare two people tool
  const [comparePersonA, setComparePersonA] = useState<string>('')
  const [comparePersonB, setComparePersonB] = useState<string>('')
  const [comparisonPaths, setComparisonPaths] = useState<ConnectionPath[] | undefined>(undefined)
  const [comparisonScore, setComparisonScore] = useState<PairConnection | null | undefined>(undefined)

  const fullGraph = useMemo(() => buildGraph(data), [data])

  function handleCaseChange(newCase: string) {
    setSelectedCase(newCase)
    setExpandedNodeIds(new Set())
    setSelectedNodeId(null)
    setComparisonPaths(undefined)
    setComparisonScore(undefined)
  }

  // Base entities belonging to the selected case
  const baseNodes = useMemo(() => {
    const people = getCasePeople(data, selectedCase)
    const incidents = getCaseIncidents(data, selectedCase)
    const evidence = getCaseEvidence(data, selectedCase)
    const vehicles = getCaseVehicles(data, selectedCase)
    const locations = getCaseLocations(data, selectedCase)

    const baseIds = new Set<string>([
      ...people.map(p => p.id),
      ...incidents.map(i => i.id),
      ...evidence.map(e => e.id),
      ...vehicles.map(v => v.id),
      ...locations.map(l => l.id),
    ])

    return fullGraph.nodes.filter(n => baseIds.has(n.id))
  }, [data, selectedCase, fullGraph])

  // Candidate nodes before filtering unconnected ones
  const candidateNodes = useMemo(() => {
    const includedIds = new Set(baseNodes.map(n => n.id))

    for (const id of expandedNodeIds) {
      includedIds.add(id)
    }

    if (comparisonPaths) {
      for (const path of comparisonPaths) {
        for (const node of path.nodes) {
          includedIds.add(node.id)
        }
      }
    }

    return fullGraph.nodes.filter(n => {
      if (!includedIds.has(n.id)) return false
      if (comparisonPaths?.some(p => p.nodes.some(pn => pn.id === n.id))) return true
      return visibleTypes.has(n.type)
    })
  }, [baseNodes, expandedNodeIds, comparisonPaths, fullGraph, visibleTypes])

  // Active edges between candidate nodes
  const activeEdges = useMemo(() => {
    const candidateIds = new Set(candidateNodes.map(n => n.id))
    return fullGraph.edges.filter(
      e => candidateIds.has(e.source) && candidateIds.has(e.target)
    )
  }, [fullGraph.edges, candidateNodes])

  // Hide nodes that have no connection in the current view (Step 14 requirement)
  const activeNodes = useMemo(() => {
    const connectedIds = new Set<string>()
    for (const edge of activeEdges) {
      connectedIds.add(edge.source)
      connectedIds.add(edge.target)
    }

    return candidateNodes.filter(n => {
      return (
        connectedIds.has(n.id) ||
        n.id === selectedNodeId ||
        comparisonPaths?.some(p => p.nodes.some(pn => pn.id === n.id))
      )
    })
  }, [candidateNodes, activeEdges, selectedNodeId, comparisonPaths])

  const layoutPositions = useMemo(() => {
    return computeLayout(activeNodes, activeEdges)
  }, [activeNodes, activeEdges])

  const pathNodeIds = useMemo(() => {
    const set = new Set<string>()
    if (comparisonPaths) {
      for (const p of comparisonPaths) {
        for (const n of p.nodes) set.add(n.id)
      }
    }
    return set
  }, [comparisonPaths])

  const pathEdgeKeys = useMemo(() => {
    const set = new Set<string>()
    if (comparisonPaths) {
      for (const p of comparisonPaths) {
        for (const e of p.edges) {
          set.add(`${e.source}->${e.target}`)
          set.add(`${e.target}->${e.source}`)
        }
      }
    }
    return set
  }, [comparisonPaths])

  const activeFocusId = selectedNodeId || hoveredNodeId

  const neighboringNodeIds = useMemo(() => {
    if (!activeFocusId) return new Set<string>()
    return new Set(getNeighbors(fullGraph, activeFocusId))
  }, [activeFocusId, fullGraph])

  // React Flow nodes for detailed entity graph
  const rfNodes: Node<CustomNodeData>[] = useMemo(() => {
    return activeNodes.map(node => {
      const pos = layoutPositions[node.id] ?? { x: 400, y: 300 }
      const isPathNode = pathNodeIds.has(node.id)
      const isFocused = activeFocusId === node.id
      const isNeighbor = neighboringNodeIds.has(node.id)

      let isDimmed = false
      if (pathNodeIds.size > 0) {
        isDimmed = !isPathNode
      } else if (activeFocusId) {
        isDimmed = !isFocused && !isNeighbor
      }

      let subLabel: string | undefined
      if (node.type === 'person') {
        const p = data.persons.find(x => x.id === node.id)
        subLabel = p ? p.type : undefined
      } else if (node.type === 'vehicle') {
        const v = data.vehicles.find(x => x.id === node.id)
        subLabel = v ? `${v.color} ${v.model}` : undefined
      } else if (node.type === 'incident') {
        const i = data.incidents.find(x => x.id === node.id)
        subLabel = i ? i.type : undefined
      } else if (node.type === 'evidence') {
        const e = data.evidence.find(x => x.id === node.id)
        subLabel = e ? e.type : undefined
      } else if (node.type === 'location') {
        const l = data.locations.find(x => x.id === node.id)
        subLabel = l ? l.city : undefined
      }

      return {
        id: node.id,
        type: 'investigationNode',
        position: pos,
        data: {
          id: node.id,
          label: node.label,
          entityType: node.type,
          subLabel,
          isDimmed,
          isHighlighted: isFocused || isNeighbor,
          isPathNode,
          onClick: (id: string) => setSelectedNodeId(id),
        },
      }
    })
  }, [activeNodes, layoutPositions, pathNodeIds, activeFocusId, neighboringNodeIds, data])

  // React Flow edges: Step 14 requires showing edge labels ONLY for the selected node's connections
  const rfEdges: Edge[] = useMemo(() => {
    return activeEdges.map((e, idx) => {
      const config = RELATIONSHIP_CONFIGS[e.relationship] || { stroke: '#64748b', strokeWidth: 2 }
      const edgeKeyForward = `${e.source}->${e.target}`
      const edgeKeyReverse = `${e.target}->${e.source}`
      const isPathEdge = pathEdgeKeys.has(edgeKeyForward) || pathEdgeKeys.has(edgeKeyReverse)

      const isConnectedToFocus = activeFocusId
        ? e.source === activeFocusId || e.target === activeFocusId
        : false

      let opacity = 1
      if (pathNodeIds.size > 0) {
        opacity = isPathEdge ? 1 : 0.15
      } else if (activeFocusId) {
        opacity = isConnectedToFocus ? 1 : 0.15
      }

      // Edge labels only shown when selected node is connected to this edge
      const showLabel = selectedNodeId
        ? e.source === selectedNodeId || e.target === selectedNodeId
        : false

      return {
        id: `e-${e.source}-${e.target}-${idx}`,
        source: e.source,
        target: e.target,
        label: showLabel ? e.relationship : undefined,
        animated: isPathEdge,
        style: {
          stroke: isPathEdge ? '#2563eb' : config.stroke,
          strokeWidth: isPathEdge ? 3.5 : isConnectedToFocus ? config.strokeWidth + 1 : config.strokeWidth,
          strokeDasharray: isPathEdge ? undefined : config.strokeDasharray,
          opacity,
        },
        labelStyle: {
          fill: isPathEdge ? '#1e40af' : '#334155',
          fontSize: 13,
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: '#ffffff',
          fillOpacity: 0.95,
        },
        labelBgPadding: [6, 2],
        labelBgBorderRadius: 4,
      }
    })
  }, [activeEdges, pathEdgeKeys, pathNodeIds, activeFocusId, selectedNodeId])

  function toggleType(type: EntityType) {
    setVisibleTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        if (next.size > 1) next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  function handleExpandSelected() {
    if (!selectedNodeId) return
    const neighbors = getNeighbors(fullGraph, selectedNodeId)
    setExpandedNodeIds(prev => {
      const next = new Set(prev)
      for (const n of neighbors) next.add(n)
      return next
    })
  }

  function handleResetView() {
    setExpandedNodeIds(new Set())
    setSelectedNodeId(null)
    setComparisonPaths(undefined)
    setComparisonScore(undefined)
    setComparePersonA('')
    setComparePersonB('')
    setVisibleTypes(new Set<EntityType>(['person', 'incident', 'vehicle', 'evidence', 'location']))
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 })
    }, 50)
  }

  // Auto-fitView on case change
  useEffect(() => {
    const timer = setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 })
    }, 60)
    return () => clearTimeout(timer)
  }, [selectedCase, reactFlowInstance])

  function focusOnNode(nodeId: string) {
    setSelectedNodeId(nodeId)
    const pos = layoutPositions[nodeId]
    if (pos) {
      reactFlowInstance.setCenter(pos.x + 80, pos.y + 20, { zoom: 1.2, duration: 400 })
    }
    setSearchOpen(false)
  }

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return activeNodes.filter(n => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q))
  }, [searchQuery, activeNodes])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as HTMLElement)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleCompare() {
    if (!comparePersonA || !comparePersonB || comparePersonA === comparePersonB) return
    const paths = findAllShortestConnections(data, comparePersonA, comparePersonB)
    const score = calculateConnection(data, comparePersonA, comparePersonB)
    setComparisonPaths(paths)
    setComparisonScore(score)
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 })
    }, 100)
  }

  function handleClearComparison() {
    setComparisonPaths(undefined)
    setComparisonScore(undefined)
    setComparePersonA('')
    setComparePersonB('')
  }

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null
    return fullGraph.nodes.find(n => n.id === selectedNodeId) ?? null
  }, [selectedNodeId, fullGraph])

  const selectedNodeEdges = useMemo(() => {
    if (!selectedNodeId) return []
    return fullGraph.edges.filter(e => e.source === selectedNodeId || e.target === selectedNodeId)
  }, [selectedNodeId, fullGraph])

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        {/* Case picker: single cases only (All Cases removed per Step 14) */}
        <div className="flex items-center gap-2">
          <label className="text-[13px] font-semibold text-slate-600 whitespace-nowrap">Case:</label>
          <select
            value={selectedCase}
            onChange={e => handleCaseChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-base font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
          >
            {data.cases.map(c => (
              <option key={c.id} value={c.id}>
                {c.id} ({c.title})
              </option>
            ))}
          </select>
        </div>

        {/* Entity type toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['person', 'incident', 'vehicle', 'evidence', 'location'] as EntityType[]).map(type => {
            const isVis = visibleTypes.has(type)
            const style = ENTITY_STYLE[type]
            const Icon = style.icon
            const count = baseNodes.filter(n => n.type === type).length

            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] font-medium transition-all ${
                  isVis
                    ? 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                    : 'border-dashed border-slate-300 bg-white text-slate-400 opacity-60 hover:opacity-100'
                }`}
                title={isVis ? `Hide ${style.label}s` : `Show ${style.label}s`}
              >
                <Icon className={`h-3.5 w-3.5 ${isVis ? style.color : 'text-slate-400'}`} />
                <span>{style.label}</span>
                <span className="text-[13px] font-mono text-slate-400">({count})</span>
                {isVis ? <Eye className="h-3 w-3 text-slate-400" /> : <EyeOff className="h-3 w-3 text-slate-400" />}
              </button>
            )
          })}
        </div>

        {/* Find on graph + Reset View */}
        <div className="flex items-center gap-2">
          <div className="relative" ref={searchRef}>
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 focus-within:border-blue-500 focus-within:bg-white">
              <Search className="h-4 w-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Find node on graph…"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setSearchOpen(true)
                }}
                className="w-40 md:w-52 bg-transparent text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {searchOpen && searchResults.length > 0 && (
              <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-50 max-h-60 overflow-y-auto">
                {searchResults.map(result => (
                  <button
                    key={result.id}
                    onClick={() => focusOnNode(result.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                  >
                    <EntityIcon type={result.type} className="h-3.5 w-3.5 shrink-0" />
                    <div className="min-w-0 flex-1 truncate">
                      <p className="text-[13px] font-medium text-slate-800 truncate">{result.label}</p>
                      <p className="text-[13px] text-slate-400 font-mono">{result.id}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleResetView}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title="Reset filters, layout, and zoom"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Canvas + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={selectedNode ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'}>
          <div className="relative h-[650px] w-full rounded-xl border border-slate-200 bg-slate-50/50 shadow-inner overflow-hidden">
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              nodeTypes={entityNodeTypes}
              fitView
              minZoom={0.2}
              maxZoom={2.5}
              onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
              onNodeMouseLeave={() => setHoveredNodeId(null)}
              onPaneClick={() => setSelectedNodeId(null)}
            >
              <Background gap={24} size={1} color="#cbd5e1" />
              <Controls position="top-right" showInteractive={false} />
              <MiniMap
                position="bottom-right"
                nodeStrokeWidth={3}
                nodeColor={n => {
                  const nodeData = n.data as unknown as CustomNodeData
                  return ENTITY_STYLE[nodeData.entityType]?.color || '#94a3b8'
                }}
                className="!bg-white/80 !border-slate-200"
              />
            </ReactFlow>

            {/* Collapsible Legend Button (Step 14: Never covers nodes) */}
            <div className="absolute bottom-4 left-4 z-10 space-y-2">
              {legendOpen && (
                <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-xs text-[13px] text-slate-600 space-y-2 max-w-xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between font-semibold text-slate-800 border-b border-slate-100 pb-1">
                    <span>Relationship Legend</span>
                    <button
                      onClick={() => setLegendOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                      title="Close"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-4 h-0.5 bg-blue-600"></span>
                      <span>owns (solid)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-4 h-0.5 border-t border-dashed border-pink-500"></span>
                      <span>visited (dashed)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-4 h-0.5 border-t border-dotted border-purple-500"></span>
                      <span>witnessed (dotted)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-4 h-1 bg-orange-600"></span>
                      <span>involved-in (thick)</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <span className="inline-block w-4 h-0.5 border-t border-dashed border-slate-500"></span>
                      <span>connected-to (long-dash)</span>
                    </div>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setLegendOpen(!legendOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-[13px] font-semibold text-slate-700 shadow-sm backdrop-blur-xs hover:bg-slate-50 transition-colors"
              >
                <Info className="h-4 w-4 text-blue-600" />
                <span>Legend</span>
              </button>
            </div>
          </div>
        </div>

        {/* Selected Node Side Panel */}
        {selectedNode && (
          <div className="lg:col-span-4 xl:col-span-3">
            <Card className="h-full max-h-[650px] overflow-y-auto space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <EntityIcon type={selectedNode.type} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold text-slate-900" title={selectedNode.label}>
                      {selectedNode.label}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <EntityTypeBadge type={selectedNode.type} />
                      <span className="font-mono text-[13px] text-slate-400">{selectedNode.id}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleExpandSelected}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
                  title="Load neighboring nodes onto the graph"
                >
                  <Plus className="h-3.5 w-3.5 text-blue-600" />
                  <span>Expand connections</span>
                </button>
                <Link
                  to={`/${selectedNode.type === 'person' ? 'persons' : selectedNode.type === 'incident' ? 'incidents' : selectedNode.type === 'vehicle' ? 'vehicles' : selectedNode.type === 'location' ? 'locations' : 'evidence'}/${selectedNode.id}`}
                  className="flex items-center justify-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-[13px] font-medium text-blue-700 hover:bg-blue-100"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Details</span>
                </Link>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 text-[13px] space-y-1.5">
                <p className="font-semibold text-slate-600 mb-1">Entity attributes</p>
                {selectedNode.type === 'person' && (() => {
                  const p = data.persons.find(x => x.id === selectedNode.id)
                  if (!p) return null
                  return (
                    <>
                      <div className="flex justify-between"><span className="text-slate-500">Type:</span> <span className="font-medium capitalize">{p.type}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Phone:</span> <span className="font-mono">{p.phone ?? 'None'}</span></div>
                      {p.knownAliases && p.knownAliases.length > 0 && (
                        <div><span className="text-slate-500">Aliases:</span> <span className="font-medium">{p.knownAliases.join(', ')}</span></div>
                      )}
                      <div><span className="text-slate-500">Related cases:</span> <span className="font-medium">{p.relatedCases.join(', ')}</span></div>
                    </>
                  )
                })()}

                {selectedNode.type === 'vehicle' && (() => {
                  const v = data.vehicles.find(x => x.id === selectedNode.id)
                  if (!v) return null
                  const owner = v.ownerId ? data.persons.find(p => p.id === v.ownerId) : null
                  return (
                    <>
                      <div className="flex justify-between"><span className="text-slate-500">Plate:</span> <span className="font-mono font-bold">{v.registration}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Make/Model:</span> <span className="font-medium">{v.make} {v.model}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Color:</span> <span className="font-medium">{v.color}</span></div>
                      {owner && (
                        <div className="flex justify-between"><span className="text-slate-500">Owner:</span> <span className="font-medium">{owner.fullName}</span></div>
                      )}
                    </>
                  )
                })()}

                {selectedNode.type === 'incident' && (() => {
                  const inc = data.incidents.find(x => x.id === selectedNode.id)
                  if (!inc) return null
                  return (
                    <>
                      <div className="flex justify-between"><span className="text-slate-500">Type:</span> <span className="font-medium capitalize">{inc.type}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Occurred:</span> <span>{formatDateTime(inc.occurredAt)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Status:</span> <span className="capitalize">{inc.status}</span></div>
                    </>
                  )
                })()}

                {selectedNode.type === 'evidence' && (() => {
                  const ev = data.evidence.find(x => x.id === selectedNode.id)
                  if (!ev) return null
                  return (
                    <>
                      <div className="flex justify-between"><span className="text-slate-500">Type:</span> <span className="font-medium capitalize">{ev.type}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Status:</span> <span className="capitalize">{ev.status}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Officer:</span> <span>{getOfficerName(data, ev.collectedBy)}</span></div>
                    </>
                  )
                })()}

                {selectedNode.type === 'location' && (() => {
                  const loc = data.locations.find(x => x.id === selectedNode.id)
                  if (!loc) return null
                  return (
                    <>
                      <div className="flex justify-between"><span className="text-slate-500">City:</span> <span className="font-medium">{loc.city}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Region:</span> <span>{loc.region}</span></div>
                    </>
                  )
                })()}
              </div>

              <div>
                <p className="text-[13px] font-semibold text-slate-700 mb-2">
                  Connected entities ({selectedNodeEdges.length})
                </p>
                <div className="space-y-1.5">
                  {selectedNodeEdges.map((e, idx) => {
                    const targetId = e.source === selectedNode.id ? e.target : e.source
                    const targetNode = fullGraph.nodes.find(n => n.id === targetId)
                    if (!targetNode) return null

                    return (
                      <button
                        key={idx}
                        onClick={() => focusOnNode(targetId)}
                        className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <EntityIcon type={targetNode.type} className="h-4 w-4 shrink-0" />
                          <span className="truncate text-[13px] font-medium text-slate-800">{targetNode.label}</span>
                        </div>
                        <span className="shrink-0 text-[12px] font-mono text-slate-400 capitalize">{e.relationship}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Path Finder & Direct Connection Strength Panel */}
      <Card title="How are these two people connected?">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-[13px] font-medium text-slate-600">Person A</label>
            <select
              value={comparePersonA}
              onChange={e => setComparePersonA(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select individual…</option>
              {data.persons.map(p => (
                <option key={p.id} value={p.id}>{p.fullName} ({p.id} — {p.type})</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-[13px] font-medium text-slate-600">Person B</label>
            <select
              value={comparePersonB}
              onChange={e => setComparePersonB(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select individual…</option>
              {data.persons.map(p => (
                <option key={p.id} value={p.id}>{p.fullName} ({p.id} — {p.type})</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCompare}
            disabled={!comparePersonA || !comparePersonB || comparePersonA === comparePersonB}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>Find connection</span>
          </button>

          {(comparisonPaths !== undefined || comparisonScore !== undefined) && (
            <button
              onClick={handleClearComparison}
              className="rounded-lg border border-slate-200 px-3 py-2 text-[14px] font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear highlight
            </button>
          )}
        </div>

        {comparisonPaths !== undefined && (
          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
            {comparisonPaths.length === 0 ? (
              <p className="text-[14px] font-medium text-slate-600">
                No connection path found in the investigation graph between these two individuals.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-semibold text-slate-800">
                    {comparisonPaths.length === 1
                      ? `Shortest connection path (${comparisonPaths[0].length} step${comparisonPaths[0].length === 1 ? '' : 's'})`
                      : `${comparisonPaths.length} shortest connection paths found (${comparisonPaths[0].length} steps each)`}
                  </p>
                  <span className="text-[13px] text-blue-600 font-medium">Highlighted on graph above</span>
                </div>
                <div className="space-y-2">
                  {comparisonPaths.map((path, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 overflow-x-auto flex items-center gap-2"
                    >
                      {comparisonPaths.length > 1 && (
                        <span className="text-[12px] font-bold text-slate-500 shrink-0">
                          Path {idx + 1}:
                        </span>
                      )}
                      <ConnectionPathView path={path} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {comparisonScore && (
              <div className="space-y-2">
                <p className="text-[14px] font-semibold text-slate-800">Direct connection strength</p>
                <ConnectionScoreCard
                  pair={comparisonScore}
                  personAName={getPersonName(data, comparePersonA)}
                  personBName={getPersonName(data, comparePersonB)}
                />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

// ==========================================
// 4. MAIN PAGE WITH TOP-LEVEL SWITCH
// ==========================================

export default function RelationshipGraphPage() {
  const [searchParams] = useSearchParams()
  const caseParam = searchParams.get('case')

  // Top level switch: Case map (default) / Detailed graph
  const [viewMode, setViewMode] = useState<'caseMap' | 'detailed'>('caseMap')

  useEffect(() => {
    document.title = viewMode === 'caseMap'
      ? 'Case Map · Incident Investigation System'
      : 'Relationship Graph · Incident Investigation System'
  }, [viewMode])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {viewMode === 'caseMap' ? (
          <PageHeader
            title="Case map"
            description="Each circle is a case. A line means two cases share something. A thicker line means a stronger link."
          />
        ) : (
          <PageHeader
            title="Detailed graph"
            description="Detailed entity relationship graph linking people, vehicles, locations, incidents, and evidence."
          />
        )}

        {/* Top-level View Switch: Case map (default) / Detailed graph */}
        <div className="flex items-center rounded-xl border border-slate-300 bg-white p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode('caseMap')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[14px] font-semibold transition-all ${
              viewMode === 'caseMap'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Case map</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('detailed')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[14px] font-semibold transition-all ${
              viewMode === 'detailed'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Network className="h-4 w-4" />
            <span>Detailed graph</span>
          </button>
        </div>
      </div>

      <ReactFlowProvider>
        {viewMode === 'caseMap' ? (
          <CaseMapView initialCaseId={caseParam || undefined} />
        ) : (
          <EntityGraphView />
        )}
      </ReactFlowProvider>
    </div>
  )
}
