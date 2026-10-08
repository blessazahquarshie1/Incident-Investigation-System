import React, { useMemo, useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { filterCases } from '../lib/filters'
import PageHeader from '../components/PageHeader'
import FilterBar from '../components/FilterBar'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable'
import PriorityBadge from '../components/PriorityBadge'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { formatDate } from '../lib/dates'
import { getOfficerName } from '../lib/lookup'
import type { Case } from '../types'

export default function CasesPage() {
  useEffect(() => {
    document.title = 'Cases · Incident Investigation System'
  }, [])

  const data = useInvestigationStore(s => s.data)
  const createCase = useInvestigationStore(s => s.createCase)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const text = params.get('text') ?? ''
  const type = params.get('type') ?? ''
  const priority = params.get('priority') ?? ''
  const status = params.get('status') ?? ''
  
  const filtered = useMemo(() => filterCases(data.cases, { text, type, priority, status }), [data, text, type, priority, status])
  
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }
  
  function clearFilters() {
    setParams({}, { replace: true })
  }
  
  const columns: Column<Case>[] = [
    { key: 'id', header: 'ID', render: r => <Link to={`/cases/${r.id}`} className="text-blue-600 hover:underline">{r.id}</Link>, sortable: true, getValue: r => r.id },
    { key: 'title', header: 'Title', render: r => <Link to={`/cases/${r.id}`} className="text-blue-600 hover:underline">{r.title}</Link>, sortable: true, getValue: r => r.title },
    { key: 'type', header: 'Type', render: r => r.type, sortable: true, getValue: r => r.type },
    { key: 'priority', header: 'Priority', render: r => <PriorityBadge priority={r.priority} />, sortable: true, getValue: r => r.priority },
    { key: 'status', header: 'Status', render: r => <StatusBadge status={r.status} />, sortable: true, getValue: r => r.status },
    { key: 'lead', header: 'Lead Investigator', render: r => getOfficerName(data, r.leadInvestigator), sortable: true, getValue: r => getOfficerName(data, r.leadInvestigator) },
    { key: 'updatedAt', header: 'Last Updated', render: r => formatDate(r.updatedAt), sortable: true, getValue: r => r.updatedAt },
  ]

  // Form State
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formType, setFormType] = useState<Case['type']>('theft')
  const [formPriority, setFormPriority] = useState<Case['priority']>('medium')
  const [formLead, setFormLead] = useState('')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle || !formDesc || !formType || !formPriority || !formLead) return
    createCase({ title: formTitle, description: formDesc, type: formType, priority: formPriority, leadInvestigator: formLead })
    setIsModalOpen(false)
    setFormTitle('')
    setFormDesc('')
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <PageHeader title="Cases" description="Active and archived investigation cases." />
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">New Case</button>
      </div>
      
      <FilterBar 
        search={text} 
        onSearchChange={v => setParam('text', v)} 
        onClear={clearFilters}
        filters={[
          { key: 'type', label: 'Type', value: type, onChange: v => setParam('type', v), options: Array.from(new Set(data.cases.map(c => c.type))).map(t => ({ value: t, label: t })) },
          { key: 'priority', label: 'Priority', value: priority, onChange: v => setParam('priority', v), options: ['low', 'medium', 'high', 'critical'].map(t => ({ value: t, label: t })) },
          { key: 'status', label: 'Status', value: status, onChange: v => setParam('status', v), options: ['open', 'closed', 'cold'].map(t => ({ value: t, label: t })) }
        ]}
      />
      
      <DataTable columns={columns} rows={filtered} getRowKey={r => r.id} showRowCount totalCount={data.cases.length} onRowClick={r => navigate(`/cases/${r.id}`)} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Case">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="block text-sm font-medium">Title</label><input type="text" required value={formTitle} onChange={e => setFormTitle(e.target.value)} className="mt-1 w-full border rounded p-2" /></div>
          <div><label className="block text-sm font-medium">Description</label><textarea required value={formDesc} onChange={e => setFormDesc(e.target.value)} className="mt-1 w-full border rounded p-2" /></div>
          <div><label className="block text-sm font-medium">Type</label><select value={formType} onChange={e => setFormType(e.target.value as Case['type'])} className="mt-1 w-full border rounded p-2">
            <option value="theft">Theft</option><option value="fraud">Fraud</option><option value="assault">Assault</option><option value="cybercrime">Cybercrime</option><option value="other">Other</option>
          </select></div>
          <div><label className="block text-sm font-medium">Priority</label><select value={formPriority} onChange={e => setFormPriority(e.target.value as Case['priority'])} className="mt-1 w-full border rounded p-2">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
          </select></div>
          <div><label className="block text-sm font-medium">Lead Investigator</label><select required value={formLead} onChange={e => setFormLead(e.target.value)} className="mt-1 w-full border rounded p-2">
            <option value="">Select investigator...</option>
            {data.officers.map(o => <option key={o.id} value={o.id}>{o.fullName} ({o.badgeNumber})</option>)}
          </select></div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create Case</button></div>
        </form>
      </Modal>
    </div>
  )
}
