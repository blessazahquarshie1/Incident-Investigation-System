import type { InvestigationData, Person } from '../types'
import { normaliseWords } from './caseComparison'

export type MatchedOnType =
  | 'full name'
  | 'first name'
  | 'surname'
  | 'alias'
  | 'similar spelling'

export interface PersonNameMatch {
  person: Person
  matchedOn: MatchedOnType
  caseIds: string[] // all cases this person is in
}

export interface CaseMention {
  where: 'case description' | 'incident' | 'note' | 'witness statement' | 'evidence'
  snippet: string
}

export interface CaseNameMatch {
  caseId: string
  isPast: boolean
  people: { personId: string; matchedOn: MatchedOnType }[]
  mentions: CaseMention[]
}

export interface NameSearchResult {
  people: PersonNameMatch[]
  cases: CaseNameMatch[]
}

/**
 * Computes simple Levenshtein edit distance between two strings.
 */
function editDistance(a: string, b: string): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > 1) return 2

  const d: number[][] = []
  for (let i = 0; i <= a.length; i++) d[i] = [i]
  for (let j = 0; j <= b.length; j++) d[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      )
    }
  }
  return d[a.length][b.length]
}

/**
 * Extracts a brief context snippet around a query match.
 */
function extractSnippet(text: string, queryWord: string): string {
  const lower = text.toLowerCase()
  const idx = lower.indexOf(queryWord)
  if (idx === -1) {
    return text.length > 80 ? text.slice(0, 80) + '…' : text
  }
  const start = Math.max(0, idx - 25)
  const end = Math.min(text.length, idx + queryWord.length + 35)
  let snippet = text.slice(start, end).trim()
  if (start > 0) snippet = '…' + snippet
  if (end < text.length) snippet = snippet + '…'
  return snippet
}

/**
 * Searches investigative records across people, aliases, and document texts
 * for instances of a name.
 */
