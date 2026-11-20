import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lancer } from './harnais.mjs'

const ficheRot = { id: 'brainwriting-635', nom: 'Brainwriting 6-3-5', mecanique: 'rotation', parametres: { idees: 3, tours: 3 }, sortie: 'options' }
const slugs = ['grove', 'munger', 'bezos', 'participant']
const sieges = slugs.map(s => ({ slug: s, nom: s, persona: s !== 'participant', mandat: 'idées', posture: 'posture ' + s }))
const base = () => ({ date: '2026-11-20', question: 'Comment livrer plus vite ?', documents: ['/tmp/doc.md'], documentsAffiches: ['doc.md'],
  cadrage: 'cadrage.md', fichesDir: '/fiches', fiche: ficheRot, sieges, entrees: [] })

// Au tour t, le siège s (1..4) travaille sur la feuille ((s-1)-(t-1)) mod 4 + 1 ; ses idées sont numérotées à la suite.
const feuilleDe = (s, t) => ((((s - 1) - (t - 1)) % 4) + 4) % 4 + 1
const idees = (s, t, prolonge) => ({ idees: [1, 2, 3].map(k => ({ texte: `Idée t${t} du siège ${s} n°${k} sur la feuille ${feuilleDe(s, t)}.`, prolonge: t === 1 ? '' : prolonge(s, t) })) })
const reponses = (prolonge = (s, t) => `F${feuilleDe(s, t)}-I1`) => {
  const r = {}
  for (let t = 1; t <= 3; t++) slugs.forEach((slug, i) => { r[`tour${t}:${slug}`] = idees(i + 1, t, prolonge) })
  const tous = []
  for (let f = 1; f <= 4; f++) for (let n = 1; n <= 9; n++) tous.push(`F${f}-I${n}`)
  r.mur = { groupes: [{ titre: 'Première moitié', ids: tous.slice(0, 18) }, { titre: 'Seconde moitié', ids: tous.slice(18) }] }
  return r
}

test('rotation : au tour 2, le siège 2 reçoit la feuille 1', async () => {
  const { appels } = await lancer(base(), reponses())
  const p = appels.find(a => a.label === 'tour2:munger').prompt
  assert.match(p, /F1-I1 Idée t1 du siège 1 n°1 sur la feuille 1\./)
  assert.doesNotMatch(p, /du siège 2 n°1 sur la feuille 2/)
})

test('prolongement vérifié : identifiant absent de la feuille reçue', async () => {
  const { resultat } = await lancer(base(), reponses((s, t) => (s === 3 && t === 2 ? 'F4-I1' : `F${feuilleDe(s, t)}-I1`)))
  assert.equal(resultat.ok, true)
  assert.ok(resultat.ecarts.some(e => e.includes('F4-I1')), resultat.ecarts.join('\n'))
})

test('texte mot pour mot, chaque idée une fois', async () => {
  const { resultat } = await lancer(base(), reponses())
  const mur = resultat.rapport.split('## Le mur')[1].split('## Feuilles')[0]
  assert.equal(mur.split('Idée t3 du siège 4 n°2 sur la feuille 2.').length - 1, 1)
  assert.equal(resultat.sortie.type, 'options')
  assert.deepEqual(resultat.sortie.items.map(i => i.id), ['G1', 'G2'])
})

test('mur qui oublie une idée : relance puis échec', async () => {
  const r = reponses()
  r.mur = [{ groupes: [{ titre: 'Incomplet', ids: ['F1-I1'] }] }, { groupes: [{ titre: 'Incomplet', ids: ['F1-I1'] }] }]
  const { resultat } = await lancer(base(), r)
  assert.equal(resultat.ok, false)
  assert.equal(resultat.etape, 'mur')
})
