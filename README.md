# Akadémia olympiád

**[▶ Otvoriť živú stránku a vybrať predmet](https://goomo1313.github.io/Technick-akad-mia/)**

Vzdelávací portál pre žiakov základných škôl. Na úvodnej stránke si môžeš vybrať Techniku alebo Geografiu.

| Predmet | Kategórie | Obsah |
| --- | --- | --- |
| [Technická akadémia](https://goomo1313.github.io/Technick-akad-mia/technika.html) | A, B | 798 otázok a 223 testových zostáv |
| [Geografická akadémia](https://goomo1313.github.io/Technick-akad-mia/geografia/) | E, F, G | 699 otázok, 174 testových zostáv a 194 kariet štátov |

Nová sekcia [Okresy → Okres Gelnica](https://goomo1313.github.io/Technick-akad-mia/geografia/#okresy-gelnica) pridáva 64 otázok, 20 erbov a 2 mapy.

V Technike nájdeš štyri [okresné zostavy A a B z rokov 2024/2025 a 2025/2026](https://goomo1313.github.io/Technick-akad-mia/technika.html?zostava=B-okres-2025-2026) s nákresmi, vysvetleniami a odkazmi na zdrojové zadania.

V oboch predmetoch môžeš trénovať s vysvetleniami, spustiť časovaný test, pokračovať v rozpracovanom pokuse a sledovať výsledky. Profily a výsledky sa ukladajú v danom prehliadači. GitHub Pages je dostupný bez prihlásenia.

## Spustenie lokálne

V koreňovom priečinku spusti `python3 -m http.server 8000` a otvor [localhost:8000](http://localhost:8000/). Aplikácia sa načíta priamo z HTML, CSS a JavaScriptu.

## Obsah repozitára

- `index.html` je úvodná stránka s výberom predmetu.
- `technika.html`, `questions.json` a `tests.json` patria Technickej akadémii.
- `geografia/` obsahuje Geografickú akadémiu, jej databázu a mapové podklady.
- `sources.html` uvádza zdroje k Technike. Zdroje ku Geografii nájdeš v časti **Atlas a učebnica**.

GitHub Pages publikuje koreňový priečinok vetvy `main`.
