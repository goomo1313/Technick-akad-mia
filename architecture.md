# Technická akadémia — architektúra

Funkčný statický SPA prototyp: index.html (sémantická štruktúra), style.css (responzívny vzhľad), app.js (profily, navigácia, časovač, vyhodnotenie, história, export), questions.json (120 vlastných cvičných otázok), tests.json (33 hotových testových zostáv).

## Ukladanie a profily
Žiacka prezývka a kategória, bez e-mailu a hesla. localStorage pod kľúčom tech-academy-v1. Na zdieľanom zariadení sú profily dostupné všetkým jeho používateľom. Nejde o autentifikáciu ani cloudové účty. Vymazanie dát prehliadača vymaže históriu. Export výsledkov je JSON. Na začiatku nie sú generované fiktívne výsledky.

## Otázky
Každý záznam má id, categories (A/B), topic, type (mc/fill/short/match), prompt, options, answer, explanation, difficulty, source, version. Pri mc je answer presná možnosť; pri fill/short zoznam prijateľných odpovedí; pri match zoznam hodnôt zodpovedajúci poradiu options. Automatické hodnotenie krátkych odpovedí používa explicitné akceptované varianty, nie sémantické AI hodnotenie. Ignoruje veľkosť písmen, diakritiku a nadbytočné medzery.

## Test
Náhodný výber voliteľného počtu vhodných otázok, 1 bod za otázku. Pri priraďovaní bod za všetky správne dvojice. Tréning: okamžité overenie a vysvetlenie, bez limitu. Test: 60 sekúnd na každú otázku a hodnotenie po odovzdaní. História: dátum, kategória, režim, čas, body, percentá, odpovede. Opakovanie chýb vytvára samostatný tréning. Časový limit a bodovanie nie sú oficiálnymi pravidlami olympiády.

## Rozšíriteľný serverový návrh (ešte nie implementovaný)
Pre ostré účty použiť serverovú autentifikáciu, oddelené používateľské dáta a databázu. Správne odpovede preniesť zo statického klienta na server, ktorý hodnotí pokusy. SQL model:

```sql
CREATE TABLE profiles (id TEXT PRIMARY KEY, auth_subject TEXT UNIQUE NOT NULL, nickname TEXT NOT NULL, category TEXT NOT NULL CHECK(category IN ('A','B')));
CREATE TABLE topics (id TEXT PRIMARY KEY, title TEXT NOT NULL);
CREATE TABLE questions (id TEXT NOT NULL, version INTEGER NOT NULL, topic_id TEXT REFERENCES topics(id), type TEXT NOT NULL, difficulty INTEGER NOT NULL, payload_json TEXT NOT NULL, source_json TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, PRIMARY KEY(id, version));
CREATE TABLE question_categories (question_id TEXT, question_version INTEGER, category TEXT CHECK(category IN ('A','B')), PRIMARY KEY(question_id,question_version,category), FOREIGN KEY(question_id,question_version) REFERENCES questions(id,version));
CREATE TABLE attempts (id TEXT PRIMARY KEY, profile_id TEXT REFERENCES profiles(id), started_at TEXT NOT NULL, submitted_at TEXT, mode TEXT NOT NULL, category TEXT NOT NULL, score INTEGER, total INTEGER, elapsed_seconds INTEGER);
CREATE TABLE responses (attempt_id TEXT REFERENCES attempts(id), question_id TEXT, question_version INTEGER, answer_json TEXT, earned_points INTEGER, PRIMARY KEY(attempt_id,question_id), FOREIGN KEY(question_id,question_version) REFERENCES questions(id,version));
CREATE INDEX questions_by_topic ON questions(topic_id, active);
CREATE INDEX attempts_by_student ON attempts(profile_id, started_at);
```

API návrh: GET /api/questions (bez riešení), POST /api/attempts, POST /api/attempts/:id/submit (serverové hodnotenie), GET /api/me/history. Každý prístup musí overiť vlastníka profilu; správne riešenia sa poskytujú až podľa režimu. Verzie otázok zachovajú reprodukovateľnosť starších výsledkov.

## Zdroje a pôvod
Všetkých 120 otázok je vlastných, typovo zameraných na predmet Technika; nie sú prevzaté z konkrétneho ročníka. Oficiálne zadania a pravidlá: https://nivam.sk/olympiady-a-sutaze/technicka-olympiada/ a https://nivam.sk/olympiady-a-sutaze/technicka-olympiada/sutazne-ulohy-a-autorske-riesenia/ . Materiály NIVaM sa tu nerepublikujú.

## Rozšírenie obsahu
120 otázok: 120 pre A, z toho 85 aj pre B. tests.json obsahuje 33 hotových zostáv: 12 súhrnných A, 9 súhrnných B a 12 tematických (6 pre každú kategóriu). Súhrnné zostavy v rámci kategórie tvoria rozdelenie databázy bez opakovania. Tematické zostavy sú alternatívnym usporiadaním rovnakého obsahu. 30 otázok rozvíja šesť početných postupov na konkrétnych hodnotách. Pôvodných 18 ID aj localStorage sú zachované.
