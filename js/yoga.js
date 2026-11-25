// Yoga & Dehnen: Posen-Katalog (mit Strichfiguren), Programme, Baukasten und Zeitplanung
// Figuren: Gelenkpunkte in einem 120×100-Feld (Boden y=93). h Kopf, s Schulter, w Hüfte, c Wirbelsäulen-Kurve (optional),
// k1/f1 nahes Bein, k2/f2 fernes Bein, e1/a1 naher Arm, e2/a2 ferner Arm. hl = gedehnte Segmente (orange).
// Mehrere Personen: fig = [A, B] (B wird lila gezeichnet). env = Umgebung (Wand, Stuhl, Ball …), top = Draufsicht.

const STAND = { h: [60, 19], s: [60, 30], w: [60, 58], k1: [61, 76], f1: [61, 93], k2: [59, 76], f2: [59, 93], e1: [61, 44], a1: [62, 57], e2: [59, 44], a2: [58, 57] };
const CHAIR = '<path d="M44 66 H74 M47 66 V93 M71 66 V93 M44 66 V32"/>';
const CHAIR_F = '<path d="M44 66 H76 M46 66 V93 M74 66 V93"/>';
const WALL_R = '<line x1="101" y1="4" x2="101" y2="93"/>';
const LIE = { h: [18, 85], s: [29, 88], w: [57, 88] };

export const TAGS = {
  ruecken: 'Rücken', nacken: 'Nacken', schulter: 'Schultern', brust: 'Brust', huefte: 'Hüfte',
  vbein: 'Oberschenkel vorn', hbein: 'Oberschenkel hinten', wade: 'Waden', fuss: 'Füße', arme: 'Arme & Hände',
  atem: 'Atmung', balance: 'Balance', ganz: 'Ganzkörper'
};
export const TAG_ZONES = {
  ruecken: ['lowerback', 'upperback', 'lats'], nacken: ['traps'], schulter: ['shoulders'], brust: ['chest'],
  huefte: ['glutes', 'adductors'], vbein: ['quads'], hbein: ['hamstrings'], wade: ['calves'], fuss: ['calves'],
  arme: ['forearms', 'triceps'], atem: [], balance: [], ganz: []
};
export const PLACES = { m: 'Matte', st: 'im Stehen', si: 'im Sitzen' };

