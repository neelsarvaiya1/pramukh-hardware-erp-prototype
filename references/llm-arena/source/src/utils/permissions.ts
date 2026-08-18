import type { User, Role } from '../types';
import { roles } from '../data/mockData';

export function getUserRole(user: User): Role | undefined {
  const roleMap: Record<string, string> = {
    admin: 'r1',
    manager: 'r2',
    cashier: 'r3',
    inventory: 'r4',
  };
  return roles.find(r => r.id === roleMap[user.role]);
}

export function hasPermission(user: User, module: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean {
  const role = getUserRole(user);
  if (!role) return false;
  return role.permissions[module]?.[action] ?? false;
}

export function getAccessibleModules(user: User): string[] {
  const role = getUserRole(user);
  if (!role) return [];
  return Object.entries(role.permissions)
    .filter(([_, perms]) => perms.view)
    .map(([module]) => module);
}

export function formatCurrency(amount: number, symbol = '$'): string {
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string, format = 'MM/DD/YYYY'): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return format.replace('MM', month).replace('DD', day).replace('YYYY', String(year));
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
