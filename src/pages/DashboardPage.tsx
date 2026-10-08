import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { getDashboardStats } from '../lib/dashboard'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import PriorityBadge from '../components/PriorityBadge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { formatDateTime } from '../lib/dates'
import { getOfficerName } from '../lib/lookup'
import { Briefcase, AlertTriangle, Users, FileSearch, Search } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  open: '#0d9488', // teal
  investigating: '#2563eb', // blue
  pending: '#d97706', // amber
  closed: '#94a3b8', // grey
}

const TYPE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6']

export default function DashboardPage() {
  const data = useInvestigationStore(s => s.data)
  const stats = useMemo(() => getDashboardStats(data), [data])

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
          <div className="space-y-4">
            {stats.recentActivity.map(act => (
              <div key={act.id} className="flex gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                <div>
                  <p className="text-[13px] text-slate-800">{act.description}</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {formatDateTime(act.timestamp)} • {getOfficerName(data, act.officerId)}
                  </p>
                </div>
              </div>
            ))}
            {stats.recentActivity.length === 0 && (
              <p className="text-[13px] text-slate-500 py-4 text-center">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
