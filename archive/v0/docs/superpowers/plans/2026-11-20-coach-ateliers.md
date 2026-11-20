# Coach d'ateliers du board — plan de mise en œuvre

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un skill `/board:coach` qui anime, avec des agents pour participants, un atelier seul ou un parcours d'ateliers, à partir d'un catalogue de fiches JSON exécutées par un moteur unique.

**Architecture:** Le script actuel de l'atelier (`skills/atelier/atelier.workflow.js`) devient un moteur générique (`skills/coach/moteur.workflow.js`) qui reçoit une fiche en argument et exécute l'une de cinq mécaniques (atelier, chaine, rotation, notation, objection). Les fiches vivent dans `skills/coach/fiches/*.json` ; un générateur Python les valide et produit `skills/coach/CATALOGUE.md`. Le skill coach dialogue avec l'utilisateur (cadrage léger, choix du parcours, validation entre étapes) et lance le moteur par l'outil Workflow ; un programme Python enregistre le rapport et la sortie de chaque étape dans le dossier.

**Tech Stack:** Script Workflow de Claude Code (JavaScript sans accès fichier), Node 18+ pour les tests du moteur, Python 3 (bibliothèque standard, `unittest`) pour le catalogue et l'enregistrement, agents Markdown du plugin.

**Spec:** `docs/superpowers/specs/2026-11-20-coach-ateliers.md`

## Global Constraints

- Tout ce que lit l'utilisateur et tout ce qu'écrivent les agents est en français.
- Les noms de propriétés des schémas JSON passés à `agent(…, {schema})` sont en ASCII (`^[a-zA-Z0-9_.-]{1,64}$`) : l'API refuse les accents.
- Le moteur ne lit ni n'écrit aucun fichier ; tout ce qu'il reçoit passe par `args`, tout ce qu'il produit passe par sa valeur de retour.
- Une relance au plus par étape d'agent ; toute relance, tout identifiant inconnu, tout élément écarté est inscrit dans `ecarts` et dans la rubrique « Contrôles du script » du rapport.
- Aucun texte de carte n'est réécrit par un agent non persona : les regroupements se font par identifiants, le texte est remis par le code.
- Rien dans un dossier n'est écrasé : chaque fichier prend le prochain numéro libre `NN-`.
- Les étapes de convergence (notation, consentement) ne décident pas : leur sortie est une proposition que l'utilisateur valide.
- Chaque fiche porte `nom` (nom usuel) et `source` (auteur et référence). Les sources citées dans ce plan viennent de la mémoire du rédacteur : les vérifier avant d'écrire la fiche, et écrire `"verifie": false` dans `source` tant qu'elles ne le sont pas.
- Le comportement de `/board:atelier` et de `--premortem` ne change pas (mêmes consignes, même rapport).

## Review Focus

- Une fiche qui nomme un persona inexistant, une mécanique inconnue ou une clé accentuée : le générateur doit la refuser avec le nom du fichier et le champ fautif, pas produire un catalogue partiel. → Task 2.
- Un agent qui renvoie un identifiant inexistant, une liste vide ou un champ manquant : le moteur écarte l'élément, l'inscrit dans `ecarts`, et continue ; il ne lève jamais d'exception non rattrapée. → Tasks 3 à 7, un test de réponse malformée par mécanique.
- Une chaîne de pourquoi où un siège répond que les documents ne permettent pas d'aller plus loin : la chaîne s'arrête à ce niveau, sans niveau inventé pour atteindre cinq. → Task 4.
- Des tours d'objection qui ne convergent jamais : arrêt au nombre maximal de tours, rapport qui liste les objections non levées et ne dit pas « consentement obtenu ». → Task 7.
- Une étape de parcours lancée alors que l'utilisateur n'a retenu aucun élément de l'étape précédente : le coach s'arrête et le dit, il ne relance pas l'étape suivante sur une entrée vide. → Task 8.

---

## Fichiers

