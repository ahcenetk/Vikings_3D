import { formatKeyCode } from './settingsStore.js';

export function createKeybindRow({ action, store, onCaptureStart }) {
    const row = document.createElement('div');
    row.className = 'keybind-row';
    row.dataset.action = action.id;

    const label = document.createElement('span');
    label.className = 'keybind-label';
    label.textContent = action.label;

    const right = document.createElement('span');
    right.className = 'keybind-right';

    const warning = document.createElement('span');
    warning.className = 'keybind-warning';
    warning.textContent = 'Touche d\u00e9j\u00e0 utilis\u00e9e';

    const button = document.createElement('button');
    button.className = 'keybind-button';
    button.type = 'button';
    button.addEventListener('click', () => onCaptureStart?.(action.id));

    right.append(warning, button);
    row.append(label, right);

    return {
        element: row,
        actionId: action.id,
        setCapturing(isCapturing) {
            row.classList.toggle('is-capturing', isCapturing);
            if (isCapturing) {
                button.textContent = 'Appuyez sur une touche...';
            }
        },
        render(state) {
            const isCapturing = row.classList.contains('is-capturing');
            const issue = store.getKeybindIssue(action.id);

            if (!isCapturing) {
                button.textContent = formatKeyCode(state.keybinds[action.id]);
            }

            row.classList.toggle('has-conflict', Boolean(issue));
            warning.hidden = !issue;
        }
    };
}
