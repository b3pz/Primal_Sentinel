# PRIMAL SENTINELS — Il cuore dei titani
Ideato e sviluppato da b3pZ. Build 1.6: campagna completa in 8 capitoli, modalità extra, da 1 a 4 giocatori.

## Avvio
Estrai tutto lo ZIP e apri `index.html` con Chrome, Edge o Firefox (Mac o Windows).
Non serve installare nulla. Per GitHub Pages pubblica il contenuto della cartella
`primal-sentinels` così com'è (index.html, js, assets, vendor devono restare insieme).

## Modalità
- **Gioca · 1–4 giocatori su questo PC**: cooperativa locale. Ogni giocatore entra
  premendo un tasto sul proprio dispositivo: controller (A o X), tastiera 1 (F, J o Spazio),
  tastiera 2 (K o Num1). Si sceglie l'eroe con ◀ ▶ e si conferma con pugno.
- **Cooperativa online con codice**: uno crea la stanza e comunica il codice di 5 caratteri,
  gli altri lo inseriscono. Fino a 4 giocatori, ciascuno sul proprio PC.
- **Capitoli**: riparti da un capitolo già sbloccato (il salvataggio è locale nel browser).
- **Modalità extra**: Boss Rush (gli 8 boss di fila), Sopravvivenza (ondate infinite, un boss ogni 5),
  Sfida a tempo (un capitolo sbloccato, senza dialoghi, conta il cronometro). Senza continui.
- **Classifiche** con le iniziali (3 lettere, come in sala giochi) per storia, Boss Rush, Sopravvivenza
  e Sfida a tempo (il miglior tempo di ogni capitolo).
- **Galleria**: Sentinels, nemici, boss, titani, cinematiche da rivedere e luoghi, man mano che li sblocchi.
- **Opzioni**: volume della musica e degli effetti separati, audio acceso/spento, schermo intero,
  **tasti personalizzabili** (tastiera per 1 giocatore, le due metà della tastiera per 2 giocatori, controller).
- Se resti sul titolo parte il giro del cabinato: intro, classifica e una **demo giocata dal computer**.

## Comandi
| | Tastiera (1 giocatore) | Tastiera 1P (in due) | Tastiera 2P (in due) | Controller |
|---|---|---|---|---|
| Muovi (doppio tocco = corsa) | WASD / frecce | WASD | frecce | stick / croce |
| Attacco: pugno, calcio, colpo con l'arma | J | F | K / Num1 | X |
| Pistola (pochi colpi) | K | G | L / Num2 | Y |
| Speciale con l'arma (40 energia) | L | R | O / Num3 | B |
| Salto (+ attacco = calcio volante) | Spazio | Spazio | I / Num0 | A |
| Schivata | Shift | Shift sinistro | Shift destro | RB / RT |
| Colpo di squadra | I | T | P / Num4 | LB |
| Pausa | Esc / Invio | Esc | Invio | Start |

Il tutorial animato **COME SI GIOCA** (dal menu, dalla pausa e automaticamente la prima volta
prima del capitolo 1) mostra ogni mossa con i tasti che si illuminano, per tastiera, controller e
due giocatori sulla stessa tastiera. Durante la partita i tasti da premere compaiono sullo schermo
quando servono: colpo di squadra pronto, "SPRIGIONA IL TUO POTERE!", "AFFERRALO!", "SALTA!".

- **Combo**: attacco ×3 = pugno, calcio e colpo finale con l'arma personale; in corsa = carica con l'arma.
- **Pistola**: 8 colpi a inizio capitolo, massimo 12; i caricatori escono dalle casse e dai nemici.
- **Prese**: quando un nemico è stordito compare "PRESA!": attacco lo afferra, attacco = ginocchiate,
  indietro + attacco = lancio alle spalle, salto = lancio in avanti contro gli altri.
- **Speciali in base all'arma**: Aura (arco) tre frecce da lontano; Ignis (spada) onda di fuoco e Azur
  (lancia) affondo a media distanza; Onyx (ascia) e Lyra (pugnali) da vicino.
