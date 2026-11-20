export const meta = {
  name: 'board-coach-moteur',
  description: "Moteur des ateliers du board : exécute la mécanique d'une fiche (atelier, chaîne, rotation, notation, objection)",
  whenToUse: 'Lancé par /board:atelier ou /board:coach une fois le cadrage, la fiche, les sièges et la copie isolée des documents prêts',
  phases: [
    { title: 'Cartes', detail: 'chaque participant écrit seul, sous son mandat' },
    { title: 'Mur', detail: 'un agent sans avis regroupe par identifiant' },
    { title: 'Lectures', detail: 'chaque participant prolonge, attaque, complète et place ses points' },
    { title: 'Restitution', detail: 'argumentaire de chaque profil et carte de décision du greffier' },
  ],
}

// args : { date, question, documents: [chemins des copies isolées],
//          documentsAffiches: [chemins d'origine, pour l'en-tête du rapport],
//          fichesDir (fiches des personas), cadrage, fiche: <fiche JSON du catalogue>,
//          sieges: [{ slug, nom, persona: bool, mandat, posture }], entrees: [{ id, texte, source }],
//          horizon: optionnel, remplace fiche.parametres.horizon }
// Un siège neutre a le slug 'participant' : il reçoit une ligne POSTURE: au lieu de SHEET:.
// Le script ne lit ni n'écrit aucun fichier : il rend le rapport et la sortie, que
// rapport.py enregistre dans le dossier et contrôle contre les documents.

const fiche = args.fiche
const P = fiche.parametres || {}
const PM = !!P.premortem
const HORIZON = args.horizon || P.horizon || 'dans douze mois'
const ZONES = PM ? ["Causes d'échec"] : ['Options', 'Risques', 'Questions pour le terrain', 'Manques']
const TYPE_DE_ZONE = PM ? { "Causes d'échec": 'cause' } : { Options: 'option', Risques: 'risque', 'Questions pour le terrain': 'question', Manques: 'manque' }
const LETTRES = ['A', 'B', 'C', 'D', 'E', 'F']

const CARTES_SCHEMA = {
  type: 'object',
  properties: {
    cartes: {
      type: 'array',
      minItems: 5,
      maxItems: 7,
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['option', 'risque', 'question', 'manque'] },
          texte: { type: 'string' },
          pari: { type: 'boolean' },
        },
        required: ['type', 'texte', 'pari'],
      },
    },
  },
  required: ['cartes'],
}

const CARTES_PM_SCHEMA = {
  type: 'object',
  properties: {
    cartes: {
      type: 'array',
      minItems: 4,
      maxItems: 6,
      items: {
        type: 'object',
        properties: {
          titre: { type: 'string', maxLength: 70 },
          mecanisme: { type: 'string' },
          signalFaible: { type: 'string' },
          pari: { type: 'boolean' },
        },
        required: ['titre', 'mecanisme', 'signalFaible', 'pari'],
      },
    },
  },
  required: ['cartes'],
}

const MUR_SCHEMA = {
  type: 'object',
  properties: {
    groupes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          zone: { type: 'string', enum: ZONES },
          titre: { type: 'string' },
          ids: { type: 'array', items: { type: 'string' }, minItems: 1 },
        },
        required: ['zone', 'titre', 'ids'],
      },
    },
    tensions: {
      type: 'array',
      items: {
        type: 'object',
        properties: { groupeA: { type: 'string' }, groupeB: { type: 'string' } },
        required: ['groupeA', 'groupeB'],
      },
    },
    enchainements: {
      type: 'array',
      items: {
        type: 'object',
        properties: { de: { type: 'string' }, vers: { type: 'string' }, motsDeLaCarte: { type: 'string' } },
        required: ['de', 'vers', 'motsDeLaCarte'],
      },
    },
    lecturesAVerifier: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          motsDeLaCarte: { type: 'string' },
          citation: { type: 'string' },
          section: { type: 'string' },
          muet: { type: 'boolean' },
        },
        required: ['id', 'motsDeLaCarte', 'citation', 'section', 'muet'],
      },
    },
    horsSujet: { type: 'array', items: { type: 'string' } },
  },
  required: ['groupes', PM ? 'enchainements' : 'tensions', 'lecturesAVerifier', 'horsSujet'],
}

const LECTURE_SCHEMA = {
  type: 'object',
  properties: {
    prolonge: { type: 'object', properties: { id: { type: 'string' }, texte: { type: 'string' } }, required: ['id', 'texte'] },
    attaque: { type: 'object', properties: { id: { type: 'string' }, texte: { type: 'string' } }, required: ['id', 'texte'] },
    ilManque: { type: 'string' },
    points: {
      type: 'object',
      properties: { aFaireDabord: { type: 'string' }, couteuxAIgnorer: { type: 'string' }, audacieuxATester: { type: 'string' } },
      required: ['aFaireDabord', 'couteuxAIgnorer', 'audacieuxATester'],
    },
  },
  required: ['prolonge', 'attaque', 'ilManque', 'points'],
}

const documents = args.documents.join('\n')
const cheminFiche = p => args.fichesDir + '/' + p.slug + '.md'
const ligneFiche = p => (p.slug === 'participant' ? 'POSTURE: ' + p.posture : 'SHEET: ' + cheminFiche(p))

const ligne = c => c.id + ' [' + c.type + '] ' + c.texte + (c.pari ? ' (pari)' : '')
const mots = t => t.trim().split(/\s+/).length
const ecarts = []

// ------------------------------------------------- Mécaniques autres que l'atelier
const MECANIQUES = { chaine: mecaniqueChaine, rotation: mecaniqueRotation, notation: mecaniqueNotation, objection: mecaniqueObjection }
if (MECANIQUES[fiche.mecanique]) return await MECANIQUES[fiche.mecanique]()
if (fiche.mecanique !== 'atelier') return { ok: false, etape: 'fiche', message: 'mécanique inconnue : ' + fiche.mecanique, ecarts: [] }

// En-tête et pied communs aux rapports des mécaniques autres que l'atelier.
function enTete(titre) {
  return [
    '# ' + titre + ' : ' + args.question,
    [
      '- Date : ' + args.date,
      '- Fiche : ' + fiche.nom + ' (' + fiche.id + ')',
      '- Sièges : ' + args.sieges.map(s => s.nom + ' (' + s.posture + ')').join(', '),
      '- Documents : ' + (args.documentsAffiches || args.documents).join(' ; '),
      '- Cadrage : ' + args.cadrage,
      '- Orchestration : moteur.workflow.js. Chaque appel est une instance neuve.',
    ].join('\n'),
  ]
}
// Un appel d'agent qui lève une erreur (type d'agent introuvable, panne) devient une réponse
// vide, et l'erreur est inscrite dans les écarts au lieu de disparaître.
async function appeler(prompt, opts) {
  try {
    return await agent(prompt, opts)
  } catch (e) {
    ecarts.push((opts.label || 'agent') + ' en échec : ' + String((e && e.message) || e).slice(0, 160))
    return null
  }
}
function piedDeRapport() {
  return '## Contrôles du script\n\n' + (ecarts.length ? ecarts.map(e => '- Écart : ' + e).join('\n') : '- Aucun écart relevé.')
}
function marquerAppui(a) {
  return !a || /non document/i.test(a) ? '(non documenté)' : '(' + a.trim() + ')'
}