// h = Haltezeit [min, Standard, max] in Sekunden. seq = Reihenfolge im Baukasten (1 aufwärmen … 6 Entspannung)
export const POSES = [
  // ── Stehend ──
  { id: 'berg', n: 'Berghaltung', place: ['st'], seq: 2, tags: ['atem', 'ganz'], h: [20, 30, 60],
    d: 'Aufrecht stehen, Füße hüftbreit, Gewicht gleichmäßig auf beiden Füßen. Knie locker, Scheitel nach oben ziehen, Schultern sinken lassen. Ruhig durch die Nase atmen.',
    cue: 'Aufrecht stehen, Schultern locker, ruhig atmen.', fig: STAND },
  { id: 'sg_arme', n: 'Arme nach oben', place: ['st'], seq: 2, tags: ['schulter', 'ganz'], h: [5, 5, 10], hidden: true,
    d: 'Mit dem Einatmen die Arme über die Seiten nach oben führen, Blick folgt den Händen.', cue: 'Einatmen, Arme hoch.',
    fig: { ...STAND, e1: [67, 18], a1: [71, 6], e2: [65, 18], a2: [68, 6], hl: ['up1', 'up2'] } },
  { id: 'seit_st', n: 'Stehende Seitdehnung', place: ['st'], seq: 2, side: true, tags: ['ruecken', 'schulter'], h: [15, 25, 40],
    d: 'Hüftbreit stehen, beide Arme über den Kopf strecken, Hände fassen. Mit dem Ausatmen den Oberkörper zur Seite neigen – nicht nach vorn kippen. Die ganze Flanke wird lang.',
    easy: 'Eine Hand an der Hüfte abstützen.', cue: 'Arme hoch und zur Seite neigen, die Flanke wird lang.',
    fig: { h: [49, 22], s: [54, 31], w: [60, 58], k1: [56, 76], f1: [54, 93], k2: [64, 76], f2: [66, 93], e1: [47, 15], a1: [40, 6], e2: [52, 15], a2: [43, 7], hl: ['torso', 'up2'] } },
  { id: 'vorbeuge_st', n: 'Stehende Vorbeuge', place: ['st'], seq: 2, tags: ['hbein', 'ruecken'], h: [15, 30, 50],
    d: 'Aus dem Stand mit geradem Rücken aus der Hüfte nach vorn beugen und den Oberkörper hängen lassen. Knie ruhig deutlich beugen, Kopf und Arme schwer werden lassen.',
    easy: 'Hände auf die Oberschenkel oder einen Stuhl stützen.', cue: 'Nach vorn hängen lassen, Knie gern beugen.',
    fig: { h: [66, 85], s: [68, 75], w: [56, 55], k1: [61, 75], f1: [60, 93], k2: [59, 75], f2: [58, 93], e1: [69, 84], a1: [69, 92], e2: [67, 84], a2: [67, 92], hl: ['thigh1'] } },
  { id: 'halbe_vorbeuge', n: 'Halbe Vorbeuge', place: ['st'], seq: 2, tags: ['hbein', 'ruecken'], h: [5, 15, 30],
    d: 'Aus der Vorbeuge den Rücken lang machen, bis er etwa waagerecht ist. Hände auf die Schienbeine oder Oberschenkel, Blick zum Boden, Nacken lang.',
    cue: 'Rücken lang, Hände an die Schienbeine.',
    fig: { h: [91, 52], s: [82, 55], w: [56, 56], k1: [59, 75], f1: [58, 93], k2: [57, 75], f2: [56, 93], e1: [78, 65], a1: [67, 72], e2: [77, 66], a2: [66, 73], hl: ['torso', 'thigh1'] } },
  { id: 'nacken', n: 'Seitliche Nackendehnung', place: ['st', 'si'], seq: 1, side: true, tags: ['nacken'], h: [15, 25, 40],
    d: 'Aufrecht sitzen oder stehen. Ein Ohr Richtung Schulter sinken lassen, die Hand derselben Seite liegt sanft auf dem Kopf. Die andere Schulter aktiv nach unten schieben. Nicht ziehen, nur das Gewicht der Hand wirken lassen.',
    cue: 'Ohr zur Schulter, die andere Schulter nach unten.',
    fig: { h: [67, 22], s: [60, 31], w: [60, 58], k1: [57, 76], f1: [56, 93], k2: [63, 76], f2: [64, 93], e1: [74, 24], a1: [68, 15], e2: [53, 44], a2: [50, 57], hl: ['neck'] } },
  { id: 'schulterkreisen', n: 'Schulterkreisen', place: ['st', 'si'], seq: 1, dyn: true, tags: ['schulter', 'nacken'], h: [20, 30, 45],
    d: 'Fingerspitzen auf die Schultern legen und mit den Ellbogen große Kreise malen – erst vorwärts, nach der Hälfte rückwärts. Im Atemrhythmus bewegen.',
    cue: 'Fingerspitzen auf die Schultern, große Kreise mit den Ellbogen.',
    fig: { ...STAND, e1: [72, 25], a1: [64, 29], e2: [48, 25], a2: [56, 29], k1: [57, 76], f1: [56, 93], k2: [63, 76], f2: [64, 93], hl: ['up1', 'up2'],
      env: '<path class="mv" d="M78 17 a8 8 0 1 1 -6 -3"/>' } },
  { id: 'brust_st', n: 'Brustöffner im Stehen', place: ['st', 'si'], seq: 2, tags: ['brust', 'schulter'], h: [15, 25, 40],
    d: 'Hände hinter dem Rücken verschränken (oder ein Handtuch greifen). Arme lang machen, Schulterblätter zusammen und Brustbein nach vorn-oben heben. Nicht ins Hohlkreuz fallen.',
    easy: 'Mit Handtuch zwischen den Händen ist es leichter.', cue: 'Hände hinter dem Rücken, Brust nach vorn öffnen.',
    fig: { ...STAND, h: [61, 19], e1: [53, 45], a1: [48, 60], e2: [54, 45], a2: [49, 61], hl: ['up1', 'fo1'] } },
  { id: 'quad_st', n: 'Oberschenkel vorn im Stehen', place: ['st'], seq: 2, side: true, tags: ['vbein', 'balance'], h: [20, 30, 45],
    d: 'Auf einem Bein stehen, bei Bedarf an Wand oder Stuhl festhalten. Den anderen Fuß greifen und die Ferse Richtung Gesäß ziehen. Knie zeigen nach unten, Becken leicht nach vorn kippen.',
    cue: 'Ferse zum Po, Knie zeigt nach unten.',
    fig: { h: [55, 20], s: [55, 30], w: [55, 57], k1: [55, 75], f1: [55, 93], k2: [57, 75], f2: [45, 62], e1: [66, 38], a1: [74, 34], e2: [50, 45], a2: [45, 61], hl: ['thigh2'] } },
  { id: 'wade_wand', n: 'Wadendehnung an der Wand', place: ['st'], seq: 2, side: true, tags: ['wade', 'fuss'], h: [20, 30, 45],
    d: 'Hände an die Wand, ein Bein weit nach hinten. Hinteres Bein gestreckt, Ferse fest am Boden, Zehen nach vorn. Hüfte Richtung Wand schieben, bis es in der Wade zieht.',
    cue: 'Hinteres Bein lang, Ferse in den Boden.',
    fig: { h: [83, 28], s: [77, 36], w: [60, 58], k1: [76, 72], f1: [80, 93], k2: [48, 75], f2: [36, 93], e1: [88, 38], a1: [99, 38], e2: [88, 40], a2: [99, 40], hl: ['shin2'], env: WALL_R } },
  { id: 'soleus', n: 'Tiefe Wadendehnung (Knie gebeugt)', place: ['st'], seq: 2, side: true, tags: ['wade', 'fuss'], h: [20, 30, 45],
    d: 'Wie die Wadendehnung, aber der hintere Fuß steht näher und das hintere Knie wird gebeugt. Die Ferse bleibt am Boden – die Dehnung wandert tiefer Richtung Achillessehne.',
    cue: 'Hinteres Knie beugen, Ferse bleibt unten.',
    fig: { h: [84, 30], s: [78, 38], w: [62, 62], k1: [76, 75], f1: [80, 93], k2: [53, 78], f2: [47, 93], e1: [88, 40], a1: [99, 40], e2: [88, 42], a2: [99, 42], hl: ['shin2'], env: WALL_R } },
  { id: 'hueftkreisen', n: 'Hüftkreisen', place: ['st'], seq: 1, dyn: true, tags: ['huefte', 'ruecken'], h: [20, 30, 45],
    d: 'Füße etwas breiter als hüftbreit, Hände an die Hüften. Mit dem Becken große, langsame Kreise malen. Nach der Hälfte die Richtung wechseln.',
    cue: 'Hände an die Hüften, große Kreise mit dem Becken.',
    fig: { h: [60, 20], s: [60, 30], w: [61, 58], k1: [55, 76], f1: [53, 93], k2: [66, 76], f2: [68, 93], e1: [70, 42], a1: [64, 56], e2: [50, 42], a2: [56, 56],
      env: '<ellipse class="mv" cx="60" cy="60" rx="15" ry="5"/>' } },
  { id: 'baum', n: 'Baum', place: ['st'], seq: 2, side: true, tags: ['balance', 'huefte'], h: [15, 25, 40],
    d: 'Auf einem Bein stehen, den anderen Fuß an Knöchel, Wade oder Oberschenkel-Innenseite setzen (nicht ans Knie). Hände vor der Brust zusammen, Blick auf einen festen Punkt.',
    easy: 'Fuß am Knöchel lassen, Zehen am Boden.', cue: 'Fuß an die Wade, Blick auf einen festen Punkt.',
    fig: { h: [60, 20], s: [60, 30], w: [60, 58], k1: [60, 76], f1: [60, 93], k2: [73, 72], f2: [61, 70], e1: [68, 42], a1: [61, 38], e2: [52, 42], a2: [59, 38], hl: ['thigh2'] } },
  { id: 'krieger1', n: 'Krieger I', place: ['st'], seq: 2, side: true, tags: ['vbein', 'huefte', 'schulter'], h: [15, 25, 40],
    d: 'Großer Schritt nach vorn, vorderes Knie über dem Knöchel beugen, hinteres Bein gestreckt, hintere Ferse leicht schräg am Boden. Becken nach vorn ausrichten, Arme nach oben strecken.',
    easy: 'Kleinerer Schritt, Hände an die Hüften.', cue: 'Vorderes Knie beugen, Arme nach oben.',
    fig: { h: [58, 22], s: [58, 32], w: [57, 60], k1: [76, 70], f1: [77, 93], k2: [42, 77], f2: [28, 93], e1: [65, 20], a1: [69, 8], e2: [63, 20], a2: [66, 8], hl: ['thigh2'] } },
  { id: 'krieger2', n: 'Krieger II', place: ['st'], seq: 2, side: true, tags: ['vbein', 'huefte', 'ganz'], h: [15, 25, 40],
    d: 'Breiter Stand, vorderer Fuß zeigt nach vorn, hinterer quer. Vorderes Knie über den Knöchel beugen. Arme waagerecht ausbreiten, Blick über die vordere Hand.',
    cue: 'Breiter Stand, vorderes Knie beugen, Arme weit.',
    fig: { h: [60, 24], s: [58, 34], w: [58, 62], k1: [80, 70], f1: [82, 93], k2: [40, 78], f2: [26, 93], e1: [72, 34], a1: [86, 34], e2: [44, 34], a2: [30, 34], hl: ['thigh1', 'thigh2'] } },
  { id: 'dreieck', n: 'Dreieck', place: ['st'], seq: 2, side: true, tags: ['hbein', 'huefte', 'ruecken'], h: [15, 25, 40],
    d: 'Breiter Stand, beide Beine gestreckt (Knie nicht durchdrücken). Oberkörper zum vorderen Bein neigen, untere Hand ans Schienbein, obere Hand zur Decke. Brust bleibt offen.',
    easy: 'Untere Hand höher am Bein oder auf einem Stuhl.', cue: 'Zur Seite neigen, eine Hand ans Bein, die andere zur Decke.',
    fig: { h: [84, 40], s: [76, 44], w: [58, 58], k1: [72, 76], f1: [82, 93], k2: [46, 76], f2: [36, 93], e1: [78, 58], a1: [80, 72], e2: [74, 30], a2: [72, 16], hl: ['torso', 'thigh1'] } },
  { id: 'tuer_brust', n: 'Brustdehnung am Türrahmen', place: ['st'], seq: 2, side: true, tags: ['brust', 'schulter'], h: [20, 30, 45],
    d: 'Unterarm im rechten Winkel an den Türrahmen legen, Ellbogen auf Schulterhöhe. Einen kleinen Schritt nach vorn machen und den Oberkörper leicht wegdrehen, bis es in der Brust zieht.',
    cue: 'Unterarm an den Rahmen, Oberkörper leicht wegdrehen.',
    fig: { h: [61, 15], s: [60, 27], w: [60, 52], k1: [59, 72], f1: [58, 93], k2: [63, 72], f2: [66, 93], e1: [44, 28], a1: [44, 12], e2: [72, 40], a2: [76, 52], hl: ['up1', 'fo1'], env: '<line x1="40" y1="4" x2="40" y2="93"/>' } },
  { id: 'ausfall_st', n: 'Hoher Ausfallschritt', place: ['st'], seq: 2, side: true, tags: ['vbein', 'huefte'], h: [20, 30, 45],
    d: 'Großer Schritt nach vorn, vorderes Knie beugen, hintere Ferse angehoben. Hände auf das vordere Knie, Oberkörper aufrecht, Gesäß anspannen und die Hüfte sanft nach vorn-unten schieben.',
    cue: 'Großer Schritt, Hüfte sanft nach vorn schieben.',
    fig: { h: [58, 23], s: [58, 33], w: [57, 61], k1: [76, 70], f1: [77, 93], k2: [42, 78], f2: [30, 90], e1: [67, 48], a1: [75, 64], e2: [66, 49], a2: [74, 65], hl: ['thigh2'] } },
  { id: 'hamstring_st', n: 'Oberschenkel hinten im Stehen', place: ['st'], seq: 2, side: true, tags: ['hbein'], h: [20, 30, 45],
    d: 'Ferse eines gestreckten Beins auf eine Stufe, Bank oder einen Stuhl legen, Zehen zeigen nach oben. Mit geradem Rücken aus der Hüfte nach vorn neigen, bis es hinten im Oberschenkel zieht.',
    cue: 'Ferse hoch, mit geradem Rücken nach vorn neigen.',
    fig: { h: [74, 31], s: [66, 37], w: [42, 52], k1: [62, 64], f1: [84, 76], k2: [41, 72], f2: [40, 93], e1: [72, 52], a1: [76, 64], e2: [70, 53], a2: [74, 65], hl: ['thigh1', 'shin1'], env: '<rect x="76" y="78" width="26" height="15" rx="2"/>' } },
  { id: 'handgelenk', n: 'Handgelenke & Unterarme', place: ['st', 'si'], seq: 1, side: true, tags: ['arme'], h: [15, 20, 30],
    d: 'Arm gestreckt nach vorn, Handfläche zeigt nach oben. Mit der anderen Hand die Finger sanft nach unten ziehen. Danach Handfläche nach unten und die Hand zu dir ziehen.',
    cue: 'Arm nach vorn, Finger sanft zu dir ziehen.',
    fig: { ...STAND, e1: [72, 31], a1: [85, 32], e2: [67, 41], a2: [82, 35], hl: ['fo1'] } },
  { id: 'ball_fuss', n: 'Fußsohle mit dem Massageball', place: ['st', 'si'], seq: 1, side: true, prop: 'Massageball', tags: ['fuss'], h: [30, 45, 60],
    d: 'Ball unter die Fußsohle legen und mit leichtem Druck langsam von der Ferse bis zu den Zehen rollen. An empfindlichen Stellen kurz verweilen. Kein Schmerz – angenehmer Druck.',
    cue: 'Ball unter den Fuß, langsam von der Ferse zu den Zehen rollen.',
    fig: { ...STAND, w: [58, 58], k2: [64, 75], f2: [70, 86], k1: [57, 76], f1: [56, 93], env: '<circle class="prop" cx="72" cy="89" r="4"/>' } },
  { id: 'ball_ruecken', n: 'Oberer Rücken mit dem Massageball', place: ['st'], seq: 1, prop: 'Massageball', tags: ['ruecken', 'schulter'], h: [30, 45, 60],
    d: 'Ball zwischen Wand und oberen Rücken (neben der Wirbelsäule, nicht direkt darauf). Mit leicht gebeugten Knien langsam auf und ab rollen. Verspannte Punkte 10–20 Sekunden halten.',
    cue: 'Ball zwischen Rücken und Wand, langsam rollen.',
    fig: { h: [50, 22], s: [49, 32], w: [47, 58], k1: [54, 75], f1: [57, 93], k2: [53, 75], f2: [56, 93], e1: [59, 42], a1: [52, 40], e2: [58, 43], a2: [51, 41], hl: ['torso'], env: '<line x1="38" y1="4" x2="38" y2="93"/><circle class="prop" cx="43" cy="40" r="4"/>' } },

  // ── Auf dem Stuhl ──
  { id: 'stuhl_katze', n: 'Katze-Kuh im Sitzen', place: ['si'], seq: 1, dyn: true, tags: ['ruecken'], h: [20, 30, 45],
    d: 'Auf der Stuhlkante sitzen, Hände auf den Knien. Einatmen: Brust nach vorn schieben, leichtes Hohlkreuz. Ausatmen: Rücken rund machen, Kinn zur Brust. Langsam im Atemrhythmus wechseln.',
    cue: 'Einatmen Brust raus, ausatmen Rücken rund.',
    fig: { h: [67, 45], s: [61, 39], c: [49, 50], w: [52, 64], k1: [74, 64], f1: [76, 93], k2: [72, 65], f2: [74, 93], e1: [67, 53], a1: [73, 62], e2: [66, 54], a2: [72, 63], hl: ['torso'], env: CHAIR } },
  { id: 'stuhl_drehung', n: 'Drehung im Sitzen', place: ['si'], seq: 2, side: true, tags: ['ruecken'], h: [15, 25, 40],
    d: 'Aufrecht auf dem Stuhl sitzen, Füße fest am Boden. Mit dem Einatmen lang machen, mit dem Ausatmen den Oberkörper zur Seite drehen. Eine Hand an die Lehne, die andere ans Knie.',
    cue: 'Lang machen und mit dem Ausatmen zur Seite drehen.',
    fig: { h: [52, 26], s: [54, 36], w: [52, 64], k1: [74, 64], f1: [76, 93], k2: [72, 65], f2: [74, 93], e1: [46, 48], a1: [45, 40], e2: [64, 49], a2: [72, 60], hl: ['torso'], env: CHAIR } },
  { id: 'stuhl_taube', n: 'Taube im Sitzen', place: ['si'], seq: 2, side: true, tags: ['huefte'], h: [20, 30, 45],
    d: 'Aufrecht sitzen, einen Knöchel auf das andere Knie legen. Das obere Knie sanft sinken lassen. Mit geradem Rücken leicht nach vorn neigen, bis es im Gesäß zieht.',
    cue: 'Knöchel aufs Knie, mit geradem Rücken leicht nach vorn.',
    fig: { h: [70, 30], s: [64, 38], w: [52, 64], k1: [64, 55], f1: [73, 62], k2: [72, 65], f2: [74, 93], e1: [66, 50], a1: [66, 58], e2: [68, 51], a2: [73, 60], hl: ['thigh1'], env: CHAIR } },
  { id: 'stuhl_vorbeuge', n: 'Vorbeuge im Sitzen', place: ['si'], seq: 2, tags: ['ruecken', 'nacken'], h: [20, 30, 45],
    d: 'Füße etwas breiter als hüftbreit, Oberkörper zwischen den Knien nach vorn hängen lassen. Kopf und Arme werden schwer. Zum Aufrichten langsam Wirbel für Wirbel hochrollen.',
    cue: 'Oberkörper zwischen die Knie hängen lassen.',
    fig: { h: [80, 74], s: [74, 62], c: [62, 50], w: [52, 64], k1: [74, 64], f1: [76, 93], k2: [72, 65], f2: [74, 93], e1: [76, 76], a1: [77, 90], e2: [75, 77], a2: [76, 91], hl: ['torso'], env: CHAIR } },
  { id: 'stuhl_seit', n: 'Seitdehnung im Sitzen', place: ['si'], seq: 2, side: true, tags: ['ruecken', 'schulter'], h: [15, 25, 40],
    d: 'Aufrecht sitzen, einen Arm über den Kopf strecken und zur anderen Seite neigen. Die andere Hand stützt sich auf die Sitzfläche. Beide Sitzknochen bleiben auf dem Stuhl.',
    cue: 'Arm über den Kopf und zur Seite neigen.',
    fig: { h: [50, 28], s: [54, 37], w: [60, 64], k1: [68, 66], f1: [68, 93], k2: [52, 66], f2: [52, 93], e1: [52, 22], a1: [42, 15], e2: [50, 50], a2: [47, 64], hl: ['torso', 'up1'], env: CHAIR_F } },
  { id: 'fussgelenk', n: 'Fußkreisen', place: ['si'], seq: 1, dyn: true, side: true, tags: ['fuss', 'wade'], h: [15, 20, 30],
    d: 'Ein Bein leicht anheben und den Fuß langsam in großen Kreisen bewegen, nach der Hälfte die Richtung wechseln. Danach Zehen abwechselnd zu dir ziehen und strecken.',
    cue: 'Fuß in großen Kreisen bewegen.',
    fig: { h: [55, 26], s: [54, 36], w: [52, 64], k1: [74, 62], f1: [90, 70], k2: [72, 65], f2: [74, 93], e1: [57, 50], a1: [62, 62], e2: [56, 50], a2: [60, 63], env: CHAIR + '<circle class="mv" cx="92" cy="70" r="6"/>' } },

  // ── Matte ──
  { id: 'katzekuh', n: 'Katze-Kuh', place: ['m'], seq: 3, dyn: true, tags: ['ruecken', 'nacken'], h: [20, 40, 60], alt: 'stuhl_katze',
    d: 'Vierfüßlerstand: Hände unter den Schultern, Knie unter der Hüfte. Einatmen: Bauch sinkt, Brust und Blick nach vorn (Kuh). Ausatmen: Rücken rund nach oben, Kinn zur Brust (Katze). Langsam im Atemrhythmus.',
    cue: 'Vierfüßlerstand. Einatmen Kuh, ausatmen Katze.',
    fig: { h: [84, 71], s: [76, 63], c: [62, 50], w: [46, 63], k1: [46, 92], f1: [28, 93], k2: [44, 92], f2: [26, 93], e1: [76, 78], a1: [76, 93], e2: [74, 78], a2: [74, 93], hl: ['torso'] } },
  { id: 'kind', n: 'Kindhaltung', place: ['m'], seq: 6, tags: ['ruecken', 'huefte', 'schulter'], h: [30, 45, 90], alt: 'stuhl_vorbeuge',
    d: 'Im Kniestand auf die Fersen setzen, Knie etwas auseinander. Oberkörper auf die Oberschenkel ablegen, Arme lang nach vorn, Stirn auf die Matte. Ruhig in den Rücken atmen.',
    easy: 'Kissen zwischen Po und Fersen oder unter die Stirn.', cue: 'Auf die Fersen setzen, Oberkörper ablegen, in den Rücken atmen.',
    fig: { h: [82, 81], s: [74, 77], c: [58, 71], w: [44, 82], k1: [62, 92], f1: [40, 92], e1: [88, 85], a1: [102, 90], hl: ['torso', 'up1'] } },
  { id: 'hund', n: 'Herabschauender Hund', place: ['m'], seq: 3, tags: ['hbein', 'wade', 'schulter', 'ganz'], h: [15, 30, 45], alt: 'halbe_vorbeuge',
    d: 'Aus dem Vierfüßlerstand die Knie anheben und den Po nach hinten-oben schieben. Arme lang, Kopf zwischen den Oberarmen. Knie ruhig gebeugt lassen – wichtiger ist ein langer Rücken. Fersen sinken Richtung Boden.',
    easy: 'Knie deutlich beugen, Fersen müssen nicht den Boden berühren.', cue: 'Po nach hinten oben, Rücken lang, Knie dürfen gebeugt sein.',
    fig: { h: [81, 74], s: [77, 66], w: [52, 40], k1: [41, 66], f1: [30, 93], k2: [40, 67], f2: [28, 93], e1: [83, 80], a1: [88, 93], e2: [81, 80], a2: [86, 93], hl: ['thigh1', 'shin1', 'up1'] } },
  { id: 'brett_knie', n: 'Stütz auf den Knien', place: ['m'], seq: 3, tags: ['ganz'], h: [5, 5, 10], hidden: true,
    d: 'Hände unter den Schultern, Knie am Boden, Körper gerade von Knie bis Kopf.', cue: 'Ausatmen, nach hinten in den Stütz, Knie ab.',
    fig: { h: [86, 61], s: [77, 66], w: [50, 78], k1: [36, 91], f1: [24, 82], k2: [35, 91], f2: [23, 82], e1: [77, 80], a1: [77, 93], e2: [75, 80], a2: [75, 93] } },
  { id: 'kobra', n: 'Baby-Kobra', place: ['m'], seq: 4, tags: ['ruecken', 'brust'], h: [10, 20, 30], alt: 'brust_st',
    d: 'Bauchlage, Hände neben der Brust, Ellbogen eng am Körper. Mit dem Einatmen Brust und Kopf leicht anheben – die Kraft kommt aus dem Rücken, die Hände helfen nur wenig. Schultern weg von den Ohren.',
    cue: 'Bauchlage, Brust sanft anheben, Schultern weg von den Ohren.',
    fig: { h: [85, 66], s: [77, 74], c: [66, 86], w: [54, 90], k1: [37, 92], f1: [19, 92], e1: [71, 84], a1: [79, 92], hl: ['torso'] } },
  { id: 'sphinx', n: 'Sphinx', place: ['m'], seq: 4, tags: ['ruecken', 'brust'], h: [30, 45, 75],
    d: 'Bauchlage, Unterarme parallel auf der Matte, Ellbogen unter den Schultern. Oberkörper ruhen lassen, Brust nach vorn schieben, Gesäß locker. Sanfte Rückbeuge zum Halten.',
    cue: 'Auf die Unterarme stützen, Brust nach vorn, Po locker.',
    fig: { h: [82, 65], s: [74, 74], c: [64, 86], w: [50, 90], k1: [33, 92], f1: [16, 92], e1: [74, 92], a1: [90, 92], hl: ['torso'] } },
  { id: 'tiefer_ausfall', n: 'Tiefer Ausfallschritt', place: ['m'], seq: 3, side: true, tags: ['vbein', 'huefte'], h: [20, 35, 60], alt: 'ausfall_st',
    d: 'Großer Schritt nach vorn, hinteres Knie auf die Matte (Handtuch unterlegen). Hände auf das vordere Knie, Oberkörper aufrecht. Gesäß anspannen und die Hüfte langsam nach vorn schieben – Dehnung vorn an der Leiste.',
    cue: 'Hinteres Knie ab, Hüfte langsam nach vorn schieben.',
    fig: { h: [58, 25], s: [57, 34], w: [55, 62], k1: [80, 68], f1: [82, 92], k2: [40, 90], f2: [22, 90], e1: [68, 50], a1: [78, 64], e2: [67, 51], a2: [77, 65], hl: ['thigh2'] } },
  { id: 'halbspagat', n: 'Halber Spagat', place: ['m'], seq: 3, side: true, tags: ['hbein', 'wade'], h: [20, 35, 60], alt: 'hamstring_st',
    d: 'Aus dem tiefen Ausfallschritt die Hüfte nach hinten über das hintere Knie schieben und das vordere Bein strecken, Zehen zeigen nach oben. Hände links und rechts am Boden, mit langem Rücken nach vorn neigen.',
    easy: 'Hände auf Bücher oder einen Block stützen.', cue: 'Hüfte nach hinten, vorderes Bein lang, Rücken lang.',
    fig: { h: [79, 54], s: [70, 57], w: [46, 66], k1: [66, 82], f1: [85, 92], k2: [46, 91], f2: [30, 91], e1: [70, 74], a1: [70, 92], e2: [72, 74], a2: [72, 92], hl: ['thigh1'] } },
  { id: 'taube', n: 'Taube', place: ['m'], seq: 4, side: true, tags: ['huefte'], h: [30, 45, 75], alt: 'stuhl_taube',
    d: 'Aus dem Vierfüßlerstand ein Knie nach vorn zwischen die Hände bringen, der Unterschenkel liegt schräg. Das andere Bein lang nach hinten. Hüfte gerade halten, Oberkörper langsam nach vorn ablegen – Dehnung im Gesäß.',
    easy: 'Kissen unter die Hüfte der vorderen Seite oder stattdessen die Liegende Taube.', cue: 'Ein Knie nach vorn, das andere Bein lang, Oberkörper sinken lassen.',
    fig: { h: [90, 61], s: [82, 67], w: [58, 79], k1: [72, 86], f1: [52, 89], k2: [30, 88], f2: [12, 90], e1: [84, 78], a1: [86, 90], hl: ['thigh1'] } },
  { id: 'figur4', n: 'Liegende Taube (Figur 4)', place: ['m'], seq: 5, side: true, tags: ['huefte', 'ruecken'], h: [30, 45, 75], alt: 'stuhl_taube',
    d: 'Rückenlage, Füße aufgestellt. Einen Knöchel auf das andere Knie legen. Das untere Bein zur Brust ziehen, Hände greifen hinter den Oberschenkel. Kopf und Schultern bleiben entspannt am Boden.',
    cue: 'Knöchel aufs Knie, das untere Bein zur Brust ziehen.',
    fig: { ...LIE, k1: [61, 64], f1: [69, 71], k2: [67, 70], f2: [78, 74], e1: [44, 74], a1: [62, 72], hl: ['thigh1'] } },
  { id: 'schmetterling', n: 'Schmetterling', place: ['m'], seq: 4, tags: ['huefte'], h: [30, 45, 75],
    d: 'Aufrecht sitzen, Fußsohlen aneinander, Knie fallen nach außen. Füße mit den Händen halten, Wirbelsäule lang. Optional mit langem Rücken leicht nach vorn neigen.',
    easy: 'Kissen unter das Gesäß oder unter die Knie.', cue: 'Fußsohlen zusammen, Knie sinken lassen, Rücken lang.',
    fig: { h: [60, 47], s: [60, 58], w: [60, 85], k1: [80, 80], f1: [62, 90], k2: [40, 80], f2: [58, 90], e1: [66, 72], a1: [61, 88], e2: [54, 72], a2: [59, 88], hl: ['thigh1', 'thigh2'] } },
  { id: 'sitz_vorbeuge', n: 'Sitzende Vorbeuge mit Handtuch', place: ['m'], seq: 4, prop: 'Handtuch', tags: ['hbein', 'ruecken', 'wade'], h: [30, 45, 75], alt: 'hamstring_st',
    d: 'Sitzen, Beine lang nach vorn, Handtuch um die Fußsohlen legen. Mit langem Rücken aus der Hüfte nach vorn neigen und das Handtuch halten. Knie dürfen leicht gebeugt sein.',
    cue: 'Beine lang, Handtuch um die Füße, mit langem Rücken nach vorn.',
    fig: { h: [64, 63], s: [56, 68], c: [42, 74], w: [36, 88], k1: [58, 87], f1: [80, 86], e1: [66, 76], a1: [76, 80], hl: ['thigh1', 'torso'], env: '<path class="prop" d="M76 80 Q85 84 81 87"/>' } },
  { id: 'drehsitz', n: 'Einfacher Drehsitz', place: ['m'], seq: 4, side: true, tags: ['ruecken', 'huefte'], h: [20, 30, 45], alt: 'stuhl_drehung',
    d: 'Sitzen, ein Bein lang, das andere aufstellen und den Fuß über das gestreckte Bein setzen. Mit dem Einatmen lang machen, mit dem Ausatmen zum aufgestellten Knie drehen. Der Arm umarmt das Knie, die andere Hand stützt hinten.',
    cue: 'Ein Knie aufstellen, lang machen, ausatmen und drehen.',
    fig: { h: [44, 49], s: [44, 60], w: [44, 88], k1: [56, 70], f1: [58, 90], k2: [64, 88], f2: [84, 88], e1: [55, 72], a1: [63, 66], e2: [34, 72], a2: [28, 90], hl: ['torso'] } },
  { id: 'liegende_drehung', n: 'Liegende Drehung', place: ['m'], seq: 5, side: true, tags: ['ruecken', 'brust'], h: [30, 45, 75], alt: 'stuhl_drehung',
    d: 'Rückenlage, Arme seitlich ausgebreitet. Beide Knie anziehen und langsam zu einer Seite sinken lassen. Kopf gern zur anderen Seite drehen. Beide Schultern bleiben am Boden.',
    cue: 'Knie zur Seite sinken lassen, Schultern bleiben am Boden.',
    fig: { top: true, h: [22, 50], s: [34, 50], w: [64, 50], k1: [78, 66], f1: [66, 80], k2: [80, 62], f2: [68, 76], e1: [34, 34], a1: [34, 20], e2: [34, 66], a2: [34, 80], hl: ['torso'] } },
  { id: 'knie_brust', n: 'Knie zur Brust', place: ['m'], seq: 5, tags: ['ruecken'], h: [20, 30, 60],
    d: 'Rückenlage, beide Knie zur Brust ziehen und mit den Händen umfassen. Den unteren Rücken in den Boden sinken lassen. Optional sanft hin und her schaukeln.',
    cue: 'Knie zur Brust, unteren Rücken sinken lassen.',
    fig: { ...LIE, k1: [52, 66], f1: [66, 72], k2: [54, 68], f2: [68, 74], e1: [40, 76], a1: [52, 67], hl: ['torso'] } },
  { id: 'bruecke', n: 'Brücke', place: ['m'], seq: 5, tags: ['vbein', 'brust', 'ruecken'], h: [15, 25, 40],
    d: 'Rückenlage, Füße hüftbreit aufgestellt, nah am Po. Becken anheben, bis Knie, Hüfte und Schultern eine Linie bilden. Gesäß locker anspannen, ruhig atmen, langsam abrollen.',
    cue: 'Füße aufstellen, Becken heben, ruhig atmen.',
    fig: { h: [18, 85], s: [30, 88], w: [54, 70], k1: [70, 62], f1: [74, 92], k2: [69, 63], f2: [73, 92], e1: [40, 91], a1: [50, 91], hl: ['thigh1', 'torso'] } },
  { id: 'baby', n: 'Glückliches Baby', place: ['m'], seq: 5, tags: ['huefte', 'ruecken'], h: [20, 30, 60],
    d: 'Rückenlage, Knie Richtung Achseln ziehen, Fußsohlen zeigen zur Decke. Außenkanten der Füße oder die Kniekehlen greifen. Unterer Rücken bleibt am Boden, sanft hin und her wiegen.',
    easy: 'Kniekehlen statt Füße greifen.', cue: 'Knie zu den Achseln, Füße zur Decke.',
    fig: { ...LIE, k1: [42, 73], f1: [48, 57], k2: [44, 74], f2: [50, 58], e1: [37, 70], a1: [47, 58], hl: ['thigh1'] } },
  { id: 'beine_wand', n: 'Beine an die Wand', place: ['m'], seq: 6, tags: ['wade', 'hbein', 'atem'], h: [60, 120, 300],
    d: 'Seitlich an eine Wand setzen, dann auf den Rücken drehen und die Beine an der Wand hochlegen. Po so nah an die Wand, wie es angenehm ist. Arme locker, Augen schließen – gut nach langen Wegen.',
    cue: 'Beine an die Wand, Arme locker, Augen schließen.',
    fig: { h: [20, 85], s: [31, 88], w: [74, 88], k1: [76, 66], f1: [77, 44], k2: [75, 66], f2: [76, 44], e1: [41, 92], a1: [51, 92], env: '<line x1="81" y1="4" x2="81" y2="93"/>' } },
  { id: 'fadenoehr', n: 'Fadenöhr', place: ['m'], seq: 3, side: true, tags: ['schulter', 'ruecken', 'nacken'], h: [20, 35, 60], alt: 'nacken',
    d: 'Vierfüßlerstand. Einen Arm unter dem Körper zur anderen Seite durchschieben, bis Schulter und Schläfe auf der Matte liegen. Die Hüfte bleibt über den Knien. Dehnung zwischen den Schulterblättern.',
    cue: 'Arm unten durchschieben, Schulter und Kopf ablegen.',
    fig: { h: [84, 87], s: [75, 85], w: [46, 63], k1: [46, 92], f1: [28, 93], k2: [44, 92], f2: [26, 93], e1: [86, 91], a1: [99, 91], e2: [76, 70], a2: [74, 55], hl: ['up1', 'torso'] } },
  { id: 'ball_gesaess', n: 'Gesäß mit dem Massageball', place: ['m'], seq: 4, side: true, prop: 'Massageball', tags: ['huefte'], h: [30, 45, 60],
    d: 'Auf den Boden setzen, den Ball unter eine Gesäßhälfte legen, Hände hinten abstützen. Langsam kleine Kreise rollen; wer mag, legt den Knöchel aufs andere Knie für mehr Druck.',
    cue: 'Ball unter eine Pobacke, langsam kleine Kreise rollen.',
    fig: { h: [34, 47], s: [38, 57], w: [50, 80], k1: [66, 72], f1: [60, 82], k2: [70, 72], f2: [78, 92], e2: [31, 72], a2: [28, 90], e1: [33, 73], a1: [30, 90], hl: ['thigh1'], env: '<circle class="prop" cx="50" cy="88" r="4"/>' } },
  { id: 'atmung', n: 'Ruhige Bauchatmung', place: ['m', 'si'], seq: 6, tags: ['atem'], h: [45, 60, 180],
    d: 'Bequem sitzen, eine Hand auf den Bauch. Durch die Nase einatmen (4 Sekunden), der Bauch hebt sich. Langsam ausatmen (6 Sekunden), der Bauch sinkt. Längeres Ausatmen beruhigt das Nervensystem.',
    cue: 'Vier Sekunden ein, sechs Sekunden aus. Der Bauch hebt und senkt sich.',
    fig: { h: [60, 45], s: [60, 56], w: [60, 84], k1: [78, 86], f1: [58, 90], k2: [42, 86], f2: [62, 90], e1: [70, 70], a1: [63, 74], e2: [50, 70], a2: [42, 84], env: '<circle class="mv" cx="61" cy="73" r="8"/>' } },
  { id: 'savasana', n: 'Endentspannung', place: ['m'], seq: 6, tags: ['atem'], h: [45, 90, 300], alt: 'atmung',
    d: 'Flach auf den Rücken legen, Beine leicht geöffnet, Arme neben dem Körper, Handflächen nach oben. Augen schließen, den Körper schwer werden lassen und den Atem einfach beobachten.',
    cue: 'Auf den Rücken legen, Augen schließen, schwer werden.',
    fig: { ...LIE, k1: [74, 89], f1: [92, 90], k2: [74, 89], f2: [92, 88], e1: [40, 91], a1: [52, 91] } },

  // ── Flow ──
  { id: 'sonnengruss', n: 'Sonnengruß (Einsteiger)', place: ['m'], seq: 1, flow: true, tags: ['ganz', 'ruecken', 'hbein'], alt: 'seit_st',
    d: 'Ein fließender Ablauf im Atemrhythmus, der den ganzen Körper weckt. Eine Bewegung pro Atemzug, Knie gern beugen, im Stütz die Knie ablegen.',
    cue: 'Sonnengruß. Eine Bewegung pro Atemzug.',
    steps: [['berg', 'Hände vor die Brust, ausatmen', 1], ['sg_arme', 'Einatmen, Arme nach oben', 1], ['vorbeuge_st', 'Ausatmen, nach vorn beugen', 1],
      ['halbe_vorbeuge', 'Einatmen, Rücken lang', 1], ['brett_knie', 'Ausatmen, nach hinten in den Stütz, Knie ab', 1], ['kobra', 'Einatmen, Brust heben', 1],
      ['hund', 'Ausatmen in den Hund – drei Atemzüge', 3], ['halbe_vorbeuge', 'Nach vorn gehen, einatmen, Rücken lang', 1],
      ['vorbeuge_st', 'Ausatmen, hängen lassen', 1], ['sg_arme', 'Einatmen, aufrichten, Arme hoch', 1], ['berg', 'Ausatmen, Hände zur Brust', 1]],
    fig: { ...STAND, e1: [67, 18], a1: [71, 6], e2: [65, 18], a2: [68, 6], hl: ['up1', 'torso'] } },

  // ── Zu zweit ──
  { id: 'p_vorbeuge', n: 'Partner-Vorbeuge', place: ['m'], seq: 4, partner: true, tags: ['hbein', 'ruecken', 'huefte'], h: [20, 30, 45],
    d: 'Gegenüber sitzen, Beine gegrätscht, Fußsohlen berühren sich. Hände fassen. Eine Person lehnt sich langsam zurück und zieht die andere sanft in die Vorbeuge. Nach dem Halten wechseln.',
    cue: 'Hände fassen, eine Person zieht die andere sanft nach vorn.',
    fig: [{ h: [50, 59], s: [44, 66], c: [36, 76], w: [30, 88], k1: [46, 88], f1: [59, 88], e1: [52, 70], a1: [60, 71], hl: ['thigh1', 'torso'] },
      { h: [87, 51], s: [86, 62], w: [90, 88], k1: [74, 88], f1: [61, 88], e1: [74, 68], a1: [61, 71] }] },
  { id: 'p_ruecken', n: 'Rücken-an-Rücken-Drehung', place: ['m'], seq: 4, partner: true, side: true, tags: ['ruecken'], h: [20, 30, 45],
    d: 'Rücken an Rücken im Schneidersitz sitzen. Beide machen sich lang und drehen gleichzeitig zur selben Seite: eine Hand aufs eigene Knie, die andere ans Knie der anderen Person.',
    cue: 'Rücken an Rücken, gemeinsam zur gleichen Seite drehen.',
    fig: [{ h: [50, 48], s: [52, 58], w: [52, 86], k1: [34, 86], f1: [47, 90], e1: [60, 72], a1: [78, 84], hl: ['torso'] },
      { h: [70, 48], s: [68, 58], w: [68, 86], k1: [86, 86], f1: [73, 90], e1: [60, 74], a1: [42, 84], hl: ['torso'] }] },
  { id: 'p_brust', n: 'Partner-Brustöffner', place: ['m'], seq: 4, partner: true, tags: ['brust', 'schulter'], h: [20, 30, 45],
    d: 'Eine Person sitzt aufrecht, die andere kniet dahinter und fasst ihre Handgelenke. Langsam die Arme nach hinten-oben führen, bis die Brust sich öffnet. Kommunizieren: „mehr“ oder „stopp“. Dann wechseln.',
    cue: 'Arme sanft nach hinten führen, Bescheid sagen bei genug.',
    fig: [{ h: [51, 47], s: [50, 58], w: [50, 86], k1: [70, 86], f1: [86, 88], e1: [40, 62], a1: [30, 64], hl: ['up1'] },
      { h: [20, 28], s: [20, 38], w: [22, 64], k1: [24, 92], f1: [8, 92], e1: [26, 52], a1: [30, 63] }] },
  { id: 'p_baum', n: 'Doppel-Baum', place: ['st'], seq: 2, partner: true, side: true, tags: ['balance', 'huefte'], h: [15, 25, 40],
    d: 'Nebeneinander stehen, die inneren Arme legen sich um die Taille der anderen Person oder die Handflächen treffen sich oben. Beide stellen den äußeren Fuß an die Wade – gegenseitig stützen.',
    cue: 'Nebeneinander, gegenseitig stützen, äußerer Fuß an die Wade.',
    fig: [{ h: [46, 20], s: [46, 30], w: [46, 58], k1: [46, 76], f1: [46, 93], k2: [34, 72], f2: [45, 69], e1: [52, 21], a1: [58, 11], e2: [38, 20], a2: [40, 7], hl: ['thigh2'] },
      { h: [74, 20], s: [74, 30], w: [74, 58], k1: [74, 76], f1: [74, 93], k2: [86, 72], f2: [75, 69], e1: [68, 21], a1: [62, 11], e2: [82, 20], a2: [80, 7], hl: ['thigh2'] }] },
  { id: 'p_seit', n: 'Seitdehnung zu zweit', place: ['st'], seq: 2, partner: true, side: true, tags: ['ruecken', 'schulter'], h: [15, 25, 40],
    d: 'Nebeneinander stehen, etwa eine Armlänge Abstand, die inneren Hände fassen sich. Beide lehnen sich nach außen und strecken den äußeren Arm über den Kopf. Gemeinsam die Balance halten.',
    cue: 'Innere Hände fassen, nach außen lehnen, äußerer Arm über den Kopf.',
    fig: [{ h: [35, 22], s: [40, 31], w: [44, 58], k1: [46, 76], f1: [48, 93], k2: [42, 76], f2: [40, 93], e1: [50, 44], a1: [59, 55], e2: [34, 16], a2: [27, 9], hl: ['torso'] },
      { h: [85, 22], s: [80, 31], w: [76, 58], k1: [74, 76], f1: [72, 93], k2: [78, 76], f2: [80, 93], e1: [70, 44], a1: [61, 55], e2: [86, 16], a2: [93, 9], hl: ['torso'] }] }
];
export const POSE = Object.fromEntries(POSES.map(p => [p.id, p]));

