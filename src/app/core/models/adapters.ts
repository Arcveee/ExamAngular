import { Wallet, WalletDTO, Facture, FactureDTO } from './models';

export function toWallet(dto: WalletDTO): Wallet {
  return {
    id: dto.id,
    phoneNumber: dto.phoneNumber,
    balance: dto.balance,
    ownerName: dto.ownerName,
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
