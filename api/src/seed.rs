use anyhow::{anyhow, Context, Result};
use serde_json::Value;
use sqlx::PgPool;

/// Wipes every table so the seed can be re-run. WARNING: destroys all data.
const TRUNCATE_SQL: &str = "TRUNCATE relationships, activity_log, phone_records, sightings, \
witness_statements, notes, documents, custody_entries, evidence_persons, evidence, vehicles, \
incidents, case_persons, persons, cases, locations, officers, id_counters RESTART IDENTITY CASCADE";

/// (label, key in the JSON file, SQL that inserts that JSON array, passed as $1)
/// Order matters: parents before children (foreign keys).
const STEPS: &[(&str, &str, &str)] = &[
    (
        "officers",
        "officers",
        r#"INSERT INTO officers (id, full_name, rank, badge_number, department)
SELECT id, "fullName", rank, "badgeNumber", department
FROM jsonb_to_recordset($1::jsonb)
  AS x(id text, "fullName" text, rank text, "badgeNumber" text, department text)"#,
    ),
    (
        "locations",
        "locations",
        r#"INSERT INTO locations (id, name, city, region)
SELECT id, name, city, region
FROM jsonb_to_recordset($1::jsonb)
  AS x(id text, name text, city text, region text)"#,
    ),
    (
        "cases",
        "cases",
        r#"INSERT INTO cases (id, title, description, type, priority, status, lead_investigator, created_at, updated_at)
SELECT id, title, description, "type", priority, status, "leadInvestigator", "createdAt", "updatedAt"
FROM jsonb_to_recordset($1::jsonb)
  AS x(id text, title text, description text, "type" text, priority text, status text,
       "leadInvestigator" text, "createdAt" timestamptz, "updatedAt" timestamptz)"#,
    ),
    (
        "persons",
        "persons",
        r#"INSERT INTO persons (id, full_name, type, phone, address, known_aliases)
SELECT id, "fullName", "type", phone, address,
       ARRAY(SELECT jsonb_array_elements_text(COALESCE("knownAliases", '[]'::jsonb)))
FROM jsonb_to_recordset($1::jsonb)
  AS x(id text, "fullName" text, "type" text, phone text, address text, "knownAliases" jsonb)"#,
    ),
    (
        "case_persons",
        "persons",
        r#"INSERT INTO case_persons (case_id, person_id)
SELECT DISTINCT c.case_id, p.id
FROM jsonb_to_recordset($1::jsonb) AS p(id text, "relatedCases" jsonb)
CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(p."relatedCases", '[]'::jsonb)) AS c(case_id)"#,
    ),
    (
        "incidents",
        "incidents",
        r#"INSERT INTO incidents (id, case_id, title, description, type, location_id, occurred_at, status)
SELECT id, "caseId", title, description, "type", "locationId", "occurredAt", status
FROM jsonb_to_recordset($1::jsonb)
  AS x(id text, "caseId" text, title text, description text, "type" text,
       "locationId" text, "occurredAt" timestamptz, status text)"#,
    ),
    (
        "vehicles",
        "vehicles",
        r#"INSERT INTO vehicles (id, registration, make, model, color, owner_id)
SELECT id, registration, make, model, color, NULLIF("ownerId", '')
FROM jsonb_to_recordset($1::jsonb)
  AS x(id text, registration text, make text, model text, color text, "ownerId" text)"#,
    ),
    (
        "evidence",
        "evidence",
        r#"INSERT INTO evidence (id, case_id, type, title, description, collected_at, collected_by, location_id, status, tags)
SELECT id, "caseId", "type", title, description, "collectedAt", "collectedBy",
       NULLIF("locationId", ''), status,
       ARRAY(SELECT jsonb_array_elements_text(COALESCE(tags, '[]'::jsonb)))
FROM jsonb_to_recordset($1::jsonb)
  AS x(id text, "caseId" text, "type" text, title text, description text,
       "collectedAt" timestamptz, "collectedBy" text, "locationId" text, status text, tags jsonb)"#,
    ),
    (
        "evidence_persons",
        "evidence",
        r#"INSERT INTO evidence_persons (evidence_id, person_id)
SELECT DISTINCT e.id, lp.person_id
FROM jsonb_to_recordset($1::jsonb) AS e(id text, "linkedPersons" jsonb)
CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(e."linkedPersons", '[]'::jsonb)) AS lp(person_id)"#,
    ),
    (
        "custody_entries",
        "evidence",
        r#"INSERT INTO custody_entries (id, evidence_id, seq, action, timestamp, officer_id, to_officer_id, note)
SELECT c.obj->>'id', e.id, c.ord::int, c.obj->>'action', (c.obj->>'timestamp')::timestamptz,
       c.obj->>'officerId', c.obj->>'toOfficerId', c.obj->>'note'
FROM jsonb_to_recordset($1::jsonb) AS e(id text, "custodyHistory" jsonb)
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(e."custodyHistory", '[]'::jsonb))
  WITH ORDINALITY AS c(obj, ord)"#,
    ),
    (
        "documents",
        "documents",
        r#"INSERT INTO documents (id, case_id, title, kind, uploaded_at, uploaded_by)
SELECT id, "caseId", title, kind, "uploadedAt", "uploadedBy"
FROM jsonb_to_recordset($1::jsonb)
  AS x(id text, "caseId" text, title text, kind text, "uploadedAt" timestamptz, "uploadedBy" text)"#,
    ),
    (
        "notes",
        "notes",
        r#"INSERT INTO notes (id, case_id, author_id, created_at, text)
SELECT id, "caseId", "authorId", "createdAt", "text"
FROM jsonb_to_recordset($1::jsonb)
  AS x(id text, "caseId" text, "authorId" text, "createdAt" timestamptz, "text" text)"#,
    ),
    (
        "witness_statements",
        "witnessStatements",
        r#"INSERT INTO witness_statements (id, case_id, witness_id, subject_person_id, location_id, claimed_time, recorded_at, text)
SELECT id, "caseId", "witnessId", "subjectPersonId", "locationId", "claimedTime", "recordedAt", "text"
FROM jsonb_to_recordset($1::jsonb)
  AS x(id text, "caseId" text, "witnessId" text, "subjectPersonId" text, "locationId" text,
       "claimedTime" timestamptz, "recordedAt" timestamptz, "text" text)"#,
    ),
    (
        "sightings",
        "sightings",
        r#"INSERT INTO sightings (id, case_id, source, action, location_id, timestamp, description, vehicle_id, person_id)
SELECT id, "caseId", source, action, "locationId", "timestamp", description,
       NULLIF("vehicleId", ''), NULLIF("personId", '')
FROM jsonb_to_recordset($1::jsonb)
  AS x(id text, "caseId" text, source text, action text, "locationId" text,
       "timestamp" timestamptz, description text, "vehicleId" text, "personId" text)"#,
    ),
    (
        "phone_records",
        "phoneRecords",
        r#"INSERT INTO phone_records (id, case_id, person_id, phone_number, kind, timestamp, location_id, other_number)
SELECT id, "caseId", "personId", "phoneNumber", kind, "timestamp", NULLIF("locationId", ''), "otherNumber"
FROM jsonb_to_recordset($1::jsonb)
  AS x(id text, "caseId" text, "personId" text, "phoneNumber" text, kind text,
       "timestamp" timestamptz, "locationId" text, "otherNumber" text)"#,
    ),
    (
        "activity_log",
        "activityLog",
        r#"INSERT INTO activity_log (id, case_id, officer_id, timestamp, action, description)
SELECT id, NULLIF("caseId", ''), "officerId", "timestamp", action, description
FROM jsonb_to_recordset($1::jsonb)
  AS x(id text, "caseId" text, "officerId" text, "timestamp" timestamptz, action text, description text)"#,
    ),
    (
        "relationships",
        "relationships",
        r#"INSERT INTO relationships (source, target, relationship)
SELECT t.obj->>'source', t.obj->>'target', t.obj->>'relationship'
FROM jsonb_array_elements($1::jsonb) WITH ORDINALITY AS t(obj, ord)
ORDER BY t.ord
ON CONFLICT (source, target, relationship) DO NOTHING"#,
    ),
];

