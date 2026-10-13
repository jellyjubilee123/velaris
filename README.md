# Velaris

Privacy-first matching with realistic pairing and ephemeral encrypted chat via Kestrel.

## Local setup

```bash
docker compose up -d
# Apply migration (example with psql)
psql postgresql://velaris:velaris@localhost:5432/velaris -f backend/migrations/001_init.sql