| Fichier | Rôle |
|---|---|
| `agents/participant.md` | Agent `board:participant` : siège neutre, règles communes des personas, sans fiche |
| `skills/coach/fiches/<id>.json` | Une fiche par technique |
| `skills/coach/tools/catalogue.py` | Valide les fiches, génère `CATALOGUE.md` |
| `skills/coach/CATALOGUE.md` | Catalogue généré (ne pas éditer) |
| `skills/coach/moteur.workflow.js` | Moteur : une fonction par mécanique, assemblage du rapport |
| `skills/coach/rapport.py` | Enregistre `NN-<id>.md` et `NN-<id>.sortie.json`, vérifie les citations |
| `skills/coach/tests/harnais.mjs` | Charge le moteur dans Node avec des agents simulés |
| `skills/coach/tests/*.test.mjs` | Tests du moteur, une suite par mécanique |
| `skills/coach/tests/test_catalogue.py`, `test_rapport.py` | Tests Python |
| `skills/coach/SKILL.md` | Skill `/board:coach` |
| `skills/atelier/SKILL.md` | Lance le moteur avec la fiche `atelier` ou `pre-mortem` |
| `skills/cadrage/SKILL.md`, `skills/suite/SKILL.md` | Cadrage léger `--coach` ; état et suite d'un parcours |

Supprimés à la Task 3 : `skills/atelier/atelier.workflow.js`, `skills/atelier/atelier_rapport.py` (remplacés par le moteur et `rapport.py`).

---

### Task 1: Agent `board:participant`

**Files:**
- Create: `agents/participant.md`
- Test: `skills/coach/tests/test_participant.py`

**Interfaces:**
- Produces: l'agent `board:participant`. Brief reçu : les mêmes tours que les personas (`ATELIER CARTES`, `ATELIER MUR`, `ATELIER ARGUMENTAIRE`, `ASK`) plus `POSTURE: <texte>` à la place de `SHEET:`.

- [ ] **Step 1: Write the failing test** `test_regles_communes_identiques` : les cinq paragraphes de `agents/buffett.md` qui commencent par `- Facts about the project`, `- Check the owner's figures`, `- If the documents include a file titled \`Audit des chiffres\``, `- If the documents include a file titled \`Cadrage\`` et `- You may bring your general knowledge` figurent tels quels dans `agents/participant.md`. Deuxième test `test_sans_fiche` : `participant.md` ne contient ni `SHEET:` comme instruction de lecture obligatoire ni le mot `persona sheet`, et contient `POSTURE:`.
- [ ] **Step 2: Run** `python3 -I -m unittest skills/coach/tests/test_participant.py -v` — Expected: FAIL (fichier absent).
- [ ] **Step 3: Write `agents/participant.md`** : frontmatter `name: participant`, `description: Siège neutre des ateliers du board : tient la posture donnée par l'atelier, sans personnalité. Invoke only from a board skill.`, `tools: Read, Glob`. Corps : « Avant tout » lit la ligne `POSTURE:` ; les règles sur les documents, les chiffres, le cadrage, l'audit et le marquage reprises mot pour mot de `buffett.md` ; les tours `ATELIER CARTES`, `ATELIER MUR`, `ATELIER ARGUMENTAIRE`, `ASK` repris en remplaçant « your sheet » par « ta posture » ; pas de voix ni de section « Staying in character ».
- [ ] **Step 4: Run** the test — Expected: PASS.
- [ ] **Step 5: Commit** `git add agents/participant.md skills/coach/tests/test_participant.py && git commit -m "board : agent participant pour les sièges neutres"`

### Task 2: Format des fiches et catalogue

**Files:**
- Create: `skills/coach/tools/catalogue.py`, `skills/coach/tests/test_catalogue.py`, `skills/coach/tests/fixtures/fiche-valide.json`

**Interfaces:**
- Produces: le format de fiche, utilisé par toutes les tâches suivantes :

```json
{
  "id": "cinq-pourquoi",
  "nom": "Les 5 Pourquoi",
  "alias": [],
  "source": { "auteur": "…", "reference": "…" },
  "diamant": "explorer",
  "quand": "…", "pasQuand": "…",
  "mecanique": "chaine",
  "sieges": [ { "posture": "…", "persona": "grove" } ],
  "parametres": { },
  "entree": "aucune",
  "sortie": "causes",
  "pieges": [ "…" ],
  "cout": "…"
}
```

  `diamant` ∈ `cadrer, diverger, explorer, converger, conclure` ; `mecanique` ∈ `atelier, chaine, rotation, notation, objection` ; `entree` ∈ `aucune, options, causes, proposition` ; `sortie` ∈ `options, causes, proposition, signaux, scenarios` ; `persona` = un slug de `agents/*.md` ou `null` (siège neutre, tenu par `board:participant`) ; 3 à 6 sièges, sauf `chaine` (1 à 4).
