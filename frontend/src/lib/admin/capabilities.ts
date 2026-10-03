import { AdminCapability } from '@/types/admin';

export function hasCapability(
  granted: AdminCapability[] | undefined,
  required: AdminCapability | AdminCapability[]
): boolean {
  if (!granted || !Array.isArray(granted)) {
    return false;
  }

  if (Array.isArray(required)) {
    return required.some((cap) => granted.includes(cap));
  }

  return granted.includes(required);
}

export function hasAllCapabilities(
  granted: AdminCapability[] | undefined,
  required: AdminCapability[]
): boolean {
  if (!granted || !Array.isArray(granted)) {
    return false;
  }

  return required.every((cap) => granted.includes(cap));
}
