# Technická akadémia

Interaktívna príprava na Technickú olympiádu pre kategórie A a B.

120 autorských cvičných otázok, 33 testových zostáv, tréning s vysvetleniami, časované testy a lokálne profily s históriou. Profily nepredstavujú serverové prihlasovanie; dáta sa ukladajú v prehliadači.

## Spustenie

Statický web bez zostavovania. V koreňovom priečinku spustite `python3 -m http.server 8000` a otvorte `http://localhost:8000`. Súbory JSON sa načítavajú cez HTTP.

## Publikovanie

GitHub Settings → Pages → Build and deployment → Source: Deploy from a branch → main → / (root). Po publikovaní bude web na https://goomo1313.github.io/Technick-akad-mia/.

## Súbory

- index.html, style.css, app.js: rozhranie a logika
- questions.json: 120 otázok
- tests.json: 33 zostáv
- architecture.md: architektúra a návrh rozšírenia

Otázky sú vlastné cvičenia z učiva Techniky, nie oficiálne zadania olympiády. Odkazy na oficiálny archív NIVaM sú súčasťou webu.