/// Starts each ID counter at the highest number already in the data.
const COUNTERS_SQL: &str = r#"INSERT INTO id_counters (prefix, last_value)
SELECT prefix, MAX(n)
FROM (
  SELECT regexp_replace(id, '-[0-9]+$', '') AS prefix,
         (regexp_match(id, '([0-9]+)$'))[1]::int AS n
  FROM (
    SELECT id FROM cases UNION ALL SELECT id FROM persons UNION ALL SELECT id FROM incidents
    UNION ALL SELECT id FROM evidence UNION ALL SELECT id FROM vehicles UNION ALL SELECT id FROM locations
    UNION ALL SELECT id FROM notes UNION ALL SELECT id FROM documents
    UNION ALL SELECT id FROM witness_statements UNION ALL SELECT id FROM sightings
    UNION ALL SELECT id FROM phone_records UNION ALL SELECT id FROM activity_log
  ) ids
) t
WHERE n IS NOT NULL
GROUP BY prefix"#;

/// (table, key in the JSON file) for the before/after row-count report.
const COUNTS: &[(&str, &str)] = &[
    ("officers", "officers"),
    ("locations", "locations"),
    ("cases", "cases"),
    ("persons", "persons"),
    ("incidents", "incidents"),
    ("evidence", "evidence"),
    ("vehicles", "vehicles"),
    ("documents", "documents"),
    ("notes", "notes"),
    ("witness_statements", "witnessStatements"),
    ("sightings", "sightings"),
    ("phone_records", "phoneRecords"),
    ("activity_log", "activityLog"),
    ("relationships", "relationships"),
];

