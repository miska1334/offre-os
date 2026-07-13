# Audit AICoach : actions réalisées

Date : 13 juillet 2026
Version préparée : 1.1.0-beta

## Corrigé dans cette version

1. Suppression des fichiers en double qui risquaient de faire modifier la mauvaise version.
2. Capture réelle des emails avec Netlify Forms.
3. Message honnête sur la bêta, sans faux compteur de testeurs.
4. Possibilité de revoir un résultat après actualisation dans la même session navigateur.
5. Nettoyage complet lorsque l’utilisateur choisit de recommencer.
6. Affichage corrigé des cartes emails et des en-têtes de résultats.
7. Gestion plus claire des erreurs API et du quota.
8. Validation serveur des réponses et du résultat généré.
9. Réduction du risque de prompt injection.
10. Restriction des appels navigateur à la même origine.
11. Ajout d’en-têtes de sécurité.
12. Mise à jour de la politique de confidentialité pour Netlify, Anthropic et le stockage de session.
13. Ajout de `.gitignore`.
14. Ajout d’un numéro de version visible dans le pied de page.

## Ce qui reste à faire par Michael

### Obligatoire avant d’envoyer des testeurs

- compléter les informations légales manquantes ;
- déployer le ZIP corrigé sur le bon projet Netlify ;
- vérifier que le formulaire `aicoach-beta` est détecté ;
- faire une génération test complète ;
- confirmer que le nouveau déploiement est bien celui publié en production.

### À faire après les premiers tests

- relier les contacts Netlify Forms à Systeme.io ou les exporter ;
- ajouter un vrai formulaire de feedback dans le parcours ;
- installer un rate limit persistant ou une protection anti-bot avant trafic important ;
- vérifier la configuration Plausible et le domaine suivi ;
- remplacer le lien mailto de la liste d’attente par un formulaire réel.

## Diagnostic du site actuellement publié

Le site public consulté avant correction affichait encore l’ancienne version : `Ton offre complète`, l’ancienne question de budget et une offre Pro à 47 €. Le dépôt ZIP reçu contient une version plus récente. Cela indique que Netlify publie probablement un ancien déploiement, une autre branche ou un autre dossier.

Le marqueur le plus simple après mise à jour est le texte `REVENUS-IA.FR · bêta 1.1` dans le pied de page.
