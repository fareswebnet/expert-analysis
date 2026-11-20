import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lancer } from './harnais.mjs'

const ficheObj = { id: 'consentement', nom: 'Décision par consentement', mecanique: 'objection', parametres: { toursMax: 3 }, sortie: 'proposition' }
const sieges = ['grove', 'munger', 'participant'].map(s => ({ slug: s, nom: s, persona: s !== 'participant', mandat: 'consentir', posture: 'posture ' + s }))
const proposition = [{ id: 'G1', texte: 'Faire un rétro-test chez un prêteur avant la levée.', source: 'notation' }]
const base = (entrees = proposition) => ({ date: '2026-11-20', question: 'Adopte-t-on cette proposition ?', documents: ['/tmp/doc.md'], documentsAffiches: ['doc.md'],
  cadrage: 'cadrage.md', fichesDir: '/fiches', fiche: ficheObj, sieges, entrees })
const oui = { consent: true, objection: '', appui: '' }
const non = texte => ({ consent: false, objection: texte, appui: '§2' })

test('consentement au tour 2', async () => {
  const { resultat } = await lancer(base(), {
    'tour1:1': oui, 'tour1:2': non('Sans date, le test ne finit jamais.'), 'tour1:3': oui,
    'redacteur:1': { proposition: 'Faire un rétro-test chez un prêteur avant la levée, terminé avant le 31 mars.' },
    'tour2:': oui })
  assert.equal(resultat.ok, true)
  assert.equal(resultat.statistiques.tours, 2)
  assert.equal(resultat.statistiques.consentement, true)
  assert.match(resultat.carteDecision, /terminé avant le 31 mars/)
  assert.equal(resultat.sortie.items[0].texte, 'Faire un rétro-test chez un prêteur avant la levée, terminé avant le 31 mars.')
})

test('non-convergence : arrêt au troisième tour, objections listées', async () => {
  const { resultat, appels } = await lancer(base(), {
    'tour': non('Le prêteur ne partagera pas ses données.'),
    'redacteur': { proposition: 'Proposition amendée.' } })
  assert.equal(resultat.statistiques.tours, 3)
  assert.equal(resultat.statistiques.consentement, false)
  assert.doesNotMatch(resultat.carteDecision, /consentement obtenu/i)
  assert.match(resultat.carteDecision, /Le prêteur ne partagera pas ses données\./)
  assert.ok(!appels.some(a => a.label.startsWith('tour4')))
})

test('entrée vide : aucun agent appelé', async () => {
  const { resultat, appels } = await lancer(base([]), {})
  assert.equal(resultat.ok, false)
  assert.equal(appels.length, 0)
})

test('chaque version de la proposition figure mot pour mot', async () => {
  const { resultat } = await lancer(base(), {
    'tour1:': non('Trop vague.'), 'redacteur:1': { proposition: 'Version deux.' }, 'tour2:': oui })
  assert.match(resultat.rapport, /Faire un rétro-test chez un prêteur avant la levée\./)
  assert.match(resultat.rapport, /Version deux\./)
})