- Produces: `valider(fiche: dict, slugs: set[str]) -> list[str]` (liste d'erreurs, vide si valide) et `catalogue(fiches: list[dict]) -> str` (Markdown) dans `catalogue.py` ; en ligne de commande, `python3 -I skills/coach/tools/catalogue.py` valide toutes les fiches de `skills/coach/fiches/`, sort en code 1 avec la liste des erreurs si l'une est invalide, sinon écrit `CATALOGUE.md`.

- [ ] **Step 1: Write the failing tests** dans `test_catalogue.py` : `test_fiche_valide` (la fixture renvoie `[]`) ; `test_persona_inconnu` (`"persona": "inconnu"` → une erreur contenant `inconnu`) ; `test_mecanique_inconnue` ; `test_cle_accentuee` (une clé `"paramètres"` → une erreur contenant `ASCII`) ; `test_source_obligatoire` (sans `source.auteur` → une erreur) ; `test_catalogue_regroupe_par_diamant` (deux fiches `diverger` et `explorer` → le Markdown contient les titres `## Diverger` puis `## Explorer`, et une ligne par fiche avec nom, alias, mécanique, nombre de sièges, coût).
- [ ] **Step 2: Run** `python3 -I -m unittest skills/coach/tests/test_catalogue.py -v` — Expected: FAIL.
- [ ] **Step 3: Implement** `valider` et `catalogue` ; la vérification ASCII porte sur toutes les clés, à toute profondeur.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "coach : format des fiches et générateur du catalogue"`

### Task 3: Moteur générique, mécanique `atelier`, fiches `atelier` et `pre-mortem`

**Files:**
- Create: `skills/coach/moteur.workflow.js` (à partir de `skills/atelier/atelier.workflow.js`), `skills/coach/rapport.py` (à partir de `skills/atelier/atelier_rapport.py`), `skills/coach/fiches/atelier.json`, `skills/coach/fiches/pre-mortem.json`, `skills/coach/tests/harnais.mjs`, `skills/coach/tests/atelier.test.mjs`, `skills/coach/tests/test_rapport.py`
- Modify: `skills/atelier/SKILL.md` (étapes 2 et 3)
- Delete: `skills/atelier/atelier.workflow.js`, `skills/atelier/atelier_rapport.py`

**Interfaces:**
- Consumes: le format de fiche (Task 2).
- Produces: `args` du moteur : `{ date, question, documents, documentsAffiches, cadrage, fichesDir, fiche, sieges: [{ slug, nom, posture, persona: bool }], entrees: [{ id, texte, source }] }`. `slug` vaut `participant` pour un siège neutre. Les arguments `participants` et `premortem` de l'ancien script sont remplacés : `pre-mortem.json` porte `parametres.premortem: true` et `parametres.horizon`.
- Produces: valeur de retour : `{ ok, rapport, carteDecision, differences, statistiques, ecarts, citations, sortie: { type, items: [{ id, texte, source }] } }` ; en échec `{ ok: false, etape, message, ecarts }`. Les noms de propriétés passent en ASCII (`carteDecision`, `differences`, `documentsAffiches`) ; `rapport.py` est adapté en conséquence.
- Produces: `harnais.mjs` exporte `async function lancer(args, reponses)` : charge le texte du moteur, retire `export const meta`, l'enveloppe dans une fonction asynchrone qui reçoit `agent, parallel, pipeline, phase, log`, et fournit un `agent` simulé qui renvoie `reponses[label]` (par préfixe de label, `null` si absent). Renvoie la valeur de retour du moteur.
- Produces: `rapport.py <sortie-workflow.json> <dossier> <documents…>` écrit `NN-<fiche.id>.md` et `NN-<fiche.id>.sortie.json`, affiche le chemin, la carte de décision, les phrases « Ma différence : » et les écarts.

- [ ] **Step 1: Write the failing tests** dans `atelier.test.mjs` (exécution : `node --test skills/coach/tests/`) : `mur mot pour mot` (cartes simulées de trois sièges, mur simulé qui regroupe par identifiants → chaque texte de carte figure une fois dans `rapport`) ; `point sur sa propre carte retiré` (→ un écart contenant `donné à sa propre carte`) ; `réponse malformée` (le mur renvoie un identifiant `C99` → relance, puis `{ ok: false, etape: 'mur' }` si la relance échoue aussi, sans exception) ; `pre-mortem` (fiche `pre-mortem.json` → cartes à trois champs, enchaînement gardé seulement si ses mots figurent dans une carte). Dans `test_rapport.py` : `test_numero_suivant` et `test_ne_rien_ecraser` (un `05-atelier.md` existant → écrit `06-…`), `test_sortie_json`.
- [ ] **Step 2: Run** `node --test skills/coach/tests/` et `python3 -I -m unittest skills/coach/tests/test_rapport.py -v` — Expected: FAIL.
- [ ] **Step 3: Implement** : déplacer le script, remplacer `PM`/`args.premortem` par `fiche.parametres.premortem`, construire les sièges à partir de `args.sieges` (agent `board:<slug>`, ligne `POSTURE:` pour `participant`, ligne `MANDAT:` sinon), isoler le code d'une mécanique dans `async function mecaniqueAtelier(ctx)` et choisir la mécanique par `fiche.mecanique`. `sortie.items` de l'atelier = les cartes options (ou causes en pre-mortem) avec leur identifiant. Écrire `atelier.json` (source : groupe nominal, Delbecq et Van de Ven, 1971 ; diagramme d'affinité, Jiro Kawakita) et `pre-mortem.json` (source : Gary Klein, « Performing a Project Premortem », Harvard Business Review, 2007).
- [ ] **Step 4: Run** the tests — Expected: PASS.
- [ ] **Step 5: Non-régression** : relancer avec l'outil Workflow, sur les exécutions déjà en cache `wf_388ce2dc-84e` (atelier) et `wf_d6a10a45-410` (pre-mortem), les mêmes arguments traduits au nouveau format. Expected : tous les agents servis par le cache, et le rapport identique à `board/projet A-achat/05-atelier.md` et `06-atelier.md` aux lignes d'en-tête près. Si un agent n'est pas servi par le cache, une consigne a changé : la retrouver et la remettre à l'identique.
- [ ] **Step 6: Mettre à jour `skills/atelier/SKILL.md`** (le moteur et la fiche à passer), lancer `python3 -I skills/coach/tools/catalogue.py`, commit `git commit -m "coach : moteur générique, l'atelier et le pre-mortem deviennent des fiches"`

### Task 4: Mécanique `chaine` et fiche `cinq-pourquoi`

**Files:**
- Modify: `skills/coach/moteur.workflow.js` (ajouter `mecaniqueChaine`)
- Create: `skills/coach/fiches/cinq-pourquoi.json`, `skills/coach/tests/chaine.test.mjs`

**Interfaces:**
- Consumes: `args`, harnais (Task 3).
- Produces: `parametres: { niveaux: 5, symptomes: 3 }`. Entrée : `entrees` (symptômes) ou, si vide, les symptômes que le premier siège tire des documents (au plus `symptomes`). Pour chaque symptôme, une chaîne : le niveau k est posé au siège `k mod nombre de sièges`, qui reçoit le symptôme et les réponses précédentes et rend `{ cause, appui, fin }` (`appui` = passage des documents ou « non documenté » ; `fin` = vrai si les documents ne permettent pas d'aller plus loin). Puis un greffier non persona rend, par chaîne, la cause racine et ce qui reste à vérifier. `sortie = { type: 'causes', items }`, une cause racine par chaîne.

- [ ] **Step 1: Write the failing tests** : `arrêt sur fin` (le siège du niveau 2 renvoie `fin: true` → la chaîne a 2 niveaux, aucun niveau 3 demandé à `agent`) ; `rotation des sièges` (3 sièges, 5 niveaux → labels `chaine:1:n1` à `n5` envoyés aux sièges 1,2,3,1,2) ; `appui non documenté signalé` (un niveau sans passage → la carte de décision le marque « non documenté ») ; `réponse malformée` (niveau renvoyant `null` → la chaîne s'arrête, écart inscrit).
- [ ] **Step 2: Run** `node --test skills/coach/tests/chaine.test.mjs` — Expected: FAIL.
- [ ] **Step 3: Implement** `mecaniqueChaine(ctx)` ; chaînes en parallèle (`pipeline`), niveaux en séquence ; écrire `cinq-pourquoi.json` (source : Taiichi Ohno, *Toyota Production System*, 1978 ; méthode attribuée à Sakichi Toyoda).
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "coach : mécanique chaîne et fiche 5 pourquoi"`

### Task 5: Mécanique `rotation` et fiche `brainwriting-635`

**Files:**
- Modify: `skills/coach/moteur.workflow.js` (`mecaniqueRotation`)
- Create: `skills/coach/fiches/brainwriting-635.json`, `skills/coach/tests/rotation.test.mjs`

**Interfaces:**
- Produces: `parametres: { idees: 3, tours: 3 }`. Tour 1 : chaque siège écrit `idees` idées sur sa feuille. Tour t > 1 : chaque siège reçoit la feuille du siège précédent (rotation) et ajoute `idees` idées qui prolongent l'une de celles déjà écrites, en citant son identifiant (`prolonge`). Identifiants `F<feuille>-I<n>`. Puis le mur (même consigne que la mécanique atelier, zone unique « Idées ») et un greffier. `sortie = { type: 'options', items }`.

- [ ] **Step 1: Write the failing tests** : `rotation` (4 sièges, 3 tours → au tour 2 le siège 2 reçoit la feuille 1) ; `prolongement vérifié` (une idée qui cite un identifiant absent de la feuille reçue → écart, idée gardée sans lien) ; `texte mot pour mot` (chaque idée figure une fois dans le rapport).
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** ; écrire la fiche (source : Bernd Rohrbach, « Kreativ nach Regeln – Methode 635 », *Absatzwirtschaft*, 1969).
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "coach : mécanique rotation et fiche brainwriting 6-3-5"`

### Task 6: Fiche `six-chapeaux` (mécanique `atelier`, sièges à posture) et mécanique `notation` avec la fiche `impact-effort`

**Files:**
- Modify: `skills/coach/moteur.workflow.js` (`mecaniqueNotation` ; sièges à posture fixe dans `mecaniqueAtelier`)
- Create: `skills/coach/fiches/six-chapeaux.json`, `skills/coach/fiches/impact-effort.json`, `skills/coach/tests/notation.test.mjs`

**Interfaces:**
- Produces (six chapeaux) : six sièges dont la posture est fixée par la fiche (faits, ressenti, risques, bénéfices, idées nouvelles, organisation), `persona: null` par défaut ; la carte de décision garde la colonne de chaque posture. Source : Edward de Bono, *Six Thinking Hats*, 1985.
- Produces (notation) : `parametres: { axes: ["impact", "effort"], echelle: [1, 5] }`. Entrée obligatoire : `entrees` (options). Chaque siège rend, pour chaque option, une note par axe et un appui (passage des documents ou « non documenté »). Le script calcule la médiane et l'écart entre notes extrêmes par option et par axe, place chaque option dans un quadrant, et signale une option dont l'écart dépasse 2. Pas de greffier : la carte est produite par le code. `sortie = { type: 'options', items }` trié par quadrant, la note restant une proposition. Source : pratique publiée, sans auteur unique (le nom et la mention figurent dans la fiche).

- [ ] **Step 1: Write the failing tests** : `médiane et écart` (notes 1,3,5 → médiane 3, écart 4, option signalée) ; `entrée vide` (aucune option → `{ ok: false, etape: 'notation' }`, aucun agent appelé) ; `note manquante` (un siège omet une option → médiane sur les notes présentes, écart inscrit) ; `six chapeaux` (fiche à six sièges neutres → six briefs `board:participant` avec chacun sa ligne `POSTURE:`).
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** ; écrire les deux fiches.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "coach : six chapeaux, mécanique notation et matrice impact/effort"`

### Task 7: Mécanique `objection` et fiche `consentement`

**Files:**
- Modify: `skills/coach/moteur.workflow.js` (`mecaniqueObjection`)
- Create: `skills/coach/fiches/consentement.json`, `skills/coach/tests/objection.test.mjs`

**Interfaces:**
- Produces: `parametres: { toursMax: 3 }`. Entrée obligatoire : une proposition (`entrees[0]`). À chaque tour, chaque siège rend `{ consent: bool, objection, appui }` ; une objection doit dire quel tort la proposition cause, pas une préférence. S'il y a des objections, un rédacteur non persona amende la proposition pour les lever, sans rien y ajouter d'autre ; nouveau tour. Arrêt quand aucun siège n'objecte, ou à `toursMax`. `sortie = { type: 'proposition', items: [proposition finale] }` avec `statistiques.consentement: true|false` et la liste des objections non levées. Source : Gerard Endenburg, sociocratie, années 1970.

- [ ] **Step 1: Write the failing tests** : `consentement au tour 2` (objection au tour 1, aucune au tour 2 → 2 tours, `consentement: true`) ; `non-convergence` (objections à chaque tour → arrêt à 3, `consentement: false`, rapport sans la phrase « consentement obtenu », objections listées) ; `entrée vide` (→ `{ ok: false }` sans agent) ; `amendement sans ajout` (le rapport montre la proposition de chaque tour, mot pour mot).
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** ; écrire la fiche.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "coach : mécanique objection et décision par consentement"`

### Task 8: Skill `/board:coach`, cadrage léger, suite

**Files:**
- Create: `skills/coach/SKILL.md`
- Modify: `skills/cadrage/SKILL.md` (variante `--coach`), `skills/suite/SKILL.md` (état d'un parcours), `README.md`, `.claude-plugin/plugin.json` (version 0.11.0), `lessons/journal.md`

**Interfaces:**
- Consumes: le moteur et `rapport.py` (Task 3), le catalogue (Task 2).
- Produces: `/board:coach [technique] [--dossier <slug>]`. Sans technique : le coach ouvre ou reprend le dossier, fait le cadrage léger s'il manque, propose un parcours lu dans `CATALOGUE.md` (pour le premier lot : 5 pourquoi, brainwriting 6-3-5, six chapeaux, impact/effort, consentement), et l'exécute étape par étape. Avec une technique : un atelier seul.
- Produces: entre deux étapes, le coach montre `sortie.items` et demande lesquels passent à l'étape suivante ; il écrit le choix de l'utilisateur, mot pour mot, dans `NN-<id>.sortie.json` (`retenus`) ; l'étape suivante reçoit ces éléments en `entrees`. Si aucun élément n'est retenu, il s'arrête et le dit.
- Produces: `/board:cadrage --coach` écrit `00-cadrage.md` en quatre sections (Question puissante, Déjà su ou essayé, Ce qui ne bouge pas, Résultat attendu et qui décide), avec « Non renseigné » et « Précisions », mêmes règles que le cadrage du board.

- [ ] **Step 1: Write the skill files** selon les interfaces ; le coach ne lance aucun agent lui-même (tout passe par le moteur), ne résume pas une étape en cours, et rappelle avant chaque lancement le coût en appels lu dans la fiche.
- [ ] **Step 2: Vérifier** : `python3 -I skills/coach/tools/catalogue.py` passe, `node --test skills/coach/tests/` et `python3 -I -m unittest discover skills/coach/tests` passent, et un essai à blanc (`/board:coach cinq-pourquoi` sur un petit dossier de test hors du projet déjà traité) va jusqu'à `NN-cinq-pourquoi.md` et `.sortie.json`.
- [ ] **Step 3: Commit** `git commit -m "board 0.11.0 : coach d'ateliers, cadrage léger, cinq premières techniques"`

### Task 9: Séance réelle (recette)

Pas de code. Avec l'utilisateur : un problème réel hors du projet déjà traité, idéalement déjà résolu ; `/board:cadrage --coach`, puis le parcours complet ; à chaque arrêt, l'utilisateur retient les éléments ; à la fin, `/board:retro` sur chaque étape, et comparaison avec la solution réellement retenue s'il y en a une. Les leçons vont au journal ; une technique jugée inutile par l'utilisateur est notée comme telle et ne part pas dans la vague suivante sans révision.