// ── Programme ─────────────────────────────────────────────
// items: [Pose, Stufe] – Stufe 1 ist immer dabei, 2 ab mittlerer Dauer, 3 nur bei langen Einheiten
export const THEMES = [
  { id: 'sport', n: 'Nach dem Sport' }, { id: 'ruecken', n: 'Rücken & Nacken' }, { id: 'morgen', n: 'Morgens' },
  { id: 'abend', n: 'Abends' }, { id: 'sitzen', n: 'Nach langem Sitzen' }
];
export const PROGRAMS = [
  { id: 'laufen', theme: 'sport', n: 'Nach dem Laufen', icon: '🏃', style: 'ruhig', place: 'm',
    desc: 'Waden, Achillessehne, Oberschenkel und Hüftbeuger – was beim Laufen am meisten arbeitet.',
    items: [['wade_wand', 1], ['soleus', 2], ['quad_st', 1], ['tiefer_ausfall', 1], ['halbspagat', 1], ['hund', 2], ['figur4', 2], ['schmetterling', 3], ['ball_fuss', 3], ['knie_brust', 3], ['beine_wand', 2], ['savasana', 3]] },
  { id: 'wandern', theme: 'sport', n: 'Nach dem Wandern', icon: '🥾', style: 'ruhig', place: 'm',
    desc: 'Beine und Füße nach langen Wegen, dazu Schultern und Rücken vom Rucksack.',
    items: [['wade_wand', 1], ['quad_st', 1], ['ball_fuss', 2], ['brust_st', 2], ['tiefer_ausfall', 1], ['halbspagat', 1], ['fadenoehr', 2], ['kind', 2], ['figur4', 1], ['liegende_drehung', 3], ['knie_brust', 3], ['beine_wand', 1], ['savasana', 3]] },
  { id: 'ruecken', theme: 'ruecken', n: 'Verspannter Rücken', icon: '🌿', style: 'ruhig', place: 'm',
    desc: 'Sanfte Mobilisation und Entlastung für den ganzen Rücken – ideal bei Verspannungen.',
    items: [['katzekuh', 1], ['kind', 1], ['fadenoehr', 2], ['sphinx', 2], ['knie_brust', 1], ['liegende_drehung', 1], ['figur4', 2], ['bruecke', 3], ['baby', 3], ['ball_ruecken', 3], ['savasana', 2]] },
  { id: 'nacken', theme: 'ruecken', n: 'Schultern & Nacken', icon: '💻', style: 'ruhig', place: 'mix',
    desc: 'Gegen den Laptop-Nacken: Schultern lockern, Brust öffnen, Nacken entlasten.',
    items: [['schulterkreisen', 1], ['nacken', 1], ['brust_st', 1], ['tuer_brust', 2], ['handgelenk', 3], ['katzekuh', 2], ['fadenoehr', 1], ['kind', 2], ['ball_ruecken', 3], ['atmung', 3]] },
  { id: 'wecken', theme: 'morgen', n: 'Körper wecken', icon: '☀️', style: 'fließend', place: 'm',
    desc: 'Mobilisieren, Kreislauf anregen, wach werden – mit Sonnengrüßen im Atemrhythmus.',
    items: [['berg', 2], ['seit_st', 1], ['hueftkreisen', 2], ['sonnengruss', 1], ['katzekuh', 1], ['tiefer_ausfall', 2], ['krieger2', 2], ['dreieck', 3], ['baum', 3], ['berg', 3]] },
  { id: 'abend', theme: 'abend', n: 'Abends runterkommen', icon: '🌙', style: 'ruhig', place: 'm',
    desc: 'Lange, ruhige Positionen und langsames Ausatmen – zum Abschalten und besser Schlafen.',
    items: [['atmung', 1], ['kind', 1], ['katzekuh', 2], ['sitz_vorbeuge', 2], ['schmetterling', 1], ['liegende_drehung', 1], ['baby', 3], ['beine_wand', 2], ['savasana', 1]] },
  { id: 'bus', theme: 'sitzen', n: 'Im Sitzen – Bus & Bahn', icon: '🚌', style: 'ruhig', place: 'si', travel: true,
    desc: 'Komplett im Sitzen und unauffällig: Nacken, Schultern, Rücken, Hüfte und Füße lockern.',
    items: [['schulterkreisen', 1], ['nacken', 1], ['stuhl_katze', 1], ['stuhl_drehung', 1], ['stuhl_seit', 2], ['stuhl_taube', 1], ['handgelenk', 2], ['fussgelenk', 2], ['stuhl_vorbeuge', 3], ['atmung', 3]] },
  { id: 'buero', theme: 'sitzen', n: 'Am Arbeitsplatz', icon: '🪑', style: 'ruhig', place: 'mix', travel: true,
    desc: 'Ohne Matte, im Sitzen und Stehen: einmal durchbewegen nach langem Sitzen.',
    items: [['schulterkreisen', 1], ['nacken', 1], ['stuhl_katze', 2], ['stuhl_drehung', 1], ['hueftkreisen', 2], ['ausfall_st', 1], ['quad_st', 2], ['hamstring_st', 1], ['brust_st', 1], ['wade_wand', 3], ['handgelenk', 3]] },
  { id: 'sitzen_matte', theme: 'sitzen', n: 'Nach dem Sitzen – zu Hause', icon: '🧘', style: 'fließend', place: 'm',
    desc: 'Auf der Matte das Sitzen „ausgleichen“: Hüftbeuger öffnen, Rücken strecken, Gesäß dehnen.',
    items: [['katzekuh', 1], ['tiefer_ausfall', 1], ['hund', 1], ['kobra', 2], ['halbspagat', 2], ['taube', 1], ['drehsitz', 2], ['bruecke', 3], ['fadenoehr', 3], ['savasana', 3]] }
];
export const PROGRAM = Object.fromEntries(PROGRAMS.map(p => [p.id, p]));

