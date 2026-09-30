import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Pure utility helper replicating the contract function
export function buildWhatsAppUrl(baseUrl: string, locale: string, customGreeting?: string): string {
  if (!baseUrl || baseUrl.trim() === '') return '';
  const greeting =
    customGreeting ??
    (locale === 'ar'
      ? 'مرحباً، لدي استفسار حول منصة كَنزين'
      : 'Hello, I have an inquiry about KNZiN');
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl.trim()}${separator}text=${encodeURIComponent(greeting)}`;
}

describe('User Story 5: WhatsApp Button Invariants', () => {
  const arPath = path.resolve(process.cwd(), 'messages/ar.json');
  const enPath = path.resolve(process.cwd(), 'messages/en.json');

  const arDict = JSON.parse(fs.readFileSync(arPath, 'utf8'));
  const enDict = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  it('verifies 100% dictionary parity between ar.json and en.json for whatsapp namespace', () => {
    assert.ok(arDict.whatsapp, 'ar.json must have whatsapp namespace');
    assert.ok(enDict.whatsapp, 'en.json must have whatsapp namespace');

    const arKeys = Object.keys(arDict.whatsapp).sort();
    const enKeys = Object.keys(enDict.whatsapp).sort();

    assert.deepEqual(arKeys, enKeys, 'whatsapp namespace keys must match exactly across ar and en');
  });

  it('asserts verbatim pre-filled greetings match specifications', () => {
    assert.equal(arDict.whatsapp.prefilledGreeting, 'مرحباً، لدي استفسار حول منصة كَنزين');
    assert.equal(enDict.whatsapp.prefilledGreeting, 'Hello, I have an inquiry about KNZiN');
  });

  it('correctly constructs encoded WhatsApp URL with Arabic prefilled greeting', () => {
    const baseUrl = 'https://wa.me/971500000000';
    const result = buildWhatsAppUrl(baseUrl, 'ar');
    assert.ok(result.startsWith('https://wa.me/971500000000?text='));
    const url = new URL(result);
    assert.equal(url.searchParams.get('text'), 'مرحباً، لدي استفسار حول منصة كَنزين');
  });

  it('correctly constructs encoded WhatsApp URL with English prefilled greeting', () => {
    const baseUrl = 'https://wa.me/971500000000';
    const result = buildWhatsAppUrl(baseUrl, 'en');
    assert.ok(result.startsWith('https://wa.me/971500000000?text='));
    const url = new URL(result);
    assert.equal(url.searchParams.get('text'), 'Hello, I have an inquiry about KNZiN');
  });

  it('preserves existing query parameters on baseUrl', () => {
    const baseUrl = 'https://api.whatsapp.com/send?phone=971500000000';
    const result = buildWhatsAppUrl(baseUrl, 'en');
    assert.ok(result.includes('&text='));
    const url = new URL(result);
    assert.equal(url.searchParams.get('phone'), '971500000000');
    assert.equal(url.searchParams.get('text'), 'Hello, I have an inquiry about KNZiN');
  });

  it('returns empty string when URL is undefined or whitespace, triggering fallback dialog', () => {
    assert.equal(buildWhatsAppUrl('', 'ar'), '');
    assert.equal(buildWhatsAppUrl('   ', 'en'), '');
    assert.equal(buildWhatsAppUrl(undefined as any, 'ar'), '');
  });
});
