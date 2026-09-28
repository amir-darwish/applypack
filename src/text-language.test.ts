import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notEnglishNotice, textLanguage } from './text-language';

// TASKS S20: postings in the languages the sources bring (country-search-plan §7.2).
const EN = 'We are looking for a Senior Backend Engineer to join our team. You will build and own services in Node.js and TypeScript, work with PostgreSQL, and review the code of your peers. We offer a remote role in the EU and a budget for your learning.';
const DE = 'Wir suchen eine erfahrene Backend-Entwicklerin oder einen Backend-Entwickler (m/w/d) für unser Team in Berlin. Du entwickelst mit uns die Plattform in TypeScript und Node.js, arbeitest mit PostgreSQL und bist für die Qualität der Services verantwortlich. Bei uns erwartet dich ein modernes Büro und die Möglichkeit, remote zu arbeiten.';
const PL = 'Poszukujemy doświadczonego programisty backend do naszego zespołu w Warszawie. Będziesz odpowiedzialny za rozwój platformy w Node.js oraz TypeScript, pracę z bazą PostgreSQL i przegląd kodu. Oferujemy pracę zdalną, prywatną opiekę medyczną oraz budżet na szkolenia dla każdego członka zespołu.';
const UK = 'Шукаємо досвідченого бекенд-розробника до нашої команди. Ви будете відповідати за розробку платформи на Node.js та TypeScript, працювати з PostgreSQL і робити код-рев’ю. Ми пропонуємо віддалену роботу, гнучкий графік та бюджет на навчання для кожного, хто приєднається до команди.';
const RU = 'Ищем опытного бэкенд-разработчика в нашу команду. Вы будете отвечать за разработку платформы на Node.js и TypeScript, работать с PostgreSQL и делать код-ревью. Мы предлагаем удалённую работу, гибкий график и бюджет на обучение для каждого, кто присоединится к команде. Это отличная возможность.';
const FR = 'Nous recherchons un développeur backend expérimenté pour rejoindre notre équipe à Paris. Vous serez responsable du développement de la plateforme avec Node.js et TypeScript, de la base de données PostgreSQL et de la revue du code. Nous proposons le télétravail et un budget pour la formation de chacun.';

test('the language of a posting, from its function words', () => {
  assert.equal(textLanguage(EN)?.code, 'en');
  assert.equal(textLanguage(DE)?.code, 'de');
  assert.equal(textLanguage(PL)?.code, 'pl');
  assert.equal(textLanguage(FR)?.code, 'fr');
});

test('Ukrainian and Russian are told apart by the alphabet', () => {
  assert.equal(textLanguage(UK)?.name, 'Ukrainian');
  assert.equal(textLanguage(RU)?.name, 'Russian');
});

test('too little prose to tell says nothing', () => {
  assert.equal(textLanguage('Node.js, TypeScript, PostgreSQL, AWS, Docker'), null);
  assert.equal(textLanguage(''), null);
});

test('the notice names the language, and an English posting has none', () => {
  assert.equal(notEnglishNotice(EN), null);
  assert.match(notEnglishNotice(DE) ?? '', /^This posting is in German\. .* a letter comes out in English\.$/);
});