export const FOCUS = {
  ruecken: { n: 'Rücken', tags: ['ruecken'] }, nacken: { n: 'Nacken & Schultern', tags: ['nacken', 'schulter'] },
  huefte: { n: 'Hüfte', tags: ['huefte'] }, hbein: { n: 'Beinrückseite', tags: ['hbein'] }, vbein: { n: 'Oberschenkel vorn', tags: ['vbein'] },
  wade: { n: 'Waden & Füße', tags: ['wade', 'fuss'] }, brust: { n: 'Brust', tags: ['brust'] }, ganz: { n: 'Ganzkörper', tags: ['ganz', 'ruecken', 'huefte', 'hbein'] }
};

// ── Zeitplanung ──────────────────────────────────────────
export const TRANS = 6, SWITCH = 5, BREATH = 5;
const flowLen = p => p.steps.reduce((s, x) => s + x[2] * BREATH, 0);
function cost(p, hold, rounds = 1) {
  if (p.flow) return flowLen(p) * rounds + TRANS;
  return (p.side ? 2 * hold + SWITCH : hold) + TRANS;
}
const holdAt = (p, f) => p.flow ? 0 : Math.round(Math.max(p.h[0], Math.min(p.h[2], p.h[1] * f)) / 5) * 5;

// Unterwegs (ohne Matte): Matten-Posen durch ihre Alternative ersetzen oder weglassen
function placeOk(p, place) {
  if (place === 'm') return true;
  if (place === 'mix' || place === 'travel') return p.place.includes('st') || p.place.includes('si');
  return p.place.includes(place);
}
export function adapt(items, place) {
  const out = [], seen = new Set();
  for (const [id, tier] of items) {
    let p = POSE[id];
    if (!placeOk(p, place)) p = p.alt && placeOk(POSE[p.alt], place) ? POSE[p.alt] : null;
    if (p && !seen.has(p.id)) { seen.add(p.id); out.push([p.id, tier]); }
  }
  return out;
}

