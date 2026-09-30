import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('User Story 6: Winner KYC Compliance & Legal Invariants', () => {
  const arPath = path.resolve(process.cwd(), 'messages/ar.json');
  const enPath = path.resolve(process.cwd(), 'messages/en.json');

  const arDict = JSON.parse(fs.readFileSync(arPath, 'utf8'));
  const enDict = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  const canonicalArabicClause =
    'شرط تسليم الجوائز: يُلزم الفائز بتقديم إثبات هوية رسمي يطابق البيانات الأساسية (مثل البريد الإلكتروني) التي تم الشراء بها، وللإدارة الحق في حجب الجائزة في حال ثبوت تلاعب أو استخدام بطاقات دفع مسروقة.';

  const canonicalEnglishClause =
    'Prize Delivery Requirement: The winner is strictly required to present official national identification matching the primary contact details (such as the verified email) used during checkout. Platform administration reserves the legal right to withhold prizes if fraudulent activity or stolen payment methods are established.';

  it('verifies verbatim match of canonical Arabic National ID legal clause', () => {
    assert.ok(arDict.kyc, 'ar.json must have kyc namespace');
    assert.equal(
      arDict.kyc.clause,
      canonicalArabicClause,
      'Arabic Winner KYC clause must match canonical text verbatim'
    );
  });

  it('verifies verbatim match of canonical English National ID legal clause', () => {
    assert.ok(enDict.kyc, 'en.json must have kyc namespace');
    assert.equal(
      enDict.kyc.clause,
      canonicalEnglishClause,
      'English Winner KYC clause must match canonical text verbatim'
    );
  });

  it('verifies 100% dictionary key parity between ar.json and en.json for kyc namespace', () => {
    const arKeys = Object.keys(arDict.kyc).sort();
    const enKeys = Object.keys(enDict.kyc).sort();

    assert.deepEqual(arKeys, enKeys, 'kyc namespace keys must match exactly across ar and en');
  });

  it('validates Iraqi Consumer Protection Law No. 1 (2010) citation presence', () => {
    assert.ok(
      arDict.kyc.lawCitation.includes('2010') && arDict.kyc.lawCitation.includes('1'),
      'Arabic law citation must reference Law No. 1 of 2010'
    );
    assert.ok(
      enDict.kyc.lawCitation.includes('2010') && enDict.kyc.lawCitation.includes('(1)'),
      'English law citation must reference Law No. (1) of 2010'
    );
  });
});
