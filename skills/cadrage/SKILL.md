---
name: cadrage
description: Step 1 of the board. Open a dossier and write its cadrage (00-cadrage.md, the owner's framing every later step reads, like a spec), list the related dossiers, and check the counterpart on the web (01-interlocuteur.md) when the owner meets a person or an organisation. Use to start any work with the board, or with --maj to amend the framing. Next: /board:base.
argument-hint: "<document path(s)> [\"subject\"] [--dossier <slug>] [--maj] [--sans-recherche]"
---

# cadrage

Read `BASE/../../references/principes.md` first and apply it.

You open a dossier and write down what the owner wants, in his words. You add nothing of your own to the cadrage: no advice, no inference. The only additions that are not his words are the paths of the related dossiers and of the counterpart check, each said to be so.

## The dossier

- A folder `board/<slug>/` in the current working directory; `<slug>` from `--dossier`, else the subject, else the first document's name. `board/.courant` holds the slug of the current dossier; every command reads it when no dossier is named.
- Fixed file names, one per step: `00-cadrage.md`, `01-interlocuteur.md`, `02-base.md`, `03-acteurs.md`, `04-angles.md`, `05-livrable.md`, `06-terrain.md`. Rerunning a step moves the previous file to `historique/<name>.<YYYY-MM-DD-HHMM>.md` first.

## Steps

1. **Resolve** the documents (absolute paths; read them in full) and the slug. If `00-cadrage.md` exists and `--maj` is absent, show its working question and « Non renseigné », write the slug to `board/.courant`, and stop with the next command.
2. **Related dossiers.** List the other `board/*/00-cadrage.md` that share a document, a subject, a counterpart or a product with this one. Read their `02-base.md`, `05-livrable.md` and `06-terrain.md`, and say to the owner in one line what they already settled.
3. **Ask the owner**, in one message, at most six short questions, skipping any his message or the documents already answer:
   1. What decision or action must the answer serve?
   2. Whom is it aimed at: exact name, title and organisation (the legal entity and its group, not only the brand), what that person can decide, give or refuse?
   3. What does he already know or has tried, and what can he show today?
   4. What would a useful result look like?
   5. Is there a date?
   6. What must not be done or assumed, and what would make him stop?
   Take his words. A question he does not answer stays unanswered.
4. **Write `00-cadrage.md`** with exactly these sections: `# Cadrage : <subject>`; the lines `- Dossier :`, `- Ouvert le :`, `- Mis à jour le :`; `## Type de question` (one of: rendez-vous, idée produit, business plan, positionnement, autre; for idée produit, « acheter » means adhering to the idea and its positioning, never financing); `## Documents`; `## 1. Décision à servir`; `## 2. À qui cela s'adresse`; `## 3. Ce qui est déjà su ou montrable`; `## 4. Résultat attendu`; `## 5. Échéance`; `## 6. Limites et critères d'arrêt`; `## Question de travail` (one sentence); `## Dossiers liés`; `## Non renseigné`; `## Précisions`. Under each numbered section, only the owner's words between « », or a quoted passage of his documents. Write the slug to `board/.courant`.
5. **Counterpart check**, when section 2 names a person or an organisation and `--sans-recherche` is absent. Launch one fresh `general-purpose` agent with web search, with section 2 and this instruction:

```
Tu es documentaliste. Établis, avec une URL et une date pour chaque fait, et le niveau V (vérifié), P (probable) ou NT (non trouvé) :
1. Qui est l'interlocuteur : nom, fonction exacte, depuis quand, parcours, prises de parole publiques.
2. Son entité : forme juridique, rattachement (filiale, succursale, groupe, actionnaire), régulateur s'il y en a un, où se prennent les décisions qui concernent le sujet.
3. Ce qu'il décide et ce qui se décide ailleurs ; qui porte le risque ou le coût dont parle le cadrage, s'il est publié.
4. Les entités proches que le porteur pourrait confondre avec elle (même marque, autre groupe), et les liens réels entre elles.
5. L'actualité de l'entité sur deux ans.
N'invente rien : ce qui n'est pas trouvé est écrit « non trouvé ». Ni avis ni recommandation. 600 mots au plus.
```

   Check that each V fact has a URL; relaunch once if not. Save `01-interlocuteur.md`, add its path under « Documents » with a dated line under « Précisions ». **If it contradicts section 2** (another entity, title, group, or a decision taken elsewhere), say so first and ask the owner to confirm whom he meets; amend from his answer only, and write « Interlocuteur confirmé : <date> » under « Précisions ». Every later step refuses to start while a contradiction is unconfirmed.
6. **Tell the user** the path, the working question (he may correct it), « Non renseigné », what the check found and did not find, and the next command: `/board:base`.

## Amending (`--maj`, or a new fact along the way)

Only the owner amends. Add a dated line under « Précisions » with his words, update the section it concerns and « Mis à jour le », remove from « Non renseigné » what is now answered. Never rewrite a section silently.
