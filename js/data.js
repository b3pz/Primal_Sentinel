'use strict';
/* ============================================================
   PRIMAL SENTINELS — dati di gioco
   Eroi, nemici, boss, oggetti, capitoli e testi della storia.
   ============================================================ */

const HEROES = [
  { id: 'ignis', name: 'IGNIS', civil: 'Marco', role: 'Equilibrato', color: '#ff5b4f', glow: '#ff8a5a', power: 1.0, speed: 250, hp: 120,
    special: 'RUGGITO DI FUOCO', weapon: 'SPADA ZANNA', specialText: 'Onda di fuoco tutt\'intorno', titan: 'Tiranno rosso' },
  { id: 'azur', name: 'AZUR', civil: 'Davide', role: 'Tecnico', color: '#5d9bff', glow: '#8cc4ff', power: 0.95, speed: 262, hp: 115,
    special: 'CARICA DEL TRICORNO', weapon: 'LANCIA TRICORNO', specialText: 'Scatto che travolge tutto sulla linea', titan: 'Triceratopo blu' },
  { id: 'lyra', name: 'LYRA', civil: 'Nadia', role: 'Veloce', color: '#f7d046', glow: '#ffe98a', power: 0.85, speed: 300, hp: 105,
    special: 'ARTIGLIO FULMINEO', weapon: 'ARTIGLI FELINI', specialText: 'Raffica di colpi rapidissimi', titan: 'Felino giallo' },
  { id: 'aura', name: 'AURA', civil: 'Sofia', role: 'Distanza', color: '#ff78bb', glow: '#ffb2da', power: 0.9, speed: 268, hp: 110,
    special: 'ALA DI LUCE', weapon: 'ARCO D\'ALA', specialText: 'Lama d\'energia che attraversa lo schermo', titan: 'Pterosauro rosa' },
  { id: 'onyx', name: 'ONYX', civil: 'Bruno', role: 'Potente', color: '#b9c6d4', glow: '#e3ecf5', power: 1.25, speed: 222, hp: 140,
    special: 'ZANNA TELLURICA', weapon: 'MARTELLO ZANNA', specialText: 'Pugno a terra che abbatte tutti', titan: 'Mastodonte nero' },
];

/* Frame convention of the fighters atlas (per character):
   0 guardia · 1-3 camminata · 4 caricamento · 5 pugno · 6 calcio · 7 colpito */

const ENEMIES = {
  soldier: { sheet: 'fighters', pre: 'soldier', name: 'Senzavolto', hp: 55, speed: 110, dmg: 9, reach: 88, scale: 0.86, score: 200, wind: 0.5, aggro: 1 },
  lancer: { sheet: 'fighters', pre: 'lancer', name: 'Lama del Velo', hp: 48, speed: 165, dmg: 11, reach: 96, scale: 0.86, score: 260, wind: 0.36, aggro: 1.35, lunge: true },
  brute: { sheet: 'fighters', pre: 'brute', name: 'Bruto di ruggine', hp: 120, speed: 80, dmg: 17, reach: 104, scale: 1.02, score: 450, wind: 0.75, aggro: 0.8, heavy: true },
  segment: { sheet: 'bosses', pre: 'centipede', name: 'Segmento', hp: 60, speed: 150, dmg: 10, reach: 105, scale: 0.62, score: 350, wind: 0.45, aggro: 1.2, villain: true, lunge: true },
  shade: { sheet: 'fighters', pre: 'HERO', name: 'Copia oscura', hp: 70, speed: 150, dmg: 12, reach: 96, scale: 0.86, score: 500, wind: 0.42, aggro: 1.3, shade: true },
};

/* Boss frames: villains 0 guardia · 1-2 passo · 3 carica · 4 attacco · 5 colpito.
   Mastice has 8 frames: 0-2 passo · 3 carica · 4 pugno · 5 schianto · 6 colpito · 7 a terra */
