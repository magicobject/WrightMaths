import { test, expect } from './support/fixtures';
import { ALEVEL_TOPICS } from './support/alevel-pages';

// A-level papers allow a calculator, so every topic page offers the scientific one, as the GCSE pages do where it is allowed.
test.describe('the scientific calculator on every A-level topic page', () => {
  for (const topic of ALEVEL_TOPICS) {
    test(`${topic.path} offers the scientific calculator on its first question`, async ({ page }) => {
      await page.goto(topic.path);
      const q = page.locator('.q').first();
      await q.locator('.calc-toggle').click();
      await expect(q.getByRole('button', { name: 'sin, sine', exact: true })).toBeVisible();
    });
  }
});

test('only the <main> element of an A-level topic page sets the calculator, so every question gets the same scientific keypad', () => {
  const { readFileSync } = require('node:fs');
  const { join } = require('node:path');
  const bad: string[] = [];
  for (const topic of ALEVEL_TOPICS) {
    const src = readFileSync(join(__dirname, '..', 'src', 'pages', topic.path.replace(/^\//, '')), 'utf8') as string;
    const marks = src.match(/data-calc="[a-z]*"/g) ?? [];
    if (marks.length !== 1 || !/^<main[^>]*data-calc="scientific"/.test(src)) bad.push(`${topic.path}: ${marks.join(' ')}`);
  }
  expect(bad).toEqual([]);
});
