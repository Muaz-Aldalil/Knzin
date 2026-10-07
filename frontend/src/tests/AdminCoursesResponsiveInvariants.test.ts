/**
 * Admin Courses Responsive & Table Row Invariants Test
 * Verifies that DataTable and Admin Courses rows adhere to strict multi-device responsive invariants.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Admin Courses Table Responsive Invariants', () => {
  it('DataTable component defaults to lg breakpoint and min-w-[780px] to protect against sidebar crunching', () => {
    const dataTablePath = path.resolve(__dirname, '../components/admin/DataTable.tsx');
    assert.ok(fs.existsSync(dataTablePath), 'DataTable.tsx must exist');

    const content = fs.readFileSync(dataTablePath, 'utf8');
    assert.ok(
      content.includes("breakpoint = 'lg'"),
      'DataTable must default to lg breakpoint to adapt under admin sidebar presence'
    );
    assert.ok(
      content.includes("minWidth = 'min-w-[780px]'"),
      'DataTable must enforce minimum table width to prevent squished columns'
    );
    assert.ok(
      content.includes('overflow-x-auto'),
      'DataTable must wrap desktop table in horizontal scrolling container'
    );
  });

  it('Admin Courses table defines explicit min-widths and whitespace-nowrap for all columns', () => {
    const coursesPagePath = path.resolve(__dirname, '../app/[locale]/admin/courses/page.tsx');
    assert.ok(fs.existsSync(coursesPagePath), 'admin/courses/page.tsx must exist');

    const content = fs.readFileSync(coursesPagePath, 'utf8');

    // Title column
    assert.ok(
      content.includes("min-w-[220px]"),
      'Title column must enforce min-w-[220px]'
    );

    // Pricing column
    assert.ok(
      content.includes("min-w-[170px] whitespace-nowrap"),
      'Pricing column must enforce min-w-[170px] and whitespace-nowrap'
    );

    // BiDi isolation on currency
    assert.ok(
      content.includes('dir="ltr"') && content.includes('<bdi>({item.display_price_label})</bdi>'),
      'Pricing column must isolate LTR dollar amounts and BDI display price label to prevent parenthesis inversion'
    );

    // Parts column
    assert.ok(
      content.includes("min-w-[140px] whitespace-nowrap"),
      'Parts column must enforce min-w-[140px] and whitespace-nowrap'
    );

    // Status column
    assert.ok(
      content.includes("min-w-[125px] whitespace-nowrap"),
      'Status column must enforce min-w-[125px] and whitespace-nowrap'
    );

    // Actions column
    assert.ok(
      content.includes("min-w-[145px] whitespace-nowrap"),
      'Actions column must enforce min-w-[145px] and whitespace-nowrap'
    );

    // DataTable invocation
    assert.ok(
      content.includes('breakpoint="lg"') && content.includes('minWidth="min-w-[840px]"'),
      'Admin courses page must explicitly specify lg breakpoint and 840px minWidth on DataTable'
    );
  });

  it('Mobile card renderer renderCourseMobileCard isolates BiDi currencies properly', () => {
    const coursesPagePath = path.resolve(__dirname, '../app/[locale]/admin/courses/page.tsx');
    const content = fs.readFileSync(coursesPagePath, 'utf8');

    assert.ok(
      content.includes('renderCourseMobileCard'),
      'Must define dedicated renderCourseMobileCard for devices under lg breakpoint'
    );
    assert.ok(
      content.includes('<bdi>({item.display_price_label})</bdi>'),
      'Mobile card must protect Iraqi Dinar parenthetical amounts with <bdi>'
    );
  });
});
