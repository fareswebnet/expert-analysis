# Leçons

Le journal des leçons est **privé** : il contient des noms de clients, d'interlocuteurs et les jugements du porteur. Il ne vit pas dans ce dépôt mais dans l'espace de travail, à côté des dossiers : `board/journal.md` (dans le répertoire où l'on lance les commandes). `/board:terrain` y écrit. `.gitignore` empêche de le remettre ici.

## Format d'une entrée

Identifiant, titre, type (`session`, `terrain`, `eval`), cible (`principes §n`, `skill:<nom>`, `aucune`), statut (`observée`, `confirmée`, `appliquée`, `rejetée`), occurrences (date, sujet, fichier, preuve), changement envisagé. Une table « Terrain » (date, sujet, ce que le board disait, ce qui a été observé, verdict) et une table « Jugement de l'utilisateur ».

**Règle.** Une leçon vue sur un seul sujet reste `observée`. Elle devient `confirmée` quand elle est revue sur un second sujet distinct, et peut alors changer `references/principes.md`, avec l'accord du porteur.

## Ce que le journal a établi (anonymisé)

Les leçons qui fondent la v1.0.0 sont résumées dans `references/principes.md` et prouvées par les cas anonymisés de `evals/terrain/` :
- un bon appel unique a fait aussi bien ou mieux que débats, tables et ateliers de 16 à 40 appels ;
- la préparation d'un rendez-vous a échoué faute d'avoir vérifié l'interlocuteur et en pariant sur une réponse non vérifiée ;
- raisonner depuis la chaise des acteurs de la chaîne de valeur apporte des canaux, des prix et des blocages que la base ne voit pas ; un seul appel le fait aussi bien qu'un atelier à agents.
