export function createToggleControl({
    label,
    description = '',
    checked = false,
    onChange
}) {
    const wrapper = document.createElement('label');
    wrapper.className = 'settings-control settings-toggle-control';

    const text = document.createElement('span');
    text.className = 'settings-control-text';

    const title = document.createElement('span');
    title.className = 'settings-control-label';
    title.textContent = label;
    text.appendChild(title);

    if (description) {
        const detail = document.createElement('span');
        detail.className = 'settings-control-description';
        detail.textContent = description;
        text.appendChild(detail);
    }

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;

    const visual = document.createElement('span');
    visual.className = 'settings-toggle';

    input.addEventListener('change', () => onChange?.(input.checked));

    wrapper.append(text, input, visual);

    return {
        element: wrapper,
        setChecked(nextChecked) {
            input.checked = Boolean(nextChecked);
        },
        setDescription(nextDescription) {
            const detail = text.querySelector('.settings-control-description');
            if (detail) detail.textContent = nextDescription;
        }
    };
}
