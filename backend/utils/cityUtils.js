const CITY_ALIASES = new Map([
    ['purnea', 'purnia'],
    ['purniya', 'purnia'],
    ['purnia', 'purnia'],
    ['banglore', 'bengaluru'],
    ['bangalore', 'bengaluru'],
    ['bengaluru', 'bengaluru'],
    ['bombay', 'mumbai'],
    ['mumbai', 'mumbai'],
    ['calcutta', 'kolkata'],
    ['kolkata', 'kolkata'],
    ['delhi', 'delhi'],
    ['newdelhi', 'delhi'],
    ['new delhi', 'delhi']
]);

const CITY_DISPLAY_NAMES = new Map([
    ['purnia', 'Purnia'],
    ['bengaluru', 'Bengaluru'],
    ['mumbai', 'Mumbai'],
    ['kolkata', 'Kolkata'],
    ['delhi', 'Delhi']
]);

const cleanCity = (value = '') => String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');

const getCityKey = (value = '') => {
    const cleaned = cleanCity(value).toLowerCase();
    if (!cleaned) return '';

    const compact = cleaned.replace(/[^a-z0-9]/g, '');
    return CITY_ALIASES.get(cleaned) || CITY_ALIASES.get(compact) || compact;
};

const titleCaseCity = (value = '') => cleanCity(value)
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const normalizeCityName = (value = '') => {
    const key = getCityKey(value);
    if (!key) return '';

    return CITY_DISPLAY_NAMES.get(key) || titleCaseCity(cleanCity(value));
};

const isSameCity = (cityA, cityB) => {
    const keyA = getCityKey(cityA);
    const keyB = getCityKey(cityB);
    return Boolean(keyA && keyB && keyA === keyB);
};

module.exports = {
    getCityKey,
    normalizeCityName,
    isSameCity
};
