# Baseline: does the board add anything to one question?

Manual procedure. It answers the question the other evals do not: on the same dossier, do the sheets (`ask`), a table or a debate give the owner something that a single prompt to the same model does not? If not, a plain question is enough.

The user is the final judge. A model judge shares the model family of every arm, so its opinion is recorded as an indication only.

## Dossiers

The three dossiers of `../discrimination/cases.json` (`disc-1`, `disc-2`, `disc-3`), each saved as a text file, plus any real subject the user has already run. Use the same file for every arm.

## Arms

| Arm | How | Cost |
|---|---|---|
| `single` | One fresh general-purpose agent, no persona, with the prompt below | 1 call |
| `ask` | `/board:ask` with three members of different lenses (for example thiel, munger, grove) | 3 calls |
| `table` | `/board:table` with the same three members, `--suite` the ask report, and the point the answers left open as the question | about 16 calls |
| `debate` | `/board:debate --quick <dossier>` | 8 calls |

Prompt of the `single` arm, with nothing added:

```
Lis ce dossier en entier : <path>

Critique-le comme le ferait un comité d'investissement exigeant, sous au moins cinq angles différents (client, avantage défendable, économie unitaire, exécution, ce qui peut tuer le projet). Sépare ce que le dossier donne comme fait de ce qu'il suppose. Rends : les objections, les désaccords possibles entre ces angles, les questions à aller poser sur le terrain, les critères d'arrêt. Aucune recherche web.
```

## Normalize, then blind

The outputs do not look alike, so they cannot be compared as they are.

1. **Extract.** Give each output to a fresh agent that has not seen the others: « Liste au plus 15 éléments utiles à la décision présents dans ce texte : objections, désaccords, questions pour le terrain, critères d'arrêt. Une ligne par élément, sans nom de personne, sans reformuler au-delà du nécessaire. N'ajoute rien qui n'y soit pas. »
2. **Blind.** Label the lists W, X, Y, Z in a shuffled order. Keep the key in a separate file.
3. **Judge (user).** For each list, mark every element: `déjà connu` (the owner had it), `utile`, `change la décision`, or `faux`. Then mark the elements that appear in one list only.
4. **Judge (model, optional).** A fresh agent, with the lists and the dossier, lists the elements unique to each list and the elements it considers wrong. Indication only.
5. Open the key.

## Reading the result

Per dossier, for `table` and for `debate`: the number of elements marked `change la décision` by the user that the `single` list does not have.

- An arm earns its cost on a dossier with **at least 3** such elements.
- Keep a mode that earns its cost on **at least 2 dossiers out of 3**. Otherwise record the lesson in `lessons/journal.md` and stop using that mode for decisions, or keep it for what it is (a way to rehearse objections).
- Also compare `table` with `debate`: unique useful elements, wrong elements, and length the user had to read.

Record the series in `../results/history.md` (date, plugin version, model, dossiers, the three counts per dossier, remarks). One series is a snapshot: rerun a dossier whose result decides the question.
