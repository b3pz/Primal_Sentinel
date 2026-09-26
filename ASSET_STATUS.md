# Inventario degli asset (build 1.0)

## Sprite in gioco (`assets/sprites`, metadati in `js/atlas.js`)
| Atlante | Contenuto | Origine |
|---|---|---|
| fighters.png | 5 eroi × 8 pose; soldato Senzavolto + varianti "Lama del Velo" e "Bruto di ruggine" | ritaglio per sagoma di `source/fighters.png`; varianti ricolorate |
| bosses.png | Mastice (8 pose); Centipede, Trivor, Mimesi, Kharon, Custode, Vespera, Eclisse (6 pose ciascuno) | ritaglio per sagoma di `source/mastice.png` e `source/campaign-villains.png` |
| titans.png | 5 titani + Concordia, viste di lato/fronte/retro | ritaglio di `source/titans-reference.png` |
| items.png | pizza, pollo arrosto, bibita, cella d'energia, moneta, frammento di Cuore, tubo, remo, cassa, fusto esplosivo, bidone, 4 schegge | pixel art nuova (`tools/items.py`) |
| people.png | 9 civili (cameriere, pescatore, signora, anziano, turista, ragazza, impiegato, bambino, scienziata) × fermo/camminata/corsa in preda al panico/riparo/indica; 5 eroi in borghese × fermo/camminata/scatto/posa/braccio alzato/indica | pixel art nuova (`tools/people.py`) |

Ogni fotogramma ha il punto d'appoggio ai piedi: le pose con estensioni (calci, spade, magie)
non vengono più troncate e non "saltano" quando cambiano larghezza.
Correzione: il fotogramma di danno di Onyx aveva la gemma viola del soldato; ora è ridipinto.

## Fondali (`assets/bg`)
port (capitolo 1), rail, park, theater, siege, graveyard, veil, dawn (capitoli 2–8),
più le tavole della storia usate nelle cinematiche. I fondali dei capitoli 2–8 derivano dalle
miniature di `campaign-worlds.png`: sono ingranditi e quindi più morbidi del porto.

## Animazioni ottenute via codice
Salto, caduta a terra, rialzata, presa, lancio, pose del titano nei duelli giganti, colpo di
squadra: realizzati trasformando le pose esistenti (rotazione, spostamento, scie, bagliori).

## Da migliorare in futuro
- Fondali dei capitoli 2–8 disegnati alla risoluzione piena, con livelli di parallasse separati.
- Pose dedicate per salto, a terra e rialzata di eroi e boss (ora sono pose adattate).
- Pose animate dei titani (ora sono viste fisse animate con trasformazioni).
- Voci e colonna sonora registrata (ora c'è musica sintetizzata).
