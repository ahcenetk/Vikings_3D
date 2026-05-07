export function createSettingsButton({ onClick }) {
    const button = document.createElement('button');
    button.id = 'settings-button';
    button.className = 'settings-button';
    button.type = 'button';
    button.title = 'Param\u00e8tres';
    button.setAttribute('aria-label', 'Param\u00e8tres');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<span aria-hidden="true">&#9881;</span>';
    button.addEventListener('click', (event) => {
        event.stopPropagation();
        onClick?.();
    });

    return {
        element: button,
        setOpen(isOpen) {
            button.classList.toggle('is-open', isOpen);
            button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        },
        setVisible(isVisible) {
            button.hidden = !isVisible;
        }
    };
}
