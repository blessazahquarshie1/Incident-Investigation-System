import { useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { getDashboardStats } from '../lib/dashboard'
import { findAllCaseLinks, type ComparisonLevel } from '../lib/caseComparison'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import PriorityBadge from '../components/PriorityBadge'
import ActivityFeed from '../components/ActivityFeed'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { getOfficerName } from '../lib/lookup'
import { Briefcase, AlertTriangle, Users, FileSearch, Search, GitCompare, ArrowRight } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  open: '#0d9488', // teal
  investigating: '#2563eb', // blue
  pending: '#d97706', // amber
  closed: '#94a3b8', // grey
}

const TYPE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6']

function ComparisonBadge({ level }: { level: ComparisonLevel }) {
  const colors: Record<ComparisonLevel, string> = {
    'WEAK': 'bg-slate-100 text-slate-700 border-slate-200',
    'MODERATE': 'bg-blue-100 text-blue-800 border-blue-200',
    'STRONG': 'bg-orange-100 text-orange-800 border-orange-200',
    'VERY STRONG': 'bg-red-100 text-red-800 border-red-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[13px] font-semibold ${colors[level]}`}>
      {level}
    </span>
  )
}

function CurrentPastBadge({ isPast }: { isPast: boolean }) {
  return isPast ? (
    <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[13px] font-medium text-slate-600">
      Past
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[13px] font-medium text-emerald-800">
      Current
    </span>
  )
}

export default function DashboardPage() {
  useEffect(() => {
    document.title = 'Dashboard · Incident Investigation System'
  }, [])

  const data = useInvestigationStore(s => s.data)
  const stats = useMemo(() => getDashboardStats(data), [data])

  // Step 13: Top 5 strongest case links
  const topCaseLinks = useMemo(() => {
    return findAllCaseLinks(data, 4).slice(0, 5)
  }, [data])

  const statusData = Object.entries(stats.casesByStatus).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    originalName: name
  }))

  const typeData = Object.entries(stats.casesByType).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }))

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Investigation overview and key metrics." 
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open cases" value={stats.openCases} href="/cases?status=open" icon={<Briefcase size={20} />} />
        <StatCard label="Active investigations" value={stats.activeInvestigations} href="/cases?status=investigating" icon={<Search size={20} />} />
        <StatCard label="Critical cases" value={stats.criticalCases} href="/cases?priority=critical" icon={<AlertTriangle size={20} />} />
        <StatCard label="Suspects" value={stats.suspects} href="/persons?type=suspect" icon={<Users size={20} />} />
        <StatCard label="Persons of interest" value={stats.personsOfInterest} href="/persons?type=person-of-interest" icon={<Users size={20} />} />
        <StatCard label="Evidence items" value={stats.evidenceItems} href="/evidence" icon={<FileSearch size={20} />} />
        <StatCard label="Unresolved incidents" value={stats.unresolvedIncidents} href="/incidents?status=unresolved" icon={<AlertTriangle size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Cases by status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.originalName] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Cases by type</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {typeData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* STEP 13: STRONGEST CASE LINKS */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-blue-600" />
              <span>Strongest case links</span>
            </h2>
            <p className="text-[13px] text-slate-500">
              Highest scoring cross-case relationships detected across shared subjects, vehicles, phones, and evidence.
            </p>
          </div>
          <Link
            to="/graph"
            className="text-[13px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>View case network</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {topCaseLinks.length === 0 ? (
          <p className="text-[14px] text-slate-500 py-3 text-center">No strong case links detected.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {topCaseLinks.map((link, idx) => {
              const caseA = data.cases.find(c => c.id === link.caseAId)
              const caseB = data.cases.find(c => c.id === link.caseBId)
              const isPastA = caseA?.status === 'closed'
              const isPastB = caseB?.status === 'closed'

              return (
                <div
                  key={idx}
                  className="flex flex-wrap items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  {/* Case A */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/cases/${link.caseAId}`}
                        className="font-mono text-[14px] font-bold text-blue-600 hover:underline"
                      >
                        {link.caseAId}
                      </Link>
                      <CurrentPastBadge isPast={isPastA} />
                    </div>
                    <p className="text-[13px] text-slate-700 font-medium truncate max-w-[240px]">
                      {caseA?.title}
                    </p>
                  </div>

                  {/* Score & Badges */}
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[18px] font-extrabold text-slate-900">{link.score}</span>
                      <ComparisonBadge level={link.level} />
                    </div>
                  </div>

                  {/* Case B */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/cases/${link.caseBId}`}
                        className="font-mono text-[14px] font-bold text-blue-600 hover:underline"
                      >
                        {link.caseBId}
                      </Link>
                      <CurrentPastBadge isPast={isPastB} />
                    </div>
                    <p className="text-[13px] text-slate-700 font-medium truncate max-w-[240px]">
                      {caseB?.title}
                    </p>
                  </div>

                  {/* Compare Action */}
                  <div className="shrink-0">
                    <Link
                      to={`/cases/${link.caseAId}/compare/${link.caseBId}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-[13px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <GitCompare className="h-3.5 w-3.5" />
                      <span>Compare</span>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Urgent cases</h2>
          <div className="space-y-3">
            {stats.priorityCases.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <Link to={`/cases/${c.id}`} className="text-[15px] font-medium text-blue-600 hover:underline">
                    {c.id}
                  </Link>
                  <p className="text-[13px] text-slate-600 truncate max-w-[200px] sm:max-w-[300px]">{c.title}</p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className="hidden sm:inline text-[13px] text-slate-500">
                    {getOfficerName(data, c.leadInvestigator)}
                  </span>
                  <PriorityBadge priority={c.priority} />
                </div>
              </div>
            ))}
            {stats.priorityCases.length === 0 && (
              <p className="text-[13px] text-slate-500 py-4 text-center">No urgent cases found.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Recent activity</h2>
          <ActivityFeed entries={stats.recentActivity} showCaseLink={true} />
        </div>
      </div>
    </div>
  )
}
