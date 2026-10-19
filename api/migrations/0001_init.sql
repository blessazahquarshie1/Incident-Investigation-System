-- Investigation-Man-Sys: initial schema.
-- IDs are TEXT so they match the frontend ("P-001", "CASE-00123", ...).
-- JSON is camelCase on the wire; columns here are snake_case.

CREATE TABLE officers (
  id            TEXT PRIMARY KEY,
  full_name     TEXT NOT NULL,
  rank          TEXT NOT NULL,
  badge_number  TEXT NOT NULL,
  department    TEXT NOT NULL
);

CREATE TABLE locations (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  city    TEXT NOT NULL,
  region  TEXT NOT NULL
);

CREATE TABLE cases (
  id                 TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  description        TEXT NOT NULL,
  type               TEXT NOT NULL CHECK (type IN ('theft','fraud','assault','cybercrime','other')),
  priority           TEXT NOT NULL CHECK (priority IN ('low','medium','high','critical')),
  status             TEXT NOT NULL CHECK (status IN ('open','investigating','pending','closed')),
  lead_investigator  TEXT NOT NULL REFERENCES officers(id),
  created_at         TIMESTAMPTZ NOT NULL,
  updated_at         TIMESTAMPTZ NOT NULL
);

CREATE TABLE persons (
  id             TEXT PRIMARY KEY,
  full_name      TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('suspect','witness','victim','person-of-interest')),
  phone          TEXT,
  address        TEXT,
  known_aliases  TEXT[] NOT NULL DEFAULT '{}'
);

-- Person.relatedCases (derived on read from this table)
CREATE TABLE case_persons (
  case_id    TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  person_id  TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  PRIMARY KEY (case_id, person_id)
);

CREATE TABLE incidents (
  id           TEXT PRIMARY KEY,
  case_id      TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('theft','fraud','assault','cybercrime','other')),
  location_id  TEXT NOT NULL REFERENCES locations(id),
  occurred_at  TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('unresolved','resolved'))
);

CREATE TABLE vehicles (
  id            TEXT PRIMARY KEY,
  registration  TEXT NOT NULL,
  make          TEXT NOT NULL,
  model         TEXT NOT NULL,
  color         TEXT NOT NULL,
  owner_id      TEXT REFERENCES persons(id) ON DELETE SET NULL
);

CREATE TABLE evidence (
  id            TEXT PRIMARY KEY,
  case_id       TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('document','photo','video','device','vehicle','digital')),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  collected_at  TIMESTAMPTZ NOT NULL,
  collected_by  TEXT NOT NULL REFERENCES officers(id),
  location_id   TEXT REFERENCES locations(id) ON DELETE SET NULL,
  status        TEXT NOT NULL CHECK (status IN
                  ('collected','with-officer','in-evidence-room','under-analysis','analysed','released','destroyed')),
  tags          TEXT[] NOT NULL DEFAULT '{}'
);

-- Evidence.linkedPersons
CREATE TABLE evidence_persons (
  evidence_id  TEXT NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  person_id    TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  PRIMARY KEY (evidence_id, person_id)
);

-- Evidence.custodyHistory (append-only; ordered by seq)
CREATE TABLE custody_entries (
  id             TEXT PRIMARY KEY,
  evidence_id    TEXT NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  seq            INTEGER NOT NULL,
  action         TEXT NOT NULL CHECK (action IN
                   ('collected','transferred','submitted-to-evidence-room','analysis-started',
                    'analysis-completed','released','destroyed')),
  timestamp      TIMESTAMPTZ NOT NULL,
  officer_id     TEXT NOT NULL REFERENCES officers(id),
  to_officer_id  TEXT REFERENCES officers(id),
  note           TEXT,
  UNIQUE (evidence_id, seq)
);

CREATE TABLE documents (
  id           TEXT PRIMARY KEY,
  case_id      TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN ('report','warrant','statement','court-order','other')),
  uploaded_at  TIMESTAMPTZ NOT NULL,
  uploaded_by  TEXT NOT NULL REFERENCES officers(id)
);

