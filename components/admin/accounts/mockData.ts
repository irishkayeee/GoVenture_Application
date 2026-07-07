/**
 * mockData.ts
 * Client-side mock data for the admin Accounts tab.
 */

export type AccountRole = 'Admin' | 'Staff' | 'Client';

export type Account = {
  id:          string;
  name:        string;
  initials:    string;
  email:       string;
  role:        AccountRole;
  address:     string;
  cellphone:   string;
  createdDate: string;
};

export const ACCOUNTS: Account[] = [
  { id: '1',  name: 'Maria Santos',          initials: 'MS', email: 'maria.santos@goventure.com', role: 'Staff',  address: '456 Rizal St., Makati City', cellphone: '+63 917 111 2222', createdDate: 'June 13, 2026' },
  { id: '2',  name: 'Carlo Reyes',           initials: 'CR', email: 'carlo.reyes@goventure.com',  role: 'Staff',  address: '12 Mabini St., Quezon City',  cellphone: '+63 917 222 3333', createdDate: 'June 10, 2026' },
  { id: '3',  name: 'System Administrator',  initials: 'SA', email: 'admin@goventure.com',        role: 'Admin',  address: 'GoVenture HQ, Cebu City',      cellphone: '+63 917 000 1111', createdDate: 'January 5, 2026' },
  { id: '4',  name: 'Mia Reyes',             initials: 'MR', email: 'mia.reyes@email.com',        role: 'Client', address: '88 Osmeña Blvd, Cebu City',    cellphone: '+63 917 333 4444', createdDate: 'May 2, 2026' },
  { id: '5',  name: 'Carlos Garcia',         initials: 'CG', email: 'carlos.garcia@email.com',    role: 'Client', address: '21 Boracay Rd, Malay, Aklan',  cellphone: '+63 917 444 5555', createdDate: 'April 28, 2026' },
  { id: '6',  name: 'Ana Torres',            initials: 'AT', email: 'ana.torres@email.com',       role: 'Client', address: '5 Session Rd, Baguio City',    cellphone: '+63 917 555 6666', createdDate: 'April 20, 2026' },
  { id: '7',  name: 'Benjamin Lim',          initials: 'BL', email: 'benjamin.lim@email.com',     role: 'Client', address: '3 Marina Blvd, Manila',        cellphone: '+63 917 666 7777', createdDate: 'April 15, 2026' },
  { id: '8',  name: 'Jared Abellera',        initials: 'JA', email: 'jaredabellera@gmail.com',    role: 'Client', address: '14 Katipunan Ave, Quezon City', cellphone: '+63 917 777 8888', createdDate: 'March 30, 2026' },
  { id: '9',  name: 'Rico Santos',           initials: 'RS', email: 'rico.santos@gmail.com',      role: 'Client', address: '9 Del Pilar St, Palawan',      cellphone: '+63 917 888 9999', createdDate: 'March 22, 2026' },
  { id: '10', name: 'Anna Cruz',             initials: 'AC', email: 'anna.cruz@gmail.com',        role: 'Client', address: '77 Colon St, Cebu City',       cellphone: '+63 917 999 0000', createdDate: 'March 10, 2026' },
  { id: '11', name: 'Bea Ramos',             initials: 'BR', email: 'bea.ramos@gmail.com',        role: 'Client', address: '33 Roxas Blvd, Manila',        cellphone: '+63 918 111 2222', createdDate: 'February 26, 2026' },
  { id: '12', name: 'Liza Fernandez',        initials: 'LF', email: 'liza.fernandez@gmail.com',   role: 'Client', address: '6 Fuente Circle, Cebu City',   cellphone: '+63 918 222 3333', createdDate: 'February 14, 2026' },
  { id: '13', name: 'Grace Tan',             initials: 'GT', email: 'grace.tan@gmail.com',        role: 'Client', address: '18 EDSA, Mandaluyong',         cellphone: '+63 918 333 4444', createdDate: 'January 30, 2026' },
];

export const AVATAR_COLORS = ['#C46B1A', '#9C27B0', '#2196F3', '#F44336', '#12946F'];