- **Colpo di squadra**: la squadra si riunisce, le cinque armi diventano il Cannone Primordiale.
- I fusti rossi esplodono. Senza energia lo speciale costa un po' di vita, come nei cabinati.

**In squadra** (cooperativa locale e online):
- **Rianimare**: quando un compagno va K.O. resta a terra con un cerchio che si svuota (8 secondi).
  Avvicinati e **tieni premuto ATTACCO** finché si rialza: non perde la vita.
- **Lancio del compagno**: quando un compagno salta accanto a te premi ATTACCO e lo scagli come un proiettile.
- **Presa doppia**: se un compagno ha afferrato un nemico, premi ATTACCO davanti al nemico: lo sollevate
  insieme e lo schiantate a terra, con un'onda d'urto sugli altri.
- **Cibo condiviso**: chi mangia recupera tutto, i compagni vicini metà.

**Evocazione del titano**: con almeno 3 Sigilli dei Titani trovati (in tutto il gioco) puoi evocare il tuo
titano una volta per capitolo **tenendo premuto COLPO DI SQUADRA** (quando la barra squadra non è piena).
Il titano attraversa lo schermo travolgendo i nemici.

**Duelli giganti** (capitoli 3, 5 e 8): tutti i giocatori pilotano insieme il titano o Concordia.
Attacco = pugno, pistola = colpo pesante, schivata tenuta = parata, salto = passo rapido.
Quando la barra "equilibrio" del mostro si svuota, speciale lancia l'arma finale.



## Novità della 1.6.2
- **Nuove pose dei boss** (8 ciascuno) per Centipede, Trivor, Mimesi, Kharon, il Custode e Vespera: guardia, passo,
  carica, attacco, mossa speciale, colpito, a terra, in ginocchio (quando la guardia viene sfondata).
- **Kharon giocabile** usa ora le stesse 8 pose (anche la mossa speciale e la caduta a terra).
- Le nuove pose si vedono anche nella Galleria. `tools/build_boss_poses.py` le rigenera.

## Novità della 1.6.1
- **Sfondi HD** per i capitoli 2-8 (scalo merci, parco, teatro, città in fiamme, fabbrica dei titani, Velo, alba),
  allineati al pavimento di gioco (`tools/build_hd_bg.py` li rigenera dalle immagini originali).

## Novità della 1.6
- **Capitolo 2 · la galleria**: il treno entra in un tunnel buio. Travi basse (tieni SCHIVATA per abbassarti)
  e barriere sul tetto (salta). Un avviso con il tasto giusto compare prima di ognuna.
- **Capitolo 3 · in sella al Tiranno rosso**: a metà capitolo il titano si risveglia e la squadra gli sale in
  groppa. Attacco = morso, salto = codata, speciale = ruggito che stordisce tutti, pistola = ognuno spara
  dalla groppa. Il titano ha la sua barra di vita; prima del boss torna nella foresta.
- **Capitolo 8 · il crollo**: prima di Vespera la fortezza si sgretola e lo schermo scorre da solo; frammenti
  che cadono (guarda il cerchio a terra), nemici del Velo e il vuoto che avanza da sinistra.
- **Mosse in coppia, rianimazione, cibo condiviso** (vedi "In squadra") e **evocazione del titano**.
- **Rallentatore e lampo bianco** sull'ultimo colpo a ogni boss e ai mostri giganti.
- **Kharon giocabile** (si sblocca finendo la storia) con la sua Onda del traghettatore; per ora usa le pose del
  boss, quando arriva la sua tavola verrà sostituita.
- **Costumi alternativi**: OMBRA (12 sigilli) e ORO (finisci la storia). Nella scelta dei giocatori: ▲▼.
- **Modalità extra, classifiche con iniziali, demo del cabinato, galleria, opzioni, tasti personalizzabili,
  volume separato** (vedi Modalità).
