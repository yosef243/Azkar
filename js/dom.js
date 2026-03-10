export const dom = {
    safeText(element, text) {
        if (!element) return;
        element.textContent = String(text);
    },
    safeHTML(element, html) {
        if (!element) return;
        const template = document.createElement('template');
        template.innerHTML = html;
        const scripts = template.content.querySelectorAll('script');
        scripts.forEach(s => s.remove());
        element.innerHTML = '';
        element.appendChild(template.content);
    },
    create(tag, className = '') {
        const el = document.createElement(tag);
        if (className) el.className = className;
        return el;
    },
    clear(element) {
        if (!element) return;
        while (element.firstChild) element.removeChild(element.firstChild);
    }
};
