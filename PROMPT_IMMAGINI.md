# Prompt per le immagini da generare (punto 6)

Come usarli:
- Un prompt = una tavola. Allega sempre l'immagine di riferimento indicata, così lo stile resta uguale a quello del gioco.
- Formato: **PNG con sfondo trasparente** (tranne il fondale della base, che è un JPG pieno).
- Poi carica le tavole in chat **con il nome del file indicato**: le taglio, le metto nell'atlante e nello ZIP.
- Se una posa esce male, rigenera solo quella tavola: non serve rifare le altre.

Stile comune (è già dentro ogni prompt): pixel art HD a 16 bit da picchiaduro arcade anni '90, contorno scuro,
luce da sinistra in alto, vista laterale, nessun testo, nessuna ombra per terra, figure separate da spazio vuoto.

---

## 1. Il titano di Kharon: il Drago Verde → `titano_drago.png`
Allega: la tavola dei titani (Tirannosauro rosso, Triceratopo blu, Felino giallo, Pterosauro rosa, Mastodonte nero).

```
Sprite sheet di pixel art HD a 16 bit per un picchiaduro arcade anni '90, sfondo trasparente.
Soggetto: il sesto titano, un DRAGO MECCANICO VERDE smeraldo, cugino dei titani dell'immagine allegata:
stessa costruzione a piastre corazzate, stesse proporzioni massicce, giunture dorate, un cuore di cristallo
verde luminoso al centro del petto, occhi verdi brillanti, corna all'indietro, ali corte ripiegate sul dorso,
coda lunga con punte. Vista laterale, rivolto verso DESTRA.
Griglia 2 righe x 2 colonne, pose ben separate, stessa scala in tutte:
1) addormentato, accucciato con la testa appoggiata a terra, luce del cuore fioca;
2) si risveglia, alza testa e petto, occhi che si accendono;
3) corsa in avanti a quattro zampe, zampe anteriori distese, coda tesa;
4) ruggito verso l'alto a bocca spalancata, ali aperte, cuore verde acceso al massimo.
Contorno scuro, luce da sinistra in alto, niente testo, niente ombra per terra, niente sfondo.
```

## 2. Lo scooter con il pilota del Velo → `scooter.png`
Allega: `fighters.png` (per il soldato Senzavolto) e, se l'hai, la tavola del capitolo 1 (il porto).

```
Sprite sheet di pixel art HD a 16 bit per un picchiaduro arcade anni '90, sfondo trasparente.
Soggetto: uno scooter italiano da città (tipo Vespa), rosso scuro e crema, guidato da un soldato
Senzavolto del Velo come quello dell'immagine allegata: tuta grigio-nera aderente, maschera liscia
senza volto, gemma viola sulla fronte. Vista laterale, rivolto verso SINISTRA, il pilota è seduto
e tiene il manubrio, piegato in avanti per la velocità.
Griglia 2 righe x 2 colonne, stessa scala in tutte:
1) in corsa, pilota piegato in avanti;
2) in corsa, secondo fotogramma (ruote e sciarpa in un'altra posizione, pilota leggermente più basso);
3) impennata: ruota anteriore sollevata, pilota sbilanciato all'indietro;
4) lo scooter vuoto rovesciato a terra su un fianco, con un filo di fumo.
Scala: lo scooter è lungo circa quanto un uomo e mezzo in altezza. Contorno scuro, luce da sinistra
in alto, niente testo, niente ombra per terra.
```

## 3. Le prese dei Sentinels (senza il nemico) → `presa_ignis.png`, `presa_azur.png`, `presa_lyra.png`, `presa_aura.png`, `presa_onyx.png`, `presa_kharon.png`
Sei tavole, una per Sentinel. Allega: `fighters.png` (per Kharon allega la sua tavola a 16 pose verde).
Nel prompt cambia solo la riga **[EROE]** con la descrizione qui sotto:
- ignis: *ranger ROSSO con elmo a visiera nera e spada fiammeggiante*
- azur: *ranger BLU con elmo a corna e lancia a tre punte*
- lyra: *ranger GIALLO con elmo felino e due pugnali ricurvi*
- aura: *ranger ROSA con elmo alato e arco*
- onyx: *ranger NERO-ARGENTO massiccio con elmo a zanne e ascia*
- kharon: *ranger VERDE smeraldo, il sesto Sentinel, identico alla sua tavola allegata (stessa armatura e stessa arma)*

