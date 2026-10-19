import type { InvestigationData } from '../types'
import type { Case } from '../types/case'
import type { ActivityLogEntry } from '../types/activityLogEntry'

export interface DashboardStats {
  openCases: number
  activeInvestigations: number
  criticalCases: number
  suspects: number
  personsOfInterest: number
  evidenceItems: number
  unresolvedIncidents: number
  casesByStatus: Record<string, number>
  casesByType: Record<string, number>
  priorityCases: Case[]
  recentActivity: ActivityLogEntry[]
}

export function getDashboardStats(data: InvestigationData): DashboardStats {
  const casesByStatus: Record<string, number> = {}
  const casesByType: Record<string, number> = {}

  let openCases = 0
  let activeInvestigations = 0
  let criticalCases = 0

  for (const c of data.cases) {
    if (c.status === 'open') openCases++
    if (c.status === 'investigating') activeInvestigations++
    if (c.priority === 'critical' && c.status !== 'closed') criticalCases++

    casesByStatus[c.status] = (casesByStatus[c.status] || 0) + 1
    casesByType[c.type] = (casesByType[c.type] || 0) + 1
  }

  let suspects = 0
  let personsOfInterest = 0
  for (const p of data.persons) {
    if (p.type === 'suspect') suspects++
    if (p.type === 'person-of-interest') personsOfInterest++
  }

  const evidenceItems = data.evidence.length
  const unresolvedIncidents = data.incidents.filter(i => i.status === 'unresolved').length

  const priorityCases = [...data.cases]
    .filter(c => (c.priority === 'critical' || c.priority === 'high') && c.status !== 'closed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)

  const recentActivity = [...data.activityLog]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8)

  return {
    openCases,
    activeInvestigations,
    criticalCases,
    suspects,
    personsOfInterest,
    evidenceItems,
    unresolvedIncidents,
    casesByStatus,
    casesByType,
    priorityCases,
    recentActivity
  }
}