CREATE TABLE notes (
  id          TEXT PRIMARY KEY,
  case_id     TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id   TEXT NOT NULL REFERENCES officers(id),
  created_at  TIMESTAMPTZ NOT NULL,
  text        TEXT NOT NULL
);

CREATE TABLE witness_statements (
  id                 TEXT PRIMARY KEY,
  case_id            TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  witness_id         TEXT NOT NULL REFERENCES persons(id),
  subject_person_id  TEXT NOT NULL REFERENCES persons(id),
  location_id        TEXT NOT NULL REFERENCES locations(id),
  claimed_time       TIMESTAMPTZ NOT NULL,
  recorded_at        TIMESTAMPTZ NOT NULL,
  text               TEXT NOT NULL
);

CREATE TABLE sightings (
  id           TEXT PRIMARY KEY,
  case_id      TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  source       TEXT NOT NULL CHECK (source IN ('cctv','patrol','anpr','informant')),
  action       TEXT NOT NULL CHECK (action IN ('entered','left','seen')),
  location_id  TEXT NOT NULL REFERENCES locations(id),
  timestamp    TIMESTAMPTZ NOT NULL,
  description  TEXT NOT NULL,
  vehicle_id   TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
  person_id    TEXT REFERENCES persons(id) ON DELETE CASCADE
);

CREATE TABLE phone_records (
  id            TEXT PRIMARY KEY,
  case_id       TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  person_id     TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  phone_number  TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('call','sms','cell-tower')),
  timestamp     TIMESTAMPTZ NOT NULL,
  location_id   TEXT REFERENCES locations(id),
  other_number  TEXT
);

-- case_id is nullable: createLocation logs activity with no case
CREATE TABLE activity_log (
  id           TEXT PRIMARY KEY,
  case_id      TEXT REFERENCES cases(id) ON DELETE CASCADE,
  officer_id   TEXT NOT NULL REFERENCES officers(id),
  timestamp    TIMESTAMPTZ NOT NULL,
  action       TEXT NOT NULL CHECK (action IN
                 ('case-created','priority-changed','status-changed','person-added','vehicle-linked',
                  'evidence-uploaded','custody-action','note-added','incident-added','location-added',
                  'vehicle-added','document-added','link-added','lead-changed','timeline-record-added')),
  description  TEXT NOT NULL
);

-- Graph edges. source/target are polymorphic (P-, V-, I-, L-, E-, CASE-), so no FKs.
-- BIGSERIAL id preserves insertion order.
CREATE TABLE relationships (
  id            BIGSERIAL PRIMARY KEY,
  source        TEXT NOT NULL,
  target        TEXT NOT NULL,
  relationship  TEXT NOT NULL CHECK (relationship IN ('owns','visited','witnessed','involved-in','connected-to')),
  UNIQUE (source, target, relationship)
);

-- Atomic ID generation per prefix (P, V, E, I, L, N, D, WS, SG, PR, A, CASE)
CREATE TABLE id_counters (
  prefix      TEXT PRIMARY KEY,
  last_value  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_case_persons_person      ON case_persons (person_id);
CREATE INDEX idx_incidents_case           ON incidents (case_id);
CREATE INDEX idx_evidence_case            ON evidence (case_id);
CREATE INDEX idx_custody_evidence         ON custody_entries (evidence_id, seq);
CREATE INDEX idx_documents_case           ON documents (case_id);
CREATE INDEX idx_notes_case               ON notes (case_id);
CREATE INDEX idx_witness_statements_case  ON witness_statements (case_id);
CREATE INDEX idx_sightings_case           ON sightings (case_id);
CREATE INDEX idx_phone_records_case       ON phone_records (case_id);
CREATE INDEX idx_activity_case_time       ON activity_log (case_id, timestamp DESC);
CREATE INDEX idx_relationships_source     ON relationships (source);
CREATE INDEX idx_relationships_target     ON relationships (target);