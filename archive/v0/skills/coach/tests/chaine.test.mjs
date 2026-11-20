import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lancer } from './harnais.mjs'

const ficheChaine = { id: 'cinq-pourquoi', nom: 'Les 5 Pourquoi', mecanique: 'chaine', parametres: { niveaux: 5, symptomes: 3 }, sortie: 'causes' }
const sieges = [
  { slug: 'grove', nom: 'Grove', persona: true, mandat: 'pourquoi', posture: 'le terrain' },
  { slug: 'munger', nom: 'Munger', persona: true, mandat: 'pourquoi', posture: 'les incitations' },
  { slug: 'participant', nom: 'Les faits', persona: false, mandat: 'pourquoi', posture: 'les faits' },
]
const base = (entrees = [{ id: 'S1', texte: 'Les livraisons prennent 22 jours.', source: 'cadrage' }]) => ({
  date: '2026-11-20', question: 'Pourquoi les livraisons sont-elles lentes ?', documents: ['/tmp/doc.md'], documentsAffiches: ['doc.md'],
  cadrage: 'cadrage.md', fichesDir: '/fiches', fiche: ficheChaine, sieges, entrees })
const niveau = (k, extra = {}) => ({ cause: `Cause de niveau ${k}.`, appui: `§${k}`, fin: false, ...extra })
const greffier = { chaines: [{ numero: 1, causeRacine: 'La cause racine.', aVerifier: 'Le délai réel.' }] }

test('arrêt sur fin', async () => {
  const { resultat, appels } = await lancer(base(), { 'chaine:1:n1': niveau(1), 'chaine:1:n2': niveau(2, { fin: true }), greffier })
  assert.equal(resultat.ok, true)
  assert.equal(appels.filter(a => a.label.startsWith('chaine:1:')).length, 2)
  assert.ok(!appels.some(a => a.label === 'chaine:1:n3'))
  assert.match(resultat.rapport, /Cause de niveau 2\./)
})

test('rotation des sièges sur cinq niveaux', async () => {
  const r = {}
  for (let k = 1; k <= 5; k++) r['chaine:1:n' + k] = niveau(k)
  const { appels } = await lancer(base(), { ...r, greffier })
  const types = [1, 2, 3, 4, 5].map(k => appels.find(a => a.label === 'chaine:1:n' + k).opts.agentType)
  assert.deepEqual(types, ['board:grove', 'board:munger', 'board:participant', 'board:grove', 'board:munger'])
  assert.match(appels.find(a => a.label === 'chaine:1:n3').prompt, /Cause de niveau 2\./)
})

test('appui non documenté signalé', async () => {
  const { resultat } = await lancer(base(), { 'chaine:1:n1': niveau(1, { appui: 'non documenté', fin: true }), greffier })
  assert.match(resultat.carteDecision, /Cause de niveau 1\. \(non documenté\)/)
})

test('réponse malformée : la chaîne s’arrête, écart inscrit', async () => {
  const { resultat } = await lancer(base(), { 'chaine:1:n1': niveau(1), 'chaine:1:n2': null, greffier })
  assert.equal(resultat.ok, true)
  assert.ok(resultat.ecarts.some(e => e.includes('chaîne 1') && e.includes('niveau 2')), resultat.ecarts.join('\n'))
})

test('sans entrée : symptômes tirés des documents par le premier siège', async () => {
  const { resultat, appels } = await lancer(base([]), {
    symptomes: { symptomes: [{ texte: 'Symptôme A.', appui: '§1' }, { texte: 'Symptôme B.', appui: '§2' }] },
    'chaine:1:n1': niveau(1, { fin: true }), 'chaine:2:n1': niveau(1, { fin: true }),
    greffier: { chaines: [{ numero: 1, causeRacine: 'R1.', aVerifier: 'V1.' }, { numero: 2, causeRacine: 'R2.', aVerifier: 'V2.' }] } })
  assert.equal(appels.find(a => a.label === 'symptomes').opts.agentType, 'board:grove')
  assert.deepEqual(resultat.sortie.items.map(i => [i.id, i.texte]), [['K1', 'R1.'], ['K2', 'R2.']])
})

test('agent en erreur : écart inscrit, chaîne vide absente de la sortie', async () => {
  const { resultat, appels } = await lancer(base(), {
    'chaine:1:n1': () => { throw new Error("agent type 'board:participant' not found") },
    greffier })
  assert.equal(resultat.ok, true)
  assert.ok(resultat.ecarts.some(e => e.includes('not found')), resultat.ecarts.join('\n'))
  assert.deepEqual(resultat.sortie.items, [])
  assert.ok(!appels.some(a => a.label === 'greffier'), 'pas de greffier sans maillon')
})
