# GAME DESIGN DOCUMENT: NEON TETRIS ROGUELITE

## 1. Concept & Vision

### High Concept
Une fusion entre le gameplay classique de Tetris et les mécaniques de progression d'un Roguelite (type Balatro ou Slay the Spire). Le joueur ne se contente pas d'empiler des blocs : il construit son propre "build" grâce à des modificateurs qui altèrent les règles du jeu en temps réel.

### Philosophie
*   **Simple à jouer, difficile à maîtriser** : Les règles de base sont celles de Tetris. La complexité vient de la gestion des risques et des choix de modificateurs.
*   **Risque vs Récompense** : Jouer de manière risquée (mal jouer, empiler sans effacer) déclenche des punitions ("Deals"). Bien jouer (monter de niveau) octroie des bonus.
*   **Game Feel Premium** : Visuel soigné, animations fluides, feedbacks juteux (screen shake, particules, sons).

---

## 2. Boucle de Gameplay (Core Loop)

1.  **Phase d'Action (Tetris)** : Le joueur joue à Tetris.
    *   Il vise à effacer des lignes pour marquer des points et monter de niveau.
    *   Il doit éviter de remplir l'écran (Game Over).

2.  **Progression (Level Up)** :
    *   À chaque niveau gagné (toutes les X lignes), le jeu se met en pause ("Freeze").
    *   Le joueur doit choisir 1 bonus parmi 3 proposés (ex: "Blocs d'Or", "Gravité ralentie", "Score x2").

3.  **Menace (Le Deal)** :
    *   Une jauge de "Danger" se remplit si le joueur pose trop de pièces sans effacer de lignes.
    *   Si la jauge est pleine, le "Deal" s'active.
    *   Le jeu se met en pause et force le joueur à choisir 1 Malus parmi 3 (ex: "Ligne Fantôme", "Input Inversé", "Vitesse Max").
    *   *But : Inciter le joueur à jouer proprement.*

---

## 3. Mécaniques de Jeu (Détails)

### Règles Tetris (Standard Moderne)
*   **Système de Rotation** : SRS (Super Rotation System) pour permettre les "t-spins" et kicks fluides.
*   **Sac de Pièces** : 7-Bag Randomizer (on tire les 7 formes avant de remélanger) ou Générateur Pondéré (modifié par les bonus).
*   **Hold** : Possibilité de stocker une pièce (avec restrictions possibles via malus).
*   **Ghost Piece** : Visualisation de l'atterrissage de la pièce.
*   **Lock Delay** : La pièce ne se bloque pas instantanément au sol, laissant un court laps de temps pour la glisser/tourner.

### Système Roguelite (Modificateurs)
Les modificateurs sont le cœur du jeu. Ils agissent sur :
*   **La physique** : Gravité, glissance, rebond.
*   **Les pièces** : Probabilité d'apparition (plus de barres "I", moins de carrés "O"), propriétés spéciales (pièces dorées, blocs de pierre).
*   **La grille** : Ajout de lignes orphelines, trous, blocs indestructibles.
*   **Le score** : Multiplicateurs, bonus de combo.

#### Types de Modificateurs
1.  **Positifs (Bonus)** : Obtenus au Level Up. Aident le joueur.
    *   *Exemple : "Midas Touch" (Les blocs posés ont une chance de devenir de l'or = score bonus).*
2.  **Négatifs (Malus/Maledictions)** : Obtenus via le Deal. Punissent le joueur.
    *   *Exemple : "Brouillard" (La grille n'est visible que près de la pièce active).*
3.  **Chaotiques (Neutres)** : Changent le gameplay de manière drastique (double tranchant).
    *   *Exemple : "Géant" (Toutes les pièces sont 2x plus grandes mais la grille aussi).*

---

## 4. Identité Visuelle & UX

### Direction Artistique
*   **Style** : Néo-Rétro / Cyberpunk épuré.
*   **Palette** : Fond sombre (Bleu nuit/Noir profond), pièces néons vibrantes, effets de lueur (Glow).
*   **UI** : Glassmorphism (panneaux translucides avec flou d'arrière-plan), typographie moderne et lisible (San Francisco, Inter, Rajdhani).

### Feedbacks (Game Feel)
*   **Particules** : Explosion de confettis/étincelles lors de l'effacement de lignes.
*   **Screen Shake** : Légère secousse lors d'un "Hard Drop" ou d'un Tetris.
*   **Audio** : Effets sonores impactants (bass heavy pour les drops, cristallin pour les clears).
*   **Notifications** : "Toasts" qui apparaissent pour annoncer les effets des modificateurs ("Vitesse augmentée !", "Bloc d'or acquis !").

### Ergonomie
*   **Contrôles** : Clavier (Flèches/ZQSD + Espace) et Tactile (Zones de touches invisibles ou boutons discrets).
*   **Lisibilité** : La grille doit toujours rester lisible, même avec beaucoup d'effets. Les effets de malus ne doivent pas rendre le jeu "injouable" mais "difficile".

---

## 5. Architecture Technique (Pour le Développeur)

Le code doit être modulaire pour faciliter l'ajout de nouveaux modificateurs sans casser le jeu de base.

### Structure des Dossiers Recommandée
```
/js
  /engine        # Moteur Tetris pur (indépendant du roguelite)
    - Game.js    # Boucle principale
    - Board.js   # Gestion de la grille et des collisions
    - Piece.js   # Logique des pièces (SRS, formes)
  /roguelite     # La couche "Méta"
    - RogueliteSystem.js # Chef d'orchestre (gère XP, Deals, Modals)
    - ModifierManager.js # Applique les effets actifs
    /modifiers   # Un fichier par modificateur (héritant d'une classe de base)
      - BaseModifier.js
      - GoldBlock.js
      - FastGravity.js
  /ui            # Gestion de l'affichage DOM/Canvas
    - Renderer.js
    - ModalUI.js
```

### Pattern "Modifier"
Chaque modificateur doit pouvoir "hook" (intercepter) des événements du moteur :
*   `onSpawn(piece)` : Pour altérer la pièce avant qu'elle n'arrive.
*   `onDrop(piece)` : Juste après le verrouillage.
*   `onLineClear(lines)` : Pour modifier le score ou déclencher des effets.
*   `onUpdate(deltaTime)` : Pour des effets continus (gravité, distorsion).

---

## 6. Liste des Contraintes
1.  **Performance** : 60 FPS constant. Pas de lag lors de l'instantiation de particules.
2.  **Responsive** : Doit être jouable sur Desktop et Mobile.
3.  **Sauvegarde** : Le High Score et les statistiques doivent être persistants (LocalStorage).
4.  **Extensibilité** : Ajouter un nouveau modificateur ne doit prendre que la création d'un fichier `.js`.
