
import { Contract, Company } from './types';

export const PARTNERS: Company[] = [
  {
    id: 'p1',
    name: 'TechSoluções Ltda',
    category: 'Empresa',
    status: 'active',
    logoUrl: 'https://picsum.photos/seed/tech/200',
    contractCount: 3,
    cnpj: '12.345.678/0001-90',
    location: 'São Paulo, SP',
    code: '12.345.678/0001-90',
    emailSuffix: 'techsolucoes.com.br',
    logoPath: '',
    logoName: '',
    phone: '(11) 98888-7777'
  } as Company,
  {
    id: 'p2',
    name: 'Serviços Gerais Express',
    category: 'Empresa',
    status: 'active',
    logoUrl: 'https://picsum.photos/seed/express/200',
    contractCount: 1,
    cnpj: '98.765.432/0001-01',
    location: 'Rio de Janeiro, RJ',
    code: '98.765.432/0001-01',
    emailSuffix: 'geraisexpress.com',
    logoPath: '',
    logoName: '',
    phone: '(21) 97777-6666'
  } as Company
];

export const CONTRACTS: Contract[] = [
  {
    id: 'c1',
    partnerId: 'p1',
    description: 'Manutenção Preventiva',
    dateStart: '2023-01-01',
    dateEnd: '2024-01-01',
    statusId: 1,
    totalValue: 12000,
    companyName: 'TechSoluções Ltda',
    logoUrl: 'https://picsum.photos/seed/tech/200'
  } as Contract,
  {
    id: 'c2',
    partnerId: 'p2',
    description: 'Limpeza Industrial',
    dateStart: '2023-03-15',
    dateEnd: '2025-03-15',
    statusId: 1,
    totalValue: 8500,
    companyName: 'Serviços Gerais Express',
    logoUrl: 'https://picsum.photos/seed/express/200'
  } as Contract
];
