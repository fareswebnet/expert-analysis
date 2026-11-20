import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lancer, fiche } from './harnais.mjs'

const sieges = [
  { slug: 'grove', nom: 'Grove', persona: true, mandat: 'pre-mortem', posture: 'Dans dix-huit mois, le plan a échoué.' },
  { slug: 'graham', nom: 'Graham', persona: true, mandat: 'plaider', posture: 'Le plan à son plus fort.' },
  { slug: 'participant', nom: 'Les faits', persona: false, mandat: 'supprimer', posture: 'les faits' },
]
const base = f => ({ date: '2026-11-20', question: 'Que faire ?', documents: ['/tmp/doc.md'], documentsAffiches: ['doc.md'], cadrage: 'cadrage.md', fichesDir: '/fiches', fiche: f, sieges, entrees: [] })

const cartesDe = n => ({ cartes: [
  { type: 'option', texte: `Option A du siège ${n}.`, pari: true },
  { type: 'option', texte: `Option B du siège ${n}.`, pari: false },
  { type: 'risque', texte: `Risque du siège ${n}.`, pari: false },
  { type: 'question', texte: `Question du siège ${n} ?`, pari: false },
  { type: 'manque', texte: `Manque du siège ${n}.`, pari: false },
] })
// Les cartes C01..C15 : 5 par siège, dans l'ordre option, option, risque, question, manque.
const id = (s, k) => 'C' + String(s * 5 + k + 1).padStart(2, '0')
const groupes = () => {
  const g = []
  ;[0, 1, 2].forEach(s => {
    g.push({ zone: 'Options', titre: 'Options du siège ' + s, ids: [id(s, 0), id(s, 1)] })
    g.push({ zone: 'Risques', titre: 'Risque ' + s, ids: [id(s, 2)] })
    g.push({ zone: 'Questions pour le terrain', titre: 'Question ' + s, ids: [id(s, 3)] })
    g.push({ zone: 'Manques', titre: 'Manque ' + s, ids: [id(s, 4)] })
  })
  return g
}
const mur = { groupes: groupes(), tensions: [], lecturesAVerifier: [], horsSujet: [] }
const lecture = (prolonge, point) => ({ prolonge: { id: prolonge, texte: 'Prolongement.' }, attaque: { id: 'C02', texte: 'Attaque.' }, ilManque: 'Un manque.', points: { aFaireDabord: point, couteuxAIgnorer: 'C08', audacieuxATester: 'C13' } })
const greffier = { scenarios: [
  { titre: 'Scénario un', description: 'Description.', cartes: [{ id: 'C01', enBref: 'option A' }], suppose: 'C05.', attaque: 'aucune attaque reçue', questionDeTerrain: 'C04.', prochaineAction: 'aucune carte ne la propose' },
  { titre: 'Scénario deux', description: 'Description.', cartes: [{ id: 'C06', enBref: 'option A' }], suppose: 'C10.', attaque: 'aucune attaque reçue', questionDeTerrain: 'C09.', prochaineAction: 'aucune carte ne la propose' },
], ilManque: [], aDemander: [], avantDAgir: [], attenduAuCadrage: '', affirmationsExterieures: [], repetitions: [] }
const reponses = (extra = {}) => ({
  'cartes:grove': cartesDe(0), 'cartes:graham': cartesDe(1), 'cartes:participant': cartesDe(2),
  mur,
  'lecture:grove': lecture('C06', 'C11'), 'lecture:graham': lecture('C01', 'C02'), 'lecture:participant': lecture('C01', 'C11'),
  greffier,
  'argumentaire:': 'Mon argumentaire.\n\nMa différence : la mienne.',
  ...extra,
})

test('mur mot pour mot', async () => {
  const { resultat } = await lancer(base(fiche('atelier')), reponses())
  assert.equal(resultat.ok, true)
  for (const s of [0, 1, 2]) for (const t of [`Option A du siège ${s}.`, `Risque du siège ${s}.`]) {
    const murTexte = resultat.rapport.split('## Le mur')[1].split('## Lectures du mur')[0]
    assert.equal(murTexte.split(t).length - 1, 1, t)
  }
  assert.equal(resultat.sortie.type, 'options')
  assert.deepEqual(resultat.sortie.items.map(i => i.id), ['C01', 'C02', 'C06', 'C07', 'C11', 'C12'])
})

