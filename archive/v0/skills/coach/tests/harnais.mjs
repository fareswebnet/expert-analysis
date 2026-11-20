// Charge moteur.workflow.js dans Node avec des agents simulés.
// reponses : { '<préfixe de label>': valeur | [valeurs successives] | (prompt, opts) => valeur }
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ici = dirname(fileURLToPath(import.meta.url))
const texte = readFileSync(join(ici, '..', 'moteur.workflow.js'), 'utf8').replace(/^export const meta/m, 'const meta')
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const moteur = new AsyncFunction('args', 'agent', 'parallel', 'pipeline', 'phase', 'log', 'budget', texte)

export const fiche = nom => JSON.parse(readFileSync(join(ici, '..', 'fiches', nom + '.json'), 'utf8'))

export async function lancer(args, reponses) {
  const appels = []
  const vus = {}
  const agent = async (prompt, opts = {}) => {
    const label = opts.label || ''
    appels.push({ label, prompt, opts })
    const cle = Object.keys(reponses).filter(k => label.startsWith(k)).sort((a, b) => b.length - a.length)[0]
    if (cle === undefined) return null
    const r = reponses[cle]
    if (typeof r === 'function') return r(prompt, opts)
    if (Array.isArray(r)) {
      vus[cle] = (vus[cle] || 0) + 1
      return r[Math.min(vus[cle], r.length) - 1]
    }
    return r
  }
  const parallel = thunks => Promise.all(thunks.map(t => Promise.resolve().then(t).catch(() => null)))
  const pipeline = (items, ...etapes) =>
    Promise.all(items.map(async (item, i) => {
      let v = item
      for (const e of etapes) {
        try { v = await e(v, item, i) } catch { return null }
      }
      return v
    }))
  const resultat = await moteur(args, agent, parallel, pipeline, () => {}, () => {}, { total: null, spent: () => 0, remaining: () => Infinity })
  return { resultat, appels }
}
