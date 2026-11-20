# board

Une méthode en six étapes pour préparer un rendez-vous, savoir si quelqu'un achète une idée, éprouver un business plan ou un positionnement. Chaque étape est une commande séparée, qui écrit un fichier dans le dossier et refuse de partir si l'étape précédente manque, à la manière d'un enchaînement spécifier, clarifier, planifier.

Version 1.0.0. Elle remplace les débats, tables, ateliers à agents et parcours de coach de la v0 (archivés dans `archive/v0/`) : sur les dossiers testés du 16 au 20 novembre 2026, un bon appel unique a fait aussi bien ou mieux, pour 10 à 40 fois moins d'appels (`evals/terrain/`, leçons L-041 à L-043).

## Installation

Dans Claude Code :

```
/plugin marketplace add fareswebnet/expert-analysis
/plugin install board@expert-analysis
```

Les commandes apparaissent ensuite sous la forme `/board:<étape>`. Pour mettre à jour : `/plugin`, puis mettre à jour `board` depuis le marketplace `expert-analysis`.

## Mode d'emploi

Lancez les commandes depuis le répertoire de travail où vous voulez garder vos dossiers. Chaque sujet devient un dossier `board/<sujet>/`. Le journal des leçons, `board/journal.md`, reste dans ce répertoire et n'entre jamais dans un dépôt.

**Préparer un rendez-vous** (3 appels environ)

1. `/board:cadrage notes-client.md "rendez-vous avec le directeur financier de X"` : répondez aux questions (décision à servir, qui vous rencontrez, ce que vous savez, la date). L'interlocuteur est vérifié sur le web ; si la vérification contredit ce que vous avez dit, confirmez qui vous voyez avant d'aller plus loin.
2. `/board:base` : le verdict, les questions décisives en arbre (si la réponse est a, alors… ; si ce n'est pas le cas, viser…), les hypothèses classées avec leur test le moins cher.
3. `/board:livrable` : la fiche d'une page à emporter.
4. Après le rendez-vous, `/board:terrain` : racontez, répondez aux questions prévues une par une ; chaque fichier du dossier est noté contre ce qui s'est passé.

**Savoir si quelqu'un achète une idée, éprouver un business plan ou un positionnement** (4 à 5 appels)

1. `/board:cadrage definition-produit.md` : au type de question, choisissez « idée produit » (acheter veut dire adhérer à l'idée, pas financer), « business plan » ou « positionnement ».
2. `/board:base`.
3. `/board:acteurs` : les acteurs de la chaîne de valeur (qui achète, qui paie, qui porte le risque, l'outil en place, qui bloque) sont nommés et joués un par un ; la fin du fichier liste ce que la base n'avait pas vu. Vous pouvez imposer les acteurs : `/board:acteurs "DRH, cabinet de recrutement, candidat"`.
4. Si vous voulez une critique : `/board:angles munger,graham,thiel`, ou sans argument pour laisser choisir les angles adaptés.
5. `/board:livrable`, puis `/board:terrain` après vos entretiens.

**À tout moment**, `/board:suite` dit où en est le dossier et quelle commande lancer. Une commande lancée trop tôt s'arrête et nomme celle qui manque. Relancer une étape range l'ancienne version dans `historique/`. Pour corriger le cadrage : `/board:cadrage --maj`.

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