const BOSSES = {
  mastice: { name: 'MASTICE', title: 'COLOSSO DI ASFALTO', hp: 620, scale: 0.78, speed: 95, reach: 175, dmg: 22, frames: 8, pattern: ['punch', 'slam', 'punch', 'charge'] },
  centipede: { name: 'CENTIPEDE', title: 'IL MOSTRO CHE SI DIVIDE', hp: 680, scale: 1.35, speed: 130, reach: 215, dmg: 20, frames: 6, pattern: ['lunge', 'claw', 'split', 'lunge'] },
  trivor: { name: 'TRIVOR', title: 'LA BESTIA TRIVELLA', hp: 760, scale: 1.4, speed: 110, reach: 190, dmg: 24, frames: 6, pattern: ['drill', 'burrow', 'claw', 'drill'] },
  mimesi: { name: 'MIMESI', title: 'LADRA DI MOSSE', hp: 700, scale: 1.3, speed: 150, reach: 200, dmg: 20, frames: 6, pattern: ['slash', 'mirror', 'lunge', 'slash'] },
  kharon: { name: 'KHARON', title: 'IL COMANDANTE DEL VELO', hp: 820, scale: 1.25, speed: 145, reach: 205, dmg: 23, frames: 6, pattern: ['slash', 'lunge', 'guard', 'slash', 'wave'] },
  custode: { name: 'IL CUSTODE', title: 'DIFESA DELL\'ANTICA FLOTTA', hp: 900, scale: 1.35, speed: 90, reach: 230, dmg: 24, frames: 6, pattern: ['sweep', 'orbs', 'sweep', 'summon'] },
  kharon2: { sprite: 'kharon', name: 'KHARON', title: 'PRIGIONIERO DELLA CORAZZA', hp: 950, scale: 1.25, speed: 165, reach: 205, dmg: 25, frames: 6, pattern: ['slash', 'wave', 'lunge', 'guard', 'wave'] },
  vespera: { name: 'VESPERA', title: 'LA REGINA DEL VELO', hp: 1100, scale: 1.3, speed: 120, reach: 520, dmg: 24, frames: 6, pattern: ['blast', 'teleport', 'orbs', 'summon', 'blast'] },
};

/* Giant duels (titan vs giant monster) */
const GIANTS = {
  trivor: { sprite: 'trivor', name: 'TRIVOR GIGANTE', hp: 900, scale: 2.7, dmg: 16 },
  mastice: { sprite: 'mastice', name: 'MASTICE RISORTO', hp: 1100, scale: 1.45, dmg: 18, frames: 8 },
  eclipse: { sprite: 'eclipse', name: 'VESPERA ECLISSE', hp: 1300, scale: 2.05, dmg: 21 },
};

const ITEMS = {
  pizza: { heal: 30, label: 'PIZZA' },
  chicken: { heal: 65, label: 'POLLO ARROSTO' },
  can: { heal: 14, label: 'BIBITA' },
  energy: { energy: 35, label: 'CELLA D\'ENERGIA' },
  coin: { score: 500, label: 'MONETA' },
  gem: { score: 1500, team: 25, label: 'FRAMMENTO DI CUORE' },
  pipe: { weapon: true, dmg: 1.7, reach: 42, uses: 14, label: 'TUBO D\'ACCIAIO' },
  oar: { weapon: true, dmg: 1.5, reach: 74, uses: 11, label: 'REMO' },
};

const PROPS = {
  crate: { hp: 2, drops: ['pizza', 'can', 'coin', 'energy', 'chicken'] },
  bin: { hp: 1, drops: ['can', 'coin', 'pizza'] },
  barrel: { hp: 1, explode: true, drops: [] },
};

/* Walkable band (feet y). Backgrounds have been normalised so the floor starts at 465. */
const FLOOR_TOP = 492, FLOOR_BOTTOM = 700;

/* civ types available for background civilians */
const CIVS = ['waiter', 'fisher', 'lady', 'elder', 'tourist', 'girl', 'suit', 'kid'];

/* ------------------------------------------------------------
   CAPITOLI
   zones: arena che si blocca finché non sono sconfitte le ondate.
   w: ondate [tipo, quantità]; c: civili da proteggere; p: oggetti di scena
   ------------------------------------------------------------ */
