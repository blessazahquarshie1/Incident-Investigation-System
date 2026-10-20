-- Safety-net unique indexes. The API already de-duplicates; these stop races and bad seeds.
CREATE UNIQUE INDEX IF NOT EXISTS uq_vehicles_registration ON vehicles (lower(btrim(registration)));
CREATE UNIQUE INDEX IF NOT EXISTS uq_locations_name_city   ON locations (lower(btrim(name)), lower(btrim(city)));
CREATE UNIQUE INDEX IF NOT EXISTS uq_officers_badge        ON officers (badge_number);
