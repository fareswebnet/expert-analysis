# board

Une méthode en six étapes pour préparer un rendez-vous, savoir si quelqu'un achète une idée, éprouver un business plan ou un positionnement. Chaque étape est une commande séparée, qui écrit un fichier dans le dossier et refuse de partir si l'étape précédente manque, à la manière d'un enchaînement spécifier, clarifier, planifier.

Version 1.0.0. Elle remplace les débats, tables, ateliers à agents et parcours de coach de la v0 (archivés dans `archive/v0/`) : sur les dossiers testés du 16 au 20 novembre 2026, un bon appel unique a fait aussi bien ou mieux, pour 10 à 40 fois moins d'appels (`evals/terrain/`, leçons L-041 à L-043).

## La constitution

`references/principes.md` : les règles que chaque commande lit avant d'agir (un bon appel avant tout dispositif, vérifier à qui l'on parle, questions décisives en arbre, jamais « probablement », raisonner depuis la chaise des acteurs, connaissance générale marquée, ce qui est réglé n'est pas redemandé, le terrain tranche).

## Les étapes

| Commande | Écrit | Prérequis | Appels |
|---|---|---|---|
| `/board:cadrage <documents>` | `00-cadrage.md`, `01-interlocuteur.md` | — | 0 à 1 |
| `/board:base` | `02-base.md` | cadrage, interlocuteur confirmé | 1 |
| `/board:acteurs` | `03-acteurs.md` | base | 1 |
| `/board:angles` | `04-angles.md` | base | 1 |
| `/board:livrable` | `05-livrable.md` | base | 0 |
| `/board:terrain` | `06-terrain.md`, journal privé `board/journal.md` | base | 0 |
| `/board:suite` | rien : dit où en est le dossier et la commande suivante | — | 0 |

Par type de question :
- **Rendez-vous** : cadrage, base, livrable, puis terrain.
- **Idée produit** (« acheter » = adhérer à l'idée, pas financer), **business plan**, **positionnement** : cadrage, base, acteurs, éventuellement angles, livrable, puis terrain.

## Le dossier

`board/<slug>/` dans le répertoire de travail, avec des noms de fichiers fixes. Relancer une étape range l'ancienne version dans `historique/`. `board/.courant` désigne le dossier en cours.

## Les angles

`references/angles.md` décrit quatorze façons de juger tirées de dirigeants connus (avantage durable, inversion et incitations, utilisateurs qui veulent le produit, focus, distribution…). `/board:angles` en choisit deux à quatre et donne un avis séparé par angle, en un appel. Ce sont des grilles de lecture : ni agents, ni rôles à jouer.

## Ce qui juge la méthode

- `evals/terrain/` : les cas tranchés par le terrain ou par l'utilisateur. Toute évolution doit faire au moins aussi bien que la meilleure préparation de ces cas.
- Le journal des leçons est **privé** (`board/journal.md`, dans l'espace de travail) : il contient des noms de clients et les jugements du porteur. `lessons/README.md` en donne le format ; `.gitignore` l'empêche d'entrer dans ce dépôt.

## Arborescence

```
references/principes.md     la constitution
references/angles.md        les angles de critique
skills/<étape>/SKILL.md     cadrage, base, acteurs, angles, livrable, terrain, suite
evals/terrain/              les cas de référence, anonymisés
lessons/README.md           le format du journal privé
archive/v0/                 l'ancienne suite (agents, débat, table, atelier, coach, évaluations générées)
```