// Wählt Posen nach Stufe und skaliert Haltezeiten auf die Zieldauer
export function planSession(items, minutes) {
  const target = minutes * 60;
  let chosen = items.filter(x => x[1] === 1);
  const total = (list, f) => list.reduce((s, [id]) => s + cost(POSE[id], holdAt(POSE[id], f)), 0);
  // zu lang? Stufe 1 von hinten kürzen, aber mind. 3 Posen
  while (chosen.length > 3 && total(chosen, 0) > target) {
    let i = chosen.length - 1;
    while (i > 0 && (POSE[chosen[i][0]].seq === 6 || POSE[chosen[i][0]].flow)) i--;
    chosen = chosen.filter((_, k) => k !== i);
  }
  for (const tier of [2, 3]) {
    for (const it of items.filter(x => x[1] === tier)) {
      const next = items.filter(x => chosen.includes(x) || x === it);
      if (total(next, 1) <= target) chosen = next;
    }
  }
  // Faktor für die Haltezeiten suchen
  let lo = 0.3, hi = 3;
  for (let i = 0; i < 25; i++) { const m = (lo + hi) / 2; if (total(chosen, m) > target) hi = m; else lo = m; }
  const hasFlow = chosen.some(([id]) => POSE[id].flow);
  const f = hasFlow ? Math.min(lo, 1.1) : lo; // fließende Programme: lieber mehr Sonnengrüße als lange Halten
  const plan = chosen.map(([id]) => ({ id, hold: POSE[id].flow ? 0 : holdAt(POSE[id], f), rounds: 1 }));
  let left = target - plan.reduce((s, x) => s + cost(POSE[x.id], x.hold, x.rounds), 0);
  // Restzeit: mehr Sonnengrüße, dann Endentspannung/Atmung verlängern
  const fl = plan.find(x => POSE[x.id].flow);
  while (fl && left >= flowLen(POSE[fl.id]) && fl.rounds < 8) { fl.rounds++; left -= flowLen(POSE[fl.id]); }
  // Noch viel Zeit übrig: zentrale Posen ein zweites Mal (vor der Entspannung)
  const core = plan.filter(x => !POSE[x.id].flow && POSE[x.id].seq < 6);
  let ci = 0, guard = 0;
  while (core.length && left > 75 && guard++ < 20) {
    const src = core[ci++ % core.length], p = POSE[src.id];
    const c = cost(p, src.hold);
    if (c > left + 10) break;
    let at = plan.findIndex(x => POSE[x.id].seq === 6); if (at < 0) at = plan.length;
    if (plan[at - 1]?.id === src.id) continue;
    plan.splice(at, 0, { id: src.id, hold: src.hold, rounds: 1, rep: true });
    left -= c;
  }
  const relax = [...plan].reverse().find(x => ['savasana', 'atmung', 'beine_wand', 'kind'].includes(x.id));
  if (relax && left > 10) { const add = Math.min(left, 300 - relax.hold); relax.hold += Math.max(0, Math.round(add / 5) * 5); }
  return plan;
}
export function planSeconds(plan) { return plan.reduce((s, x) => s + cost(POSE[x.id], x.hold, x.rounds), 0); }