// ------------------------------------------------- Objection (décision par consentement)
async function mecaniqueObjection() {
  const TOURS_MAX = P.toursMax || 3
  if (!(args.entrees || []).length) return { ok: false, etape: 'objection', message: 'aucune proposition : le consentement part d\'une proposition retenue', ecarts }
  const AVIS_SCHEMA = {
    type: 'object',
    properties: { consent: { type: 'boolean' }, objection: { type: 'string' }, appui: { type: 'string' } },
    required: ['consent', 'objection', 'appui'],
  }
  const AMENDEMENT_SCHEMA = { type: 'object', properties: { proposition: { type: 'string' } }, required: ['proposition'] }
  let proposition = args.entrees[0].texte.trim()
  const versions = [proposition]
  const tours = []
  let objections = []

  for (let t = 1; t <= TOURS_MAX; t++) {
    phase('Tour ' + t)
    const avis = await parallel(args.sieges.map((p, i) => () =>
      appeler(
        ['CONSENTEMENT', ligneFiche(p), 'DOCUMENTS: ' + documents, 'QUESTION: ' + args.question, 'MANDAT: ' + p.mandat + ' : ' + p.posture,
          'PROPOSITION: ' + proposition, '',
          'Consens-tu à cette proposition ? Consentir ne veut pas dire la préférer : c\'est ne voir aucune raison qu\'elle cause un tort. Si tu objectes, dis quel tort elle cause, à qui ou à quoi, et l\'appui (le passage des documents et sa section, ou « non documenté ») ; une préférence n\'est pas une objection. Sinon consent à vrai et objection vide.'].join('\n'),
        { agentType: 'board:' + p.slug, schema: AVIS_SCHEMA, label: 'tour' + t + ':' + (i + 1), phase: 'Tour ' + t })))
    objections = []
    avis.forEach((a, i) => {
      if (!a) {
        ecarts.push('Tour ' + t + ' : ' + args.sieges[i].nom + ' n\'a pas répondu ; compté comme objection non formulée.')
        objections.push({ nom: args.sieges[i].nom, texte: '(pas de réponse)', appui: '' })
        return
      }
      if (!a.consent) objections.push({ nom: args.sieges[i].nom, texte: (a.objection || '').trim() || '(objection sans texte)', appui: a.appui })
    })
    tours.push({ t, proposition, objections: [...objections] })
    if (!objections.length || t === TOURS_MAX) break
    phase('Amendement ' + t)
    const r = await appeler(
      ["Tu es rédacteur d'une décision par consentement. Tu n'as pas d'avis. Amende la proposition pour lever les objections ci-dessous, et seulement elles : n'ajoute rien qu'aucune objection ne demande. Garde les mots de la proposition partout où aucune objection ne porte.",
        '', 'PROPOSITION: ' + proposition, 'OBJECTIONS: ' + objections.map(o => o.nom + ' : ' + o.texte).join(' / ')].join('\n'),
      { agentType: 'general-purpose', schema: AMENDEMENT_SCHEMA, label: 'redacteur:' + t, phase: 'Amendement ' + t })
    if (!r || !r.proposition.trim()) {
      ecarts.push('Rédacteur sans réponse au tour ' + t + ' : arrêt sans consentement.')
      break
    }
    proposition = r.proposition.trim()
    versions.push(proposition)
  }

  const consentement = !objections.length
  const carteDecision = ['**Question posée.** ' + args.question, '',
    '**Proposition finale.** ' + proposition, '',
    consentement
      ? '**Résultat.** Aucun siège n\'objecte au tour ' + tours.length + '. Ce consentement est celui des sièges, sur les documents : c\'est vous qui décidez.'
      : '**Résultat.** Pas de consentement après ' + tours.length + ' tour' + (tours.length > 1 ? 's' : '') + '. Objections non levées :',
    ...(consentement ? [] : objections.map(o => '- ' + o.nom + ' : ' + o.texte + ' ' + marquerAppui(o.appui)))].join('\n')
  const deroule = tours.map(x => '### Tour ' + x.t + '\n\nProposition : ' + x.proposition + '\n\n' +
    (x.objections.length ? x.objections.map(o => '- Objection de ' + o.nom + ' : ' + o.texte + ' ' + marquerAppui(o.appui)).join('\n') : '- Aucune objection.')).join('\n\n')
  const rapport = [...enTete('Décision par consentement'), '## Carte de décision', carteDecision, '## Déroulé', deroule, piedDeRapport()].join('\n\n') + '\n'
  return {
    ok: true, fiche: fiche.id, rapport, carteDecision, differences: [],
    statistiques: { appels: tours.length * args.sieges.length + (versions.length - 1), tours: tours.length, consentement, objectionsRestantes: objections.length },
    ecarts, citations: [],
    sortie: { type: 'proposition', items: [{ id: 'P1', texte: proposition, source: consentement ? 'consentement des sièges' : 'sans consentement' }] },
  }
}

// ------------------------------------------------------ Notation (matrice impact / effort)
async function mecaniqueNotation() {
  const AXES = P.axes || ['impact', 'effort']
  const [BAS, HAUT] = P.echelle || [1, 5]
  const options = args.entrees || []
  if (!options.length) return { ok: false, etape: 'notation', message: 'aucune option à noter : la notation part de la sortie retenue d\'une étape précédente', ecarts }
  const parId = Object.fromEntries(options.map(o => [o.id, o]))
  const proprietes = { id: { type: 'string' }, appui: { type: 'string' } }
  AXES.forEach(a => { proprietes[a] = { type: 'integer', minimum: BAS, maximum: HAUT } })
  const NOTES_SCHEMA = {
    type: 'object',
    properties: { notes: { type: 'array', items: { type: 'object', properties: proprietes, required: ['id', ...AXES, 'appui'] } } },
    required: ['notes'],
  }

  phase('Notation')
  const rendus = await parallel(args.sieges.map((p, i) => () =>
    appeler(
      ['NOTATION', ligneFiche(p), 'DOCUMENTS: ' + documents, 'QUESTION: ' + args.question, 'MANDAT: ' + p.mandat + ' : ' + p.posture,
        'OPTIONS: ' + options.map(o => o.id + ' ' + o.texte).join(' / '), '',
        'Note chaque option, désignée par son identifiant, sur ' + AXES.join(' et ') + ', de ' + BAS + ' à ' + HAUT + ', et donne l\'appui de tes notes (le passage des documents et sa section, ou « non documenté »). Une note est une estimation, pas un fait : ne prête pas aux documents un chiffre qu\'ils ne donnent pas.'].join('\n'),
      { agentType: 'board:' + p.slug, schema: NOTES_SCHEMA, label: 'notation:' + (i + 1) + ':' + p.slug, phase: 'Notation' })))

  const notes = {}
  options.forEach(o => { notes[o.id] = Object.fromEntries(AXES.map(a => [a, []])); notes[o.id].appuis = [] })
  rendus.forEach((r, i) => {
    const nom = args.sieges[i].nom
    if (!r) return ecarts.push(nom + ' n\'a rendu aucune note.')
    const vues = new Set()
    r.notes.forEach(n => {
      if (!parId[n.id]) return ecarts.push(nom + ' note un identifiant inconnu (' + n.id + ') : écarté.')
      if (vues.has(n.id)) return
      vues.add(n.id)
      AXES.forEach(a => notes[n.id][a].push(n[a]))
      notes[n.id].appuis.push(n.appui)
    })
    options.filter(o => !vues.has(o.id)).forEach(o => ecarts.push(nom + ' n\'a pas noté ' + o.id + '.'))
  })

  const mediane = v => {
    const s = [...v].sort((a, b) => a - b)
    return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null
  }
  const MILIEU = (BAS + HAUT) / 2
  const QUADRANTS = ["à faire d'abord", 'grands projets', 'en passant', 'à écarter']
  const lignes = options.map(o => {
    const axes = Object.fromEntries(AXES.map(a => [a, { med: mediane(notes[o.id][a]), min: Math.min(...notes[o.id][a]), max: Math.max(...notes[o.id][a]) }]))
    const disperse = AXES.some(a => notes[o.id][a].length && axes[a].max - axes[a].min > 2)
    const sansAppui = notes[o.id].appuis.filter(x => !x || /non document/i.test(x)).length
    let quadrant = ''
    if (AXES.includes('impact') && AXES.includes('effort') && axes.impact.med !== null && axes.effort.med !== null) {
      const fort = axes.impact.med >= MILIEU
      const lourd = axes.effort.med > MILIEU
      quadrant = fort ? (lourd ? QUADRANTS[1] : QUADRANTS[0]) : (lourd ? QUADRANTS[3] : QUADRANTS[2])
    }
    return { o, axes, disperse, sansAppui, quadrant }
  })
  const ordre = l => (l.quadrant ? QUADRANTS.indexOf(l.quadrant) : 9)
  lignes.sort((a, b) => ordre(a) - ordre(b))

  const decrire = l =>
    '- **' + l.o.id + '** ' + l.o.texte + ' : ' +
    AXES.map(a => (l.axes[a].med === null ? a + ' non noté' : a + ' ' + l.axes[a].med + ' (' + l.axes[a].min + ' à ' + l.axes[a].max + ')')).join(', ') +
    (l.quadrant ? ' ; ' + l.quadrant : '') + (l.disperse ? ' ; notes dispersées' : '') +
    (l.sansAppui ? ' ; ' + l.sansAppui + ' note' + (l.sansAppui > 1 ? 's' : '') + ' sans appui dans les documents' : '')
  const carteDecision = ['**Question posée.** ' + args.question, '',
    ...lignes.map(decrire), '',
    'Les notes sont des estimations des sièges, pas des mesures. Une option aux notes dispersées (écart de plus de 2 entre les notes extrêmes) est à discuter avant d\'être classée. Le classement est une proposition : c\'est vous qui retenez.'].join('\n')
  const detail = options.map(o => '### ' + o.id + ' ' + o.texte + '\n\n' + args.sieges.map((p, i) => {
    const r = rendus[i] && rendus[i].notes.find(n => n.id === o.id)
    return '- ' + p.nom + ' : ' + (r ? AXES.map(a => a + ' ' + r[a]).join(', ') + ' ' + marquerAppui(r.appui) : 'pas de note')
  }).join('\n')).join('\n\n')
  const rapport = [...enTete('Notation'), '## Carte de décision', carteDecision, '## Notes par siège', detail, piedDeRapport()].join('\n\n') + '\n'
  return {
    ok: true, fiche: fiche.id, rapport, carteDecision, differences: [],
    statistiques: { appels: args.sieges.length, options: options.length, dispersees: lignes.filter(l => l.disperse).length },
    ecarts, citations: [],
    sortie: { type: 'options', items: lignes.map(l => ({ id: l.o.id, texte: l.o.texte, source: l.quadrant || 'notation' })) },
  }
}

