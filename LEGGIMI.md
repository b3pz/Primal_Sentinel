# PRIMAL SENTINELS — Porto Aurora
Sviluppato ed ideato da b3pZ.
Build 0.1 — primo livello, single player desktop.

## Avvio
Estrai tutto lo ZIP, poi apri `index.html` in un browser su Mac o Windows.
Non aprire il file direttamente dentro lo ZIP. Non occorrono installazioni,
account, librerie esterne o connessione per la modalità singola.
Per GitHub Pages, pubblica il contenuto della cartella `primal-sentinels`
come sito statico mantenendo `index.html` e `assets` nella stessa directory.
Questo pacchetto non è già stato caricato su un repository o pubblicato.

## Incluso e implementato
- Intro in tre scene, saltabile; menu, scelta tra cinque eroi.
- Un livello a scorrimento con tre ondate (4, 6, 7 soldati) e Mastice.
- Movimento su due assi, pugno, calcio, salto, speciale e schivata.
- Eroi con velocità/potenza diverse; energia, salute, punteggio e contatore colpi.
- Boss con anticipazione dei colpi e attacco ad area, più aggressivo a metà vita.
- Casse distruttibili con cure; recuperi di energia.
- Checkpoint tra le zone nella sessione; pausa; vittoria e sconfitta.
- Suoni sintetizzati localmente e accompagnamento minimale.
- Input tastiera e controller standard; controller non verificato con hardware reale.
- Tavole di riferimento aggiuntive per ambientazioni, boss e titani.

## Comandi
WASD / frecce: movimento. J: pugno. K: calcio. Spazio: salto.
L: speciale (40 energia). Shift sinistro: schivata. Esc: pausa. M: audio.
Controller standard: stick/croce per muoversi, X pugno, Y calcio, A salto,
B speciale, RB schivata, Start pausa. Nei menu croce e A.
Con tastiera: Tab e Invio per navigare i menu.

## Stato effettivo
È una prima build giocabile, non la campagna completa né una versione finale.
Il multiplayer online con codice non è implementato. Nessun server viene contattato.
Mobile rinviato. Livelli 2–8 non implementati.
Le cinematiche sono scene statiche con testo, non filmati animati o doppiati.
Le animazioni del primo livello sono essenziali; salto e schivata riutilizzano pose.
Il checkpoint non sopravvive al ricaricamento della pagina. Il completamento viene
registrato localmente quando il browser lo consente, ma non sblocca contenuti inesistenti.
Consulta ASSET_STATUS.md per ciò che è ancora da produrre.

## Verifica
Controllo sintassi JavaScript superato. Caricamento delle immagini e rendering
Canvas eseguiti. Simulazione della logica di combattimento completata fino alla
vittoria in tutte e quattro le zone, con posizionamento/energia controllati dal test.
Verificati movimento, salto, pausa, sconfitta e checkpoint. Non è una prova di
bilanciamento eseguita da una persona. Browser automatico non disponibile:
non sono certificati Safari/macOS, Chrome/Windows, audio e controller reali.

## File
`game.js`: logica e rendering; `style.css`: menu; `assets`: immagini.
`artbook.html`: catalogo delle tavole e regole di coerenza.
`ASSET_STATUS.md`: inventario, limiti e lavori mancanti.
`ART_BIBLE.md`: scelte visive da preservare.
