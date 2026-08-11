# docs/brand — Verbindliche Markenquelle

> **Zweck:** `docs/brand/` ist ab **quiks CI v1.0** die verbindliche Markenquelle des Projekts
> (Prinzip 5, Design-Treue). Entscheidung: **ADR-023**. Stand: 2026-08-10.

| Datei | Inhalt |
|---|---|
| [`quiks-ci-v1.md`](./quiks-ci-v1.md) | Verbindlicher Text der CI v1.0 (Logo, Farbe, Typografie, Ikonografie, Modi, Anwendung) + Token-Mapping-Tabelle |
| [`../quiks_CI.html`](../quiks_CI.html) | Visuelle Vorlage — **NICHT direkt lesen** (695 KB Claude-Design-Bundle, gzip-Payload + JSON-Template). Textextrakt siehe `.planning/quick/260810-q31-rebrand-festipal-zu-quiks-ci-v1-0-in-doc/260810-q31-CI-SOURCE-EXTRACT.md` |
| ADR-023 | Entscheidung "quiks CI v1.0" — `../DEVELOPMENT_DECISIONS.md` |
| ADR-024 | Entscheidung "Rename festipal → quiks" — `../DEVELOPMENT_DECISIONS.md` |

**Achtung:** Das im `quiks_CI.html`-Bundle eingebettete Stylesheet ist das **ALTE**
festipal-Design-System (u. a. `--brand-primary: var(--green-500)`, helle Fläche `#FFFFFF`) und
darf **nicht** 1:1 portiert werden. Verbindlich ist ausschließlich der Dokumenttext in
`quiks-ci-v1.md`.

`docs/concept/03-design-system.md` bleibt als Historie gültig, ausser in den von **ADR-023**
abgelösten Punkten (dort mit Inline-Markern gekennzeichnet).