export function searchByName(
  data: InvestigationData,
  query: string
): NameSearchResult {
  const trimmed = query.trim()
  if (trimmed.length < 2) {
    return { people: [], cases: [] }
  }

  const queryWords = normaliseWords(trimmed)
  if (queryWords.length === 0) {
    return { people: [], cases: [] }
  }

  const peopleMatches: PersonNameMatch[] = []

  // 1. Search people
  for (const person of data.persons) {
    const nameWords = normaliseWords(person.fullName)
    const aliases = (person.knownAliases ?? []).map(a => normaliseWords(a))

    // Check alias match: query words match start of words in any alias
    let aliasMatch = false
    for (const aliasWords of aliases) {
      const allQMatch = queryWords.every(qw =>
        aliasWords.some(aw => aw.startsWith(qw))
      )
      if (allQMatch) {
        aliasMatch = true
        break
      }
    }

    // Check regular name prefix match
    const allQMatchName = queryWords.every(qw =>
      nameWords.some(nw => nw.startsWith(qw))
    )

    // Check similar spelling match (Levenshtein distance 1 on words >= 5 letters)
    let similarSpellingMatch = false
    if (!allQMatchName && !aliasMatch) {
      const allQMatchSimilar = queryWords.every(qw => {
        // Direct prefix match OR 1-letter typo if length >= 5
        const direct = nameWords.some(nw => nw.startsWith(qw))
        if (direct) return true
        if (qw.length >= 5) {
          return nameWords.some(nw => {
            // Check full word distance or prefix distance
            if (editDistance(qw, nw) === 1) return true
            if (nw.length >= qw.length) {
              const prefix = nw.slice(0, qw.length)
              if (editDistance(qw, prefix) === 1) return true
            }
            return false
          })
        }
        return false
      })
      if (allQMatchSimilar) {
        similarSpellingMatch = true
      }
    }

    if (allQMatchName || aliasMatch || similarSpellingMatch) {
      let matchedOn: MatchedOnType = 'full name'
      if (similarSpellingMatch) {
        matchedOn = 'similar spelling'
      } else if (aliasMatch && !allQMatchName) {
        matchedOn = 'alias'
      } else {
        const isExactFullName =
          nameWords.length === queryWords.length &&
          queryWords.every((qw, i) => nameWords[i] === qw)

        if (isExactFullName) {
          matchedOn = 'full name'
        } else if (
          queryWords.length === 1 &&
          nameWords[0] &&
          nameWords[0].startsWith(queryWords[0])
        ) {
          matchedOn = 'first name'
        } else if (
          queryWords.length === 1 &&
          nameWords.length > 1 &&
          nameWords[nameWords.length - 1].startsWith(queryWords[0])
        ) {
          matchedOn = 'surname'
        } else {
          matchedOn = 'full name'
        }
      }

      peopleMatches.push({
        person,
        matchedOn,
        caseIds: [...person.relatedCases],
      })
    }
  }

  // Sort people: exact full name first, then alias / first name / surname, similar spelling last
  peopleMatches.sort((a, b) => {
    const rank = (m: MatchedOnType) => {
      if (m === 'full name') return 1
      if (m === 'first name') return 2
      if (m === 'surname') return 3
      if (m === 'alias') return 4
      return 5 // similar spelling
    }
    return rank(a.matchedOn) - rank(b.matchedOn)
  })

  // 2. Search mentions in case texts
  const caseMap = new Map<
    string,
    {
      caseId: string
      isPast: boolean
      people: { personId: string; matchedOn: MatchedOnType }[]
      mentions: CaseMention[]
    }
  >()

  // Helper to ensure case entry exists
  function getCaseEntry(caseId: string) {
    if (!caseMap.has(caseId)) {
      const c = data.cases.find(k => k.id === caseId)
      caseMap.set(caseId, {
        caseId,
        isPast: c?.status === 'closed',
        people: [],
        mentions: [],
      })
    }
    return caseMap.get(caseId)!
  }

  // Add people found in cases
  for (const pm of peopleMatches) {
    for (const cid of pm.caseIds) {
      const entry = getCaseEntry(cid)
      if (!entry.people.some(p => p.personId === pm.person.id)) {
        entry.people.push({ personId: pm.person.id, matchedOn: pm.matchedOn })
      }
    }
  }

  // Search mentions across descriptions and notes
  const qLower = trimmed.toLowerCase()

  for (const c of data.cases) {
    if (c.description && c.description.toLowerCase().includes(qLower)) {
      const entry = getCaseEntry(c.id)
      entry.mentions.push({
        where: 'case description',
        snippet: extractSnippet(c.description, qLower),
      })
    }
  }

  for (const inc of data.incidents) {
    const text = `${inc.title} ${inc.description}`.toLowerCase()
    if (text.includes(qLower)) {
      const entry = getCaseEntry(inc.caseId)
      entry.mentions.push({
        where: 'incident',
        snippet: extractSnippet(`${inc.title}: ${inc.description}`, qLower),
      })
    }
  }

  for (const note of data.notes) {
    if (note.text && note.text.toLowerCase().includes(qLower)) {
      const entry = getCaseEntry(note.caseId)
      entry.mentions.push({
        where: 'note',
        snippet: extractSnippet(note.text, qLower),
      })
    }
  }

  for (const ws of data.witnessStatements) {
    if (ws.text && ws.text.toLowerCase().includes(qLower)) {
      const entry = getCaseEntry(ws.caseId)
      entry.mentions.push({
        where: 'witness statement',
        snippet: extractSnippet(ws.text, qLower),
      })
    }
  }

  for (const ev of data.evidence) {
    const text = `${ev.title} ${ev.description}`.toLowerCase()
    if (text.includes(qLower)) {
      const entry = getCaseEntry(ev.caseId)
      entry.mentions.push({
        where: 'evidence',
        snippet: extractSnippet(`${ev.title}: ${ev.description}`, qLower),
      })
    }
  }

  // Convert map to array and sort:
  // cases with matching people first, then by how many matches, then past cases after current ones
  const casesMatches = Array.from(caseMap.values()).sort((a, b) => {
    // 1. Cases with matching people first
    const aHasPeople = a.people.length > 0 ? 1 : 0
    const bHasPeople = b.people.length > 0 ? 1 : 0
    if (aHasPeople !== bHasPeople) return bHasPeople - aHasPeople

    // 2. Total match count
    const totalA = a.people.length + a.mentions.length
    const totalB = b.people.length + b.mentions.length
    if (totalA !== totalB) return totalB - totalA

    // 3. Past cases after current ones
    const aPast = a.isPast ? 1 : 0
    const bPast = b.isPast ? 1 : 0
    return aPast - bPast
  })

  return {
    people: peopleMatches,
    cases: casesMatches,
  }
}

