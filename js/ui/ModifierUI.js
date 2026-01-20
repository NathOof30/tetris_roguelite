/**
 * @fileoverview Modifier Selection UI
 * Displays modifier choices when triggered by bonus threshold or deal system
 */

import { globalEvents } from '../utils/EventEmitter.js';

/**
 * ModifierUI - Handles modifier selection display
 */
export class ModifierUI {
    constructor() {
        this.modal = null;
        this.isVisible = false;
        this.onSelect = null;
    }

    /**
     * Show modifier selection modal
     * @param {Modifier[]} modifiers - Array of modifiers to choose from
     * @param {Object} options - Display options
     * @param {string} options.title - Modal title
     * @param {boolean} options.isDeal - Is this a deal (forced malus)
     * @returns {Promise<Modifier>} Selected modifier
     */
    show(modifiers, { title = 'Choisissez un modificateur', isDeal = false } = {}) {
        return new Promise((resolve) => {
            this.onSelect = resolve;
            this.render(modifiers, title, isDeal);
            this.isVisible = true;
            globalEvents.emit('modifierUIShown');
        });
    }

    /**
     * Render the modal
     * @param {Modifier[]} modifiers - Modifiers to display
     * @param {string} title - Modal title
     * @param {boolean} isDeal - Is this a deal selection
     */
    render(modifiers, title, isDeal) {
        // Remove any existing modal first
        this.hide();

        // Create modal overlay - append to body for guaranteed visibility
        this.modal = document.createElement('div');
        this.modal.className = `modifier-modal ${isDeal ? 'deal-modal' : ''}`;
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-modal', 'true');
        this.modal.setAttribute('aria-label', title);

        // Modal content
        const content = document.createElement('div');
        content.className = 'modifier-modal-content';

        // Title
        const titleEl = document.createElement('h2');
        titleEl.className = 'modifier-modal-title';
        titleEl.textContent = title;
        content.appendChild(titleEl);

        // Subtitle for deal
        if (isDeal) {
            const subtitle = document.createElement('p');
            subtitle.className = 'modifier-modal-subtitle deal-warning';
            subtitle.textContent = '⚠️ Jauge de malus atteinte ! Vous devez choisir un malus.';
            content.appendChild(subtitle);
        }

        // Cards container
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'modifier-cards';

        modifiers.forEach(modifier => {
            const card = this.createCard(modifier);
            cardsContainer.appendChild(card);
        });

        content.appendChild(cardsContainer);
        this.modal.appendChild(content);

        // Append to body instead of a container that may be hidden
        document.body.appendChild(this.modal);

        // Animate in
        requestAnimationFrame(() => {
            this.modal.classList.add('visible');
        });
    }

    /**
     * Create a modifier card element
     * @param {Modifier} modifier - Modifier to display
     * @returns {HTMLElement}
     */
    createCard(modifier) {
        const card = document.createElement('button');
        card.className = `modifier-card ${modifier.rarity} ${modifier.type}`;
        card.setAttribute('type', 'button');

        // Rarity indicator
        const rarityBadge = document.createElement('span');
        rarityBadge.className = 'modifier-rarity';
        rarityBadge.textContent = this.getRarityLabel(modifier.rarity);
        card.appendChild(rarityBadge);

        // Modifier icon (from modifier or fallback to type)
        const iconEl = document.createElement('span');
        iconEl.className = 'modifier-type-icon';
        iconEl.textContent = modifier.icon || this.getTypeIcon(modifier.type);
        card.appendChild(iconEl);

        // Name
        const name = document.createElement('h3');
        name.className = 'modifier-name';
        name.textContent = modifier.name;
        card.appendChild(name);

        // Description
        const description = document.createElement('p');
        description.className = 'modifier-description';
        description.textContent = modifier.description;
        card.appendChild(description);

        // Click handler
        card.addEventListener('click', () => {
            this.selectModifier(modifier);
        });

        return card;
    }

    /**
     * Handle modifier selection
     * @param {Modifier} modifier - Selected modifier
     */
    selectModifier(modifier) {
        // Animate out
        this.modal.classList.remove('visible');
        this.modal.classList.add('hiding');

        setTimeout(() => {
            this.hide();
            if (this.onSelect) {
                this.onSelect(modifier);
                this.onSelect = null;
            }
        }, 300);
    }

    /**
     * Hide the modal
     */
    hide() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        this.modal = null;
        this.isVisible = false;
        globalEvents.emit('modifierUIHidden');
    }

    /**
     * Get rarity label
     * @param {string} rarity - Rarity level
     * @returns {string}
     */
    getRarityLabel(rarity) {
        switch (rarity) {
            case 'common': return 'Commun';
            case 'rare': return 'Rare';
            case 'epic': return 'Épique';
            case 'legendary': return 'Légendaire';
            default: return rarity;
        }
    }

    /**
     * Get type icon
     * @param {string} type - Modifier type
     * @returns {string}
     */
    getTypeIcon(type) {
        switch (type) {
            case 'bonus': return '✨';
            case 'malus': return '💀';
            case 'mixed': return '⚖️';
            default: return '❓';
        }
    }
}

export default ModifierUI;
