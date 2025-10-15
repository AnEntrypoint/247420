/**
 * 247420 Component Loader
 * Dynamic component loading and management system
 */

class ComponentLoader {
    constructor() {
        this.components = new Map();
        this.loadedScripts = new Set();
        this.loadedStyles = new Set();
    }

    async loadComponent(name, container) {
        if (this.components.has(name)) {
            const component = this.components.get(name);
            this.renderComponent(component, container);
            return;
        }

        try {
            const component = await this.fetchComponent(name);
            this.components.set(name, component);
            await this.loadDependencies(component);
            this.renderComponent(component, container);
        } catch (error) {
            console.error(`Failed to load component ${name}:`, error);
            this.renderError(container, name);
        }
    }

    async fetchComponent(name) {
        const response = await fetch(`/components/${name}.html`);
        if (!response.ok) {
            throw new Error(`Component ${name} not found`);
        }
        const html = await response.text();

        // Parse component metadata
        const scripts = this.extractScripts(html);
        const styles = this.extractStyles(html);
        const template = this.cleanTemplate(html);

        return {
            name,
            template,
            scripts,
            styles,
            loaded: false
        };
    }

    extractScripts(html) {
        const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
        const scripts = [];
        let match;

        while ((match = scriptRegex.exec(html)) !== null) {
            scripts.push(match[1]);
        }

        return scripts;
    }

    extractStyles(html) {
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        const styles = [];
        let match;

        while ((match = styleRegex.exec(html)) !== null) {
            styles.push(match[1]);
        }

        return styles;
    }

    cleanTemplate(html) {
        return html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .trim();
    }

    async loadDependencies(component) {
        // Load styles
        for (const style of component.styles) {
            const styleId = `style-${component.name}-${this.loadedStyles.size}`;
            if (!this.loadedStyles.has(styleId)) {
                const styleElement = document.createElement('style');
                styleElement.id = styleId;
                styleElement.textContent = style;
                document.head.appendChild(styleElement);
                this.loadedStyles.add(styleId);
            }
        }

        // Load scripts
        for (const script of component.scripts) {
            const scriptId = `script-${component.name}-${this.loadedScripts.size}`;
            if (!this.loadedScripts.has(scriptId)) {
                const scriptElement = document.createElement('script');
                scriptElement.id = scriptId;
                scriptElement.textContent = script;
                document.head.appendChild(scriptElement);
                this.loadedScripts.add(scriptId);
            }
        }
    }

    renderComponent(component, container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }

        if (!container) {
            console.error(`Container not found for component ${component.name}`);
            return;
        }

        container.innerHTML = component.template;
        component.loaded = true;

        // Dispatch custom event
        container.dispatchEvent(new CustomEvent('componentLoaded', {
            detail: { component: component.name }
        }));
    }

    renderError(container, componentName) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }

        if (container) {
            container.innerHTML = `
                <div class="component-error">
                    <p>Failed to load component: ${componentName}</p>
                </div>
            `;
        }
    }

    // Preload commonly used components
    async preloadComponents(components) {
        const promises = components.map(name =>
            this.fetchComponent(name).catch(error => {
                console.warn(`Failed to preload component ${name}:`, error);
                return null;
            })
        );

        const results = await Promise.all(promises);
        results.forEach(component => {
            if (component) {
                this.components.set(component.name, component);
            }
        });
    }

    // Clear unused components
    cleanup() {
        this.components.forEach((component, name) => {
            if (!document.querySelector(`[data-component="${name}"]`)) {
                this.components.delete(name);
            }
        });
    }
}

// Global component loader instance
window.componentLoader = new ComponentLoader();

// Auto-initialize components
document.addEventListener('DOMContentLoaded', () => {
    const componentElements = document.querySelectorAll('[data-component]');

    componentElements.forEach(element => {
        const componentName = element.getAttribute('data-component');
        if (componentName) {
            window.componentLoader.loadComponent(componentName, element);
        }
    });
});

export default ComponentLoader;