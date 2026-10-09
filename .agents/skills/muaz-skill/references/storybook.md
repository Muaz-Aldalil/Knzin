# Storybook — Component Development & Visual Testing

Set up when building a shared component library or needing visual regression tests.

---

## Installation per Stack

| Stack | Command |
|---|---|
| React + Vite | `npx storybook@latest init --builder vite` |
| Next.js | `npx storybook@latest init` |
| Vue | `npx storybook@latest init --type vue3` |
| Angular | `npx storybook@latest init --type angular` |
| Svelte | `npx storybook@latest init --type svelte` |

All commands auto-detect the project and configure builder/webpack.

---

## Essential Addons

```bash
npm install -D @storybook/addon-a11y @storybook/addon-interactions \
  @storybook/test-runner @storybook/addon-viewport
```

| Addon | Purpose |
|---|---|
| `a11y` | Accessibility violations in component stories |
| `interactions` | Play function testing (click, type, wait) |
| `test-runner` | Run story interaction tests in CI |
| `viewport` | Test at 375px, 768px, 1024px, 1440px |
| `controls` | Interactive prop editing |
| `docs` | Auto-generated docs from TS types |

---

## Story Format

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Click me' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: 'primary' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const WithInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await userEvent.click(button);
    await expect(button).toHaveFocus();
  },
};
```

**Rule:** Every component gets at minimum: default state, each variant, disabled state, error state.

---

## Visual Regression (Chromatic)

```bash
npx chromatic --project-token=<token>
```

### GitHub Action
```yaml
- name: Publish to Chromatic
  uses: chromaui/action@latest
  with:
    projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

Chromatic captures a screenshot of every story on every commit. Diffs are shown in the PR. Accept/reject changes before merging.

---

## Design Tokens Integration

```typescript
// .storybook/preview.ts
import { themes } from '@storybook/theming';

export const decorators = [
  (Story) => (
    <div style={{ '--primary': '#1e40af', '--text': '#111827' } as React.CSSProperties}>
      <Story />
    </div>
  ),
];

export const parameters = {
  backgrounds: { default: 'light', values: [
    { name: 'light', value: '#ffffff' },
    { name: 'dark', value: '#0f172a' },
  ]},
};
```

---

## CI Integration

```bash
# package.json
"scripts": {
  "storybook:test": "npx test-storybook --url http://localhost:6006"
}
```

Run in CI after build:
```bash
npx concurrently -k -s first "npx http-server storybook-static -p 6006" "npx wait-on http://localhost:6006 && npx test-storybook"
```

---

## Phase 5 Checklist
- [ ] Storybook initialized with a11y + interactions addons
- [ ] Every component has stories (default, variants, error/disabled)
- [ ] Story interaction tests cover critical user flows
- [ ] Chromatic (or visual diff) configured in CI
- [ ] Design tokens applied as Storybook theme
- [ ] Stories co-located (`Component.stories.tsx` next to component)