// ------------------------------------------------------- Rotation (brainwriting 6-3-5)
async function mecaniqueRotation() {
  const IDEES = P.idees || 3
  const TOURS = P.tours || 3
  const sieges = args.sieges
  const n = sieges.length
  const IDEES_SCHEMA = {
    type: 'object',
    properties: {
      idees: {
        type: 'array', minItems: IDEES, maxItems: IDEES,
        items: { type: 'object', properties: { texte: { type: 'string' }, prolonge: { type: 'string' } }, required: ['texte', 'prolonge'] },
      },
    },
    required: ['idees'],
  }
  const MUR_IDEES = {
    type: 'object',
    properties: {
      groupes: {
        type: 'array',
        items: { type: 'object', properties: { titre: { type: 'string' }, ids: { type: 'array', items: { type: 'string' }, minItems: 1 } }, required: ['titre', 'ids'] },
      },
    },
    required: ['groupes'],
  }
  // feuilles[f] : idées écrites sur la feuille f (0..n-1), dans l'ordre.
  const feuilles = sieges.map(() => [])
  const ligneIdee = i => i.id + ' ' + i.texte + (i.prolonge ? ' (prolonge ' + i.prolonge + ')' : '')

  for (let t = 1; t <= TOURS; t++) {
    phase('Tour ' + t)
    const rendus = await parallel(sieges.map((p, s) => () => {
      const f = (((s - (t - 1)) % n) + n) % n
      const deja = feuilles[f]
      return appeler(
        ['ROTATION IDEES', ligneFiche(p), 'DOCUMENTS: ' + documents, 'QUESTION: ' + args.question, 'MANDAT: ' + p.mandat + ' : ' + p.posture,
          'FEUILLE: ' + (deja.length ? deja.map(ligneIdee).join(' / ') : 'vierge'), '',
          t === 1
            ? 'Écris ' + IDEES + ' idées pour répondre à la question, une par entrée, 30 mots au plus chacune, sans juger leur faisabilité. Laisse prolonge vide.'
            : 'Lis la feuille que tu reçois et écris ' + IDEES + ' idées nouvelles, 30 mots au plus chacune, qui prolongent chacune une idée de cette feuille : mets dans prolonge l\'identifiant exact de l\'idée prolongée. Ne recopie pas une idée existante.'].join('\n'),
        { agentType: 'board:' + p.slug, schema: IDEES_SCHEMA, label: 'tour' + t + ':' + p.slug, phase: 'Tour ' + t }).then(r => ({ r, f, p }))
    }))
    rendus.forEach(x => {
      if (!x || !x.r) {
        ecarts.push('Tour ' + t + ' : un siège n\'a rien rendu.')
        return
      }
      const avant = feuilles[x.f].map(i => i.id)
      x.r.idees.forEach(idee => {
        const id = 'F' + (x.f + 1) + '-I' + (feuilles[x.f].length + 1)
        let prolonge = (idee.prolonge || '').trim()
        if (prolonge && !avant.includes(prolonge)) {
          ecarts.push(id + ' cite ' + prolonge + ', absent de la feuille reçue : idée gardée sans lien.')
          prolonge = ''
        }
        feuilles[x.f].push({ id, texte: idee.texte.trim(), prolonge, auteur: x.p.nom })
      })
    })
  }
  const toutes = feuilles.flat()
  if (!toutes.length) return { ok: false, etape: 'tours', message: 'aucune idée écrite', ecarts }
  const parId = Object.fromEntries(toutes.map(i => [i.id, i]))

  phase('Mur')
  const consigne = recadrage =>
    [recadrage ? 'RECADRAGE: ' + recadrage : null,
      "Tu tiens le mur d'un brainwriting. Tu n'as aucun avis. Regroupe les idées ci-dessous par affinité (même objet ou même moyen), chaque idée dans un seul groupe, désignée par son identifiant ; donne à chaque groupe un titre de trois à huit mots tiré des mots des idées. Un groupe d'une seule idée est permis. Ne réécris aucune idée.",
      '', 'Question posée : ' + args.question, '', toutes.map(ligneIdee).join('\n')].filter(x => x !== null).join('\n')
  const defautMur = m => {
    const places = m.groupes.flatMap(g => g.ids)
    const inconnus = places.filter(id => !parId[id])
    if (inconnus.length) return 'identifiants inconnus : ' + inconnus.join(', ')
    const mal = toutes.filter(i => places.filter(id => id === i.id).length !== 1).map(i => i.id)
    return mal.length ? 'chaque idée doit figurer une fois et une seule ; à revoir : ' + mal.join(', ') : null
  }
  let mur = await appeler(consigne(), { agentType: 'general-purpose', schema: MUR_IDEES, label: 'mur', phase: 'Mur' })
  let defaut = mur ? defautMur(mur) : 'aucune réponse'
  if (defaut) {
    ecarts.push('Mur relancé une fois : ' + defaut + '.')
    mur = await appeler(consigne(defaut), { agentType: 'general-purpose', schema: MUR_IDEES, label: 'mur (relance)', phase: 'Mur' })
    defaut = mur ? defautMur(mur) : 'aucune réponse'
    if (defaut) return { ok: false, etape: 'mur', message: defaut, ecarts }
  }

  const groupes = mur.groupes.map((g, k) => ({ id: 'G' + (k + 1), titre: g.titre.trim(), ids: g.ids }))
  const prolongees = toutes.filter(i => toutes.some(j => j.prolonge === i.id)).length
  const murRendu = groupes.map(g => '**' + g.id + '. ' + g.titre + ' (' + g.ids.length + ')**\n' + g.ids.map(id => '- ' + ligneIdee(parId[id])).join('\n')).join('\n\n')
  const carteDecision = ['**Question posée.** ' + args.question, '',
    ...groupes.map(g => '- **' + g.id + '. ' + g.titre + '** : ' + g.ids.length + ' idée' + (g.ids.length > 1 ? 's' : '') + ' (' + g.ids.join(', ') + ')'), '',
    '**Diversité.** ' + toutes.length + ' idées sur ' + n + ' feuilles en ' + TOURS + ' tours ; ' + groupes.filter(g => g.ids.length === 1).length + ' idées seules dans leur groupe ; ' + prolongees + ' idées prolongées par un autre siège.'].join('\n')
  const rapport = [...enTete('Brainwriting'), '## Carte de décision', carteDecision, '## Le mur', murRendu,
    '## Feuilles', feuilles.map((f, k) => '### Feuille ' + (k + 1) + '\n\n' + f.map(i => '- ' + ligneIdee(i) + ' — ' + i.auteur).join('\n')).join('\n\n'), piedDeRapport()].join('\n\n') + '\n'
  return {
    ok: true, fiche: fiche.id, rapport, carteDecision, differences: [],
    statistiques: { appels: n * TOURS + 1, idees: toutes.length, groupes: groupes.length, prolongees },
    ecarts, citations: [],
    sortie: { type: 'options', items: groupes.map(g => ({ id: g.id, texte: g.titre, source: 'idées ' + g.ids.join(', ') })) },
  }
}