/// Surfaces Postgres' DETAIL line (e.g. which key violated a foreign key).
fn explain(e: sqlx::Error) -> anyhow::Error {
    if let sqlx::Error::Database(dbe) = &e {
        if let Some(pg) = dbe.try_downcast_ref::<sqlx::postgres::PgDatabaseError>() {
            return anyhow!("{} (detail: {})", pg.message(), pg.detail().unwrap_or("none"));
        }
    }
    anyhow::Error::from(e)
}

pub async fn run(db: &PgPool, path: &str) -> Result<()> {
    let raw = std::fs::read_to_string(path)
        .with_context(|| format!("could not read {path} (run the dump script first)"))?;
    let data: Value = serde_json::from_str(&raw).context("seed file is not valid JSON")?;

    let mut tx = db.begin().await?;

    sqlx::query(TRUNCATE_SQL)
        .execute(&mut *tx)
        .await
        .map_err(explain)
        .context("clearing tables")?;

    for &(label, key, sql) in STEPS {
        let rows = data
            .get(key)
            .ok_or_else(|| anyhow!("key '{key}' is missing from {path}"))?;
        sqlx::query(sql)
            .bind(rows)
            .execute(&mut *tx)
            .await
            .map_err(explain)
            .with_context(|| format!("seeding {label}"))?;
    }

    sqlx::query(COUNTERS_SQL)
        .execute(&mut *tx)
        .await
        .map_err(explain)
        .context("seeding id_counters")?;

    println!("\n{:<20} {:>6} {:>6}", "table", "json", "db");
    for &(table, key) in COUNTS {
        let json_n = data
            .get(key)
            .and_then(Value::as_array)
            .map_or(0, |a| a.len() as i64);
        let sql = format!("SELECT COUNT(*) FROM {table}");
        let db_n: i64 = sqlx::query_scalar(&sql).fetch_one(&mut *tx).await?;
        let flag = if json_n == db_n { "" } else { "  <-- differs" };
        println!("{table:<20} {json_n:>6} {db_n:>6}{flag}");
    }
    for table in ["case_persons", "evidence_persons", "custody_entries"] {
        let sql = format!("SELECT COUNT(*) FROM {table}");
        let n: i64 = sqlx::query_scalar(&sql).fetch_one(&mut *tx).await?;
        println!("{table:<20} {:>6} {n:>6}", "-");
    }

    let counters: Vec<(String, i32)> =
        sqlx::query_as("SELECT prefix, last_value FROM id_counters ORDER BY prefix")
            .fetch_all(&mut *tx)
            .await?;
    println!(
        "\nid_counters: {}",
        counters
            .iter()
            .map(|(p, n)| format!("{p}={n}"))
            .collect::<Vec<_>>()
            .join(", ")
    );

    tx.commit().await?;
    println!("\nSeed committed.");
    Ok(())
}