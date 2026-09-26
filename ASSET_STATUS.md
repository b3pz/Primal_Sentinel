# Inventario e lavori mancanti

## Pacchetto utilizzato dal primo livello
| File | Contenuto | Stato |
|---|---|---|
| fighters.png | 5 eroi + soldato, 8 pose per riga | Integrato. Onyx posa 8 esclusa. Pose essenziali, non animazione completa |
| mastice.png | 8 pose del boss | Integrato con ritaglio a griglia; possibile rifinitura delle estensioni tra celle |
| port.png | Panorama del porto | Integrato |
| story.png | Quattro quadri preliminari | Usati solo panorama e camera dei Cuori; ritratti precedenti esclusi |
| campaign-villains.png | Centipede, Trivor, Mimesi, Kharon, Custode, Vespera, Eclipse | Vespera usata nell'intro; restanti sequenze da validare |
| Codice Canvas/CSS | Casse, cure, particelle, anelli, HUD, pulsanti | Integrato; elementi semplici, non tavole raster |
| Web Audio | Colpi, salto, recuperi, pulsazione musicale | Integrato; niente doppiaggio o colonna sonora finale |

## Campagna: riferimenti inclusi
| Livello | Fondale | Avversario | Stato |
|---|---|---|---|
| 1 | Porto Aurora | Mastice | Giocabile |
| 2 | Convoglio | Centipede | Tavole preliminari |
| 3 | Parco preistorico | Trivor | Tavole preliminari; titano non animato |
| 4 | Teatro degli specchi | Mimesi | Tavole preliminari |
| 5 | Città sotto assedio | Kharon | Tavole preliminari; robot non animato |
| 6 | Cimitero dei titani | Custode | Tavole preliminari |
| 7 | Palazzo del Velo | Kharon / Vespera | Tavole preliminari |
| 8 | Alba / fortezza | Vespera / Eclipse | Tavole preliminari |

## Ancora da completare per dire «tutti gli asset definitivi»
- Turnaround fronte/profilo/retro definitivo dei cinque eroi, con correzione dei dettagli.
- Animazioni dedicate di salto, atterraggio, caduta, rialzata, presa, lancio,
  trasformazione e speciale individuale. Ora si riutilizzano pose essenziali.
- Validazione e allineamento delle sei pose dei boss successivi, più cadute e morti.
- Sprite animati e separati dei cinque titani e Concordia; parti per l'assemblaggio.
- Scenari estesi e livelli separati di parallasse per i capitoli 2–8; oggetti dedicati.
- Cinematiche definitive dei capitoli 2–8, figure civili/scienziata, inquadrature aggiuntive.
- Audio musicale finale, eventuali voci, effetti dedicati dei titani.

Questi lavori non richiedono ulteriori file dell'utente. Il pacchetto è una baseline
con un livello implementato; NON dichiara conclusa la produzione grafica degli otto livelli.

## Mancanze tecniche
Cooperativa online: da progettare e implementare. Occorrono un servizio di stanze/
signaling e una strategia di sincronizzazione; GitHub Pages serve soltanto i file statici.
Repository: non è stato fornito un repository di destinazione né pubblicata questa build.
Test su Mac e Windows e controller reali: da eseguire, oltre ai controlli Canvas già fatti.
Mobile: volontariamente fuori da questa fase.
