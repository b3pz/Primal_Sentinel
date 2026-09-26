# V0.2 CO-OP — CHANGELOG

## Nuovo
- Modalità CO-OP ONLINE per 2 giocatori.
- Creazione stanza con codice di 6 caratteri.
- Accesso stanza da secondo PC/Mac.
- Scelta Sentinel indipendente per ciascun giocatore.
- Stato PRONTO per entrambi prima dell'avvio.
- WebRTC browser-to-browser con signaling PeerJS.
- Host autoritativo per simulazione di gioco.
- Input del guest inviato all'host.
- Snapshot della partita inviati dall'host al guest a 20 Hz.
- Due HUD vita/energia.
- Nemici e Mastice scelgono il bersaglio vivo più vicino.
- Stato a terra e rianimazione del compagno restando vicini per 2 secondi.
- Pausa sincronizzata.
- Vittoria/sconfitta sincronizzate.
- Gestione disconnessione durante la sessione.

## Conservato
- Modalità 1 giocatore.
- Intro, menu e selezione eroe.
- Primo livello Porto Aurora completo.
- Tre ondate + boss Mastice.
- Casse, cure, energia, checkpoint, punteggio e combo.
- Tastiera e controller.

## Test automatici eseguiti
- `node --check game.js`: OK.
- Smoke test logico: avvio single player OK.
- Smoke test logico: due player creati in co-op OK.
- Attacco/danno nemico OK.
- Player down OK.
- Rianimazione compagno OK.

## Da verificare con due macchine reali
- WebRTC tra reti differenti.
- Safari/macOS + Chrome/Windows.
- Controller fisici.
- Latenza e fluidità su connessioni reali.
- NAT/firewall restrittivi: questa build non include un TURN dedicato.
