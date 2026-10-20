# Project Structure

```
api/
├── migrations
│   ├── 0001_init.sql
│   └── 0002_order_and_iso.sql
├── seed
│   └── mock_data.json
├── src
│   ├── routes
│   │   ├── cases.rs
│   │   ├── health.rs
│   │   ├── investigation.rs
│   │   ├── items.rs
│   │   └── mod.rs
│   ├── sql
│   │   └── snapshot.sql
│   ├── db.rs
│   ├── error.rs
│   ├── extract.rs
│   ├── main.rs
│   └── seed.rs
├── Cargo.lock
├── Cargo.toml
└── STRUCTURE.md
```