// --------------------------------------------------------------- Chaîne (5 pourquoi)
async function mecaniqueChaine() {
  const NIVEAUX = P.niveaux || 5
  const SYMPTOMES = P.symptomes || 3
  const NIVEAU_SCHEMA = {
    type: 'object',
    properties: { cause: { type: 'string' }, appui: { type: 'string' }, fin: { type: 'boolean' } },
    required: ['cause', 'appui', 'fin'],
  }
  const SYMPTOMES_SCHEMA = {
    type: 'object',
    properties: {
      symptomes: {
        type: 'array', minItems: 1, maxItems: SYMPTOMES,
        items: { type: 'object', properties: { texte: { type: 'string' }, appui: { type: 'string' } }, required: ['texte', 'appui'] },
      },
    },
    required: ['symptomes'],
  }
  const GREFFIER_CHAINE = {
    type: 'object',
    properties: {
      chaines: {
        type: 'array',
        items: {
          type: 'object',
          properties: { numero: { type: 'integer' }, causeRacine: { type: 'string', maxLength: 240 }, aVerifier: { type: 'string', maxLength: 240 } },
          required: ['numero', 'causeRacine', 'aVerifier'],
        },
      },
    },
    required: ['chaines'],
  }
  const sieges = args.sieges

  phase('Symptômes')
  let symptomes = (args.entrees || []).slice(0, SYMPTOMES).map(e => ({ texte: e.texte, appui: e.source || '' }))
  if (!symptomes.length) {
    const p = sieges[0]
    const r = await appeler(
      ['CHAINE SYMPTOMES', ligneFiche(p), 'DOCUMENTS: ' + documents, 'QUESTION: ' + args.question, '',
        'Rends par la sortie structurée au plus ' + SYMPTOMES + ' symptômes observables du problème posé, tels que les documents les décrivent, chacun avec son appui (le passage et sa section, ou « non documenté »). Un symptôme est un fait constaté, pas une cause.'].join('\n'),
      { agentType: 'board:' + p.slug, schema: SYMPTOMES_SCHEMA, label: 'symptomes', phase: 'Symptômes' })
    symptomes = r ? r.symptomes : []
  }
  if (!symptomes.length) return { ok: false, etape: 'symptomes', message: 'aucun symptôme de départ', ecarts }

  phase('Chaînes')
  const briefNiveau = (p, s, chaine) =>
    ['CHAINE POURQUOI', ligneFiche(p), 'DOCUMENTS: ' + documents, 'QUESTION: ' + args.question,
      'SYMPTOME: ' + s.texte,
      'CHAINE: ' + (chaine.length ? chaine.map((n, i) => (i + 1) + '. ' + n.cause + ' ' + marquerAppui(n.appui)).join(' / ') : 'aucun maillon encore'),
      '',
      'Pourquoi le dernier maillon (ou le symptôme, s\'il n\'y a encore aucun maillon) arrive-t-il ? Rends par la sortie structurée une seule cause, son appui (le passage des documents et sa section, ou « non documenté »), et fin à vrai si les documents ne permettent pas d\'aller plus loin. N\'invente pas de cause pour allonger la chaîne.'].join('\n')

  const chaines = await parallel(symptomes.map((s, i) => async () => {
    const chaine = []
    for (let k = 1; k <= NIVEAUX; k++) {
      const p = sieges[(k - 1) % sieges.length]
      const r = await appeler(briefNiveau(p, s, chaine), { agentType: 'board:' + p.slug, schema: NIVEAU_SCHEMA, label: 'chaine:' + (i + 1) + ':n' + k, phase: 'Chaînes' })
      if (!r || !r.cause) {
        ecarts.push('chaîne ' + (i + 1) + ' arrêtée au niveau ' + k + ' : réponse absente ou vide.')
        break
      }
      chaine.push({ cause: r.cause.trim(), appui: r.appui, siege: p.nom })
      if (r.fin) break
    }
    return chaine
  }))

  phase('Restitution')
  const pleines = symptomes.map((s, i) => i).filter(i => (chaines[i] || []).length)
  const corps = symptomes.map((s, i) =>
    '### Chaîne ' + (i + 1) + ' : ' + s.texte + '\n\n' +
      ((chaines[i] || []).map((n, k) => 'Pourquoi ' + (k + 1) + ' (' + n.siege + ') : ' + n.cause + ' ' + marquerAppui(n.appui)).join('\n') || 'Aucun maillon.')
  ).join('\n\n')
  const corpsPleines = pleines.map(i => '### Chaîne ' + (i + 1) + ' : ' + symptomes[i].texte + '\n\n' + chaines[i].map((n, k) => 'Pourquoi ' + (k + 1) + ' (' + n.siege + ') : ' + n.cause + ' ' + marquerAppui(n.appui)).join('\n')).join('\n\n')
  const g = !pleines.length ? null : await appeler(
    ["Tu es greffier d'une séance de 5 pourquoi. Tu n'as pas d'avis et tu n'ajoutes aucune cause. Pour chaque chaîne ci-dessous, désignée par son numéro, rends la cause racine telle que les maillons la donnent (les mots d'un maillon, sans en inventer) et ce qui reste à vérifier avant de la tenir pour vraie (un maillon non documenté, une chaîne arrêtée tôt). Documents du porteur, à lire en entier :", documents, '', corpsPleines].join('\n'),
    { agentType: 'general-purpose', schema: GREFFIER_CHAINE, label: 'greffier', phase: 'Restitution' })
  if (pleines.length && !g) ecarts.push('Greffier sans réponse : causes racines absentes.')
  const parNumero = Object.fromEntries(((g && g.chaines) || []).map(c => [c.numero, c]))

  const carte = symptomes.map((s, i) => {
    const c = parNumero[i + 1]
    return ['**Chaîne ' + (i + 1) + '. ' + s.texte + '**',
      ...(chaines[i] || []).map((n, k) => '- Pourquoi ' + (k + 1) + ' : ' + n.cause + ' ' + marquerAppui(n.appui)),
      '- Cause racine : ' + (c ? c.causeRacine : '(absente)'),
      '- À vérifier : ' + (c ? c.aVerifier : '(absent)')].join('\n')
  }).join('\n\n')
  const carteDecision = '**Question posée.** ' + args.question + '\n\n' + carte
  const rapport = [...enTete('Cinq pourquoi'), '## Carte de décision', carteDecision, '## Chaînes complètes', corps, piedDeRapport()].join('\n\n') + '\n'
  return {
    ok: true, fiche: fiche.id, rapport, carteDecision, differences: [],
    statistiques: { appels: (args.entrees || []).length ? 0 : 1, chaines: symptomes.length, maillons: chaines.map(c => (c || []).length) },
    ecarts, citations: [],
    sortie: { type: 'causes', items: pleines.map(i => ({ id: 'K' + (i + 1), texte: parNumero[i + 1] ? parNumero[i + 1].causeRacine : '', source: 'chaîne ' + (i + 1) })).filter(x => x.texte) },
  }
}

// ---------------------------------------------------------------- 1. Cartes
phase('Cartes')

const briefCartes = (p, recadrage) =>
  [
    recadrage ? 'RECADRAGE: ' + recadrage : null,
    'ATELIER CARTES',
    ligneFiche(p),
    'DOCUMENTS: ' + documents,
    'QUESTION: ' + args.question,
    'MANDAT: ' + p.mandat + ' : ' + p.posture,
    // En parcours, ce que le porteur a retenu de l'étape précédente ; absent sinon, pour garder le brief d'origine.
    (args.entrees || []).length ? 'OPTIONS: ' + args.entrees.map(e => e.id + ' ' + e.texte).join(' / ') : null,
    '',
    PM
      ? 'Atelier pre-mortem : nous sommes ' + HORIZON + ', et le plan a échoué. Pour cet atelier, ce format remplace celui de ta consigne de cartes. Rends par la sortie structurée 4 à 6 causes d\'échec vues par toi, chacune avec un titre court ; le mécanisme, comment cela a fait échouer le plan, à partir des documents (40 mots au plus) ; et le signal faible, ce qu\'on aurait pu observer tôt et où (30 mots au plus). Mets pari à vrai pour la seule cause que tu juges improbable mais la plus lourde si elle arrive. L\'échec est posé, pas ses causes : ce que les documents donnent comme hypothèse reste une hypothèse, ce qui vient d\'ailleurs que des documents est marqué comme tel, et aucun chiffre n\'est inventé.'
      : 'Rends tes cartes par la sortie structurée : une entrée par carte, avec son type, son texte (40 mots au plus, sans le crochet de type ni la mention « (pari) ») et pari à vrai pour la seule carte option que tu marquerais (pari).',
  ]
    .filter(x => x !== null)
    .join('\n')

const défautCartes = cs => {
  if (PM) {
    if (cs.filter(c => c.pari).length !== 1) return 'une cause, et une seule, porte le pari'
    if (cs.some(c => !c.signalFaible.trim())) return 'chaque cause nomme son signal faible'
    return null
  }
  const options = cs.filter(c => c.type === 'option')
  if (options.length < 2) return 'il faut au moins deux cartes option'
  if (options.filter(c => c.pari).length !== 1) return 'une carte option, et une seule, porte le pari'
  if (cs.some(c => c.pari && c.type !== 'option')) return 'le pari va sur une carte option'
  return null
}

const écrire = async p => {
  const schema = PM ? CARTES_PM_SCHEMA : CARTES_SCHEMA
  let r = await agent(briefCartes(p), { agentType: 'board:' + p.slug, schema, label: 'cartes:' + p.slug, phase: 'Cartes' })
  let défaut = r ? défautCartes(r.cartes) : 'aucune réponse'
  if (défaut) {
    ecarts.push('Cartes de ' + p.nom + ' relancées une fois : ' + défaut + '.')
    r = await agent(briefCartes(p, défaut), { agentType: 'board:' + p.slug, schema, label: 'cartes:' + p.slug + ' (relance)', phase: 'Cartes' })
    défaut = r ? défautCartes(r.cartes) : 'aucune réponse'
    if (défaut) ecarts.push('Cartes de ' + p.nom + ' gardées malgré : ' + défaut + '.')
  }
  return r ? r.cartes : []
}

