export type UserRole = 'agent' | 'client' | null;

export interface Wallet {
  id: number;
  phoneNumber: string;
  code: string;
  balance: number;
  devise: string;
  ownerName: string;
  createdAt: string;
}

export interface WalletDTO {
  id: number;
  phoneNumber: string;
  code: string;
  balance: number;
  devise: string;
  ownerName: string;
  createdAt: string;
}

export interface Facture {
  id: string;
  reference: string;
  montant: number;
  statut: 'PAYEE' | 'IMPAYEE';
  emetteur: string;
}

export interface FactureDTO {
  id: string;
  reference: string;
  montant: number;
  statut: 'PAYEE' | 'IMPAYEE';
  emetteur: string;
}

export interface Transaction {
  id: number;
  type: string;
  montant: number;
  date: string;
  description: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
