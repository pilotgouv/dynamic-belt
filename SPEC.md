# 🧠 PILOT — FONCTIONNALITÉS COMPLÈTES (MASTER SPEC)

## 1. 🧩 SOCLE FONCTIONNEL (Core Platform)

### 1.1 Authentification & Comptes

* Inscription par email + mot de passe
* Connexion sécurisée (NextAuth + Prisma Adapter)
* Hash des mots de passe (bcrypt)
* Gestion des sessions (persistantes, sécurisées)
* Déconnexion
* Protection des routes (middleware)
* Redirection automatique post-login
* Gestion multi-utilisateurs (à terme)

---

### 1.2 Organisation & Structure

* Création automatique d’une **Organisation** à l’inscription
* Rôles :

  * Owner
  * Viewer (futur)
* Isolation stricte des données par organisation
* Paramètres globaux par organisation (coûts, fiscalité, etc.)

---

## 2. 💰 MODULE ARGENT — VÉRITÉ ÉCONOMIQUE

### 2.1 Calcul du Profit Réel (Economic Truth)

* Calcul centralisé via **BusinessEngine**
* Formule :

  ```
  Profit Réel =
  Revenus
  - Dépenses publicitaires
  - COGS (coût produit)
  - Frais plateformes
  - Frais de livraison
  ```
* Données consolidées **jour / semaine / mois**
* Différenciation :

  * Données réelles
  * Données estimées (`dataConfidence`)

---

### 2.2 Marges & Ratios

* Marge brute
* Marge nette
* Profit par jour
* Profit cumulé
* Profit par canal
* Profit par produit

---

## 3. 📊 MODULE PUBLICITÉ — ACQUISITION INTELLIGENTE

### 3.1 Connecteurs Ads

* Google Ads
* Meta Ads
* TikTok Ads (prévu)
* Mapping :

  * Spend
  * Clicks
  * Conversions
  * ROAS
  * CPA

---

### 3.2 Analyse Multi-Canaux

* Vue consolidée Ads (tous canaux)
* Comparaison des canaux
* ROAS réel (corrélé au profit)
* Détection automatique :

  * canaux rentables
  * canaux déficitaires

---

### 3.3 Channel Arbitrage Engine

* Calcul du **Profit Contribution** par canal
* Détection :

  * Canal subventionné
  * Canal qui finance les autres
* Alertes automatiques :

  * “Ce canal brûle du cash”
  * “Ce canal masque un problème global”

---

## 4. 🌐 MODULE TRAFIC — RÉALITÉ DU FUNNEL

### 4.1 GA4 Connector

* Sessions
* Utilisateurs
* Engagement Rate
* Conversions
* Events personnalisés

---

### 4.2 Analyse Qualité Trafic

* Trafic vs revenu
* Trafic vs conversion
* Détection :

  * trafic sans revenu
  * tracking cassé
  * trafic inutile

---

### 4.3 Funnel Degradation (avancé)

* Étapes :

  * view_item
  * add_to_cart
  * begin_checkout
  * purchase
* Détection de rupture de funnel
* Alertes automatiques :

  * “Le trafic convertit mais n’achète plus”
  * “Checkout cassé”

---

## 5. 📦 MODULE PRODUITS — RENTABILITÉ RÉELLE

### 5.1 Analyse Produits

* CA par produit
* Profit par produit
* Volume vendu
* Marge réelle

---

### 5.2 Classification Automatique

* HERO → rentable
* NEUTRAL
* TOXIC → vend mais détruit la marge

---

## 6. 🚨 ALERTES & IA — DÉCISION AUTOMATISÉE

### 6.1 Alertes Temps Réel

* Business déficitaire
* Dépenses Ads > profit
* Trafic anormal
* Funnel dégradé
* Produits toxiques

---

### 6.2 Priorisation

* Critique
* Warning
* Info

---

### 6.3 IA Analyst

* Résumé quotidien automatique
* Résumé hebdomadaire
* Mode “Boardroom Brief”
* Recommandations stratégiques :

  * couper un canal
  * revoir un produit
  * corriger un funnel

---

## 7. 📈 RAPPORTS — BOARDROOM ENGINE (V2.5+)

### 7.1 Report Builder

* Sélection :

  * période
  * granularité (jour / semaine / mois)
  * modules inclus
* Preview en temps réel

---

### 7.2 Sauvegarde de Rapports

* Save ReportDefinition
* Run à la demande
* Historique ReportRun
* Comparaison temporelle

---

### 7.3 Exports (Premium)

* CSV
* PDF (boardroom-ready)
* Rapports partageables

---

## 8. 🔌 MODULE CONNEXIONS — CENTRALISATION

### 8.1 Plateformes supportées

* Shopify
* WooCommerce
* Amazon Seller
* Google Ads
* Meta Ads
* TikTok Ads
* GA4

---

### 8.2 Sync Engine

* Sync manuel
* Sync automatique (cron)
* Indicateurs :

  * succès
  * erreur
  * données manquantes

---

## 9. 👤 MON COMPTE & PAYWALL

### 9.1 Plans

* FREE
* PREMIUM

---

### 9.2 Limitations FREE

* 1 connexion max
* 1 rapport sauvegardé
* Pas d’exports
* Alertes basiques

---

### 9.3 Premium

* Connexions illimitées
* Rapports illimités
* IA complète
* Exports
* Historique long

---

## 10. 🧠 UX & POSITIONNEMENT

* Interface sombre premium
* “Outil de décision”, pas gadget
* Lisible par :

  * entrepreneur débutant
  * directeur financier
  * fondateur avancé
* Mobile-ready
* App iOS / Android (future)

---

## 11. 🧭 PILOT = CE QUE LES AUTRES N’OSENT PAS FAIRE

PILOT ne montre pas :

* des clics
* des impressions
* des vanity metrics

PILOT montre :

> **La vérité économique nue.**
