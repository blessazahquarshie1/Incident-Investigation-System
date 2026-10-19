// Shows two person names, a large score number, level badge, and breakdown lines
import type { PairConnection, ConnectionLevel } from '../lib/connections'
import { describeScore } from '../lib/connections'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { Info } from 'lucide-react'

function LevelBadge({ level }: { level: ConnectionLevel }) {
  const colors: Record<ConnectionLevel, string> = {
    'WEAK': 'bg-slate-100 text-slate-600',
    'MODERATE': 'bg-blue-100 text-blue-700',
    'STRONG': 'bg-orange-100 text-orange-700',
    'VERY STRONG': 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${colors[level]}`}>
      {level}
    </span>
  )
}

interface Props {
  pair: PairConnection
  personAName: string
  personBName: string
}

export default function ConnectionScoreCard({ pair, personAName, personBName }: Props) {
  const data = useInvestigationStore(s => s.data)
  const lines = describeScore(pair, data)

  const personA = data.persons.find(p => p.id === pair.personAId)
  const personB = data.persons.find(p => p.id === pair.personBId)

  // Contextual helper when pair includes V-001 (Hilux) and Ama Boateng with Kofi Boateng or Kwame Asante
  const hasV001 = pair.sharedVehicles.includes('V-001')
  const isAmaAndBoatengOrAsante =
    (pair.personAId === 'P-004' && (pair.personBId === 'P-002' || pair.personBId === 'P-001')) ||
    (pair.personBId === 'P-004' && (pair.personAId === 'P-002' || pair.personAId === 'P-001'))

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[15px] font-medium text-slate-900">
          <span>{personAName}</span>
          {personA && (
            <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {personA.type}
            </span>
          )}
          <span className="text-slate-400 mx-1">↔</span>
          <span>{personBName}</span>
          {personB && (
            <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {personB.type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-slate-900">{pair.score}</span>
          <LevelBadge level={pair.level} />
        </div>
      </div>

      {lines.length > 0 && (
        <ul className="space-y-1 bg-slate-50 rounded-md p-3 border border-slate-100">
          {lines.map(line => (
            <li key={line} className="text-[14px] text-slate-700 font-mono">
              {line}
            </li>
          ))}
        </ul>
      )}

      {hasV001 && isAmaAndBoatengOrAsante && (
        <div className="rounded-md bg-blue-50/80 border border-blue-200/70 p-3 text-[13px] text-blue-900 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-950">Stolen Vehicle Connection Context:</p>
            <p className="text-blue-900 mt-0.5">
              Victim <strong>Ama Boateng (P-004)</strong> reported vehicle <strong>GT-4521-23 White Toyota Hilux (V-001)</strong> stolen in <em>CASE-00022 (Vehicle Theft)</em>. 
              The stolen vehicle was subsequently recovered in the possession of the Asante robbery syndicate and operated by suspect <strong>Kofi Boateng (P-002)</strong> in armed robberies (<em>CASE-00123</em>, <em>CASE-00201</em>).
            </p>
          </div>
        </div>
      )}

      {/* Context: Scam Call / Virtual SIM Hijack on 0241111111 with Kwame Asante (P-031) */}
      {pair.sharedPhoneNumbers.includes('0241111111') &&
        ((pair.personAId === 'P-034' && pair.personBId === 'P-031') ||
          (pair.personBId === 'P-034' && pair.personAId === 'P-031')) && (
          <div className="rounded-md bg-emerald-50/80 border border-emerald-200/70 p-3 text-[13px] text-emerald-900 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-950">Scam Call & SIM Hijack Context:</p>
              <p className="text-emerald-900 mt-0.5">
                Phone number <strong>0241111111</strong> belongs to mobile money vendor <strong>Akua Agyemang (P-034)</strong>. It was hijacked via a deceptive telecom support scam call and used by fraud suspect <strong>Kwame Asante (P-031)</strong> in <em>CASE-00203 (Osu Mobile Money Fraud)</em> to drain her merchant float and coordinate communications in <em>CASE-00123 (Accra Mall Robbery)</em>.
              </p>
            </div>
          </div>
        )}

      {/* Context: Shared Family Plan with Abena Manu (P-005) */}
      {pair.sharedPhoneNumbers.includes('0242222222') &&
        ((pair.personAId === 'P-004' && pair.personBId === 'P-005') ||
          (pair.personBId === 'P-004' && pair.personAId === 'P-005')) && (
          <div className="rounded-md bg-purple-50/80 border border-purple-200/70 p-3 text-[13px] text-purple-900 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-purple-950">Family Telecom Link Context:</p>
              <p className="text-purple-900 mt-0.5">
                Phone number <strong>0242222222</strong> connects <strong>Ama Boateng (P-004)</strong> and <strong>Abena Manu (P-005)</strong> as family contacts linking Cantonments and Kasoa household contacts.
              </p>
            </div>
          </div>
        )}

      {/* Context: Syndicate Co-Conspirators P-001 and P-002 */}
      {((pair.personAId === 'P-001' && pair.personBId === 'P-002') ||
        (pair.personAId === 'P-002' && pair.personBId === 'P-001')) && (
        <div className="rounded-md bg-red-50/80 border border-red-200/70 p-3 text-[13px] text-red-900 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-950">Syndicate Co-Conspirators Context:</p>
            <p className="text-red-900 mt-0.5">
              <strong>Kwame Asante (P-001)</strong> and <strong>Kofi Boateng (P-002)</strong> are documented robbery co-suspects in <em>CASE-00123</em>. They share possession of getaway vehicle <strong>GT-4521-23 White Toyota Hilux</strong>, joint hideouts in Accra and Tema, and direct involvement in the Accra Mall armed robbery.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

