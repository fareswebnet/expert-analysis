# Spécification : coach d'ateliers du board

Décidée avec l'utilisateur le 2026-11-20 (séance de questions, treize décisions). Source des techniques : un guide de 50 ateliers de facilitation fourni par l'utilisateur, conservé hors du dépôt.

## But

Disposer d'un coach qui anime, avec des agents pour participants, des ateliers de résolution de problèmes : un atelier seul, ou un parcours de plusieurs ateliers à travers le diamant (cadrer, diverger, explorer, converger, conclure).

## Décisions

1. **Participants : des agents.** Les ateliers qui servent à créer du lien entre humains ou qui reposent sur du matériel physique sont écartés (tour d'inclusion, météo, pacte, brise-glace, réseau express, photolangage, Crazy 8s, connexions insolites, Design the Box).
2. **Sièges.** Chaque atelier déclare des sièges (une posture, un rôle). L'utilisateur choisit qui occupe chaque siège : un persona du board (`board:<slug>`) ou un agent neutre.
3. **Un moteur et un catalogue.** Un seul moteur d'animation (le script de l'atelier, généralisé) et une fiche par technique. Pas un skill par atelier.
4. **Dans le plugin `board`**, le moteur isolé dans son propre fichier pour qu'une séparation ultérieure ne coûte qu'un déplacement.
5. **Premier lot de cinq ateliers**, un par mécanique du moteur : Six chapeaux (postures en parallèle), 5 pourquoi (chaîne en profondeur), Brainwriting 6-3-5 (rotation), matrice impact/effort (notation), décision par consentement (tours d'objection). L'atelier actuel et le pre-mortem deviennent les deux premières fiches, sans changement de comportement. Le reste du catalogue suit par vagues.
6. **Le coach propose un parcours et le déroule étape par étape**, en s'arrêtant entre deux ateliers pour que l'utilisateur valide ce qui passe à l'étape suivante. L'utilisateur peut aussi lancer un seul atelier.
7. **Un seul dossier** (`board/<slug>/`) partagé avec les séances du board, avec un **cadrage léger** propre au coach.
8. **Le cadrage léger a quatre questions**, posées en un message : (1) la question puissante, « Comment pourrions-nous… ? », proposée par le coach et corrigée par l'utilisateur ; (2) ce qui est déjà su ou essayé ; (3) ce qui ne bouge pas : contraintes non négociables ; (4) ce qui est attendu à la fin, et qui décide. Mêmes règles que le cadrage du board : mots de l'utilisateur seuls, liste « Non renseigné », amendements datés.
9. **Un agent `board:participant`** tient les sièges neutres : mêmes règles communes que les 14 personas (faits pris dans les documents, marquage de ce qui vient d'ailleurs, hypothèses gardées comme hypothèses, audit non refait, cadrage lu comme la parole du porteur), sans fiche ni personnalité.
10. **Une fiche JSON par technique**, transmise telle quelle au moteur, et un **catalogue lisible généré** qui vérifie que chaque fiche est complète.
11. **Noms usuels des techniques**, avec l'auteur et la source dans chaque fiche.
12. **Validation** : contrôles automatiques sur la mécanique ; une séance réelle jugée par l'utilisateur pour la valeur. Pas de juge automatique sur la qualité des idées.
13. **Premier test** : un seul problème réel, hors du projet déjà traité, en parcours complet ; idéalement un problème déjà résolu, pour comparer le résultat à ce qui s'est passé.

## Points ouverts

- Le problème du premier test, choisi au moment de la séance.
- Commandes proposées : `/board:coach` pour un parcours, `/board:coach <technique>` pour un atelier seul.