- **Musica MP3 facoltativa**: metti i brani in `assets/music` con i nomi indicati in `assets/music/LEGGIMI.txt`
  (sigla, capitolo1…capitolo8, boss, titani, finale); se mancano si sente la musica sintetizzata.
- Tutorial con due pagine nuove: IN SQUADRA e TITANO E GALLERIA.

## Novità della 1.5
- **Duelli giganti con pose vere**: Tiranno rosso e Concordia hanno pose per morso/pugno, codata/montante,
  parata, colpo subito, arma finale; Trivor, Mastice risorto e Vespera Eclisse caricano, colpiscono e crollano.
- **Cinematiche dei titani**: il risveglio del Tiranno rosso (capitolo 3), la corsa dei cinque titani e
  l'unione pezzo per pezzo in Concordia con la cabina di pilotaggio (capitolo 5), Concordia Alba (capitolo 8),
  la caverna dei titani nell'intro e l'alba finale.
- **Nuovi nemici**: droni con jetpack, scudati (solo colpi forti o alle spalle), granatieri che lanciano
  granate da lontano, mastini meccanici veloci, ninja del Velo che si teletrasportano alle spalle.
- **Una meccanica per capitolo**: scooter che attraversano la strada (1), treno (2), specchi che generano
  copie oscure finché non li rompi e riflettori che cadono (4), antenna da difendere (5), generatori che
  ricaricano l'energia e pressa idraulica (6), gravità ridotta e rocce fluttuanti (7-8).
- **Livelli bonus** dopo i capitoli 2, 4 e 6: distruggi la capsula del Velo in 30 secondi.
- **Ritratti illustrati** nei dialoghi e nell'HUD.
- **Sfondi fermi** nell'intro, nelle cinematiche, nei dialoghi e nei menu: si muovono solo i personaggi.

## Novità della 1.4
- **Difficoltà** (menu principale): Facile (crediti infiniti), Normale (4 crediti per tutta la partita),
  Arcade (2 crediti, sempre dal capitolo 1, nemici più forti).
- **Crediti e GAME OVER**: quando la squadra è a terra compare CONTINUA? 10…0. Finiti i crediti è
  GAME OVER definitivo e si ricomincia da capo, anche a un passo da Vespera.
- **Combo**: attacco ×4 = pugno, calcio e due colpi con l'arma, con una scia colorata ben visibile.
- **Presa**: cammina contro un nemico per afferrarlo (vale per tutti tranne boss e droni);
  a schermo compaiono i tasti per ginocchiata e lanci.
- **Pistola**: 12 colpi, fino a 20; caricatori frequenti; sotto i 4 colpi si ricarica da sola lentamente.
  Su + sparo = colpo in diagonale verso l'alto, necessario contro i **droni del Velo**.
- **Guardia dei boss**: una barra mostra la guardia; i colpi con l'arma la sfondano e il boss resta stordito.
- **Scenari su più livelli**: auto, cassonetti e pensiline dove salire con il salto (il salto si può dirigere in aria).
- **Nemici dal basso** e, nei capitoli del Velo, da portali che si aprono nel pavimento.
- **Sigilli dei Titani**: 3 per capitolo, nascosti sopra le piattaforme, nelle casse o in angoli; si vedono in CAPITOLI.
- **Riepilogo di fine capitolo** con tempo, danni, civili salvati, continui, sigilli e voto S/A/B/C.

## Cosa contiene questa versione
- 8 capitoli giocabili con la trama del documento di progetto, ognuno con 3 zone,
  ondate di nemici, civili da proteggere e un boss con attacchi propri:
  Mastice, Centipede (si divide), Trivor (trivella e si interra), Mimesi (copie oscure
  degli eroi), Kharon (parata e onde di spada), il Custode (sfere e rinforzi),
  Kharon liberato, Vespera (raggio, teletrasporto, evocazioni).
- Capitolo 2 sul treno in corsa: il paesaggio scorre, passano i pali, tra un vagone e l'altro ci
  sono buchi da saltare (chi cade perde vita; i nemici scaraventati lì volano giù dal treno);
  i prigionieri sono chiusi in gabbie d'energia e il portale del Velo si avvicina durante il boss.
