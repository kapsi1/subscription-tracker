
const { LOCALES, COLORS } = require('./packages/shared/dist/index.js');
const i18next = require('i18next');

i18next.init({
  lng: 'pl',
  resources: {
    pl: { translation: LOCALES.pl }
  }
}).then(() => {
  console.log('Language switch:', i18next.t('language.switch'));
  Object.keys(COLORS).forEach(name => {
    console.log(`Color ${name}:`, i18next.t(`language.colors.${name}`));
  });
});