const jeux = await parallel(args.sieges.map(p => () => écrire(p)))
const cartes = []
args.sieges.forEach((p, i) => {
  ;(jeux[i] || []).forEach(c => {
    const id = 'C' + String(cartes.length + 1).padStart(2, '0')
    const texte = PM
      ? c.titre.trim().replace(/\.$/, '') + '. Mécanisme : ' + c.mecanisme.trim() + ' Signal faible : ' + c.signalFaible.trim()
      : c.texte.trim()
    cartes.push({ id, type: PM ? 'cause' : c.type, texte, pari: !!c.pari, auteur: i, signal: PM ? c.signalFaible.trim() : '' })
  })
})
const présents = args.sieges.filter((p, i) => cartes.some(c => c.auteur === i))
if (présents.length < 3) return { ok: false, etape: 'cartes', message: 'moins de trois participants ont rendu des cartes', ecarts }
cartes.filter(c => mots(c.texte) > (PM ? 90 : 45)).forEach(c => ecarts.push(c.id + ' dépasse la longueur demandée (' + mots(c.texte) + ' mots).'))
const parId = Object.fromEntries(cartes.map(c => [c.id, c]))
const idsDe = p => cartes.filter(c => c.auteur === args.sieges.indexOf(p)).map(c => c.id)
log(cartes.length + ' cartes, ' + présents.length + ' participants')

// ------------------------------------------------------------------- 2. Mur
phase('Mur')

const consigneMur = recadrage =>
  [
    recadrage ? 'RECADRAGE: ' + recadrage : null,
    "Tu tiens le mur d'un atelier. Lis les documents du porteur et les cartes ci-dessous. Tu n'as aucun avis sur le sujet. Tu ne réécris, ne fusionnes, ne supprimes et ne classes aucune carte : tu désignes chaque carte par son identifiant, et le mur sera assemblé mot pour mot à partir des cartes d'origine.",
    '',
    'Documents du porteur (lis-les en entier, et rien d\'autre) :',
    documents,
    '',
    'Rends, par la sortie structurée :',
    PM
      ? '1. groupes. Une seule zone, « Causes d\'échec ». Regroupe les causes par affinité (même mécanisme ou même objet), chaque carte dans un seul groupe. Donne à chaque groupe un titre de trois à six mots, neutre, tiré des mots des cartes. Un groupe d\'une seule carte est permis.'
      : '1. groupes. Quatre zones : Options, Risques, Questions pour le terrain, Manques. Une carte va dans la zone de son type ([option] dans Options, [risque] dans Risques, [question] dans Questions pour le terrain, [manque] dans Manques) et dans un seul groupe. Regroupe par affinité (ce qui dit la même chose ou porte sur le même objet). Donne à chaque groupe un titre de trois à six mots, neutre, tiré des mots des cartes. Un groupe d\'une seule carte est permis.',
    PM
      ? '2. enchainements. Les cas où une cause en entraîne une autre, d\'une carte « de » vers une carte « vers », seulement quand l\'une des deux cartes le dit : copie dans motsDeLaCarte les mots exacts de cette carte qui l\'établissent. N\'en déduis aucun toi-même ; une liste vide est permise.'
      : '2. tensions. Les paires de groupes d\'options qu\'on ne peut pas faire ensemble, désignées par leurs deux titres exacts. Sans dire laquelle vaut mieux.',
    '3. lecturesAVerifier. Pour chaque carte qui prête aux documents ce qu\'ils ne disent pas, ou donne pour un fait ce qu\'ils donnent pour une hypothèse, une estimation ou un exemple : l\'identifiant, les mots de la carte visés, la citation exacte du document copiée caractère pour caractère, sa section, et muet à vrai si les documents ne disent rien du point. Cinq au plus, les plus lourdes d\'abord. Une carte qui propose le contraire du plan, ou qui raconte un échec futur parce que son auteur devait l\'imaginer, n\'est pas une erreur de lecture.',
    '4. horsSujet. Les identifiants des cartes qui ne répondent pas à la question posée.',
    '',
    'N\'ajoute aucune carte, aucun conseil, aucun fait extérieur aux documents.',
    '',
    'Question posée : ' + args.question,
    '',
    'Cartes :',
    cartes.map(ligne).join('\n'),
  ]
    .filter(x => x !== null)
    .join('\n')

const défautMur = m => {
  const placés = m.groupes.flatMap(g => g.ids)
  const inconnus = placés.filter(id => !parId[id])
  if (inconnus.length) return 'identifiants inconnus : ' + inconnus.join(', ')
  const mal = cartes.filter(c => placés.filter(id => id === c.id).length !== 1).map(c => c.id)
  if (mal.length) return 'chaque carte doit figurer une fois et une seule ; à revoir : ' + mal.join(', ')
  const horsZone = m.groupes.flatMap(g => g.ids.filter(id => TYPE_DE_ZONE[g.zone] !== parId[id].type))
  if (m.groupes.some(g => !ZONES.includes(g.zone))) return 'zones attendues : ' + ZONES.join(', ')
  if (horsZone.length) return 'cartes hors de la zone de leur type : ' + horsZone.join(', ')
  return null
}

let mur = await agent(consigneMur(), { agentType: 'general-purpose', schema: MUR_SCHEMA, label: 'mur', phase: 'Mur' })
let défaut = mur ? défautMur(mur) : 'aucune réponse'
if (défaut) {
  ecarts.push('Mur relancé une fois : ' + défaut + '.')
  mur = await agent(consigneMur(défaut), { agentType: 'general-purpose', schema: MUR_SCHEMA, label: 'mur (relance)', phase: 'Mur' })
  défaut = mur ? défautMur(mur) : 'aucune réponse'
  if (défaut) return { ok: false, etape: 'mur', message: défaut, ecarts, cartes: cartes.map(ligne) }
}

