import { SAILING_CLASSES } from "../config/appConfig";

function uniqueClassNames(values) {
    const result = [];

    values.forEach(value => {
        const className = String(value || "").trim();

        if (
            className &&
            !result.some(item => item.toLowerCase() === className.toLowerCase())
        ) {
            result.push(className);
        }
    });

    return result;
}

function SailingClassSelect({
    value = [],
    onChange,
    extraOptions = [],
    label = "Clases *"
}) {
    const selectedClasses = uniqueClassNames(Array.isArray(value) ? value : []);
    const options = uniqueClassNames([
        ...SAILING_CLASSES,
        ...extraOptions,
        ...selectedClasses
    ]);

    function toggleClass(className) {
        const isSelected = selectedClasses.includes(className);

        onChange(
            isSelected
                ? selectedClasses.filter(item => item !== className)
                : [...selectedClasses, className]
        );
    }

    return (
        <fieldset className="multi-select-fieldset">
            <legend>{label}</legend>

            <div className="multi-select-grid">
                {options.map(className => (
                    <label
                        className="checkbox-row"
                        key={className}
                    >
                        <input
                            type="checkbox"
                            checked={selectedClasses.includes(className)}
                            onChange={() => toggleClass(className)}
                        />
                        {className}
                    </label>
                ))}
            </div>

            <p className="password-help">
                Podés seleccionar varias clases para un mismo campeonato.
            </p>
        </fieldset>
    );
}

export default SailingClassSelect;
