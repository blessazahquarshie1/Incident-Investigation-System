-- Returns the whole investigation as one JSON object, same shape as the frontend's InvestigationData.
-- jsonb_strip_nulls drops null keys so optional fields are absent (undefined), like the old mock objects.
SELECT jsonb_build_object(
  'officers', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', o.id, 'fullName', o.full_name, 'rank', o.rank,
      'badgeNumber', o.badge_number, 'department', o.department
    ) ORDER BY o.seq), '[]'::jsonb)
    FROM officers o
  ),
  'locations', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', l.id, 'name', l.name, 'city', l.city, 'region', l.region
    ) ORDER BY l.seq), '[]'::jsonb)
    FROM locations l
  ),
  'cases', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', c.id, 'title', c.title, 'description', c.description, 'type', c.type,
      'priority', c.priority, 'status', c.status, 'leadInvestigator', c.lead_investigator,
      'createdAt', iso(c.created_at), 'updatedAt', iso(c.updated_at)
    ) ORDER BY c.seq), '[]'::jsonb)
    FROM cases c
  ),
  'persons', (
    SELECT COALESCE(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id', p.id, 'fullName', p.full_name, 'type', p.type,
      'phone', p.phone, 'address', p.address,
      'knownAliases', to_jsonb(p.known_aliases),
      'relatedCases', COALESCE((
        SELECT jsonb_agg(cp.case_id ORDER BY cp.case_id)
        FROM case_persons cp WHERE cp.person_id = p.id
      ), '[]'::jsonb)
    )) ORDER BY p.seq), '[]'::jsonb)
    FROM persons p
  ),
  'incidents', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', i.id, 'caseId', i.case_id, 'title', i.title, 'description', i.description,
      'type', i.type, 'locationId', i.location_id, 'occurredAt', iso(i.occurred_at),
      'status', i.status
    ) ORDER BY i.seq), '[]'::jsonb)
    FROM incidents i
  ),
  'evidence', (
    SELECT COALESCE(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id', e.id, 'caseId', e.case_id, 'type', e.type, 'title', e.title,
      'description', e.description, 'collectedAt', iso(e.collected_at),
      'collectedBy', e.collected_by, 'locationId', e.location_id,
      'status', e.status, 'tags', to_jsonb(e.tags),
      'linkedPersons', COALESCE((
        SELECT jsonb_agg(ep.person_id ORDER BY ep.person_id)
        FROM evidence_persons ep WHERE ep.evidence_id = e.id
      ), '[]'::jsonb),
      'custodyHistory', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', ce.id, 'action', ce.action, 'timestamp', iso(ce.timestamp),
          'officerId', ce.officer_id, 'toOfficerId', ce.to_officer_id, 'note', ce.note
        ) ORDER BY ce.seq)
        FROM custody_entries ce WHERE ce.evidence_id = e.id
      ), '[]'::jsonb)
    )) ORDER BY e.seq), '[]'::jsonb)
    FROM evidence e
  ),
  'vehicles', (
    SELECT COALESCE(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id', v.id, 'registration', v.registration, 'make', v.make, 'model', v.model,
      'color', v.color, 'ownerId', v.owner_id
    )) ORDER BY v.seq), '[]'::jsonb)
    FROM vehicles v
  ),
  'documents', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', d.id, 'caseId', d.case_id, 'title', d.title, 'kind', d.kind,
      'uploadedAt', iso(d.uploaded_at), 'uploadedBy', d.uploaded_by
    ) ORDER BY d.seq), '[]'::jsonb)
    FROM documents d
  ),
  'notes', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', n.id, 'caseId', n.case_id, 'authorId', n.author_id,
      'createdAt', iso(n.created_at), 'text', n.text
    ) ORDER BY n.seq), '[]'::jsonb)
    FROM notes n
  ),
  'witnessStatements', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', w.id, 'caseId', w.case_id, 'witnessId', w.witness_id,
      'subjectPersonId', w.subject_person_id, 'locationId', w.location_id,
      'claimedTime', iso(w.claimed_time), 'recordedAt', iso(w.recorded_at), 'text', w.text
    ) ORDER BY w.seq), '[]'::jsonb)
    FROM witness_statements w
  ),
  'sightings', (
    SELECT COALESCE(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id', s.id, 'caseId', s.case_id, 'source', s.source, 'action', s.action,
      'locationId', s.location_id, 'timestamp', iso(s.timestamp),
      'description', s.description, 'vehicleId', s.vehicle_id, 'personId', s.person_id
    )) ORDER BY s.seq), '[]'::jsonb)
    FROM sightings s
  ),
  'phoneRecords', (
    SELECT COALESCE(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id', r.id, 'caseId', r.case_id, 'personId', r.person_id,
      'phoneNumber', r.phone_number, 'kind', r.kind, 'timestamp', iso(r.timestamp),
      'locationId', r.location_id, 'otherNumber', r.other_number
    )) ORDER BY r.seq), '[]'::jsonb)
    FROM phone_records r
  ),
  'activityLog', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', a.id, 'caseId', COALESCE(a.case_id, ''), 'officerId', a.officer_id,
      'timestamp', iso(a.timestamp), 'action', a.action, 'description', a.description
    ) ORDER BY a.timestamp DESC, a.seq DESC), '[]'::jsonb)
    FROM activity_log a
  ),
  'relationships', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'source', x.source, 'target', x.target, 'relationship', x.relationship
    ) ORDER BY x.id), '[]'::jsonb)
    FROM relationships x
  )
)