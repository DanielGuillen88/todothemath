import { Smartphone, Banknote, CreditCard, Wallet } from 'lucide-react';

export const PAYMENT_METHODS = [
  { id: 'bizum', label: 'Bizum', icon: Smartphone },
  { id: 'cash', label: 'Efectivo', icon: Banknote },
  { id: 'bank', label: 'Transferencia', icon: CreditCard },
  { id: 'other', label: 'Otro', icon: Wallet },
];