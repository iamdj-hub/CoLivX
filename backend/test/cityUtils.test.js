const assert = require('node:assert/strict');
const test = require('node:test');
const { getCityKey, isSameCity, normalizeCityName } = require('../utils/cityUtils');

test('city keys ignore casing, spacing, and punctuation', () => {
    assert.equal(getCityKey(' New   Delhi '), 'delhi');
    assert.equal(getCityKey('new-delhi'), 'delhi');
    assert.equal(getCityKey('PURNIA'), 'purnia');
});

test('Purnea and Purnia are treated as the same city', () => {
    assert.equal(isSameCity('Purnea', 'purnia'), true);
    assert.equal(isSameCity('PURNIYA', 'Purnia'), true);
});

test('city display names are normalized for future profile saves', () => {
    assert.equal(normalizeCityName('pUrNeA'), 'Purnia');
    assert.equal(normalizeCityName('  pune  '), 'Pune');
});
