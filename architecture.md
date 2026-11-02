# Technická akadémia — architektúra

Funkčný statický SPA prototyp: index.html (sémantická štruktúra), style.css (responzívny vzhľad), app.js (profily, navigácia, časovač, vyhodnotenie, história, export), questions.json (500 vlastných cvičných otázok), tests.json (33 hotových testových zostáv).

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
Všetkých 500 otázok je vlastných, typovo zameraných na predmet Technika; nie sú prevzaté z konkrétneho ročníka. Oficiálne zadania a pravidlá: https://nivam.sk/olympiady-a-sutaze/technicka-olympiada/ a https://nivam.sk/olympiady-a-sutaze/technicka-olympiada/sutazne-ulohy-a-autorske-riesenia/ . Materiály NIVaM sa tu nerepublikujú.

## Rozšírenie na 500 otázok
questions.json je zdrojom pravdy, content-report.json obsahuje počty podľa typu, okruhu a kategórie. 13 okruhov, 500 otázok pre A (z toho 389 aj pre B), 151 testových zostáv. Pôvodných 33 zostáv sa nemení; nové súhrnné zostavy pokrývajú rozšírenie a nové tematické bloky majú najviac 20 otázok. Celkovo sú otázky v súhrnných testoch danej kategórie pokryté presne raz. Tematické bloky sú iným usporiadaním rovnakých otázok.

Obrázkové úlohy používajú diagram: {kind: solid, image, alt, objectId, targetView} a optionImages mapujúce stabilné kľúče možností na SVG priemety. projection-models.json obsahuje geometriu 12 súvislých hranatých dielov; jej obdĺžnikové plochy sú kreslené bez mriežky. Každý diel má izometrický náhľad a nárys, ľavý bokorys a pôdorys. 36 úloh vyžaduje výber správneho obrázka. Správnosť možností je overená priamym geometrickým premietnutím.

40 nahradených otázok má nové ID; staré otázky sú iba v archived-questions.json na zobrazenie starých výsledkov. Archív sa nezaraďuje do tréningu ani učebnice. Referencie v testoch sú premigrované. Pôvodný počet 500 aktívnych otázok zostal zachovaný.

Nové výpočtové otázky majú concept a calculation s operandmi pre nezávislé overenie aritmetiky. Výber náročnosti filtruje otázky; katalóg má hľadanie, druh zostavy a postupné načítanie. Zdroje a pedagogická metodika sú v sources.html.

## Rozšírenie na 700 otázok
Pridaných 200 otázok bez zmeny pôvodných 500. Aktuálne 15 okruhov a 215 zostáv. A: 700 otázok, B: 585; ide o prekrývajúce sa kategórie, nie dve oddelené databázy. Nové súhrnné zostavy v každej kategórii rozdeľujú iba pridané otázky; existujúce zostavy zostávajú nezmenené. Tematické zostavy sú podľa tags (hlina, plasty, kovy, textílie, kompozity, triedenie, dreviny).

Nový diagram.kind = botanical používa image, alt a caption. Ide o 24 vlastných SVG ilustrácií 12 drevín v assets/trees. Tréning sa spúšťa aj tlačidlom Rozpoznávanie drevín. Ilustrácie nemajú názvy drevín priamo v obrázku a slúžia ako schematická pomôcka.

Otázky o odpade majú reviewedAt a collectionContext. Farebné otázky uvádzajú predpokladaný zberový systém. Vlastnosti materiálov sú viazané na konkrétny druh a použitie, nie paušálne na všetky plasty alebo textílie.
