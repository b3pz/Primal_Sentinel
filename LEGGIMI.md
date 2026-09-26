# PRIMAL SENTINELS — Il cuore dei titani
Ideato e sviluppato da b3pZ. Build 1.0: campagna completa in 8 capitoli, da 1 a 4 giocatori.

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

## Comandi
| | Tastiera (1 giocatore) | Tastiera 1P (in due) | Tastiera 2P (in due) | Controller |
|---|---|---|---|---|
| Muovi | WASD / frecce | WASD | frecce | stick / croce |
| Pugno (3 = combo) | J | F | K / Num1 | X |
| Calcio | K | G | L / Num2 | Y |
| Salto (+ attacco in aria) | Spazio | Spazio | I / Num0 | A |
| Speciale | L | R | O / Num3 | B |
| Schivata | Shift | Shift sinistro | Shift destro | RB / RT |
| Colpo di squadra | I | T | P / Num4 | LB |
| Pausa | Esc / Invio | Esc | Invio | Start |

Doppio tocco avanti: corsa (pugno in corsa = carica). Cammina contro un nemico stordito
per **afferrarlo**: pugno = ginocchiate, calcio = lancio (travolge gli altri nemici).
Pugno sopra un'arma per raccoglierla. I fusti rossi esplodono. Lo speciale costa 40 di
energia; senza energia costa un po' di vita, come nei cabinati. La barra squadra si riempie
colpendo: quando è piena, il colpo di squadra fa la posa tokusatsu e colpisce tutto lo schermo.

**Duelli giganti** (capitoli 3, 5 e 8): tutti i giocatori pilotano insieme il titano o Concordia.
Pugno e calcio attaccano, schivata tenuta premuta para, salto fa un passo rapido.
Quando la barra "equilibrio" del mostro si svuota, speciale lancia l'arma finale.

## Cosa contiene questa versione
- 8 capitoli giocabili con la trama del documento di progetto, ognuno con 3 zone,
  ondate di nemici, civili da proteggere e un boss con attacchi propri:
  Mastice, Centipede (si divide), Trivor (trivella e si interra), Mimesi (copie oscure
  degli eroi), Kharon (parata e onde di spada), il Custode (sfere e rinforzi),
  Kharon liberato, Vespera (raggio, teletrasporto, evocazioni).
- 3 duelli giganti: Tiranno rosso contro Trivor, Concordia contro Mastice risorto,
  Concordia Alba contro Vespera Eclisse.
- Intro animata di circa un minuto, saltabile: il lungomare con i civili, il terremoto,
  la frattura nel cielo, i soldati che escono dalle vetrine, Vespera oltre il Velo, la camera
  dei Cuori e i cinque protagonisti in borghese che si trasformano.
- Capitolo 1: si comincia in abiti civili e la prima trasformazione si fa premendo speciale.
- Dialoghi prima, durante e dopo ogni capitolo, con i personaggi in scena. Finale con i titoli di coda.
- Sprite ritagliati di nuovo seguendo la sagoma: calci, pugni, spade e magie non sono più tagliati.
- Nuovi asset: pizza, pollo arrosto, bibita, cella d'energia, moneta, frammento di Cuore,
  tubo d'acciaio, remo, casse, fusti esplosivi, bidoni, schegge; 9 tipi di civili animati;
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
- Partite simulate da un bot con 1, 2 e 4 giocatori su tutti gli 8 capitoli e i 3 duelli giganti:
  tutti completabili, senza errori.
- Cooperativa locale con due tastiere e con due controller simulati.
- Cooperativa online tra due browser reali: stanza, lobby, scelta degli eroi, intro, dialoghi,
  livello, duello gigante e uscita di un giocatore.
- Non sono stati provati controller fisici, Safari su Mac né reti con firewall restrittivi.

## File
`index.html`, `style.css` · `js/`: gioco (dati, motore, rendering, cinematiche, rete)
`assets/sprites`: atlanti ritagliati · `assets/bg`: fondali · `assets/source`: tavole originali
`vendor/peerjs.min.js`: libreria di rete · `tools/`: script Python che rigenerano gli asset
`artbook.html`: catalogo visivo · `ASSET_STATUS.md`: inventario.
