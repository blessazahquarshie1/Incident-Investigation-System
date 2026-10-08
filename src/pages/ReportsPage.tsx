import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { buildCaseReport } from '../lib/report'
import { formatDate, formatDateTime, formatTime } from '../lib/dates'
import PageHeader from '../components/PageHeader'
import PriorityBadge from '../components/PriorityBadge'
import StatusBadge from '../components/StatusBadge'
import EntityTypeBadge from '../components/EntityTypeBadge'
import EmptyState from '../components/EmptyState'
import {
  Printer,
  FileText,
  AlertTriangle,
  Users,
  Shield,
  FileSearch,
  Clock,
  Network,
  Activity,
  CheckCircle2,
} from 'lucide-react'

export default function ReportsPage() {
  const data = useInvestigationStore(s => s.data)
  const [selectedCaseId, setSelectedCaseId] = useState('CASE-00123')
  const [printedAt] = useState(() => formatDateTime(new Date().toISOString()))

  const report = useMemo(() => {
    return buildCaseReport(data, selectedCaseId)
  }, [data, selectedCaseId])

  useEffect(() => {
    document.title = report
      ? `Case Report: ${report.caseRecord.id} · Incident Investigation System`
      : 'Reports · Incident Investigation System'
  }, [report])

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Controls — Hidden on Print */}
      <div className="print:hidden space-y-4">
        <PageHeader
          title="Case briefing report"
          description="Consolidated intelligence dossiers compiled from evidence custody records, timeline events, and network connections."
          actions={
            <button
              onClick={handlePrint}
              disabled={!report}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF</span>
            </button>
          }
        />

        {/* Case Selector Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-[13px] font-semibold text-slate-700 whitespace-nowrap">
              Select case:
            </label>
            <select
              value={selectedCaseId}
              onChange={e => setSelectedCaseId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[14px] font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              {data.cases.map(c => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.title} ({c.status})
                </option>
              ))}
            </select>
          </div>

          <div className="text-[13px] text-slate-500 font-mono">
            {report ? `Generated for Case ID: ${report.caseRecord.id}` : ''}
          </div>
        </div>
      </div>

      {!report ? (
        <EmptyState
          title="Case report not available"
          description="Could not compile report dossier for the selected case."
        />
      ) : (
        /* Printable Report Dossier */
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0 space-y-8">
          {/* Official Masthead */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-600 text-[13px] font-bold tracking-widest uppercase mb-1">
                  <Shield className="h-4 w-4 text-blue-700" />
                  <span>Criminal Investigation Department · Intelligence Dossier</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                  {report.caseRecord.title}
                </h1>
                <p className="font-mono text-[14px] font-semibold text-blue-700 mt-1">
                  CASE FILE: {report.caseRecord.id}
                </p>
              </div>

              <div className="text-right text-[13px] text-slate-500 space-y-0.5 shrink-0">
                <p>CONFIDENTIAL INVESTIGATION</p>
                <p>Printed: {printedAt}</p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <PriorityBadge priority={report.caseRecord.priority} />
                  <StatusBadge status={report.caseRecord.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Executive Summary & Case Metadata */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              <FileText className="h-4 w-4 text-slate-600" />
              <span>1. Executive Summary & Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-[13px]">
              <div>
                <span className="text-slate-500 block font-medium">Case Type:</span>
                <span className="font-semibold text-slate-900 capitalize">{report.caseRecord.type}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Lead Investigator:</span>
                <span className="font-semibold text-slate-900">{report.leadInvestigatorName}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Date Opened:</span>
                <span className="font-semibold text-slate-900">{formatDate(report.caseRecord.createdAt)}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Last Modified:</span>
                <span className="font-semibold text-slate-900">{formatDate(report.caseRecord.updatedAt)}</span>
              </div>
            </div>

            <div className="text-[14px] text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-900 block mb-1">Description:</span>
              {report.caseRecord.description}
            </div>
          </section>

          {/* Section 2: Associated Persons */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              <Users className="h-4 w-4 text-slate-600" />
              <span>2. Subject & Associate Roster</span>
            </div>

            {report.peopleGroups.length === 0 ? (
              <p className="text-[13px] text-slate-500 italic">No persons linked to this case file.</p>
            ) : (
              <div className="space-y-4">
                {report.peopleGroups.map(group => (
                  <div key={group.type} className="space-y-1.5">
                    <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">
                      {group.label} ({group.people.length})
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left text-[13px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <tr>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">Role</th>
                            <th className="p-2.5">Phone</th>
                            <th className="p-2.5">Known Aliases</th>
                            <th className="p-2.5">Address</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {group.people.map(p => (
                            <tr key={p.id}>
                              <td className="p-2.5 font-semibold text-slate-900">
                                <Link to={`/persons/${p.id}`} className="hover:text-blue-600 print:text-slate-900">
                                  {p.fullName}
                                </Link>
                                <span className="font-mono text-[13px] text-slate-400 ml-1">({p.id})</span>
                              </td>
                              <td className="p-2.5">
                                <EntityTypeBadge type={p.type} />
                              </td>
                              <td className="p-2.5 font-mono text-slate-600">{p.phone || '—'}</td>
                              <td className="p-2.5 text-slate-600">{p.knownAliases?.join(', ') || '—'}</td>
                              <td className="p-2.5 text-slate-600">{p.address || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 3: Seized Evidence & Custody Status */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              <FileSearch className="h-4 w-4 text-slate-600" />
              <span>3. Evidence Inventory & Chain of Custody</span>
            </div>

            {report.evidenceItems.length === 0 ? (
              <p className="text-[13px] text-slate-500 italic">No evidence recorded for this case.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Custody Status</th>
                      <th className="p-2.5">Current Custodian</th>
                      <th className="p-2.5">Collected Date</th>
                      <th className="p-2.5">Collected By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {report.evidenceItems.map(ev => (
                      <tr key={ev.id}>
                        <td className="p-2.5">
                          <Link to={`/evidence/${ev.id}`} className="font-semibold text-slate-900 hover:text-blue-600 print:text-slate-900">
                            {ev.title}
                          </Link>
                          <div className="text-[13px] font-mono text-slate-400">{ev.id}</div>
                        </td>
                        <td className="p-2.5 capitalize text-slate-700">{ev.type}</td>
                        <td className="p-2.5">
                          <StatusBadge status={ev.status} />
                        </td>
                        <td className="p-2.5 font-medium text-slate-800">
                          {ev.holderName}
                          <span className="text-[13px] font-mono text-slate-400 ml-1">({ev.holderId})</span>
                        </td>
                        <td className="p-2.5 text-slate-600">{formatDate(ev.collectedAt)}</td>
                        <td className="p-2.5 text-slate-600">{ev.collectedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Section 4: Chronological Event Timeline */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              <Clock className="h-4 w-4 text-slate-600" />
              <span>4. Chronological Event Sequence ({report.timelineEvents.length} events)</span>
            </div>

            {report.timelineEvents.length === 0 ? (
              <p className="text-[13px] text-slate-500 italic">No timeline events recorded.</p>
            ) : (
              <div className="space-y-1.5 max-h-96 overflow-y-auto print:max-h-none border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                {report.timelineEvents.map(evt => (
                  <div key={evt.id} className="flex items-baseline gap-3 text-[13px] py-1 border-b border-slate-100 last:border-b-0">
                    <span className="font-mono text-[13px] font-bold text-slate-600 shrink-0 w-28">
                      {formatDate(evt.timestamp)}, {formatTime(evt.timestamp)}
                    </span>
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[13px] font-medium text-slate-700 uppercase shrink-0">
                      {evt.source}
                    </span>
                    <span className="font-semibold text-slate-900 shrink-0">{evt.title}:</span>
                    <span className="text-slate-700 truncate">{evt.description}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 5: Timeline Conflict Audit */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>5. Timeline Conflict & Alibi Audit</span>
            </div>

            {report.conflicts.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-[13px] text-green-800 border border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <span>No contradictory timeline presence claims detected for this case.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-200 text-[13px] text-amber-900 font-semibold">
                  ⚠ {report.conflicts.length} timeline contradiction{report.conflicts.length === 1 ? '' : 's'} identified:
                </div>
                {report.conflicts.map(c => (
                  <div key={c.id} className="rounded-lg border border-amber-200 bg-white p-3 text-[13px] space-y-1">
                    <p className="font-semibold text-amber-900">{c.explanation}</p>
                    <div className="flex gap-4 text-[13px] text-slate-500 font-mono pt-1">
                      <span>Gap: {c.gapMinutes} min</span>
                      <span>Required travel time: {c.requiredMinutes} min</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 6: Network Link Analysis (Top Connections) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              <Network className="h-4 w-4 text-slate-600" />
              <span>6. Strongest Network Associations (Top 5 Pairs)</span>
            </div>

            {report.topConnections.length === 0 ? (
              <p className="text-[13px] text-slate-500 italic">No shared associative connections identified among subjects.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.topConnections.map(({ pair, personAName, personBName, breakdown }) => (
                  <div key={`${pair.personAId}-${pair.personBId}`} className="rounded-lg border border-slate-200 p-3 bg-white text-[13px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">
                        {personAName} ↔ {personBName}
                      </span>
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[13px]">
                        Score: {pair.score} ({pair.level})
                      </span>
                    </div>
                    <ul className="text-[13px] font-mono text-slate-600 space-y-0.5">
                      {breakdown.map((line, idx) => (
                        <li key={idx}>• {line}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 7: Audit Activity Summary */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              <Activity className="h-4 w-4 text-slate-600" />
              <span>7. Recent Administrative Audit Log (Latest 10 Entries)</span>
            </div>

            {report.recentActivity.length === 0 ? (
              <p className="text-[13px] text-slate-500 italic">No activity entries logged for this case.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2">Timestamp</th>
                      <th className="p-2">Action</th>
                      <th className="p-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {report.recentActivity.map(act => (
                      <tr key={act.id}>
                        <td className="p-2 font-mono text-[13px] text-slate-500 whitespace-nowrap">
                          {formatDateTime(act.timestamp)}
                        </td>
                        <td className="p-2">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px] font-medium text-slate-700 uppercase">
                            {act.action}
                          </span>
                        </td>
                        <td className="p-2 font-medium text-slate-900">{act.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
