# Scaling PostgreSQL for SaaS

- Use managed PostgreSQL (Supabase/Neon) with auto-scaling.
- Add indexes for frequent queries.
- Use connection pooling (SQLAlchemy default, can tune pool size).
- Partition large tables if needed.
- Monitor query performance and optimize.
- Use read replicas for heavy read workloads.
- Set up automated backups.
- Use Flask-Migrate for schema changes.
