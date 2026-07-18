import {
    Country,
    State,
    City
} from "country-state-city";

const COUNTRY_NAME_OVERRIDES = {
    AR: "Argentina",
    UY: "Uruguay",
    CL: "Chile",
    BR: "Brasil",
    PY: "Paraguay",
    PE: "Perú",
    CO: "Colombia",
    EC: "Ecuador",
    MX: "México",
    US: "Estados Unidos",
    ES: "España",
    IT: "Italia",
    FR: "Francia",
    DE: "Alemania",
    GB: "Reino Unido"
};

function getCountryLabel(country) {
    return COUNTRY_NAME_OVERRIDES[country.isoCode] || country.name;
}

function sortByName(items) {
    return [...items].sort((a, b) =>
        a.name.localeCompare(b.name, "es")
    );
}

function LocationFilterSelects({
    countryCode,
    setCountryCode,
    setCountry,
    stateCode,
    setStateCode,
    setState,
    city,
    setCity
}) {
    const countries =
        sortByName(Country.getAllCountries());

    const states =
        countryCode
            ? sortByName(State.getStatesOfCountry(countryCode))
            : [];

    const cities =
        countryCode && stateCode
            ? sortByName(City.getCitiesOfState(countryCode, stateCode))
            : [];

    function handleCountryChange(value) {
        const selectedCountry =
            countries.find(item => item.isoCode === value);

        setCountryCode(value);
        setCountry(
            selectedCountry
                ? getCountryLabel(selectedCountry)
                : ""
        );

        setStateCode("");
        setState("");
        setCity("");
    }

    function handleStateChange(value) {
        const selectedState =
            states.find(item => item.isoCode === value);

        setStateCode(value);
        setState(selectedState?.name || "");
        setCity("");
    }

    return (
        <>
            <select
                value={countryCode}
                onChange={(event) =>
                    handleCountryChange(event.target.value)
                }
            >
                <option value="">
                    Todos los países
                </option>

                {countries.map(item => (
                    <option
                        key={item.isoCode}
                        value={item.isoCode}
                    >
                        {getCountryLabel(item)}
                    </option>
                ))}
            </select>

            <select
                value={stateCode}
                onChange={(event) =>
                    handleStateChange(event.target.value)
                }
                disabled={!countryCode}
            >
                <option value="">
                    {
                        countryCode
                            ? "Todas las provincias / estados"
                            : "Primero elegí país"
                    }
                </option>

                {states.map(item => (
                    <option
                        key={item.isoCode}
                        value={item.isoCode}
                    >
                        {item.name}
                    </option>
                ))}
            </select>

            <select
                value={city}
                onChange={(event) =>
                    setCity(event.target.value)
                }
                disabled={!countryCode || !stateCode}
            >
                <option value="">
                    {
                        countryCode && stateCode
                            ? "Todas las ciudades / localidades"
                            : "Primero elegí provincia / estado"
                    }
                </option>

                {cities.map(item => (
                    <option
                        key={`${item.name}-${item.latitude}-${item.longitude}`}
                        value={item.name}
                    >
                        {item.name}
                    </option>
                ))}
            </select>
        </>
    );
}

export default LocationFilterSelects;
