import { Wallet, WalletDTO, Facture, FactureDTO } from './models';

export function toWallet(dto: WalletDTO): Wallet {
  return {
    id: dto.id,
    phoneNumber: dto.phoneNumber,
    code: dto.code,
    balance: dto.balance,
    devise: dto.devise,
    ownerName: dto.ownerName,
    createdAt: dto.createdAt,
  };
}

export function toFacture(dto: FactureDTO): Facture {
  return {
    id: dto.id,
    reference: dto.reference,
    montant: dto.montant,
    statut: dto.statut,
    emetteur: dto.emetteur,
  };
}