// Duo: passende Partnerübungen vor der Entspannung einfügen
export function withPartner(items, minutes, place) {
  const tags = new Set(items.flatMap(([id]) => POSE[id].tags));
  const n = minutes <= 10 ? 1 : minutes <= 20 ? 2 : 3;
  const ps = POSES.filter(p => p.partner && placeOk(p, place === 'm' ? 'm' : 'travel')).map(p => ({ p, s: p.tags.filter(t => tags.has(t)).length }))
    .filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, n).map(x => [x.p.id, 1]);
  let idx = items.length;
  while (idx > 0 && POSE[items[idx - 1][0]].seq === 6) idx--;
  const out = items.slice();
  out.splice(idx, 0, ...ps);
  return out;
}

// Baukasten: Fokus + Stil + Ort → Posenliste
export function buildCustom({ focus = [], style = 'ruhig', place = 'm', duo = false }) {
  const want = new Set((focus.length ? focus : ['ganz']).flatMap(f => FOCUS[f].tags));
  let list = POSES.filter(p => !p.hidden && !p.partner && placeOk(p, place) && (place !== 'm' || !p.place.every(x => x === 'si')))
    .map(p => ({ p, s: p.tags.filter(t => want.has(t)).length + (style === 'fließend' && (p.dyn || p.flow) ? 1.5 : 0) + (style === 'ruhig' && p.seq >= 4 ? 0.5 : 0) - (style === 'ruhig' && p.flow ? 3 : 0) }))
    .filter(x => x.s > 0.5).sort((a, b) => b.s - a.s);
  const top = list.slice(0, 14);
  const items = top.map((x, i) => [x.p.id, i < 5 ? 1 : i < 9 ? 2 : 3]).sort((a, b) => POSE[a[0]].seq - POSE[b[0]].seq);
  if (place === 'm' && style === 'ruhig' && !items.some(x => x[0] === 'savasana')) items.push(['savasana', 2]);
  if (place !== 'm' && !items.some(x => x[0] === 'atmung') && placeOk(POSE.atmung, place)) items.push(['atmung', 3]);
  return items;
}

