# Guide de contribution

Merci de votre intérêt pour contribuer à Bug Tracking Janitor UI !

## Code de conduite

- Soyez respectueux et professionnel
- Accueillez les nouvelles idées
- Concentrez-vous sur ce qui est meilleur pour la communauté

## Comment contribuer

### Signaler un bug

1. Vérifiez que le bug n'a pas déjà été signalé
2. Créez une issue avec :
   - Description claire du problème
   - Étapes pour reproduire
   - Comportement attendu vs réel
   - Captures d'écran si applicable
   - Version du navigateur et de l'OS

### Proposer une fonctionnalité

1. Créez une issue pour discuter de la fonctionnalité
2. Attendez les retours avant de commencer le développement
3. Assurez-vous que cela s'aligne avec les objectifs du projet

### Soumettre des modifications

#### 1. Fork et clone

```bash
git clone https://github.com/votre-username/bug-tracking-janitor-ui.git
cd bug-tracking-janitor-ui
```

#### 2. Créer une branche

```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
# ou
git checkout -b fix/correction-du-bug
```

**Convention de nommage des branches** :
- `feature/` : Nouvelles fonctionnalités
- `fix/` : Corrections de bugs
- `refactor/` : Refactoring sans changement de fonctionnalité
- `docs/` : Modifications de documentation
- `style/` : Changements de style/formatage

#### 3. Installer les dépendances

```bash
npm install
```

#### 4. Faire vos modifications

Respectez les conventions de code existantes :

**JavaScript** :
- Utiliser `const` et `let` (jamais `var`)
- Préférer les arrow functions
- Ajouter des commentaires JSDoc pour les fonctions complexes
- Nommer les variables de manière descriptive

**React** :
- Composants fonctionnels avec hooks
- Props destructurées
- PropTypes pour la validation (si ajouté)

**CSS** :
- Classes descriptives (kebab-case)
- Mobile-first approach
- Éviter les !important

#### 5. Tester vos modifications

```bash
npm start
```

Testez manuellement :
- [ ] L'application démarre sans erreur
- [ ] La fonctionnalité fonctionne comme prévu
- [ ] Pas de régression sur les fonctionnalités existantes
- [ ] Responsive sur mobile/tablette/desktop
- [ ] Pas d'erreur dans la console

#### 6. Commiter

**Convention de commit** :

Format : `type(scope): message`

**Types** :
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage, point-virgules manquants, etc.
- `refactor`: Refactoring de code
- `test`: Ajout de tests
- `chore`: Tâches de maintenance

**Exemples** :
```bash
git commit -m "feat(tasks): add filter by priority"
git commit -m "fix(login): correct API key validation"
git commit -m "docs(readme): update installation steps"
```

#### 7. Push et Pull Request

```bash
git push origin feature/ma-nouvelle-fonctionnalite
```

Créez une Pull Request avec :
- Titre descriptif
- Description détaillée des changements
- Référence aux issues liées (ex: "Fixes #123")
- Captures d'écran si pertinent

**Template de PR** :

```markdown
## Description
[Décrivez les changements apportés]

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Checklist
- [ ] Le code suit les conventions du projet
- [ ] J'ai testé mes modifications
- [ ] J'ai mis à jour la documentation si nécessaire
- [ ] Pas de warnings dans la console
- [ ] L'application fonctionne en mode production

## Captures d'écran (si applicable)
[Ajoutez vos captures]

## Issues liées
Fixes #[numéro]
```

## Standards de code

### Structure des composants

```javascript
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // si utilisé
import './MonComposant.css';

/**
 * Description du composant
 * @param {Object} props - Les props du composant
 */
const MonComposant = ({ prop1, prop2 }) => {
  // 1. Hooks d'état
  const [state, setState] = useState(initialValue);

  // 2. Hooks d'effet
  useEffect(() => {
    // code
  }, [dependencies]);

  // 3. Fonctions du composant
  const handleAction = () => {
    // code
  };

  // 4. Render
  return (
    <div className="mon-composant">
      {/* JSX */}
    </div>
  );
};

// PropTypes (optionnel)
MonComposant.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

export default MonComposant;
```

### Structure des services

```javascript
import { apiClient } from './api.service';

/**
 * Service pour [description]
 */
const monService = {
  /**
   * [Description de la méthode]
   * @param {type} param - Description
   * @returns {Promise<Object>} { success, data?, error? }
   */
  maMethode: async (param) => {
    try {
      const response = await apiClient.get('/endpoint');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default monService;
```

### Style CSS

```css
/* Composant principal */
.mon-composant {
  /* Layout */
  display: flex;
  /* Position */
  position: relative;
  /* Box model */
  padding: 16px;
  margin: 0;
  /* Typographie */
  font-size: 14px;
  /* Visuel */
  background-color: white;
  /* Animation */
  transition: all 0.3s ease;
}

/* Élément enfant */
.mon-composant__element {
  /* styles */
}

/* Modificateur */
.mon-composant--variant {
  /* styles */
}

/* Media queries */
@media (max-width: 768px) {
  .mon-composant {
    /* styles mobiles */
  }
}
```

## Tests (à venir)

Quand les tests seront ajoutés :

```bash
# Lancer tous les tests
npm test

# Lancer avec coverage
npm test -- --coverage

# Mode watch
npm test -- --watch
```

## Documentation

- Commenter le code complexe
- Mettre à jour le README si nécessaire
- Documenter les nouveaux composants/services
- Ajouter des exemples d'utilisation

## Revue de code

Votre PR sera revue selon ces critères :

- [ ] Qualité du code
- [ ] Tests (si applicable)
- [ ] Documentation
- [ ] Performance
- [ ] Sécurité
- [ ] Accessibilité
- [ ] Compatibilité navigateurs

## Questions ?

N'hésitez pas à :
- Créer une issue pour poser des questions
- Demander de l'aide dans les commentaires de PR
- Consulter la documentation existante

Merci de contribuer ! 🎉
