const natural = require('natural');

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

const DOMAIN_TERMS = new Set([
    'coding', 'gaming', 'music', 'fitness', 'gym', 'cooking', 'reading', 'study',
    'studying', 'sketching', 'art', 'design', 'movies', 'travel', 'sports',
    'football', 'cricket', 'clean', 'quiet', 'social', 'introvert', 'extrovert',
    'night', 'morning', 'vegan', 'vegetarian', 'pet', 'work', 'remote'
]);

const EXTRA_STOPWORDS = new Set([
    ...natural.stopwords,
    'room', 'roommate', 'roommates', 'flat', 'house', 'apartment', 'people',
    'person', 'someone', 'thing', 'things', 'like', 'love', 'looking', 'want',
    'need', 'also', 'really', 'very', 'good', 'great', 'weekend', 'weekends'
]);

const normalizeToken = (token) => token.toLowerCase().replace(/[^a-z0-9-]/g, '');

const tokenizeText = (text) => (
    tokenizer
        .tokenize(String(text || ''))
        .map(normalizeToken)
        .filter((token) => token.length >= 3 && !EXTRA_STOPWORDS.has(token))
);

const buildTextBlob = ({ bio = '', hobbies = [], dealbreakers = [], dietary = '', occupation = '' } = {}) => (
    [
        bio,
        occupation,
        dietary,
        ...(Array.isArray(hobbies) ? hobbies : []),
        ...(Array.isArray(dealbreakers) ? dealbreakers.map((item) => `avoid ${item}`) : [])
    ].join(' ')
);

const extractKeywords = (profileInput = {}) => {
    const tokens = tokenizeText(buildTextBlob(profileInput));
    const scores = new Map();
    const labels = new Map();

    tokens.forEach((token) => {
        const stem = stemmer.stem(token);
        const domainBoost = DOMAIN_TERMS.has(token) ? 1.4 : 1;
        const currentScore = scores.get(stem) || 0;
        scores.set(stem, currentScore + domainBoost);

        if (!labels.has(stem) || token.length < labels.get(stem).length) {
            labels.set(stem, token);
        }
    });

    return [...scores.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([stem, score]) => ({
            stem,
            label: labels.get(stem),
            score: Number(score.toFixed(2))
        }));
};

const keywordLabels = (keywords = []) => keywords.map((keyword) => keyword.label);

const keywordSimilarity = (keywordsA = [], keywordsB = []) => {
    const stemsA = new Set(keywordsA.map((keyword) => keyword.stem || stemmer.stem(String(keyword))));
    const stemsB = new Set(keywordsB.map((keyword) => keyword.stem || stemmer.stem(String(keyword))));

    if (!stemsA.size || !stemsB.size) {
        return { score: 0, sharedKeywords: [] };
    }

    const intersection = [...stemsA].filter((stem) => stemsB.has(stem));
    const unionSize = new Set([...stemsA, ...stemsB]).size;
    const score = unionSize ? intersection.length / unionSize : 0;
    const labelMap = new Map(keywordsA.map((keyword) => [keyword.stem, keyword.label]));

    return {
        score,
        sharedKeywords: intersection.map((stem) => labelMap.get(stem) || stem)
    };
};

module.exports = {
    extractKeywords,
    keywordLabels,
    keywordSimilarity
};