```
Sprite sheet di pixel art HD a 16 bit per un picchiaduro arcade anni '90, sfondo trasparente.
Soggetto: [EROE], identico al personaggio dell'immagine allegata (stessi colori, stesse proporzioni,
stessa scala). Vista laterale, rivolto verso DESTRA. IMPORTANTE: il nemico NON è disegnato, le mani
stringono il vuoto come se tenessero una persona invisibile.
Griglia 2 righe x 2 colonne, stessa scala in tutte, piedi alla stessa altezza:
1) presa: gambe larghe, entrambe le mani avanti all'altezza del petto a stringere il bavero di un nemico;
2) ginocchiata: tiene il nemico con le mani e alza il ginocchio con forza;
3) sollevamento: braccia tese sopra la testa, come se sollevasse un uomo, schiena inarcata;
4) lancio: busto ruotato in avanti, braccia distese a fine movimento, gamba posteriore sollevata.
L'arma resta agganciata alla cintura o sulla schiena. Contorno scuro, luce da sinistra in alto,
niente testo, niente ombra per terra.
```

## 4. La base dei Sentinels per la scelta del personaggio → `base.jpg`
Allega: le due immagini della schermata "Choose your ranger" che mi hai mandato (solo come riferimento
di composizione) e lo sfondo della Camera dei Cuori del gioco.

```
Fondale di pixel art HD a 16 bit, formato orizzontale 16:9 (1920x1080), per la schermata di scelta
del personaggio di un picchiaduro arcade anni '90. Luogo: il centro di comando segreto dei Sentinels,
scavato nella roccia sotto un porto mediterraneo: pareti di pietra antica con colonne e archi,
mescolate a tecnologia: console con schermi verdi e ambra, cavi, luci che lampeggiano.
Al CENTRO, in fondo, un grande cilindro di energia verticale azzurro VUOTO (ci metterò io il mentore),
con base e cima dorate e rune luminose. Ai lati, sei nicchie con cristalli colorati (rosso, blu,
giallo, rosa, argento, verde). La metà inferiore è un pavimento lucido e riflettente, scuro, con cerchi
concentrici luminosi azzurri tenui: deve restare libero, perché i personaggi stanno in fila lì sopra
(la linea dei piedi è a circa il 70% dell'altezza). Atmosfera notturna, luce blu e dorata.
Nessun personaggio, nessun testo, nessuna scritta, nessun logo.
```

## 5. I sei emblemi dei titani per i dischi a terra → `emblemi.png`
Allega: la tavola dei titani e, se vuoi, il logo del gioco.

```
Sei medaglioni rotondi in pixel art HD a 16 bit, sfondo trasparente, disposti in una griglia
2 righe x 3 colonne, ben separati, tutti della stessa dimensione. Vista frontale, perfettamente circolari.
Ogni medaglione ha un bordo in metallo dorato con piccole rune e al centro la testa stilizzata di un titano
in rilievo, dentro un disco smaltato del suo colore:
1) Tirannosauro, disco ROSSO;
2) Triceratopo, disco BLU;
3) Felino dai denti a sciabola, disco GIALLO;
4) Pterosauro, disco ROSA;
5) Mastodonte, disco NERO e ARGENTO;
6) Drago, disco VERDE smeraldo.
Stile emblema da serie tokusatsu, luce da sinistra in alto, niente testo.
```

---
Quando me le carichi faccio io: ritaglio, scala, ancoraggio ai piedi, ricolore dove serve, inserimento
nell'atlante e in gioco (titano verde nell'evocazione e nella cavalcata di Kharon, pilota sugli scooter,
prese vere senza il soldato disegnato, nuovo fondale ed emblemi nella scelta dei Sentinels).
