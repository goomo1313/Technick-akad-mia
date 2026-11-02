# Technická akadémia

Interaktívny vzdelávací portál na prípravu z Techniky pre kategórie A a B Technickej olympiády.

## Obsah

- 700 vlastných cvičných otázok v 15 okruhoch; A: 700, B: 585 (B je podmnožinou spoločných základov).
- 215 hotových zostáv: súhrnné testy a tematické bloky používajú rovnakú databázu.
- 25 otázok v okruhu vynálezcov a dejín techniky.
- 58 otázok v pravouhlom premietaní, vrátane 36 obrázkových úloh s 12 priestorovými technickými dielmi.
- Elektrotechnika, domové rozvody, voda, kúrenie, energia, materiály, remeslá, automatizácia a meranie.
- 537 výberových otázok, 46 doplňovačiek, 75 krátkych odpovedí, 42 priraďovaní.
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

## Prepracované premietanie
Žiak vyberá kreslený nárys, ľavý bokorys alebo pôdorys k priestorovému dielu. V assets/projection je 48 SVG obrázkov. Staré úlohy sú dostupné iba v archíve výsledkov, nové úlohy majú nové ID. Priamo do tréningu vedie tlačidlo Obrázkové premietanie.

## Materiály a dreviny
Rozšírenie o 200 otázok zahŕňa hlinu, keramiku, plasty, kovy, textílie, kompozity, triedenie odpadu a zdroje dreva. Obsahuje 24 schematických obrázkových úloh k 12 drevinám. Rozpoznávanie drevín sa dá spustiť samostatne. Pri triedení sa rešpektuje označenie nádoby a pokyny obce; zálohovanie je samostatný systém. Pôvodných 500 otázok a 151 zostáv zostalo nezmenených.
