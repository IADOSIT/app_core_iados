import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateInvoiceNumber } from '../utils/licenseKey';

export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, clientId, page = 1, limit = 20 } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (status) { conditions.push(`i.status = $${idx++}`); params.push(status); }
    if (clientId) { conditions.push(`i.client_id = $${idx++}`); params.push(clientId); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(`SELECT COUNT(*) FROM invoices i ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const result = await query(
      `SELECT i.*,
              c.company_name, c.first_name as client_first, c.last_name as client_last,
              c.rfc as client_rfc
       FROM invoices i
       LEFT JOIN clients c ON i.client_id = c.id
       ${where} ORDER BY i.created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    res.json({ success: true, data: result.rows, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener facturas' });
  }
};

export const getInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [invoice, items, payments] = await Promise.all([
      query(
        `SELECT i.*, c.company_name, c.first_name as client_first, c.last_name as client_last,
                c.email as client_email, c.rfc as client_rfc, c.address as client_address
         FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = $1`,
        [id]
      ),
      query('SELECT * FROM invoice_items WHERE invoice_id = $1', [id]),
      query('SELECT * FROM payments WHERE invoice_id = $1', [id]),
    ]);

    if (invoice.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }

    res.json({ success: true, data: { ...invoice.rows[0], items: items.rows, payments: payments.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener factura' });
  }
};

export const createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clientId, items, taxRate, discount, currency, exchangeRate, dueDate, notes } = req.body;

    // Generar número de factura
    const seqRes = await query(`SELECT COUNT(*) FROM invoices`);
    const seq = parseInt(seqRes.rows[0].count) + 1;
    const invoiceNumber = generateInvoiceNumber(seq);

    // Calcular totales
    let subtotal = 0;
    const processedItems = (items || []).map((item: { quantity: number; unitPrice: number; discount?: number; taxRate?: number; description: string }) => {
      const lineTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
      subtotal += lineTotal;
      return { ...item, total: lineTotal };
    });

    const discountAmount = (discount || 0);
    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount * ((taxRate || 16) / 100);
    const total = taxableAmount + tax;

    const result = await query(
      `INSERT INTO invoices (invoice_number, client_id, subtotal, tax_rate, tax, discount, total, currency, exchange_rate, due_date, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [invoiceNumber, clientId, subtotal, taxRate || 16, tax, discountAmount, total, currency || 'MXN', exchangeRate || 1, dueDate, notes, req.user?.userId]
    );

    const invoiceId = result.rows[0].id;

    // Insertar items
    for (const item of processedItems) {
      await query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, discount, tax_rate, total)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [invoiceId, item.description, item.quantity, item.unitPrice, item.discount || 0, item.taxRate || taxRate || 16, item.total]
      );
    }

    res.status(201).json({ success: true, data: { ...result.rows[0], items: processedItems } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear factura' });
  }
};

export const updateInvoiceStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, cfdiUuid, cfdiUrl } = req.body;

    const setPaidAt = status === 'pagada' ? ', paid_at = NOW()' : '';
    const setIssuedAt = status === 'emitida' ? ', issued_at = NOW()' : '';

    const result = await query(
      `UPDATE invoices SET status=$1, cfdi_uuid=$2, cfdi_url=$3, updated_at=NOW() ${setPaidAt} ${setIssuedAt}
       WHERE id=$4 RETURNING *`,
      [status, cfdiUuid, cfdiUrl, id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar factura' });
  }
};
