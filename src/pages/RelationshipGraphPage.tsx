import { useMemo, useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { buildGraph, getNeighbors, getNodeType } from '../lib/graph'
import {
  getCasePeople,
  getCaseEvidence,
  getCaseIncidents,
  getCaseVehicles,
  getCaseLocations,
} from '../lib/caseScope'
import { computeLayout } from '../lib/graphLayout'
import { findShortestConnection, type ConnectionPath } from '../lib/pathfinding'
import { calculateConnection, type PairConnection } from '../lib/connections'
import { ENTITY_STYLE } from '../lib/entityStyle'
import { getPersonName, getLocationName, getOfficerName } from '../lib/lookup'
import { formatDate, formatDateTime } from '../lib/dates'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import EntityIcon from '../components/EntityIcon'
import EntityTypeBadge from '../components/EntityTypeBadge'
import ConnectionPathView from '../components/ConnectionPathView'
import ConnectionScoreCard from '../components/ConnectionScoreCard'
import type { EntityType } from '../types'
import { Search, RotateCcw, Plus, X, Users, Compass, Eye, EyeOff } from 'lucide-react'

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

const nodeTypes = {
  investigationNode: InvestigationCustomNode,
}

const RELATIONSHIP_CONFIGS: Record<string, { stroke: string; strokeWidth: number; strokeDasharray?: string }> = {
  'owns': { stroke: '#2563eb', strokeWidth: 2 },
  'visited': { stroke: '#ec4899', strokeWidth: 2, strokeDasharray: '5,5' },
  'witnessed': { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '2,3' },
  'involved-in': { stroke: '#ea580c', strokeWidth: 3 },
  'connected-to': { stroke: '#64748b', strokeWidth: 2, strokeDasharray: '8,4' },
}

function GraphViewInner() {
  const data = useInvestigationStore(s => s.data)
  const reactFlowInstance = useReactFlow()

  // State
  const [selectedCase, setSelectedCase] = useState<string>('CASE-00123')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set())
  const [visibleTypes, setVisibleTypes] = useState<Set<EntityType>>(
    new Set<EntityType>(['person', 'incident', 'vehicle', 'evidence', 'location'])
  )

  // Search / Find on graph
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Compare two people tool
  const [comparePersonA, setComparePersonA] = useState<string>('')
  const [comparePersonB, setComparePersonB] = useState<string>('')
  const [comparisonPath, setComparisonPath] = useState<ConnectionPath | null | undefined>(undefined)
  const [comparisonScore, setComparisonScore] = useState<PairConnection | null | undefined>(undefined)

  const fullGraph = useMemo(() => buildGraph(data), [data])

  // Reset expanded nodes and path when case changes
  function handleCaseChange(newCase: string) {
    setSelectedCase(newCase)
    setExpandedNodeIds(new Set())
    setSelectedNodeId(null)
    setComparisonPath(undefined)
    setComparisonScore(undefined)
  }

  // Base nodes for the chosen case
  const baseNodes = useMemo(() => {
    if (selectedCase === 'all') {
      return fullGraph.nodes
    }

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

  // Nodes to display (base + expanded + comparison path nodes)
  const activeNodes = useMemo(() => {
    const includedIds = new Set(baseNodes.map(n => n.id))

    // Include expanded nodes
    for (const id of expandedNodeIds) {
      includedIds.add(id)
    }

    // Include comparison path nodes if active
    if (comparisonPath && comparisonPath.nodes) {
      for (const node of comparisonPath.nodes) {
        includedIds.add(node.id)
      }
    }

    return fullGraph.nodes.filter(n => {
      if (!includedIds.has(n.id)) return false
      // If node is in comparison path, always keep visible
      if (comparisonPath?.nodes.some(pn => pn.id === n.id)) return true
      return visibleTypes.has(n.type)
    })
  }, [baseNodes, expandedNodeIds, comparisonPath, fullGraph, visibleTypes])

  // Edges among active nodes
  const activeEdges = useMemo(() => {
    const activeNodeIds = new Set(activeNodes.map(n => n.id))
    return fullGraph.edges.filter(
      e => activeNodeIds.has(e.source) && activeNodeIds.has(e.target)
    )
  }, [fullGraph.edges, activeNodes])

  // Synchronous force layout
  const layoutPositions = useMemo(() => {
    return computeLayout(activeNodes, activeEdges)
  }, [activeNodes, activeEdges])

  // Active path highlight sets
  const pathNodeIds = useMemo(() => {
    return new Set(comparisonPath?.nodes.map(n => n.id) ?? [])
  }, [comparisonPath])

  const pathEdgeKeys = useMemo(() => {
    const set = new Set<string>()
    if (comparisonPath) {
      for (const e of comparisonPath.edges) {
        set.add(`${e.source}->${e.target}`)
        set.add(`${e.target}->${e.source}`)
      }
    }
    return set
  }, [comparisonPath])

  // Focus node highlighting (selected or hovered)
  const activeFocusId = selectedNodeId || hoveredNodeId
  const directNeighborIds = useMemo(() => {
    if (!activeFocusId) return new Set<string>()
    return new Set(getNeighbors(fullGraph, activeFocusId))
  }, [activeFocusId, fullGraph])

  // React Flow Nodes
  const rfNodes: Node<CustomNodeData>[] = useMemo(() => {
    return activeNodes.map(node => {
      const pos = layoutPositions[node.id] ?? { x: 400, y: 300 }
      const isPath = pathNodeIds.has(node.id)
      const isFocus = activeFocusId === node.id
      const isNeighbor = activeFocusId ? directNeighborIds.has(node.id) : false

      let isDimmed = false
      if (pathNodeIds.size > 0) {
        isDimmed = !isPath
      } else if (activeFocusId) {
        isDimmed = !isFocus && !isNeighbor
      }

      // Sub-label for person type, vehicle info, etc.
      let subLabel: string | undefined
      if (node.type === 'person') {
        const p = data.persons.find(x => x.id === node.id)
        if (p) subLabel = p.type
      } else if (node.type === 'vehicle') {
        const v = data.vehicles.find(x => x.id === node.id)
        if (v) subLabel = `${v.color} ${v.make}`
      } else if (node.type === 'incident') {
        const inc = data.incidents.find(x => x.id === node.id)
        if (inc) subLabel = inc.status
      } else if (node.type === 'evidence') {
        const ev = data.evidence.find(x => x.id === node.id)
        if (ev) subLabel = ev.status
      } else if (node.type === 'location') {
        const loc = data.locations.find(x => x.id === node.id)
        if (loc) subLabel = loc.city
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
          isHighlighted: isFocus || isNeighbor,
          isPathNode: isPath,
          onClick: (id: string) => setSelectedNodeId(id),
        },
      }
    })
  }, [activeNodes, layoutPositions, pathNodeIds, activeFocusId, directNeighborIds, data])

  // React Flow Edges
  const rfEdges: Edge[] = useMemo(() => {
    return activeEdges.map((e, idx) => {
      const config = RELATIONSHIP_CONFIGS[e.relationship] ?? { stroke: '#94a3b8', strokeWidth: 1.5 }
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

      return {
        id: `e-${e.source}-${e.target}-${idx}`,
        source: e.source,
        target: e.target,
        label: e.relationship,
        animated: isPathEdge,
        style: {
          stroke: isPathEdge ? '#2563eb' : config.stroke,
          strokeWidth: isPathEdge ? 3.5 : isConnectedToFocus ? config.strokeWidth + 1 : config.strokeWidth,
          strokeDasharray: isPathEdge ? undefined : config.strokeDasharray,
          opacity,
        },
        labelStyle: {
          fill: isPathEdge ? '#1e40af' : '#475569',
          fontSize: 12,
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
  }, [activeEdges, pathEdgeKeys, pathNodeIds, activeFocusId])

  // Helper: toggle entity type
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

  // Expand connections for selected node
  function handleExpandSelected() {
    if (!selectedNodeId) return
    const neighbors = getNeighbors(fullGraph, selectedNodeId)
    setExpandedNodeIds(prev => {
      const next = new Set(prev)
      for (const n of neighbors) next.add(n)
      return next
    })
  }

  // Reset view to original case view
  function handleResetView() {
    setExpandedNodeIds(new Set())
    setSelectedNodeId(null)
    setComparisonPath(undefined)
    setComparisonScore(undefined)
    setComparePersonA('')
    setComparePersonB('')
    setVisibleTypes(new Set<EntityType>(['person', 'incident', 'vehicle', 'evidence', 'location']))
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 })
    }, 50)
  }

  // Center on node
  function focusOnNode(nodeId: string) {
    setSelectedNodeId(nodeId)
    const pos = layoutPositions[nodeId]
    if (pos) {
      reactFlowInstance.setCenter(pos.x + 80, pos.y + 20, { zoom: 1.2, duration: 400 })
    }
    setSearchQuery('')
    setSearchOpen(false)
  }

  // Compare two people runner
  function handleCompare() {
    if (!comparePersonA || !comparePersonB) return
    const path = findShortestConnection(data, comparePersonA, comparePersonB)
    const score = calculateConnection(data, comparePersonA, comparePersonB)
    setComparisonPath(path)
    setComparisonScore(score)

    // Ensure all path nodes are expanded so they are visible
    if (path) {
      setExpandedNodeIds(prev => {
        const next = new Set(prev)
        for (const n of path.nodes) next.add(n.id)
        return next
      })
    }
  }

  function handleClearComparison() {
    setComparisonPath(undefined)
    setComparisonScore(undefined)
    setComparePersonA('')
    setComparePersonB('')
  }

  // Matching nodes for search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase().trim()
    return activeNodes.filter(n => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)).slice(0, 8)
  }, [searchQuery, activeNodes])

  // Selected node entity details
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null
    return fullGraph.nodes.find(n => n.id === selectedNodeId) ?? null
  }, [selectedNodeId, fullGraph])

  const selectedNodeNeighbors = useMemo(() => {
    if (!selectedNodeId) return []
    const nIds = getNeighbors(fullGraph, selectedNodeId)
    return nIds.map(nid => {
      const node = fullGraph.nodes.find(n => n.id === nid)
      const edge = fullGraph.edges.find(
        e => (e.source === selectedNodeId && e.target === nid) || (e.source === nid && e.target === selectedNodeId)
      )
      return {
        id: nid,
        label: node?.label ?? nid,
        type: node?.type ?? getNodeType(nid) ?? 'person',
        relationship: edge?.relationship ?? 'connected-to',
      }
    })
  }, [selectedNodeId, fullGraph])

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        {/* Case picker */}
        <div className="flex items-center gap-2">
          <label className="text-[13px] font-semibold text-slate-600 whitespace-nowrap">Case:</label>
          <select
            value={selectedCase}
            onChange={e => handleCaseChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-base font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
          >
            <option value="CASE-00123">CASE-00123 (Armed Robbery)</option>
            <option value="all">All Cases (Entire Network)</option>
            {data.cases.filter(c => c.id !== 'CASE-00123').map(c => (
              <option key={c.id} value={c.id}>{c.id} ({c.title})</option>
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
          {/* Find on graph input */}
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
                {searchResults.map(result => {
                  return (
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
                  )
                })}
              </div>
            )}
          </div>

          <button
            onClick={handleResetView}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            title="Reset to default case view"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset view</span>
          </button>
        </div>
      </div>

      {/* Main Graph Grid with Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* React Flow Canvas */}
        <div className={`${selectedNode ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'} transition-all duration-200`}>
          <div className="relative h-[650px] w-full rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm">
            {activeNodes.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  title="No entities to display"
                  description="The selected case or filters have no linkable nodes to render."
                  action={
                    <button onClick={handleResetView} className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] text-white">
                      Reset filters
                    </button>
                  }
                />
              </div>
            ) : (
              <ReactFlow
                nodes={rfNodes}
                edges={rfEdges}
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
                onNodeMouseLeave={() => setHoveredNodeId(null)}
                onPaneClick={() => setSelectedNodeId(null)}
                fitView
                fitViewOptions={{ padding: 0.15 }}
                minZoom={0.2}
                maxZoom={2.5}
              >
                <Background color="#cbd5e1" gap={20} size={1} />
                <Controls className="!bg-white !border-slate-200 !shadow-sm !rounded-lg" />
                <MiniMap
                  className="!border-slate-200 !rounded-lg !bg-white/90"
                  nodeColor={n => {
                    const nodeType = (n.data as unknown as CustomNodeData)?.entityType
                    if (nodeType === 'person') return '#8b5cf6'
                    if (nodeType === 'vehicle') return '#3b82f6'
                    if (nodeType === 'incident') return '#f97316'
                    if (nodeType === 'evidence') return '#10b981'
                    if (nodeType === 'location') return '#f43f5e'
                    return '#94a3b8'
                  }}
                  zoomable
                  pannable
                />
              </ReactFlow>
            )}

            {/* Bottom Legend Overlay */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-2.5 shadow-sm z-10 text-[13px] space-y-2 pointer-events-auto max-w-[340px]">
              <div>
                <p className="font-semibold text-slate-700 mb-1">Entity types</p>
                <div className="flex flex-wrap gap-2">
                  {(['person', 'incident', 'vehicle', 'evidence', 'location'] as EntityType[]).map(type => (
                    <div key={type} className="flex items-center gap-1 text-slate-600">
                      <EntityIcon type={type} className="h-3 w-3" />
                      <span className="capitalize">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-1.5">
                <p className="font-semibold text-slate-700 mb-1">Relationships</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-600">
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
            </div>
          </div>
        </div>

        {/* Selected Node Side Panel */}
        {selectedNode && (
          <div className="lg:col-span-4 xl:col-span-3">
            <Card className="h-full max-h-[650px] overflow-y-auto space-y-4">
              {/* Header */}
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

              {/* Actions: Expand Connections & View Details */}
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

              {/* Entity Specific Details */}
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
                      <div className="flex justify-between"><span className="text-slate-500">Status:</span> <span className="font-medium capitalize">{inc.status}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Type:</span> <span className="font-medium capitalize">{inc.type}</span></div>
                      <div><span className="text-slate-500">Occurred:</span> <span className="font-medium">{formatDateTime(inc.occurredAt)}</span></div>
                      <div><span className="text-slate-500">Location:</span> <span className="font-medium">{getLocationName(data, inc.locationId)}</span></div>
                    </>
                  )
                })()}

                {selectedNode.type === 'evidence' && (() => {
                  const ev = data.evidence.find(x => x.id === selectedNode.id)
                  if (!ev) return null
                  return (
                    <>
                      <div className="flex justify-between"><span className="text-slate-500">Status:</span> <span className="font-medium capitalize">{ev.status}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Type:</span> <span className="font-medium capitalize">{ev.type}</span></div>
                      <div><span className="text-slate-500">Collected:</span> <span className="font-medium">{formatDate(ev.collectedAt)} by {getOfficerName(data, ev.collectedBy)}</span></div>
                    </>
                  )
                })()}

                {selectedNode.type === 'location' && (() => {
                  const loc = data.locations.find(x => x.id === selectedNode.id)
                  if (!loc) return null
                  return (
                    <>
                      <div className="flex justify-between"><span className="text-slate-500">City:</span> <span className="font-medium">{loc.city}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Region:</span> <span className="font-medium">{loc.region}</span></div>
                    </>
                  )
                })()}
              </div>

              {/* Connected Neighbors */}
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-slate-700">
                  Direct connections ({selectedNodeNeighbors.length})
                </p>
                {selectedNodeNeighbors.length === 0 ? (
                  <p className="text-[13px] text-slate-400">No direct relationships recorded.</p>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {selectedNodeNeighbors.map(nb => (
                      <button
                        key={nb.id}
                        onClick={() => focusOnNode(nb.id)}
                        className="flex w-full items-center justify-between rounded-lg border border-slate-100 bg-white p-2 text-left hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <EntityIcon type={nb.type} className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate text-[13px] font-medium text-slate-800">{nb.label}</span>
                        </div>
                        <span className="shrink-0 text-[13px] font-mono italic text-slate-500">{nb.relationship}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Analysis Tool: Compare Two People */}
      <Card title="Analysis tool: Compare two people">
        <p className="text-[14px] text-slate-600 mb-4">
          Select any two individuals to discover the shortest investigative path between them (via Breadth-First Search) and calculate their shared footprint connection score.
        </p>

        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="min-w-[220px]">
            <label className="block text-[13px] font-medium text-slate-700 mb-1">Person A</label>
            <select
              value={comparePersonA}
              onChange={e => setComparePersonA(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select individual…</option>
              {data.persons.map(p => (
                <option key={p.id} value={p.id}>{p.fullName} ({p.id} — {p.type})</option>
              ))}
            </select>
          </div>

          <div className="min-w-[220px]">
            <label className="block text-[13px] font-medium text-slate-700 mb-1">Person B</label>
            <select
              value={comparePersonB}
              onChange={e => setComparePersonB(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] focus:border-blue-500 focus:outline-none"
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

          {(comparisonPath !== undefined || comparisonScore !== undefined) && (
            <button
              onClick={handleClearComparison}
              className="rounded-lg border border-slate-200 px-3 py-2 text-[14px] font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear highlight
            </button>
          )}
        </div>

        {/* Results */}
        {comparisonPath !== undefined && (
          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
            {comparisonPath === null ? (
              <p className="text-[14px] font-medium text-slate-600">
                No connection path found in the investigation graph between these two individuals.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-semibold text-slate-800">
                    Shortest connection path ({comparisonPath.length} step{comparisonPath.length === 1 ? '' : 's'})
                  </p>
                  <span className="text-[13px] text-blue-600 font-medium">Highlighted on graph above</span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 overflow-x-auto">
                  <ConnectionPathView path={comparisonPath} />
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

export default function RelationshipGraphPage() {
  useEffect(() => {
    document.title = 'Relationship Graph · Incident Investigation System'
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relationship graph"
        description="Interactive investigation network linking persons of interest, evidence, vehicles, locations, and incidents."
      />
      <ReactFlowProvider>
        <GraphViewInner />
      </ReactFlowProvider>
    </div>
  )
}