const LEVELS = [
  {
    n: 1, id: 'porto', title: 'LA NOTTE DELLE SIRENE', place: 'PORTO AURORA', bg: 'port', length: 4700, music: 0,
    zones: [
      { x: 700, name: 'IL LUNGOMARE', w: [['soldier', 3], ['soldier', 2]], c: ['waiter', 'lady'], p: [['crate', 520, 560], ['bin', 980, 640]] },
      { x: 1700, name: 'LA STRADA DEI NEGOZI', w: [['soldier', 3], ['lancer', 2], ['soldier', 2]], c: ['elder', 'kid'], p: [['barrel', 1560, 540], ['crate', 1850, 650], ['crate', 2100, 530]] },
      { x: 2750, name: 'IL CANCELLO DEL PORTO', w: [['soldier', 3], ['brute', 1], ['lancer', 3]], c: ['fisher'], p: [['bin', 2600, 600], ['barrel', 2950, 670], ['crate', 3150, 560]] },
      { x: 3780, name: 'MASTICE', boss: 'mastice', p: [['crate', 3700, 520]] },
    ],
    weapons: [['pipe', 1300, 600]],
    intro: [
      ['NARRATORE', 'Porto Aurora, 23:47. Le sirene suonano da dieci minuti. Nessuno sa ancora perché.'],
      ['IGNIS', 'Sono usciti dagli specchi delle vetrine... Prima i civili: portiamoli via dal lungomare!'],
    ],
    outro: [
      ['NARRATORE', 'Tra i resti di Mastice brilla un simbolo: lo stesso inciso sulle armature dei Sentinels.'],
      ['AZUR', 'Non stava attaccando a caso. Scavava. Cercava qualcosa sotto la città.'],
      ['NARRATORE', 'Intanto, un convoglio carico di prigionieri corre verso un portale. A bordo c\'è una scienziata rapita.'],
    ],
  },
  {
    n: 2, id: 'convoglio', title: 'IL CONVOGLIO DEI PRIGIONIERI', place: 'STAZIONE MERCI', bg: 'rail', length: 4600, music: 1, train: 1650,
    zones: [
      { x: 650, name: 'LO SCALO MERCI', w: [['soldier', 3], ['lancer', 2]], c: ['suit'], p: [['crate', 500, 600], ['barrel', 900, 560]] },
      { x: 1650, name: 'I VAGONI DEI PRIGIONIERI', w: [['lancer', 3], ['soldier', 3], ['brute', 1]], c: ['girl', 'scientist'], p: [['crate', 1900, 650], ['crate', 2100, 540]] },
      { x: 2700, name: 'LA LOCOMOTIVA', w: [['brute', 2], ['lancer', 3], ['soldier', 2]], c: ['elder', 'kid'], p: [['barrel', 2600, 620], ['crate', 3000, 540]] },
      { x: 3700, name: 'CENTIPEDE', boss: 'centipede', p: [] },
    ],
    weapons: [['pipe', 1200, 640], ['oar', 2400, 560]],
    intro: [
      ['NARRATORE', 'Il convoglio ha già lasciato la città. Dieci minuti al portale.'],
      ['LYRA', 'Dentro ci sono persone. Io salto sul treno: voi coprite i vagoni!'],
    ],
    outro: [
      ['DOTT.SSA VALLI', 'Mi chiamo Irene Valli. Ho studiato le vostre armature per vent\'anni, senza sapere cosa fossero.'],
      ['DOTT.SSA VALLI', 'Sotto il vecchio parco preistorico dorme il primo dei titani. E Vespera lo sa.'],
    ],
  },
  {
    n: 3, id: 'foresta', title: 'LA FORESTA DI ACCIAIO', place: 'PARCO PREISTORICO', bg: 'park', length: 4600, music: 2,
    zones: [
      { x: 650, name: 'L\'INGRESSO DEL PARCO', w: [['soldier', 4], ['lancer', 2]], c: [], p: [['crate', 520, 600], ['bin', 950, 540]] },
      { x: 1650, name: 'LE MONTAGNE RUSSE', w: [['brute', 2], ['lancer', 3], ['soldier', 2]], c: ['tourist'], p: [['barrel', 1500, 560], ['crate', 1900, 650]] },
      { x: 2700, name: 'LA SERRA ABBANDONATA', w: [['lancer', 4], ['brute', 2]], c: [], p: [['crate', 2600, 540], ['barrel', 3000, 650]] },
      { x: 3700, name: 'TRIVOR', boss: 'trivor', p: [] },
    ],
    weapons: [['oar', 1150, 600]],
    giant: { player: 'rex', enemy: 'trivor', bg: 'park' },
    intro: [
      ['DOTT.SSA VALLI', 'Il segnale viene da sotto il recinto del tirannosauro. Sentite anche voi questo battito?'],
      ['ONYX', 'Lo sento nel petto. Come se l\'armatura... riconoscesse casa.'],
    ],
    mid: [
      ['TRIVOR', 'GRRRAAAH! Il Velo mi dona la sua forza!'],
      ['NARRATORE', 'Trivor cresce fino a sovrastare gli alberi. Sotto i piedi dei Sentinels la terra si apre...'],
      ['IGNIS', 'Il titano si è svegliato! Tutti a bordo: TIRANNO ROSSO, IN PIEDI!'],
    ],
    outro: [
      ['VESPERA', '«Inginocchiati, mio guardiano.»'],
      ['NARRATORE', 'Per un istante il Tiranno rosso obbedisce alla voce di Vespera. Poi si scuote e ruggisce contro il cielo.'],
      ['AURA', 'Lei lo conosce. E lui conosce lei. Cosa ci stanno nascondendo questi titani?'],
    ],
  },
  {
    n: 4, id: 'teatro', title: 'IL TEATRO DEGLI SPECCHI', place: 'QUARTIERE DEL VELO', bg: 'theater', length: 4500, music: 3,
    zones: [
      { x: 650, name: 'IL FOYER', w: [['lancer', 3], ['soldier', 3]], c: ['lady'], p: [['crate', 520, 600]] },
      { x: 1650, name: 'LA GALLERIA DEGLI SPECCHI', w: [['shade', 2], ['soldier', 3], ['lancer', 2]], c: [], p: [['barrel', 1500, 640], ['bin', 1900, 540]] },
      { x: 2700, name: 'IL PALCOSCENICO', w: [['shade', 3], ['brute', 2], ['lancer', 2]], c: ['suit'], p: [['crate', 2600, 560], ['crate', 3050, 660]] },
      { x: 3650, name: 'MIMESI', boss: 'mimesi', p: [] },
    ],
    weapons: [['pipe', 1300, 560]],
    intro: [
      ['NARRATORE', 'Un intero quartiere è diventato un set irreale. Ogni specchio riflette qualcuno che non c\'è.'],
      ['AZUR', 'Quelle copie... si muovono come noi. Qualcuno ci ha studiati.'],
    ],
    outro: [
      ['VESPERA', 'Guardate, piccoli custodi. Guardate cosa facevano i vostri titani quando erano miei.'],
      ['NARRATORE', 'Negli specchi infranti scorrono immagini vere: i cinque titani che radono al suolo le città di un altro mondo.'],
      ['LYRA', '...Non può essere vero.'],
    ],
  },
  {
    n: 5, id: 'assedio', title: 'ASSEDIO A PORTO AURORA', place: 'CITTÀ SOTTO ASSEDIO', bg: 'siege', length: 4700, music: 4,
    zones: [
      { x: 650, name: 'IL LUNGOMARE IN FIAMME', w: [['soldier', 4], ['lancer', 3]], c: ['waiter', 'kid'], p: [['barrel', 560, 650], ['crate', 950, 540]] },
      { x: 1700, name: 'I TETTI', w: [['brute', 2], ['lancer', 4]], c: ['elder'], p: [['crate', 1550, 600], ['bin', 1950, 660]] },
      { x: 2750, name: 'IL CENTRO COMUNICAZIONI', w: [['brute', 2], ['lancer', 3], ['soldier', 3]], c: ['girl', 'fisher'], p: [['barrel', 2650, 560], ['crate', 3050, 640]] },
      { x: 3750, name: 'KHARON', boss: 'kharon', p: [] },
    ],
    weapons: [['pipe', 1250, 620], ['oar', 2350, 560]],
    giant: { player: 'concordia', enemy: 'mastice', bg: 'siege' },
    intro: [
      ['KHARON', 'Consegnatemi i Cuori e la città vivrà. Rifiutate e la guarderete bruciare.'],
      ['IGNIS', 'Porto Aurora è casa nostra. Non trattiamo con chi la incendia!'],
    ],
    mid: [
      ['KHARON', 'Siete migliori di quanto credessi. Ma questa notte non è mia: è sua.'],
      ['NARRATORE', 'Kharon spezza un frammento del Velo sui resti di Mastice. Il colosso si rialza, alto come un palazzo.'],
      ['AURA', 'Da soli non basta. Tutti e cinque, adesso: UNIONE DEI TITANI!'],
      ['NARRATORE', 'Per la prima volta i cinque titani si agganciano l\'uno all\'altro. Nasce CONCORDIA.'],
    ],
    outro: [
      ['NARRATORE', 'Il colosso cade in mare. Nella luce dell\'esplosione, Kharon esita. Poi scompare nel Velo.'],
      ['DOTT.SSA VALLI', 'Ho decifrato le incisioni: sotto il porto c\'è una fabbrica. Un cimitero di titani.'],
    ],
  },
  {
    n: 6, id: 'cimitero', title: 'IL CIMITERO DEI TITANI', place: 'FABBRICA SOTTERRANEA', bg: 'graveyard', length: 4600, music: 5, noRegen: true,
    zones: [
      { x: 650, name: 'LE GALLERIE', w: [['soldier', 3], ['brute', 2]], c: [], p: [['crate', 520, 600], ['crate', 930, 660]] },
      { x: 1650, name: 'LA CATENA DI MONTAGGIO', w: [['lancer', 4], ['brute', 2]], c: [], p: [['barrel', 1500, 560], ['barrel', 1950, 650]] },
      { x: 2700, name: 'LA SALA DEI CUORI SPENTI', w: [['shade', 2], ['brute', 2], ['lancer', 3]], c: ['scientist'], p: [['crate', 2600, 640], ['bin', 3000, 540]] },
      { x: 3700, name: 'IL CUSTODE', boss: 'custode', p: [] },
    ],
    weapons: [['pipe', 1200, 600], ['pipe', 2300, 640]],
    intro: [
      ['NARRATORE', 'Scheletri di macchine giganti riempiono la caverna. Qui le armature perdono energia.'],
      ['ONYX', 'Le celle non si ricaricano. Qualunque cosa ci sia qui sotto... ci sta svuotando.'],
    ],
    outro: [
      ['KHARON', 'Aspettate. Non combatto contro di voi.'],
      ['KHARON', 'Mille anni fa ero il primo pilota dei titani. Fui io a liberarli da Vespera e a cancellarne la memoria.'],
      ['KHARON', 'Lei mi punì con questa corazza. Finché la indosso, devo obbedirle. Distruggetela... oltre il Velo.'],
    ],
  },
  {
    n: 7, id: 'velo', title: 'OLTRE IL VELO', place: 'PALAZZO DIMENSIONALE', bg: 'veil', length: 4600, music: 6,
    zones: [
      { x: 650, name: 'IL PONTE SOSPESO', w: [['shade', 2], ['lancer', 3], ['soldier', 2]], c: [], p: [['crate', 520, 600]] },
      { x: 1650, name: 'LE TORRI CAPOVOLTE', w: [['brute', 3], ['lancer', 3], ['segment', 2]], c: [], p: [['barrel', 1500, 640], ['crate', 1950, 540]] },
      { x: 2700, name: 'LA SCALINATA', w: [['shade', 3], ['brute', 2], ['segment', 2]], c: [], p: [['crate', 2650, 560], ['barrel', 3050, 650]] },
      { x: 3700, name: 'KHARON', boss: 'kharon2', p: [] },
    ],
    weapons: [['oar', 1200, 620]],
    intro: [
      ['NARRATORE', 'Oltre il Velo, la gravità cambia direzione a ogni passo. I nemici delle prime notti sono tornati, più forti.'],
      ['LYRA', 'Kharon è in cima alla scalinata. Dobbiamo spezzare la sua corazza senza ucciderlo.'],
    ],
    outro: [
      ['KHARON', 'La corazza... si è spezzata. Sono libero. Grazie, Sentinels.'],
      ['VESPERA', 'Che commovente. E adesso, miei titani... tornate da me.'],
      ['NARRATORE', 'Uno dopo l\'altro, i cinque titani si voltano verso Vespera. Per salvarli bisogna raggiungere i loro Cuori dall\'interno.'],
    ],
  },
  {
    n: 8, id: 'alba', title: 'L\'ULTIMA ALBA', place: 'LA FORTEZZA DEL VELO', bg: 'dawn', length: 4600, music: 7,
    zones: [
      { x: 650, name: 'LE ROVINE DELL\'ALBA', w: [['shade', 3], ['brute', 2], ['lancer', 2]], c: [], p: [['crate', 520, 600], ['barrel', 950, 650]] },
      { x: 1650, name: 'I FRAMMENTI DELLA CITTÀ', w: [['segment', 3], ['lancer', 3], ['brute', 2]], c: ['kid', 'elder'], p: [['crate', 1500, 540], ['crate', 1950, 660]] },
      { x: 2700, name: 'IL CUORE DELLA FORTEZZA', w: [['shade', 4], ['brute', 3]], c: [], p: [['barrel', 2600, 560], ['barrel', 3050, 650]] },
      { x: 3700, name: 'VESPERA', boss: 'vespera', p: [] },
    ],
    weapons: [['pipe', 1150, 600], ['oar', 2350, 560]],
    giant: { player: 'concordia', enemy: 'eclipse', bg: 'dawn', final: true },
    intro: [
      ['KHARON', 'Vi apro la strada. L\'ultima battaglia è vostra.'],
      ['IGNIS', 'Sentinels... questa è l\'ultima alba del Velo!'],
    ],
    mid: [
      ['VESPERA', 'Se non posso avere i titani, avrò questo mondo intero!'],
      ['NARRATORE', 'Vespera si fonde con la sua fortezza. Il cielo diventa nero.'],
      ['AZUR', 'I Cuori ci rispondono ancora... ma non come prima. Non stiamo più dando ordini.'],
      ['ONYX', 'Allora chiediamolo. Titani: volete combattere con noi?'],
      ['NARRATORE', 'I titani, finalmente liberi, scelgono di restare. Nasce la forma finale: CONCORDIA ALBA.'],
    ],
    outro: [
      ['NARRATORE', 'Il Velo si richiude per sempre. Sul mare di Porto Aurora sorge il sole.'],
      ['IGNIS', 'Non abbiamo vinto perché li controllavamo. Abbiamo vinto perché hanno scelto noi.'],
      ['NARRATORE', 'I titani tornano a dormire sotto la città. Questa volta, come custodi. FINE.'],
    ],
  },
];

/* Speaker → portrait sprite for dialogue boxes */
const SPEAKERS = {
  'IGNIS': ['fighters', 'ignis_0', '#ff5b4f'], 'AZUR': ['fighters', 'azur_0', '#5d9bff'], 'LYRA': ['fighters', 'lyra_0', '#f7d046'],
  'AURA': ['fighters', 'aura_0', '#ff78bb'], 'ONYX': ['fighters', 'onyx_0', '#b9c6d4'],
  'KHARON': ['bosses', 'kharon_0', '#d24a5a'], 'VESPERA': ['bosses', 'vespera_0', '#b77dff'], 'TRIVOR': ['bosses', 'trivor_0', '#4fc3a8'],
  'DOTT.SSA VALLI': ['people', 'scientist_idle0', '#9fd6ff'], 'NARRATORE': null,
};