const titres = mur.groupes.map(g => g.titre)
const groupeDe = id => mur.groupes.find(g => g.ids.includes(id))
const isolées = mur.groupes.filter(g => g.ids.length === 1).map(g => g.ids[0]).sort()
const tensionsBrutes = mur.tensions || []
const tensions = tensionsBrutes.filter(t => titres.includes(t.groupeA) && titres.includes(t.groupeB) && t.groupeA !== t.groupeB)
if (tensions.length !== tensionsBrutes.length) ecarts.push((tensionsBrutes.length - tensions.length) + ' tension(s) écartée(s) : titre de groupe introuvable.')
// Un enchaînement n'est gardé que si ses mots sont bien dans l'une des deux cartes.
const simple = s => s.toLowerCase().replace(/[«»"'’.,;:()\s]+/g, ' ').trim()
const enchaînementsBruts = mur.enchainements || []
const enchaînements = enchaînementsBruts.filter(e => parId[e.de] && parId[e.vers] && e.de !== e.vers && e.motsDeLaCarte.trim() && [e.de, e.vers].some(id => simple(parId[id].texte).includes(simple(e.motsDeLaCarte))))
if (enchaînements.length !== enchaînementsBruts.length) ecarts.push((enchaînementsBruts.length - enchaînements.length) + ' enchaînement(s) écarté(s) : identifiant inconnu, ou mots absents des deux cartes.')
const lecturesAVerifier = mur.lecturesAVerifier.filter(l => parId[l.id])
const horsSujet = mur.horsSujet.filter(id => parId[id])
const idsDuGroupe = t => '(' + mur.groupes.find(g => g.titre === t).ids.join(', ') + ')'

const murRendu = [
  '### 1. Zones',
  ZONES.map(z => {
    const gs = mur.groupes.filter(g => g.zone === z)
    return '#### ' + z + '\n\n' + (gs.length ? gs.map(g => '**' + g.titre + ' (' + g.ids.length + ')**\n' + g.ids.map(id => '- ' + ligne(parId[id])).join('\n')).join('\n\n') : 'Aucune carte.')
  }).join('\n\n'),
  '### 2. Cartes isolées',
  isolées.length ? isolées.join(', ') : 'Aucune.',
  PM ? '### 3. Enchaînements énoncés par les cartes' : '### 3. Tensions',
  PM
    ? enchaînements.length ? enchaînements.map(e => '- ' + e.de + ' → ' + e.vers + ' : « ' + e.motsDeLaCarte.trim() + ' »').join('\n') : 'Aucun.'
    : tensions.length ? tensions.map(t => '- « ' + t.groupeA + ' » ' + idsDuGroupe(t.groupeA) + ' / « ' + t.groupeB + ' » ' + idsDuGroupe(t.groupeB)).join('\n') : 'Aucune.',
  '### 4. Lectures à vérifier',
  lecturesAVerifier.length
    ? lecturesAVerifier.map(l => '- ' + l.id + ' (« ' + l.motsDeLaCarte + ' »). Le document dit : « ' + l.citation + ' » (' + l.section + ').' + (l.muet ? ' Le document ne le dit pas.' : '')).join('\n')
    : 'Rien relevé.',
  '### 5. Hors sujet',
  horsSujet.length ? horsSujet.join(', ') : 'Aucune.',
].join('\n\n')

// -------------------------------------------------------------- 3. Lectures
phase('Lectures')

const briefLecture = p =>
  [
    'ATELIER MUR',
    ligneFiche(p),
    'DOCUMENTS: ' + documents,
    'QUESTION: ' + args.question,
    'VOS CARTES: ' + idsDe(p).join(', '),
    'MUR:',
    murRendu,
    '',
    PM
      ? 'Rends ta lecture par la sortie structurée : prolonge (identifiant d\'une cause qui n\'est pas la tienne, et ce qui la rend plus probable ou plus tôt visible, 60 mots au plus), attaque (identifiant d\'une cause que tu juges mal fondée sur les documents, et ta raison, 60 mots au plus), ilManque (la cause que personne n\'a écrite, 40 mots au plus), points (trois identifiants : aFaireDabord = le signal à surveiller d\'abord, couteuxAIgnorer = la cause la plus grave, audacieuxATester = la cause la moins vue par les autres).'
      : 'Rends ta lecture par la sortie structurée : prolonge (identifiant d\'une carte qui n\'est pas la tienne, et ton texte, 60 mots au plus), attaque (identifiant et raison, 60 mots au plus), ilManque (la carte que personne n\'a écrite, 40 mots au plus), points (trois identifiants : à faire d\'abord, le plus coûteux à ignorer, le plus audacieux qui mérite un test).',
  ].join('\n')

const lecturesBrutes = await parallel(
  présents.map(p => () => agent(briefLecture(p), { agentType: 'board:' + p.slug, schema: LECTURE_SCHEMA, label: 'lecture:' + p.slug, phase: 'Lectures' }))
)

const TYPES_DE_POINT = PM
  ? [
      ['aFaireDabord', 'à surveiller d\'abord'],
      ['couteuxAIgnorer', 'la plus grave'],
      ['audacieuxATester', 'la moins vue'],
    ]
  : [
      ['aFaireDabord', 'à faire d\'abord'],
      ['couteuxAIgnorer', 'le plus coûteux à ignorer'],
      ['audacieuxATester', 'le plus audacieux qui mérite un test'],
    ]
const lectures = []
présents.forEach((p, i) => {
  const l = lecturesBrutes[i]
  if (!l) {
    ecarts.push('Lecture de ' + p.nom + ' absente.')
    return
  }
  const miens = idsDe(p)
  const points = TYPES_DE_POINT.map(([clé, libellé]) => {
    const id = (l.points[clé] || '').trim()
    if (!parId[id]) {
      ecarts.push('Point « ' + libellé + ' » de ' + p.nom + ' retiré : identifiant inconnu (' + id + ').')
      return null
    }
    if (miens.includes(id)) {
      ecarts.push('Point « ' + libellé + ' » de ' + p.nom + ' retiré : donné à sa propre carte (' + id + ').')
      return null
    }
    return { clé, libellé, id }
  }).filter(Boolean)
  ;['prolonge', 'attaque'].forEach(k => {
    if (!parId[l[k].id]) ecarts.push('« ' + k + ' » de ' + p.nom + ' vise un identifiant inconnu (' + l[k].id + ').')
    else if (k === 'prolonge' && miens.includes(l[k].id)) ecarts.push(p.nom + ' prolonge sa propre carte (' + l[k].id + ') : gardé, signalé.')
  })
  lectures.push({ p, prolonge: l.prolonge, attaque: l.attaque, ilManque: l.ilManque.trim(), points })
})
if (lectures.length < 3) return { ok: false, etape: 'lectures', message: 'moins de trois lectures rendues', ecarts, mur: murRendu }

const rendreLecture = l =>
  [
    'Je prolonge ' + l.prolonge.id + ' : ' + l.prolonge.texte.trim(),
    "J'attaque " + l.attaque.id + ' : ' + l.attaque.texte.trim(),
    'Il manque : ' + l.ilManque,
    'Mes points :\n' + l.points.map(pt => '- ' + pt.id + ' : ' + pt.libellé).join('\n'),
  ].join('\n\n')

const lecturesAnonymes = lectures.map((l, i) => '## Lecture ' + LETTRES[i] + '\n\n' + rendreLecture(l)).join('\n\n')

// ----------------------------------------------------------- 4. Restitution
phase('Restitution')

const briefArgumentaire = p =>
  ['ATELIER ARGUMENTAIRE', ligneFiche(p), 'DOCUMENTS: ' + documents, 'QUESTION: ' + args.question, 'MUR:', murRendu].join('\n')

const GREFFIER_SCHEMA = {
  type: 'object',
  properties: {
    scenarios: {
      type: 'array',
      minItems: 2,
      maxItems: 4,
      items: {
        type: 'object',
        properties: {
          titre: { type: 'string', maxLength: 60 },
          description: { type: 'string', maxLength: 160 },
          cartes: {
            type: 'array',
            minItems: 1,
            maxItems: 5,
            items: {
              type: 'object',
              properties: { id: { type: 'string' }, enBref: { type: 'string', maxLength: 50 } },
              required: ['id', 'enBref'],
            },
          },
          suppose: { type: 'string', maxLength: 180 },
          attaque: { type: 'string', maxLength: 160 },
          questionDeTerrain: { type: 'string', maxLength: 160 },
          prochaineAction: { type: 'string', maxLength: 160 },
        },
        required: ['titre', 'description', 'cartes', 'suppose', 'attaque', 'questionDeTerrain', 'prochaineAction'],
      },
    },
    signaux: {
      type: 'array',
      minItems: 2,
      maxItems: 7,
      items: {
        type: 'object',
        properties: {
          cause: { type: 'string', maxLength: 80 },
          ids: { type: 'array', items: { type: 'string' }, minItems: 1 },
          signal: { type: 'string', maxLength: 160 },
          ouObserver: { type: 'string', maxLength: 110 },
          critereArret: { type: 'string', maxLength: 160 },
        },
        required: ['cause', 'ids', 'signal', 'ouObserver', 'critereArret'],
      },
    },
    ilManque: {
      type: 'array',
      maxItems: 4,
      items: {
        type: 'object',
        properties: { texte: { type: 'string', maxLength: 180 }, lectures: { type: 'array', items: { type: 'string' } } },
        required: ['texte', 'lectures'],
      },
    },
    aDemander: {
      type: 'array',
      maxItems: 4,
      items: {
        type: 'object',
        properties: { aQui: { type: 'string', maxLength: 70 }, quoi: { type: 'string', maxLength: 160 }, ids: { type: 'array', items: { type: 'string' } } },
        required: ['aQui', 'quoi', 'ids'],
      },
    },
    avantDAgir: { type: 'array', maxItems: 3, items: { type: 'string', maxLength: 180 } },
    attenduAuCadrage: { type: 'string', maxLength: 160 },
    affirmationsExterieures: {
      type: 'array',
      maxItems: 25,
      items: {
        type: 'object',
        properties: { ou: { type: 'string' }, texte: { type: 'string', maxLength: 240 }, marquee: { type: 'boolean' } },
        required: ['ou', 'texte', 'marquee'],
      },
    },
    repetitions: {
      type: 'array',
      maxItems: 12,
      items: {
        type: 'object',
        properties: { ids: { type: 'array', items: { type: 'string' } }, note: { type: 'string', maxLength: 240 } },
        required: ['ids', 'note'],
      },
    },
  },
  required: [PM ? 'signaux' : 'scenarios', 'ilManque', 'aDemander', 'avantDAgir', 'attenduAuCadrage', 'affirmationsExterieures', 'repetitions'],
}

const consigneGreffier = [
  (PM ? "L'atelier est un pre-mortem : les participants ont posé que le plan a échoué " + HORIZON + " et en ont écrit les causes. " : '') +
    "Tu es greffier d'un atelier. Lis les documents du porteur, le mur et les lectures du mur ci-dessous. Tu n'as pas d'avis, tu ne recommandes rien et tu n'inventes aucune option : tout ce que tu écris renvoie à des identifiants de cartes ou à la lettre d'une lecture. Le porteur lira ta carte de décision seul, sans le mur : des phrases complètes et courtes.",
  '',
  'Rends, par la sortie structurée :',
  PM
    ? '- signaux : deux à sept causes d\'échec, une par groupe du mur ou par cause isolée qui a reçu un point, la plus grave d\'abord. Pour chacune : la cause en quelques mots ; les identifiants des cartes qui la portent ; le signal faible, avec les mots des cartes ; où l\'observer et à qui le demander ; un critère d\'arrêt proposé, c\'est-à-dire ce qui, observé, ferait arrêter ou changer le plan, tiré d\'une carte ou d\'une lecture avec son identifiant ou sa lettre, ou « aucune carte ne le donne ». N\'invente aucun seuil chiffré qu\'aucune carte ne donne.'
    : '- scenarios : deux à quatre scénarios contrastés, construits à partir des groupes d\'options et des tensions. Pour chacun : un titre ; une phrase qui le décrit avec les mots des cartes ; les cartes qui le portent, chacune avec quelques mots qui disent ce qu\'elle dit ; ce qu\'il suppose (cartes « manque » et hypothèses des documents, avec leurs identifiants) ; l\'attaque la plus forte qu\'il a reçue, avec la lettre de la lecture ou l\'identifiant de la carte, ou « aucune attaque reçue » ; la question de terrain qui le départagerait, avec l\'identifiant de sa carte, ou « aucune carte question ne le vise » ; la prochaine action concrète qui ferait avancer ce scénario, tirée d\'une carte ou d\'une lecture et avec son identifiant ou sa lettre, ou « aucune carte ne la propose » si personne ne l\'a écrite. Sois bref : chaque champ tient en une phrase.',
  '- ilManque : les « Il manque » des lectures, dédoublonnés, avec les lettres des lectures.',
  '- aDemander : ce qu\'il faut demander sur le terrain, à qui, avec les identifiants des cartes.',
  '- avantDAgir : les manques dont dépendent plusieurs scénarios, et les lectures à vérifier restées sans correction, trois lignes au plus.',
  PM
    ? '- attenduAuCadrage : si le document attendu au cadrage n\'est pas un tableau de signaux et de critères d\'arrêt, dis-le en une ligne ; sinon une chaîne vide.'
    : '- attenduAuCadrage : si le document attendu au cadrage n\'est pas une carte de scénarios, dis-le en une ligne ; sinon une chaîne vide.',
  '- affirmationsExterieures : les affirmations des cartes et des lectures qui ne viennent pas des documents, avec l\'endroit (identifiant ou lettre) et si elles sont marquées comme telles.',
  '- repetitions : les cartes qui se répètent d\'un groupe à l\'autre sous des mots différents.',
  '',
  'Ne compte pas les points, les cartes isolées ni les paris : le script le fait.',
  '',
  'Documents du porteur (lis-les en entier, et rien d\'autre) :',
  documents,
  '',
  'Question posée : ' + args.question,
  '',
  '# Le mur',
  '',
  murRendu,
  '',
  '# Les lectures du mur',
  '',
  lecturesAnonymes,
].join('\n')

const restitution = await parallel([
  () => agent(consigneGreffier, { agentType: 'general-purpose', schema: GREFFIER_SCHEMA, label: 'greffier', phase: 'Restitution' }),
  ...présents.map(p => () => agent(briefArgumentaire(p), { agentType: 'board:' + p.slug, label: 'argumentaire:' + p.slug, phase: 'Restitution' })),
])

// Ce qui se compte est compté par le script, pas par le greffier.
const statsDabord = () => lectures.flatMap(l => l.points.filter(pt => pt.clé === 'aFaireDabord').map(pt => pt.id))
const lettre = l => LETTRES[lectures.indexOf(l)]
const pointsSur = (ids, clé) => lectures.flatMap(l => l.points.filter(pt => pt.clé === clé && ids.includes(pt.id))).length
const reprises = (id, k) => lectures.filter(l => l[k].id === id).map(lettre)
const marques = id => {
  const m = []
  TYPES_DE_POINT.forEach(([clé, libellé]) => {
    const n = pointsSur([id], clé)
    if (n) m.push(n + ' « ' + libellé + ' »')
  })
  if (reprises(id, 'prolonge').length) m.push('prolongée par ' + reprises(id, 'prolonge').join(', '))
  if (reprises(id, 'attaque').length) m.push('attaquée par ' + reprises(id, 'attaque').join(', '))
  return m
}
const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '')

const g = restitution[0]
let carteDécision = ''
let notes = ''
if (!g) ecarts.push('Greffier sans réponse : la carte de décision manque.')
else if (PM) {
  const lignesSignaux = g.signaux.map((s, i) => {
    const ids = s.ids.filter(id => parId[id])
    if (ids.length !== s.ids.length) ecarts.push('Signal ' + (i + 1) + ' : identifiant de carte inconnu écarté.')
    const pts = TYPES_DE_POINT.map(([clé, libellé]) => [pointsSur(ids, clé), libellé]).filter(([n]) => n > 0)
    return { s, ids, pts: pts.length ? pts.map(([n, l]) => n + ' « ' + l + ' »').join(', ') : 'aucun point' }
  })
  const cellule = x => String(x).replace(/\|/g, '/').replace(/\n/g, ' ')
  const dabord = statsDabord()
  const concentré = lignesSignaux.find(x => dabord.length && pointsSur(x.ids, 'aFaireDabord') * 2 > dabord.length)
  const paris = cartes.filter(c => c.pari).map(c => c.id + ' (' + (marques(c.id).join(', ') || 'sans point') + ')')
  carteDécision = [
    '**Question posée.** ' + args.question,
    '**Pre-mortem.** Le plan a échoué ' + HORIZON + '. Chaque ligne est une cause écrite par les participants, avec ce qui aurait pu alerter tôt.',
    '',
    '| Cause (cartes) | Signal faible | Où l\'observer, à qui demander | Critère d\'arrêt proposé | Points |',
    '|---|---|---|---|---|',
    ...lignesSignaux.map(x => '| ' + [cellule(x.s.cause) + ' (' + x.ids.join(', ') + ')', cellule(x.s.signal), cellule(x.s.ouObserver), cellule(x.s.critereArret), x.pts].join(' | ') + ' |'),
    '',
    'Les critères d\'arrêt sont des propositions tirées des cartes : seul le porteur peut les inscrire au cadrage.',
    '**Enchaînements énoncés par les cartes.** ' + (enchaînements.length ? enchaînements.map(e => e.de + ' → ' + e.vers).join(' ; ') + '.' : 'aucun.'),
    '**Paris.** ' + (paris.length ? paris.join(' ; ') : 'aucun') + '.',
    '**Ce que personne n\'avait écrit.**',
    g.ilManque.map(m => '- ' + m.texte + ' (lecture' + (m.lectures.length > 1 ? 's ' : ' ') + m.lectures.join(', ') + ')').join('\n') || '- Rien.',
    '**À demander sur le terrain.**',
    g.aDemander.map(d => '- ' + d.aQui + ' : ' + d.quoi + (d.ids.length ? ' (' + d.ids.join(', ') + ')' : '')).join('\n') || '- Rien.',
    '**Avant d\'agir.**',
    g.avantDAgir.map(x => '- ' + x).join('\n') || '- Rien.',
    '**Diversité.** ' + pluriel(cartes.length, 'cause') + ', dont ' + isolées.length + ' isolées (' + Math.round((100 * isolées.length) / cartes.length) + ' %). ' +
      (concentré ? 'La cause « ' + concentré.s.cause + ' » concentre plus de la moitié des points « à surveiller d\'abord ».' : 'Aucune cause ne concentre plus de la moitié des points « à surveiller d\'abord », allés à ' + (dabord.join(', ') || 'aucune carte') + '.') +
      (g.attenduAuCadrage.trim() ? ' ' + g.attenduAuCadrage.trim() : ''),
  ].join('\n')
} else {
  const scénarios = g.scenarios.map((s, i) => {
    const cs = s.cartes.filter(c => parId[c.id])
    if (cs.length !== s.cartes.length) ecarts.push('Scénario ' + (i + 1) + ' : identifiant de carte inconnu écarté.')
    const ids = cs.map(c => c.id)
    const reçusParType = TYPES_DE_POINT.map(([clé, libellé]) => [pointsSur(ids, clé), libellé]).filter(([n]) => n > 0)
    const pts = reçusParType.length ? reçusParType.map(([n, libellé]) => n + ' « ' + libellé + ' »').join(', ') : 'aucun point direct'
    return { n: 'S' + (i + 1), s, cs, ids, pts }
  })
  const dabord = statsDabord()
  const concentré = scénarios.find(x => dabord.length && pointsSur(x.ids, 'aFaireDabord') * 2 > dabord.length)
  const paris = cartes.filter(c => c.pari).map(c => c.id + ' (' + (marques(c.id).join(', ') || 'sans point') + ')')
  const isoléesMarquées = isolées.filter(id => !parId[id].pari && marques(id).length).map(id => id + ' (' + marques(id).join(', ') + ')')
  carteDécision = [
    '**Question posée.** ' + args.question,
    '',
    scénarios
      .map(x =>
        [
          '**' + x.n + '. ' + x.s.titre.replace(/\.$/, '') + '.** ' + x.s.description,
          '- Cartes : ' + x.cs.map(c => c.id + ' (' + c.enBref + ')').join(', '),
          '- Suppose : ' + x.s.suppose,
          '- Points reçus : ' + x.pts + '. Attaque la plus forte : ' + x.s.attaque,
          '- Sur le terrain : ' + x.s.questionDeTerrain,
          '- Prochaine action : ' + x.s.prochaineAction,
        ].join('\n')
      )
      .join('\n\n'),
    '',
    '**Paris.** ' + (paris.length ? paris.join(' ; ') : 'aucun') + '.' + (isoléesMarquées.length ? ' Cartes isolées reprises : ' + isoléesMarquées.join(' ; ') + '.' : ''),
    '**Ce que personne n\'avait écrit.**',
    g.ilManque.map(m => '- ' + m.texte + ' (lecture' + (m.lectures.length > 1 ? 's ' : ' ') + m.lectures.join(', ') + ')').join('\n') || '- Rien.',
    '**À demander sur le terrain.**',
    g.aDemander.map(d => '- ' + d.aQui + ' : ' + d.quoi + (d.ids.length ? ' (' + d.ids.join(', ') + ')' : '')).join('\n') || '- Rien.',
    '**Avant d\'agir.**',
    g.avantDAgir.map(x => '- ' + x).join('\n') || '- Rien.',
    '**Diversité.** ' + pluriel(cartes.length, 'carte') + ', dont ' + isolées.length + ' isolées (' + Math.round((100 * isolées.length) / cartes.length) + ' %). ' +
      (concentré ? 'Le scénario ' + concentré.n + ' concentre plus de la moitié des points « à faire d\'abord ».' : 'Aucun scénario ne concentre plus de la moitié des points « à faire d\'abord », allés à ' + (dabord.join(', ') || 'aucune carte') + '.') +
      (g.attenduAuCadrage.trim() ? ' ' + g.attenduAuCadrage.trim() : ''),
  ].join('\n')

}
if (g) {
  const marquées = cartes.filter(c => marques(c.id).length)
  notes = [
    '### 1. Points par carte',
    '| Carte | Points, prolongements, attaques |\n|---|---|\n' + marquées.map(c => '| ' + c.id + ' | ' + marques(c.id).join(' ; ') + ' |').join('\n'),
    'Sans point, prolongement ni attaque : ' + (cartes.filter(c => !marques(c.id).length).map(c => c.id).join(', ') || 'aucune') + '.',
    '### 2. Prolongements et attaques, carte par carte',
    lectures.map(l => '- ' + l.prolonge.id + ', prolongée par la lecture ' + lettre(l) + ' : ' + l.prolonge.texte.trim()).join('\n'),
    lectures.map(l => '- ' + l.attaque.id + ', attaquée par la lecture ' + lettre(l) + ' : ' + l.attaque.texte.trim()).join('\n'),
    '### 3. Affirmations venues d\'ailleurs que des documents',
    g.affirmationsExterieures.map(x => '- ' + x.ou + (x.marquee ? ' (marquée)' : ' (non marquée)') + ' : ' + x.texte).join('\n') || 'Rien relevé.',
    '### 4. Cartes qui se répètent d\'un groupe à l\'autre',
    g.repetitions.map(x => '- ' + x.ids.join(', ') + ' : ' + x.note).join('\n') || 'Rien relevé.',
  ].join('\n\n')
}
// Six chapeaux et ateliers à postures fixes : ce que chaque posture a écrit, par identifiants.
if (P.parPosture && carteDécision) {
  carteDécision += '\n**Par posture.** ' + présents.map(p => p.mandat + ' : ' + idsDe(p).join(', ')).join(' ; ') + '.'
}
const lignesDeLaCarte = carteDécision ? carteDécision.split('\n').length : 0
// Une page : 50 lignes, la ligne « Prochaine action » de chaque scénario comprise.
if (lignesDeLaCarte > 50) ecarts.push('Carte de décision de ' + lignesDeLaCarte + ' lignes pour 50 demandées.')

const argumentaires = présents.map((p, i) => ({ p, texte: (restitution[i + 1] || '').trim() }))
const différences = argumentaires.map(a => {
  const l = a.texte.split('\n').filter(x => x.trim().startsWith('Ma différence :')).pop()
  if (!a.texte) ecarts.push('Argumentaire de ' + a.p.nom + ' absent.')
  else if (!l) ecarts.push('Argumentaire de ' + a.p.nom + ' sans phrase « Ma différence : ».')
  else if (mots(a.texte) > 260) ecarts.push('Argumentaire de ' + a.p.nom + ' de ' + mots(a.texte) + ' mots pour 200 demandés.')
  return { nom: a.p.nom, phrase: l ? l.trim() : '' }
})

// ------------------------------------------------------------------ Rapport
const reçus = id => lectures.flatMap(l => l.points.filter(pt => pt.id === id)).length
const touchées = cartes.filter(c => reçus(c.id) > 0 || lectures.some(l => l.prolonge.id === c.id || l.attaque.id === c.id)).length
const statistiques = {
  appels: 2 + présents.length * 3 + ecarts.filter(e => e.includes('relancé')).length,
  cartes: cartes.length,
  isolées: isolées.length,
  tensions: tensions.length,
  enchaînements: enchaînements.length,
  cartesSansPointNiReprise: cartes.length - touchées,
  pointsAFaireDabord: lectures.flatMap(l => l.points.filter(pt => pt.clé === 'aFaireDabord').map(pt => pt.id)),
  prolongées: lectures.map(l => l.prolonge.id),
}

const rapport = [
  '# Atelier : ' + args.question,
  [
    '- Date : ' + args.date,
    '- Participants et mandats : ' + args.sieges.map(p => p.nom + ' (' + p.mandat + ')').join(', '),
    '- Documents : ' + (args.documentsAffiches || args.documents).join(' ; '),
    '- Cadrage : ' + args.cadrage,
    '- Question : ' + args.question,
    ...(PM ? ['- Variante : pre-mortem, échec posé ' + HORIZON + ' ; tous les participants écrivent des causes d\'échec.'] : []),
    '- Orchestration : moteur.workflow.js, fiche ' + fiche.id + '. Chaque étape est une instance neuve : un participant ne garde pas la mémoire de ses cartes, on les lui redonne.',
    '- Lectures citées par le greffier, qui ne connaissait pas les auteurs : ' + lectures.map((l, i) => LETTRES[i] + ' = ' + l.p.nom).join(', '),
  ].join('\n'),
  '## Carte de décision',
  carteDécision || '(absente)',
  '## Argumentaire par profil',
  argumentaires.map(a => '### ' + a.p.nom + '\n\n' + (a.texte || '(absent)')).join('\n\n'),
  '## Le mur',
  murRendu,
  '## Lectures du mur',
  lectures.map(l => '### ' + l.p.nom + '\n\n' + rendreLecture(l)).join('\n\n'),
  '## Clé des cartes',
  '| Cartes | Participant | Mandat |\n|---|---|---|\n' + présents.map(p => '| ' + idsDe(p).join(', ') + ' | ' + p.nom + ' | ' + p.mandat + ' |').join('\n'),
  '## Notes du greffier',
  notes || '(absentes)',
  '## Contrôles du script',
  [
    '- ' + cartes.length + ' cartes au mur, chacune une fois, mot pour mot (assemblage par identifiant).',
    '- ' + isolées.length + ' cartes isolées sur ' + cartes.length + ' ; ' + (PM ? enchaînements.length + ' enchaînements' : tensions.length + ' tensions') + ' ; ' + statistiques.cartesSansPointNiReprise + ' cartes sans point, prolongement ni attaque.',
    ...(ecarts.length ? ecarts.map(e => '- Écart : ' + e) : ['- Aucun écart relevé.']),
  ].join('\n'),
].join('\n\n') + '\n'

return {
  ok: true,
  fiche: fiche.id,
  rapport,
  carteDecision: carteDécision,
  differences: différences,
  statistiques,
  ecarts,
  citations: lecturesAVerifier.map(l => ({ id: l.id, citation: l.citation, section: l.section })),
  sortie: {
    type: PM ? 'causes' : 'options',
    items: cartes.filter(c => c.type === (PM ? 'cause' : 'option')).map(c => ({ id: c.id, texte: c.texte, source: 'carte ' + c.id })),
  },
}
