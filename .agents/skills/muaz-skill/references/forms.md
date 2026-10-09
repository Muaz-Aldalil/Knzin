# Forms — Validation, Wizards, Uploads & Drafts

Load on any project with user input beyond a single search box.

---

## Library per Stack

| Stack | Library | Schema |
|---|---|---|
| React / Next | React Hook Form | Zod (`@hookform/resolvers`) |
| Vue | Vue FormKit / VeeValidate | Zod / Yup |
| Angular | Reactive Forms | Angular built-in validators + Zod |
| Svelte | svelte-forms-lib | Zod |
| Nuxt | Nuxt FormKit / VeeValidate | Zod |

---

## Multi-Step Wizard

```typescript
// React Hook Form multi-step
const steps = ['Account', 'Profile', 'Review'];
const [step, setStep] = useState(0);
const { trigger, getValues } = useForm();

async function next() {
  const fields = step === 0 ? ['email', 'password'] : ['name', 'bio'];
  const valid = await trigger(fields);
  if (valid) setStep((s) => s + 1);
}

function back() { setStep((s) => s - 1); }
```

**Rules:**
- Validate only the current step's fields before advancing
- Persist all steps in a single form state (don't submit per-step)
- Show step indicator with completed/current/pending states
- On "back", restore previous step values without re-validating
- On submit, validate all fields one final time

---

## Dynamic Field Arrays

```typescript
import { useFieldArray } from 'react-hook-form';

const { fields, append, remove } = useFieldArray({
  control,
  name: 'items',
});

return (
  <>
    {fields.map((field, index) => (
      <div key={field.id}>
        <input {...register(`items.${index}.name`)} />
        <button type="button" onClick={() => remove(index)}>Remove</button>
      </div>
    ))}
    <button type="button" onClick={() => append({ name: '' })}>Add item</button>
  </>
);
```

**Rules:**
- Enforce min/max rows (disable add/remove at limits)
- Use stable IDs per row (`field.id` from `useFieldArray`) — never array index as key
- Each row validates independently

---

## File Upload

```typescript
function FileUpload({ onFile, maxSizeMB = 5, accept = 'image/*' }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file.size > maxSizeMB * 1024 * 1024) {
      return setError(`Max ${maxSizeMB}MB`);
    }
    setPreview(URL.createObjectURL(file));
    onFile(file);
  }

  return (
    <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
         role="button" tabIndex={0}
         aria-label="Upload file">
      {preview ? <img src={preview} alt="Preview" /> : 'Drop file here'}
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
```

**Rules:**
- Validate size + type + magic bytes client-side before upload
- Show preview immediately (before server confirms)
- Upload progress bar with `<progress>` or custom indicator
- Chunked upload for files > 10MB (slice + sequential upload + resume)
- Drag zone has visible active state (border highlight)

---

## Draft Auto-Save

```typescript
import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';

const DRAFT_KEY = 'form-draft';

function useAutoSave(control: Control) {
  const values = useWatch({ control });

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    }, 1000); // debounce 1s

    return () => clearTimeout(timer);
  }, [values]);

  return {
    restore: () => JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'),
    clear: () => localStorage.removeItem(DRAFT_KEY),
  };
}
```

**Rules:**
- Debounce by 1 second (not on every keystroke)
- Restore on mount, clear on successful submit
- Show "Draft saved" indicator (small text, auto-dismiss)
- Handle localStorage quota (wrap in try/catch)

---

## Validation Patterns

| Pattern | Implementation |
|---|---|
| Cross-field (password match) | Zod `.refine()` or form-level resolver |
| Async (email unique) | `validate` function that returns a promise |
| Debounced validation | Debounce the trigger, not the onChange |
| Conditional (field required only if other field is set) | Zod `.superRefine()` |
| Server errors mapped to fields | `setError('email', { message: err.message })` |

---

## Phase 5 Checklist
- [ ] Form library chosen per stack with Zod schema
- [ ] Multi-step wizard: validate per-step, preserve state on back
- [ ] File upload: size+type validation, preview, progress
- [ ] Draft auto-save: debounced to 1s, restore on mount, clear on submit
- [ ] Validation: cross-field, async, server errors mapped to fields
- [ ] Submit button disabled during pending, shows spinner
