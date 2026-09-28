# Audit V2 — L'Escale de Larcher

Branche : `claude/site-audit-v2-redesign-j9z360` · Date : 2026-09-28

> Le site de production (lescaledelarcher.fr) n'était pas joignable depuis l'environnement
> d'audit (proxy réseau). L'audit porte sur le code source de `main`, supposé identique à la prod.

## 1. Incohérences entre pages (corrigées — commit « V2 · Contenu »)

| # | Incohérence | Pages | Correction |
|---|---|---|---|
| 1 | Restaurant : « jeudi → dimanche » (bannière, meta) vs « vendredi → dimanche + soirs d'été » (bloc pratique) vs « juillet-août uniquement » (accueil, llms.txt) | restaurant, index, llms.txt | **Juillet-août, tous les soirs, 18h-22h30** (validé propriétaire) |
| 2 | « 18 pizzas » annoncées, 17 listées, numérotation qui saute le n°11 (Céou retirée) | pizzeria | 17 pizzas, numérotation 01→17 |
| 3 | Galerie : « les pizzas du jeudi soir » alors que la pizzeria ouvre ven→dim | gallery | « du week-end » |
| 4 | Bannière « FR · EN · ES » : aucune traduction n'existe | index | supprimé |
| 5 | Saison « Mai → Octobre » vs tentes « avril → octobre » vs vans « toute l'année » | index | « Gîtes & vans toute l'année · tentes d'avril à octobre » |
| 6 | Bouton « Appeler » des gîtes → 06 78…, mais ligne « Gîtes : 06 77 57 23 00 » dans Contact | index | un seul numéro hébergements (validé) |
| 7 | « Voir tout l'album » pointait vers la section elle-même (`#vb-gal`) | index | → `gallery.html` |
| 8 | Lien footer « FAQ · Conditions » vers une FAQ inexistante ; « Piscine » vers les alentours | index | retirés / remplacés |
| 9 | Prix au format mixte : `17.50 €`, `9,5 €` | restaurant, pizzeria | `17,50 €`, `9,50 €` |
| 10 | « Voir les 110 avis sur Google Maps » alors que les 110 avis sont Google + Booking + Airbnb, et que le lien mène à Google Hôtels | index | « Lire les avis sur Google » |
| 11 | Numérotation « Chapitre 01, 03, 04… » (pas de 02) ≠ numérotation du menu « 01…06 » | index | numérotation supprimée (V2 design) |
| 12 | Nav différente selon les pages (ordre, liens) ; pages légales sans menu mobile ni pied de page | toutes | en-tête et pied de page identiques partout |
| 13 | Liens légaux présents uniquement sur l'accueil | pizzeria, restaurant, galerie | dans le pied de page de toutes les pages |
| 14 | `cookies.html` absent du sitemap et de llms.txt | sitemap, llms | ajouté |
| 15 | Typos : « Un sous-bois de sur deux hectares », « L'escale », double espace, séparateur final « · » | index | corrigées |

## 2. À confirmer par les propriétaires (non modifié — je n'invente pas)

- **Distances « Aux alentours » fausses** : Sarlat affiché à 12 km, Padirac à 22 km. À vol d'oiseau, depuis les coordonnées du domaine (44.7249, 1.2854), on est à environ 19 km pour Sarlat et 40 km pour Padirac. La route est forcément plus longue. **Les distances ont été retirées** en attendant des valeurs routières vérifiées (TODO dans `index.html`). Le même problème existe dans `llms.txt` (Sarlat 12 km, Domme 8 km, Cénac 5 km).
- **Mentions légales incomplètes** (LCEN, art. 6 III) : il manque la forme juridique, le SIREN/SIRET et le nom du directeur de la publication (TODO dans `mentions-legales.html`). Source : [LCEN — Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000801164).
- **Allergènes** : pour la restauration, l'information sur les 14 allergènes doit être disponible, et le client doit être prévenu **par écrit** qu'il peut l'obtenir. La mention « dites-le-nous » ne suffit sans doute pas : il faudrait afficher une liste ou écrire « liste des allergènes disponible sur demande ». Source : [Décret n° 2015-447 — Légifrance](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000030503581).
- **Note 4,8 / 110 avis** : codée en dur. À mettre à jour à la main, sinon elle devient fausse avec le temps.
- **Photos trop petites** : `table.jpg`, `salade.jpg`, `vallee.jpg`, les emplacements… font 480×640 px, et `banner.jpeg` 1448 px pour un héros plein écran. Il faut récupérer des originaux d'au moins 2000 px.

