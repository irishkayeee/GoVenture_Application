/**
 * mockData.ts
 * Type defs for the client Documents tab. The required-document checklist
 * (titles/descriptions/instructions) and each document's real status/file
 * now come from the backend (client_documents_list) — no seed data here.
 */

export type DocumentStatus = 'Pending Upload' | 'Submitted' | 'Approved';

export type RequiredDocument = {
  id:           string;
  title:        string;
  description:  string;
  instructions: string;
  status:       DocumentStatus;
  fileName:     string | null;
};
