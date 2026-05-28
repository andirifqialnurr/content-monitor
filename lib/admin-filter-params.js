const ALL_FILTER_VALUE = "ALL";

export function readAdminListFilters(searchParams = {}, allowedFilters = {}) {
  const filters = {
    query: readTextParam(searchParams, "q"),
  };

  for (const [key, allowedValues] of Object.entries(allowedFilters)) {
    const value = readTextParam(searchParams, key);
    filters[key] = value && value !== ALL_FILTER_VALUE && allowedValues.includes(value) ? value : undefined;
  }

  return filters;
}

function readTextParam(searchParams, key) {
  const value = searchParams?.[key];
  const selectedValue = Array.isArray(value) ? value[0] : value;

  return typeof selectedValue === "string" ? selectedValue.trim() : "";
}