## 3. Pourquoi le site « fait IA » — et ce qui a changé

| Signal typique d'un template généré | V1 | V2 |
|---|---|---|
| Étiquettes monospace en capitales « — CHAPITRE 03 / … » | partout | supprimées |
| Titre sans-serif + un mot en italique serif, avec point final (« La *carte.* ») | chaque titre | titres simples, une seule famille |
| Bandeaux défilants infinis ★ MOT ★ | 3 pages | supprimés |
| Tampon rond qui oscille, barre de progression, compteur animé 0→4,8 | oui | supprimés |
| Apparition au scroll sur chaque bloc, zoom au survol partout | oui | supprimés (seules les transitions d'état restent) |
| Fausses « stats » (« Salades & viandes », « Accueil ») | héros | remplacées par un bandeau d'ouvertures **réelles** |
| Phrases creuses (« rien ne déborde sur le suivant », « ce qui vibrait déjà ») | oui | réécrites en phrases factuelles |
| 3 polices dont JetBrains Mono (police de code) pour un camping | oui | Newsreader + police système |
| Commentaires CSS « Variation B — Sous les chênes · Almanach forestier » | oui | nouveau `site.css` unique |

## 4. Technique

- **Poids des images** : 67 Mo dans `photos/`, dont des JPEG de 6 à 7 Mo affichés en vignette. V2 : versions web dans `photos/web/`, **5,9 Mo au total** (par exemple `pateAPizza.JPG` : 7,2 Mo → 92 Ko). Avec `width`/`height` pour éviter les sauts de mise en page (CLS) et le lazy-load hors écran.
- **CSS** : 4 fichiers (≈ 70 Ko, dont du code mort : cartes des vins, formules, boissons) → `site.css` (≈ 20 Ko). JS : `enhance.js` → `site.js`, sans dépendance.
- **Polices** : `@import` dans le CSS (chaîne bloquante) → `<link>` dans le `<head>`, une seule famille.
- **RGPD** : l'iframe Google Maps se chargeait d'office (traceurs tiers sans consentement). Elle ne se charge plus qu'au clic, et la page cookies a été mise à jour. Source : [CNIL — cookies et traceurs](https://www.cnil.fr/fr/cookies-et-autres-traceurs).
- **Accessibilité** : `role="img"` + `aria-label` en double sur les images supprimés ; lien d'évitement ; `aria-current` ; filtres `aria-pressed` ; lightbox utilisable au clavier (focus piégé et restauré) ; légendes visibles, et non plus seulement au survol (invisibles sur mobile).
- **SEO** : `canonical`, `og:image` et `og:url` ajoutés ; `og:type="restaurant"` (valeur invalide) → `website` ; `openingHoursSpecification` pour la pizzeria.

## 5. Recommandations suivantes

1. Mettre les vraies personnes en avant : prénoms et photo des hôtes dans « Un bout de Périgord ». C'est le levier n°1 contre l'effet « généré ».
2. Afficher les tarifs des gîtes et des vans, même sous forme de fourchette.
3. Supprimer les originaux inutilisés de `photos/` (≈ 60 Mo) : ils sont déployés sur Vercel pour rien. L'historique Git les conserve.
4. En-tête et pied de page sont dupliqués dans 7 fichiers. Si le site grossit, passer à un générateur statique (Eleventy ou Astro) pour avoir un seul partial.
