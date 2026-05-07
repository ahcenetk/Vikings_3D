export function createSliderControl({
    label,
    min = 0,
    max = 1,
    step = 0.01,
    value = 0,
    unit = '',
    format = (nextValue) => `${nextValue}${unit}`,
    onInput
}) {
    const wrapper = document.createElement('label');
    wrapper.className = 'settings-control settings-slider-control';

    const header = document.createElement('span');
    header.className = 'settings-slider-header';

    const title = document.createElement('span');
    title.className = 'settings-control-label';
    title.textContent = label;

    const valueLabel = document.createElement('span');
    valueLabel.className = 'settings-slider-value';
    valueLabel.textContent = format(value);

    header.append(title, valueLabel);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);

    input.addEventListener('input', () => {
        const numericValue = Number(input.value);
        valueLabel.textContent = format(numericValue);
        onInput?.(numericValue);
    });

    wrapper.append(header, input);

    return {
        element: wrapper,
        setValue(nextValue) {
            input.value = String(nextValue);
            valueLabel.textContent = format(Number(nextValue));
        }
    };
}
