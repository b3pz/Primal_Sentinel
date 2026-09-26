# PRIMAL SENTINELS — Porto Aurora
Sviluppato ed ideato da b3pZ.
Build 0.2 — primo livello + cooperativa online sperimentale desktop.

## Avvio
Per la modalità singola puoi estrarre lo ZIP e aprire `index.html` su Mac o Windows.
Per il CO-OP ONLINE è consigliato pubblicare la cartella `primal-sentinels` su GitHub Pages e aprire lo stesso indirizzo su entrambi i computer. È necessaria Internet perché il collegamento usa WebRTC + PeerJS per il signaling.

## Co-op online
1. Giocatore 1: `CO-OP ONLINE` → `CREA STANZA`.
2. Condivide il codice di 6 caratteri.
3. Giocatore 2: `CO-OP ONLINE` → inserisce il codice → `ENTRA`.
4. Ognuno sceglie il proprio Sentinel.
5. Entrambi premono `PRONTO`.
6. L'host avvia automaticamente la simulazione quando entrambi sono pronti.

### Architettura
- collegamento browser-to-browser WebRTC;
- host autoritativo: nemici, danni, boss, drop, checkpoint e punteggio vengono calcolati dall'host;
- l'ospite invia solo i propri input e riceve snapshot della partita;
- targeting nemici sul Sentinel vivo più vicino;
- due barre vita/energia;
- se un Sentinel cade, il compagno lo rianima restando vicino per circa 2 secondi;
- se la connessione cade, la sessione co-op termina in modo controllato.

## Comandi
WASD / frecce: movimento. J: pugno. K: calcio. Spazio: salto.
L: speciale (40 energia). Shift sinistro: schivata. Esc: pausa. M: audio.
Controller standard: stick/croce per muoversi, X pugno, Y calcio, A salto,
B speciale, RB schivata, Start pausa. Nei menu croce e A.

## Incluso
- Intro in tre scene, menu e scelta tra cinque eroi.
- Primo livello Porto Aurora con tre ondate e Mastice.
- Single player conservato.
- Co-op online a due giocatori con stanza/codice.
- Scelta eroe indipendente P1/P2.
- Host autoritativo e sincronizzazione snapshot.
- Nemici e boss con targeting su entrambi.
- Rianimazione compagno.
- Pausa condivisa.
- HUD a due giocatori.
- Tastiera e controller sul proprio computer.

## Limiti di questa build
- Il co-op richiede Internet e il servizio pubblico di signaling PeerJS.
- Alcune VPN, firewall aziendali o NAT restrittivi possono impedire una connessione WebRTC diretta; non è incluso un TURN dedicato proprietario.
- Il controller resta da verificare con hardware reale su Mac e Windows.
- Mobile rinviato.
- Livelli 2–8 non implementati.

## GitHub Pages
Carica il contenuto della cartella `primal-sentinels` nella root del repository mantenendo `index.html`, `game.js`, `style.css` e `assets/` allo stesso livello.
