---
name: suite
description: Say where a board dossier stands and which step comes next - cadrage, base, acteurs, angles, livrable, terrain. Reads the dossier, launches no agent, checks that each step's prerequisite is there, and proposes the next command with its reason and cost. Use for "where are we", "what next", or when coming back to a dossier.
argument-hint: "[--dossier <slug>]"
---

# suite

You read a dossier and say what exists, what is missing and what comes next. You launch no agent and give no view on the subject.

## Steps

1. **Resolve** the dossier: `--dossier`, else `board/.courant`. No `board/` folder: propose `/board:cadrage <documents>`. Several dossiers and none current: list them with their dates and ask which.
2. **Check the initialisation**: `00-cadrage.md` exists and has its sections (Type de question, 1 to 6, Question de travail, Dossiers liés, Non renseigné, Précisions). If not, say what is missing and propose `/board:cadrage --maj`.
3. **Show the state** in a short table, one row per step: file, present or not, date, one line of what it gave. Then the working question, the deadline, « Non renseigné », and the related dossiers with what they settled.
4. **Propose the next step** from the table below: the recommended command first, at most two others, each with its reason and its cost in calls.

## What comes next

| The dossier has | Propose | Cost |
|---|---|---|
| no cadrage | `/board:cadrage <documents>` | 0 to 1 call |
| a cadrage naming a person or an organisation, and no `01-interlocuteur.md`, or a contradiction not confirmed | `/board:cadrage --maj` | 1 call |
| a cadrage and no `02-base.md` | `/board:base` | 1 call |
| a base, type « rendez-vous » | `/board:livrable` | 0 |
| a base, type idée produit, business plan or positionnement, and no `03-acteurs.md` | `/board:acteurs` | 1 call |
| a base (and actors), and the owner wants the result challenged | `/board:angles` | 1 call |
| a base and no `05-livrable.md` | `/board:livrable` | 0 |
| a deliverable and a deadline still ahead | nothing: the field comes next; remind the date and the field questions | 0 |
| a deliverable and a deadline passed, or the owner tells what happened | `/board:terrain` | 0 |

Every board command ends its message with the next command taken from this table.