test('siège neutre : ligne POSTURE et agent participant', async () => {
  const { appels } = await lancer(base(fiche('atelier')), reponses())
  const c = appels.find(a => a.label === 'cartes:participant')
  assert.equal(c.opts.agentType, 'board:participant')
  assert.match(c.prompt, /^POSTURE: les faits$/m)
  assert.doesNotMatch(c.prompt, /^SHEET:/m)
  assert.match(appels.find(a => a.label === 'cartes:grove').prompt, /^SHEET: \/fiches\/grove\.md$/m)
})

test('point sur sa propre carte retiré', async () => {
  const { resultat } = await lancer(base(fiche('atelier')), reponses())
  assert.ok(resultat.ecarts.some(e => e.includes('donné à sa propre carte (C11)')), resultat.ecarts.join('\n'))
})

test('réponse malformée : mur à identifiant inconnu deux fois', async () => {
  const mauvais = { ...mur, groupes: [...groupes(), { zone: 'Options', titre: 'Fantôme', ids: ['C99'] }] }
  const { resultat } = await lancer(base(fiche('atelier')), reponses({ mur: [mauvais, mauvais] }))
  assert.equal(resultat.ok, false)
  assert.equal(resultat.etape, 'mur')
})

test('pre-mortem : cartes à trois champs, enchaînement contrôlé', async () => {
  const cause = (n, k) => ({ titre: `Cause ${n}-${k}`, mecanisme: `parce que la cause ${n}-${k} entraîne la suite`, signalFaible: `signal ${n}-${k}`, pari: k === 0 })
  const jeu = n => ({ cartes: [0, 1, 2, 3].map(k => cause(n, k)) })
  const murPM = { groupes: [{ zone: "Causes d'échec", titre: 'Toutes', ids: Array.from({ length: 12 }, (_, i) => 'C' + String(i + 1).padStart(2, '0')) }],
    enchainements: [{ de: 'C01', vers: 'C02', motsDeLaCarte: 'entraîne la suite' }, { de: 'C03', vers: 'C04', motsDeLaCarte: 'mots inventés' }],
    lecturesAVerifier: [], horsSujet: [] }
  const lectPM = { prolonge: { id: 'C05', texte: 'P.' }, attaque: { id: 'C06', texte: 'A.' }, ilManque: 'M.', points: { aFaireDabord: 'C07', couteuxAIgnorer: 'C08', audacieuxATester: 'C09' } }
  const greffierPM = { signaux: [{ cause: 'Une cause', ids: ['C01'], signal: 'S.', ouObserver: 'Ici.', critereArret: 'aucune carte ne le donne' }, { cause: 'Une autre', ids: ['C05'], signal: 'S.', ouObserver: 'Là.', critereArret: 'aucune carte ne le donne' }],
    ilManque: [], aDemander: [], avantDAgir: [], attenduAuCadrage: '', affirmationsExterieures: [], repetitions: [] }
  const { resultat } = await lancer({ ...base(fiche('pre-mortem')), horizon: 'le 20 novembre 2027' }, {
    'cartes:grove': jeu(0), 'cartes:graham': jeu(1), 'cartes:participant': jeu(2), mur: murPM,
    'lecture:': lectPM, greffier: greffierPM, 'argumentaire:': 'A.\n\nMa différence : x.' })
  assert.equal(resultat.ok, true)
  assert.match(resultat.rapport, /Cause 0-0\. Mécanisme : parce que la cause 0-0 entraîne la suite Signal faible : signal 0-0/)
  assert.match(resultat.rapport, /C01 → C02/)
  assert.doesNotMatch(resultat.rapport, /C03 → C04/)
  assert.match(resultat.rapport, /le 20 novembre 2027/)
  assert.equal(resultat.sortie.type, 'causes')
})
