import crypto from 'crypto';

export const generateLicenseKey = (prefix = 'IADOS'): string => {
  const segments = Array.from({ length: 4 }, () =>
    crypto.randomBytes(2).toString('hex').toUpperCase()
  );
  return `${prefix}-${segments.join('-')}`;
};

export const generateInvoiceNumber = (sequence: number): string => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const seq = String(sequence).padStart(5, '0');
  return `FAC-${year}${month}-${seq}`;
};
