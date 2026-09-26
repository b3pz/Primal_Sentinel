# Identità visiva — versione 0.1

## Fonte dei personaggi
`assets/fighters.png` è la fonte effettiva dei cinque eroi del livello 1.
La scelta personaggio e il ritratto HUD mostrano il medesimo sprite usato nel gioco.
Le vecchie tavole dei Power Rangers e la prima tavola del rosso non sono incluse.
Non generare nuovi ritratti autonomamente senza un confronto con questo atlante.

| Eroe | Colore | Casco | Ruolo |
|---|---|---|---|
| Ignis | Rosso | Cresta arretrata | Equilibrato |
| Azur | Blu | Due corna corte | Tecnico |
| Lyra | Giallo | Orecchie feline | Veloce |
| Aura | Rosa | Pinne arretrate | Energia |
| Onyx | Carbone | Calotta squadrata | Potente |

Elementi condivisi: visiera nera, corazza a V argento, cintura con fibbia circolare,
guanti/stivali argento, sottotuta scura. La visuale opposta nel gioco è specchiata.
Le differenze estetiche minori dell'atlante generato richiedono ancora una passata
manuale: questa è una baseline, non una certificazione pixel per pixel.
Il fotogramma 8 della riga di Onyx è escluso perché contiene un dettaglio errato.

## Cinematiche
Usare composizioni dei fondali con gli stessi sprite, ritagliati mediante coordinate
Canvas. Evitare il ritratto pittorico dei cinque eroi nel quadrante inferiore destro
di story.png: è una prova precedente e non viene mostrato nel gioco.
Per Vespera l'intro usa il primo fotogramma della sua riga in campaign-villains.png,
non la sua illustrazione precedente in story.png. Menu e camera dei Cuori usano
soltanto i quadranti senza protagonisti di story.png.
Questo metodo mantiene gli stessi abiti durante gioco, selezione e narrazione.

## Scala e composizione
Canvas logico 1280×720, ridimensionamento proporzionale. Eroi 150 px inclusi margini;
Mastice 270 px. Area dei piedi: y 480–668. Nemici ordinati per coordinata y.
Palette ambiente: blu notte, verde acqua, ambra; energia nemica viola.
HUD e testo sono codice, non incorporati nelle immagini: rimangono modificabili.

## Titani: progetto di assemblaggio
Tiranno rosso: torso e testa; triceratopo blu: gamba destra; felino giallo: gamba
sinistra; pterosauro rosa: scudo del petto e ali; mastodonte nero: braccia.
La tavola titans-reference.png è un modello visivo iniziale: ha fondo residuo,
non è un atlante trasparente giocabile, e la corrispondenza meccanica tra le parti
non è ancora validata. Prima delle scene di unione occorre progettare i pezzi.

## Produzione
Non confondere una tavola generata con animazioni già allineate e testate.
Prima di accettare nuove pose controllare casco, simbolo, cintura, numero delle dita,
colore degli arti, altezza e punto d'appoggio. Fondali successivi sono moodboard,
non livelli pronti con collisioni. Conservare sempre la fonte precedente.
