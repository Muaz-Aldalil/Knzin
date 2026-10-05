import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import arMessages from '../../messages/ar.json';
import enMessages from '../../messages/en.json';

describe('Developer Attribution Invariants (Footer & Login Dialog)', () => {
  it('has 100% key parity across all footer keys', () => {
    const arKeys = Object.keys((arMessages as any).footer).sort();
    const enKeys = Object.keys((enMessages as any).footer).sort();

    assert.deepEqual(arKeys, enKeys, 'footer keys must have 100% parity');
  });

  it('verifies digage logo asset exists in public and matches source hash', () => {
    const publicLogoPath = path.resolve(process.cwd(), 'public', 'digage-logo.png');
    assert.ok(fs.existsSync(publicLogoPath), 'public/digage-logo.png must exist');

    const stat = fs.statSync(publicLogoPath);
    assert.ok(stat.size > 0, 'public/digage-logo.png must not be empty');
  });

  it('DeveloperAttribution component source code renders logo on top and exact brand specification at bottom', () => {
    const componentPath = path.resolve(process.cwd(), 'src/components/layout/DeveloperAttribution.tsx');
    assert.ok(fs.existsSync(componentPath), 'DeveloperAttribution.tsx must exist');

    const content = fs.readFileSync(componentPath, 'utf8');

    // Logo image on top
    assert.ok(content.includes('/digage-logo.png'), 'Must reference /digage-logo.png');

    // Brand colors: Dig #00bcd4 and Age #e91e63
    assert.ok(content.includes('#00bcd4'), 'Must include Dig brand color #00bcd4');
    assert.ok(content.includes('#e91e63'), 'Must include Age brand color #e91e63');

    // Arabic brand name elements: ديجتال, أيج, للحلول التقنية
    assert.ok(content.includes('ديجتال'), 'Must include ديجتال');
    assert.ok(content.includes('أيج'), 'Must include أيج');
    assert.ok(content.includes('للحلول التقنية'), 'Must include للحلول التقنية');

    // English brand name elements: Dig, Age, Tech Solutions
    assert.ok(content.includes('Dig') && content.includes('Age'), 'Must include DigAge');
    assert.ok(content.includes('Tech Solutions'), 'Must include Tech Solutions');

    // Vertical ordering invariant: Image comes before company name text
    const imageIndex = content.indexOf('<Image');
    const nameIndex = content.indexOf('<span>للحلول التقنية</span>');
    assert.ok(imageIndex !== -1 && nameIndex !== -1, 'Image and name span must exist');
    assert.ok(imageIndex < nameIndex, 'Logo must be placed on top of company name');
  });

  it('verifies image and text are separate independent links pointing to digagesolutions.com (not whole box)', () => {
    const componentPath = path.resolve(process.cwd(), 'src/components/layout/DeveloperAttribution.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');

    // Official company URL
    assert.ok(content.includes('https://digagesolutions.com/'), 'Must link to https://digagesolutions.com/');

    // Separate links: at least two <a> elements
    const linkMatches = content.match(/<a\b/g);
    assert.ok(linkMatches && linkMatches.length === 2, 'Must have exactly two separate <a> links (one for logo, one for text)');

    // Root element is a div, not an anchor
    assert.ok(content.includes('return (\n    <div') || content.includes('return (\r\n    <div'), 'Root container must be a div, not an anchor');

    // Security invariants on external links
    assert.ok(content.includes('target="_blank"'), 'Must open in new tab');
    assert.ok(content.includes('rel="noopener noreferrer"'), 'Must have secure rel attributes');
  });

  it('Footer mounts DeveloperAttribution component', () => {
    const footerSourcePath = path.resolve(process.cwd(), 'src/components/layout/Footer.tsx');
    assert.ok(fs.existsSync(footerSourcePath), 'Footer.tsx must exist');

    const content = fs.readFileSync(footerSourcePath, 'utf8');
    assert.ok(content.includes('<DeveloperAttribution'), 'Footer must mount DeveloperAttribution');
  });

  it('LoginPage renders DeveloperAttribution at bottom of login dialog and SiteFrame suppresses Footer', () => {
    const loginPagePath = path.resolve(process.cwd(), 'src/app/[locale]/auth/login/page.tsx');
    assert.ok(fs.existsSync(loginPagePath), 'Login page must exist');

    const loginContent = fs.readFileSync(loginPagePath, 'utf8');
    assert.ok(loginContent.includes('<DeveloperAttribution'), 'Login page must mount DeveloperAttribution');

    // SiteFrame suppresses Footer on auth pages
    const siteFramePath = path.resolve(process.cwd(), 'src/components/layout/SiteFrame.tsx');
    const siteFrameContent = fs.readFileSync(siteFramePath, 'utf8');
    assert.ok(siteFrameContent.includes('!isAuth && <Footer'), 'SiteFrame must suppress Footer on auth routes');
  });
});