export function programItems(prog, { travel = false, duo = false, minutes = 10 } = {}) {
  const place = prog.travel ? prog.place : travel ? 'travel' : 'm';
  let items = adapt(prog.items, place);
  if (duo) items = withPartner(items, minutes, place === 'm' ? 'm' : 'travel');
  return items;
}

// ── Figur zeichnen ───────────────────────────────────────
function skeleton(f, cls) {
  const L = (a, b, name) => a && b ? `<line class="${f.hl?.includes(name) ? 'hl' : ''}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" data-n="${name}"/>` : '';
  const torso = f.c ? `<path class="${f.hl?.includes('torso') ? 'hl' : ''}" d="M${f.w[0]} ${f.w[1]} Q${f.c[0]} ${f.c[1]} ${f.s[0]} ${f.s[1]}"/>` : L(f.w, f.s, 'torso');
  const far = `<g class="far">${L(f.w, f.k2, 'thigh2')}${L(f.k2, f.f2, 'shin2')}${L(f.s, f.e2, 'up2')}${L(f.e2, f.a2, 'fo2')}</g>`;
  const near = `${L(f.w, f.k1, 'thigh1')}${L(f.k1, f.f1, 'shin1')}${L(f.s, f.e1, 'up1')}${L(f.e1, f.a1, 'fo1')}`;
  const neck = f.hl?.includes('neck') ? `<line class="hl" x1="${f.s[0]}" y1="${f.s[1]}" x2="${(f.s[0] + f.h[0]) / 2}" y2="${(f.s[1] + f.h[1]) / 2}"/>` : '';
  return `<g class="sk ${cls}">${far}${torso}${near}${neck}<circle class="hd" cx="${f.h[0]}" cy="${f.h[1]}" r="6.5"/></g>`;
}
export function poseSVG(p, cls = '') {
  const figs = Array.isArray(p.fig) ? p.fig : [p.fig];
  const top = figs[0].top;
  return `<svg class="yfig ${cls}" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    ${top ? '<rect class="mat" x="8" y="12" width="104" height="76" rx="4"/>' : '<line class="gnd" x1="4" y1="93.5" x2="116" y2="93.5"/>'}
    <g class="env">${figs.map(f => f.env || '').join('')}</g>
    ${figs.map((f, i) => skeleton(f, i ? 'p2' : '')).join('')}</svg>`;
}
