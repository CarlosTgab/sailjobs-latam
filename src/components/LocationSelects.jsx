import {
    Country,
    State,
    City
} from "country-state-city";

export const CUSTOM_CITY_VALUE = "__custom_city__";

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

function LocationSelects({
    countryCode,
    setCountryCode,
    setCountry,
    stateCode,
    setStateCode,
    setState,
    city,
    setCity,
    customCity,
    setCustomCity,
    labels = {
        country: "País",
        state: "Provincia / Estado",
        city: "Ciudad / Localidad"
    }
}) {
    const countries = sortByName(
        Country.getAllCountries()
    );

    const states = countryCode
        ? sortByName(State.getStatesOfCountry(countryCode))
        : [];

    const cities =
        countryCode && stateCode
            ? sortByName(City.getCitiesOfState(countryCode, stateCode))
            : [];

    function handleCountryChange(value) {
        const selectedCountry = countries.find(
            item => item.isoCode === value
        );

        setCountryCode(value);
        setCountry(
            selectedCountry
                ? getCountryLabel(selectedCountry)
                : ""
        );

        setStateCode("");
        setState("");
        setCity("");
        setCustomCity("");
    }

    function handleStateChange(value) {
        const selectedState = states.find(
            item => item.isoCode === value
        );

        setStateCode(value);
        setState(selectedState?.name || "");
        setCity("");
        setCustomCity("");
    }

    return (
        <>
            <label>
                {labels.country}
            </label>

            <select
                value={countryCode}
                onChange={(event) =>
                    handleCountryChange(event.target.value)
                }
            >
                <option value="">
                    Seleccionar país
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

            <label>
                {labels.state}
            </label>

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
                            ? "Seleccionar provincia / estado"
                            : "Primero seleccioná un país"
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

            <label>
                {labels.city}
            </label>

            {countryCode && stateCode && cities.length > 0 ? (
                <>
                    <select
                        value={city}
                        onChange={(event) =>
                            setCity(event.target.value)
                        }
                    >
                        <option value="">
                            Seleccionar ciudad / localidad
                        </option>

                        {cities.map(item => (
                            <option
                                key={`${item.name}-${item.latitude}-${item.longitude}`}
                                value={item.name}
                            >
                                {item.name}
                            </option>
                        ))}

                        <option value={CUSTOM_CITY_VALUE}>
                            Otra ciudad / localidad
                        </option>
                    </select>

                    {city === CUSTOM_CITY_VALUE && (
                        <input
                            type="text"
                            value={customCity}
                            onChange={(event) =>
                                setCustomCity(event.target.value)
                            }
                            placeholder="Escribí tu ciudad o localidad"
                        />
                    )}
                </>
            ) : (
                <input
                    type="text"
                    value={customCity}
                    onChange={(event) =>
                        setCustomCity(event.target.value)
                    }
                    placeholder={
                        countryCode && stateCode
                            ? "Escribí tu ciudad o localidad"
                            : "Primero seleccioná provincia / estado"
                    }
                    disabled={!countryCode || !stateCode}
                />
            )}
        </>
    );
}

export default LocationSelects;