# Technická akadémia

Interaktívny vzdelávací portál na prípravu z Techniky pre kategórie A a B Technickej olympiády.

## Obsah

- 500 vlastných cvičných otázok v 13 okruhoch; A: 500, B: 389 (B je podmnožinou spoločných základov).
- 151 hotových zostáv: súhrnné testy a tematické bloky používajú rovnakú databázu.
- 25 otázok v okruhu vynálezcov a dejín techniky.
- 58 otázok v pravouhlom premietaní, vrátane 36 obrázkových úloh na 12 mapách kockových stavieb.
- Elektrotechnika, domové rozvody, voda, kúrenie, energia, materiály, remeslá, automatizácia a meranie.
- 341 výberových otázok, 38 doplňovačiek, 87 krátkych odpovedí, 34 priraďovaní.
- Tréning s vysvetlením, časovaný test, opakovanie chýb a lokálna história.

Zostavy sa dajú hľadať podľa názvu a typu. Vlastný test filtruje kategóriu, okruh, počet otázok a náročnosť. Pôvodných 120 otázok a pôvodných 33 zostáv zostalo zachovaných.

## Spustenie

V koreňovom priečinku spustite `python3 -m http.server 8000`, potom otvorte `http://localhost:8000`. Nie je potrebné zostavovanie ani balíčky. JSON sa načítava cez HTTP.

GitHub Pages je nastavený z vetvy main, koreňového priečinka. Nasadenie nájdete na https://goomo1313.github.io/Technick-akad-mia/.

## Overenie obsahu

Spustite `node tools/verify-content.cjs`. Kontroluje schému, jednoznačné ID, odpovede, kategórie, pokrytie zostáv, aritmetiku nových výpočtov a výsledky diagramov.

## Dáta a zdroje

questions.json je databáza, tests.json definuje pevné zostavy, content-report.json uvádza počty. sources.html opisuje metodiku a odkazuje na primárne historické a technické podklady. architecture.md obsahuje návrh rozšírenia na serverovú aplikáciu.

Otázky sú vlastné cvičenia, nie oficiálne zadania ani predpoveď ďalšieho ročníka. Pôvodné testy NIVaM sa otvárajú cez odkazy. Číselné varianty precvičujú rovnaké princípy a tematické testy opätovne používajú rovnaké otázky. Učenie o domových rozvodoch nie je návodom na zásahy do elektriny alebo plynu.

Profily fungujú bez hesla iba v danom prehliadači. Nie sú autentifikovanými serverovými účtami. Vymazanie dát prehliadača vymaže históriu; výsledky možno exportovať.
