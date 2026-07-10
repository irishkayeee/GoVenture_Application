/**
 * mockData.ts
 * Required-document checklist template for the client Documents tab. Every
 * booking gets the same checklist for now — a real backend would likely
 * vary this by destination (e.g. visa-on-arrival vs. domestic trips).
 */

export type DocumentStatus = 'Pending Upload' | 'Submitted' | 'Approved';

export type RequiredDocumentTemplate = {
  id:           string;
  title:        string;
  description:  string;
  instructions: string;
};

export type RequiredDocument = RequiredDocumentTemplate & {
  status:   DocumentStatus;
  fileName: string | null;
};

export const REQUIRED_DOCUMENT_TEMPLATE: RequiredDocumentTemplate[] = [
  {
    id: 'valid-id',
    title: 'Government Valid ID',
    description: "Any government-issued photo ID (Driver's License, SSS, PhilHealth).",
    instructions: 'Accepted formats: JPG, PNG, PDF. Max size 10MB. Make sure the ID is not expired and all four corners are visible.',
  },
  {
    id: 'birth-cert',
    title: 'Birth Certificate',
    description: 'PSA-issued birth certificate.',
    instructions: 'Must be an original or certified true copy issued within the last 12 months. Scanned copies must be legible.',
  },
  {
    id: 'bank-statement',
    title: 'Bank Statement',
    description: 'Last 3 months showing sufficient travel funds.',
    instructions: 'Upload a bank-certified statement or e-statement covering the last 3 months, with your name and account number visible.',
  },
  {
    id: 'cert-employment',
    title: 'Certificate of Employment',
    description: 'Current employment certificate with monthly salary indicated.',
    instructions: 'Must be on company letterhead, signed by HR, and issued within the last 30 days.',
  },
  {
    id: 'marriage-cert',
    title: 'Marriage Certificate',
    description: 'PSA-issued, if applicable.',
    instructions: 'Only required if traveling under a married name that differs from your valid ID.',
  },
  {
    id: 'supporting-docs',
    title: 'Supporting Documents',
    description: 'Any additional documents requested by our travel team.',
    instructions: 'Check your Messages tab for specific requests from the GoVenture team, then upload the corresponding file here.',
  },
];

export const buildDocumentChecklist = (): RequiredDocument[] =>
  REQUIRED_DOCUMENT_TEMPLATE.map((doc, i) =>
    i === 0
      ? { ...doc, status: 'Submitted', fileName: 'valid-id.jpg' }
      : { ...doc, status: 'Pending Upload', fileName: null }
  );