- 3 duelli giganti: Tiranno rosso contro Trivor, Concordia contro Mastice risorto,
  Concordia Alba contro Vespera Eclisse.
- Intro animata di circa un minuto, saltabile (con i ranger che appaiono dentro le cinque capsule): il lungomare con i civili, il terremoto,
  la frattura nel cielo, i soldati che escono dalle vetrine, Vespera oltre il Velo, la camera
  dei Cuori e i cinque protagonisti in borghese che si trasformano.
- Capitolo 1: si comincia in abiti civili e la prima trasformazione si fa premendo speciale.
- Cinematiche animate tra un capitolo e l'altro (e prima dei titoli di coda) che raccontano come
  prosegue la storia; dialoghi all'inizio dei capitoli e prima dei duelli giganti.
- Schermata del titolo con il logo, menu da cabinato, font pixel, HUD con barre a segmenti,
  transizioni a tendina colorata tra le scene.
- Sprite ritagliati di nuovo seguendo la sagoma: calci, pugni, spade e magie non sono più tagliati.
- Nuovi asset: logo, le cinque armi dei ranger e il Cannone Primordiale, pizza, pollo arrosto,
  bibita, cella d'energia, moneta, frammento di Cuore, casse, fusti esplosivi, bidoni, schegge; 9 tipi di civili animati;
  i 5 eroi in borghese (camminata, corsa, posa, trasformazione); due nuove varianti di soldato.
- Musica e suoni sintetizzati, diversi per ogni capitolo.

## Cooperativa online: come funziona
Il PC che crea la stanza esegue la partita; gli altri inviano i comandi e ricevono le immagini
della partita circa 20 volte al secondo. Il collegamento è diretto tra i browser (WebRTC):
serve Internet solo per l'incontro iniziale tramite il servizio pubblico gratuito di PeerJS.
Non c'è un server vostro da mantenere, quindi funziona anche da GitHub Pages.
Su alcune reti aziendali o scolastiche il collegamento diretto può essere bloccato dal firewall.
In quel caso provate da un'altra rete (ad esempio un hotspot del telefono).
Se un giocatore esce, la partita continua per gli altri.
Server di incontro personale (facoltativo): `index.html?peer=indirizzo:porta`.

## Verifiche eseguite
- Sintassi di tutti gli script e caricamento sia da server locale sia da file (`file://`).
- Partite simulate da giocatori controllati dal computer con 1, 2 e 4 giocatori su tutti gli 8 capitoli
  (galleria, cavalcata del Tiranno e crollo compresi) e sui 3 duelli giganti: tutti completabili, senza errori.
- Boss Rush completo, Sopravvivenza oltre l'ondata 20, Sfida a tempo, inserimento delle iniziali e classifiche.
- Cooperativa locale con due tastiere e con due controller simulati.
- Cooperativa online tra due browser reali: stanza, lobby, scelta degli eroi, intro, dialoghi,
  livello, duello gigante e uscita di un giocatore.
- Non sono stati provati controller fisici, Safari su Mac né reti con firewall restrittivi.

## File
`index.html`, `style.css` · `js/`: gioco (dati, motore, rendering, cinematiche, rete)
`assets/sprites`: atlanti ritagliati · `assets/bg`: fondali · `assets/source`: tavole originali
`vendor/peerjs.min.js`: libreria di rete · `tools/`: script Python che rigenerano gli asset
`assets/fonts`: font pixel con licenza libera SIL OFL (Press Start 2P, Pixelify Sans, Bungee)
`artbook.html`: catalogo visivo · `ASSET_STATUS.md`: inventario · `assets/music`: brani MP3 facoltativi.
`js/extra.js`: galleria, cavalcata, crollo, mosse in coppia, evocazione, modalità · `js/modes.js`: menu extra,
classifiche, demo, galleria, opzioni · `js/cpu.js`: giocatore controllato dal computer (demo e test).
