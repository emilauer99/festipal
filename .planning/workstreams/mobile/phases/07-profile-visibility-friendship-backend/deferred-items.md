# Deferred Items — Phase 07

Out-of-scope discoveries made during execution. Logged, not fixed (scope boundary:
only issues directly caused by the current task's changes are auto-fixed).

## D-1: Verwaiste Zeile in `drizzle.__drizzle_migrations` (lokale Docker-Postgres)

**Gefunden in:** Plan 07-01, Task 2 (Verifikation der angewendeten Migration)

**Beobachtung:** Die lokale Entwicklungsdatenbank führt **7** angewendete Migrationen,
`packages/db/drizzle/meta/_journal.json` kennt aber nur **6** Einträge (`0000`–`0005`).
Die überzählige Zeile trägt `created_at = 1786543153847` und lässt sich keinem Journal-Eintrag
zuordnen; sie wurde rund 75 Minuten vor Migration `0005` angewendet, also **vor** dieser
Plan-Ausführung.

**Warum nicht behoben:** Reine Zustandsanomalie der lokalen Dev-Datenbank, nicht des Repos.
Weder von diesem Plan verursacht noch von ihm berührt. `packages/db/drizzle/` ist konsistent
(6 SQL-Dateien, 6 Journal-Einträge), `pnpm --filter @quiks/db db:migrate` ist idempotent grün,
und das Schema der lebenden DB stimmt mit dem Schema-Quellcode überein. Ein Eingriff in
`drizzle.__drizzle_migrations` wäre eine destruktive Operation ohne belegten Nutzen.

**Nächster Schritt (falls es je stört):** Beim nächsten lokalen DB-Reset
(`docker compose down -v` + `db:migrate` + `db:seed`) verschwindet die Zeile von selbst.
Auf Neon/Prod hat sie keine Entsprechung — dort wurde nie eine nicht-journalisierte Migration
angewendet.
