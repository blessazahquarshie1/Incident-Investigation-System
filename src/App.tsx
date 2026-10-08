import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import DashboardPage from './pages/DashboardPage'
import CasesPage from './pages/CasesPage'
import CaseDetailPage from './pages/CaseDetailPage'
import IncidentsPage from './pages/IncidentsPage'
import PersonsPage from './pages/PersonsPage'
import PersonDetailPage from './pages/PersonDetailPage'
import EvidencePage from './pages/EvidencePage'
import EvidenceDetailPage from './pages/EvidenceDetailPage'
import VehiclesPage from './pages/VehiclesPage'
import VehicleDetailPage from './pages/VehicleDetailPage'
import LocationsPage from './pages/LocationsPage'
import LocationDetailPage from './pages/LocationDetailPage'
import IncidentDetailPage from './pages/IncidentDetailPage'
import TimelinePage from './pages/TimelinePage'
import RelationshipGraphPage from './pages/RelationshipGraphPage'
import InvestigatorsPage from './pages/InvestigatorsPage'
import ReportsPage from './pages/ReportsPage'
import SearchPage from './pages/SearchPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="cases/:caseId" element={<CaseDetailPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="incidents/:id" element={<IncidentDetailPage />} />
          <Route path="persons" element={<PersonsPage />} />
          <Route path="persons/:id" element={<PersonDetailPage />} />
          <Route path="evidence" element={<EvidencePage />} />
          <Route path="evidence/:id" element={<EvidenceDetailPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="locations/:id" element={<LocationDetailPage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="graph" element={<RelationshipGraphPage />} />
          <Route path="investigators" element={<InvestigatorsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="search" element={<SearchPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
