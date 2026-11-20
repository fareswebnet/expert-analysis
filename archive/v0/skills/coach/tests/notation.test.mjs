import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lancer } from './harnais.mjs'

const ficheNote = { id: 'impact-effort', nom: 'Matrice impact / effort', mecanique: 'notation', parametres: { axes: ['impact', 'effort'], echelle: [1, 5] }, sortie: 'options' }
const sieges = ['grove', 'buffett', 'participant'].map(s => ({ slug: s, nom: s, persona: s !== 'participant', mandat: 'noter', posture: 'posture ' + s }))
const options = [{ id: 'G1', texte: 'Rétro-test chez un prêteur.', source: 'brainwriting' }, { id: 'G2', texte: 'Refaire le site.', source: 'brainwriting' }]
const base = (entrees = options) => ({ date: '2026-11-20', question: 'Que faire d’abord ?', documents: ['/tmp/doc.md'], documentsAffiches: ['doc.md'],
  cadrage: 'cadrage.md', fichesDir: '/fiches', fiche: ficheNote, sieges, entrees })
const notes = (i1, e1, i2, e2) => ({ notes: [{ id: 'G1', impact: i1, effort: e1, appui: '§1' }, { id: 'G2', impact: i2, effort: e2, appui: 'non documenté' }] })

test('médiane et écart, option dispersée signalée', async () => {
  const { resultat } = await lancer(base(), { 'notation:1': notes(1, 2, 2, 4), 'notation:2': notes(3, 2, 2, 5), 'notation:3': notes(5, 2, 1, 4) })
  assert.equal(resultat.ok, true)
  assert.match(resultat.carteDecision, /G1[^\n]*impact 3 \(1 à 5\)/)
  assert.match(resultat.carteDecision, /G1[^\n]*notes dispersées/)
  assert.doesNotMatch(resultat.carteDecision, /G2[^\n]*notes dispersées/)
  assert.deepEqual(resultat.sortie.items.map(i => i.id), ['G1', 'G2'])
})

test('entrée vide : aucun agent appelé', async () => {
  const { resultat, appels } = await lancer(base([]), {})
  assert.equal(resultat.ok, false)
  assert.equal(resultat.etape, 'notation')
  assert.equal(appels.length, 0)
})

test('note manquante : médiane sur les notes présentes, écart inscrit', async () => {
  const partiel = { notes: [{ id: 'G1', impact: 4, effort: 2, appui: '§1' }] }
  const { resultat } = await lancer(base(), { 'notation:1': notes(4, 2, 2, 4), 'notation:2': partiel, 'notation:3': notes(4, 2, 2, 4) })
  assert.match(resultat.carteDecision, /G2[^\n]*impact 2 \(2 à 2\)/)
  assert.ok(resultat.ecarts.some(e => e.includes('G2')), resultat.ecarts.join('\n'))
})

test('six chapeaux : six sièges neutres, chacun sa posture', async () => {
  const { lancer: _l } = await import('./harnais.mjs')
  const { fiche } = await import('./harnais.mjs')
  const f = fiche('six-chapeaux')
  const six = f.sieges.map((s, i) => ({ slug: 'participant', nom: 'Chapeau ' + (i + 1), persona: false, mandat: s.posture.split(' : ')[0], posture: s.posture }))
  const { appels } = await lancer({ date: '2026-11-20', question: 'Q ?', documents: ['/tmp/d.md'], documentsAffiches: ['d.md'], cadrage: 'c.md', fichesDir: '/f', fiche: f, sieges: six, entrees: [] }, {})
  const cartes = appels.filter(a => a.label === 'cartes:participant') // sans les relances (agents simulés muets)
  assert.equal(cartes.length, 6)
  assert.ok(cartes.every(a => a.opts.agentType === 'board:participant'))
  assert.equal(new Set(cartes.map(a => a.prompt.match(/^POSTURE: (.*)$/m)[1])).size, 6)
})

test('six chapeaux en parcours : les options retenues arrivent dans chaque brief', async () => {
  const { fiche } = await import('./harnais.mjs')
  const f = fiche('six-chapeaux')
  const six = f.sieges.map((s, i) => ({ slug: 'participant', nom: 'Chapeau ' + (i + 1), persona: false, mandat: s.posture.split(' : ')[0], posture: s.posture }))
  const { appels } = await lancer({ date: '2026-11-20', question: 'Q ?', documents: ['/tmp/d.md'], documentsAffiches: ['d.md'], cadrage: 'c.md', fichesDir: '/f', fiche: f, sieges: six, entrees: options }, {})
  const cartes = appels.filter(a => a.label === 'cartes:participant')
  assert.ok(cartes.every(a => a.prompt.includes('OPTIONS: G1 Rétro-test chez un prêteur. / G2 Refaire le site.')))
})

test('atelier sans entrée : brief inchangé (pas de ligne OPTIONS)', async () => {
  const { fiche } = await import('./harnais.mjs')
  const f = fiche('atelier')
  const s = ['grove', 'munger', 'bezos'].map(x => ({ slug: x, nom: x, persona: true, mandat: 'plaider', posture: 'p' }))
  const { appels } = await lancer({ date: '2026-11-20', question: 'Q ?', documents: ['/tmp/d.md'], documentsAffiches: ['d.md'], cadrage: 'c.md', fichesDir: '/f', fiche: f, sieges: s, entrees: [] }, {})
  assert.ok(appels.filter(a => a.label.startsWith('cartes:')).every(a => !a.prompt.includes('OPTIONS:')))
})
