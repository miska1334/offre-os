# AICoach / OffreOS : bêta 1.1

Prototype statique hébergé sur Netlify avec une fonction serveur pour la génération Claude.

## Structure utile

```text
index.html
css/style.css
js/analytics.js
js/app.js
js/questionnaire.js
js/results.js
netlify/functions/generate.js
netlify.toml
confidentialite.html
mentions-legales.html
```

Les anciens doublons placés à la racine ont été supprimés. Ne modifie que les fichiers de cette structure.

## Variables Netlify

À définir dans `Project configuration > Environment variables` :

- `CLAUDE_API_KEY` : vraie clé Anthropic, à marquer comme secret.
- `MOCK_MODE` : `false` pour utiliser Claude, `true` pour tester sans coût API.

Les variables restent dans Netlify et ne doivent jamais être ajoutées au dépôt.

## Capture des emails

La bêta 1.1 utilise **Netlify Forms**. Le formulaire statique `aicoach-beta` est déclaré dans `index.html`, puis soumis en AJAX depuis `js/app.js`.

Après le premier déploiement :

1. Ouvrir l’onglet **Forms** du projet Netlify.
2. Vérifier que `aicoach-beta` apparaît dans les formulaires actifs.
3. Faire un essai avec une adresse email.
4. Vérifier que la soumission apparaît dans le formulaire.

## Déploiement

Le ZIP prêt à déployer doit contenir `index.html` directement à sa racine. Ne déploie pas un ZIP contenant un dossier supplémentaire autour du projet.

Après déploiement, vérifier dans cet ordre :

1. Le pied de page affiche `bêta 1.1`.
2. Le badge indique `Bêta gratuite actuellement ouverte`.
3. La question 6 est `Pourquoi toi plutôt qu’un autre ?`.
4. Un email de test apparaît dans Netlify Forms.
5. Une génération complète fonctionne avec `MOCK_MODE=false`.
6. Après actualisation de la page, le bouton `Revoir mon résultat` apparaît.

## Sécurité mise en place

- clé API uniquement côté serveur ;
- contrôle d’origine pour la fonction ;
- validation stricte des 7 réponses côté serveur ;
- taille maximale de requête ;
- limitation simple par adresse IP ;
- protection de base contre les instructions injectées dans les réponses ;
- validation du JSON retourné par Claude ;
- en-têtes de sécurité et politique CSP ;
- fichier `.gitignore` pour empêcher l’envoi d’un futur `.env`.

La limitation en mémoire n’est pas un quota absolu sur une architecture serverless. Avant une ouverture importante, ajouter une protection persistante et/ou un challenge anti-bot.

## Point obligatoire avant ouverture publique

Compléter les champs en majuscules dans `mentions-legales.html` et `confidentialite.html` : nom légal, statut, SIRET, adresse professionnelle et directeur de publication.
