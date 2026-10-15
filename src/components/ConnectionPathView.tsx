// Horizontal chain of node chips with entity icons and relationship labels
import React from 'react'
import { Link } from 'react-router-dom'
import type { ConnectionPath } from '../lib/pathfinding'
import type { EntityType } from '../types'
import { getNodeType } from '../lib/graph'
import EntityIcon from './EntityIcon'
import { ArrowRight } from 'lucide-react'

interface Props { path: ConnectionPath }

function getEntityUrl(id: string, type: EntityType | null): string | null {
  if (!type) return null
  if (type === 'person') return `/persons/${id}`
  if (type === 'vehicle') return `/vehicles/${id}`
  if (type === 'location') return `/locations/${id}`
  if (type === 'incident') return `/incidents/${id}`
  if (type === 'evidence') return `/evidence/${id}`
  return null
}

export default function ConnectionPathView({ path }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {path.nodes.map((node, i) => {
        const type = getNodeType(node.id)
        const edge = path.edges[i - 1] // edge connecting previous node to this one
        const url = getEntityUrl(node.id, type)
        return (
          <React.Fragment key={node.id}>
            {i > 0 && edge && (
              <div className="flex items-center gap-1 text-[13px] text-slate-400">
                <ArrowRight className="h-3.5 w-3.5" />
                <span className="italic">{edge.relationship}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            )}
            {url ? (
              <Link
                to={url}
                title={`View ${node.label}`}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[13px] font-medium text-slate-800 hover:border-blue-400 hover:text-blue-600 hover:shadow-xs transition-all"
              >
                {type && <EntityIcon type={type as EntityType} className="h-3.5 w-3.5 shrink-0" />}
                <span className="max-w-[140px] truncate">{node.label}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[13px] font-medium text-slate-800">
                {type && <EntityIcon type={type as EntityType} className="h-3.5 w-3.5 shrink-0" />}
                <span className="max-w-[140px] truncate">{node.label}</span>
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
