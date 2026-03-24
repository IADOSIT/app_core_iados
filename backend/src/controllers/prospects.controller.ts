import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

function mapQuote(q: any) {
  return {
    id: q.id,
    prospectId: q.prospect_id,
    quoteNumber: q.quote_number,
    productsDescription: q.products_description,
    implementationFee: Number(q.implementation_fee) || 0,
    licenseFee: Number(q.license_fee) || 0,
    monthlyFee: Number(q.monthly_fee) || 0,
    currency: q.currency || 'MXN',
    exchangeRate: Number(q.exchange_rate) || 1,
    validityDate: q.validity_date,
    status: q.status,
    notes: q.notes,
    fileUrl: q.file_url || null,
    createdAt: q.created_at,
    updatedAt: q.updated_at,
  };
}

function mapProspect(p: any, quotes?: any[]) {
  const latestQuote = p.lq_id ? {
    id: p.lq_id,
    quoteNumber: p.lq_quote_number,
    productsDescription: p.lq_products_description,
    implementationFee: Number(p.lq_implementation_fee) || 0,
    licenseFee: Number(p.lq_license_fee) || 0,
    monthlyFee: Number(p.lq_monthly_fee) || 0,
    currency: p.lq_currency || 'MXN',
    validityDate: p.lq_validity_date,
    status: p.lq_status,
    fileUrl: p.lq_file_url || null,
  } : null;

  return {
    id: p.id,
    name: p.name,
    contactName: p.contact_name,
    email: p.email,
    phone: p.phone,
    source: p.source,
    status: p.status,
    assignedTo: p.assigned_to,
    assignedName: p.assigned_first ? `${p.assigned_first} ${p.assigned_last || ''}`.trim() : null,
    notes: p.notes,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    quotesCount: Number(p.quotes_count) || 0,
    latestQuote,
    quotes: quotes ? quotes.map(mapQuote) : undefined,
  };
}

export const getProspects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 100 } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (status) { conditions.push(`p.status = $${idx++}`); params.push(status); }
    if (search) {
      conditions.push(`(p.name ILIKE $${idx} OR p.contact_name ILIKE $${idx} OR p.email ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(`SELECT COUNT(*) FROM prospects p ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const result = await query(`
      SELECT p.*,
        u.first_name as assigned_first, u.last_name as assigned_last,
        (SELECT COUNT(*) FROM prospect_quotes q WHERE q.prospect_id = p.id) as quotes_count,
        lq.id as lq_id,
        lq.quote_number as lq_quote_number,
        lq.products_description as lq_products_description,
        lq.implementation_fee as lq_implementation_fee,
        lq.license_fee as lq_license_fee,
        lq.monthly_fee as lq_monthly_fee,
        lq.currency as lq_currency,
        lq.validity_date as lq_validity_date,
        lq.status as lq_status,
        lq.file_url as lq_file_url
      FROM prospects p
      LEFT JOIN users u ON p.assigned_to = u.id
      LEFT JOIN LATERAL (
        SELECT * FROM prospect_quotes WHERE prospect_id = p.id ORDER BY created_at DESC LIMIT 1
      ) lq ON true
      ${where}
      ORDER BY p.updated_at DESC
      LIMIT $${idx++} OFFSET $${idx}
    `, params);

    res.json({ success: true, data: result.rows.map(r => mapProspect(r)), total });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error al obtener prospectos: ${err.message}` });
  }
};

export const getProspect = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [pRes, qRes] = await Promise.all([
      query(`SELECT p.*, u.first_name as assigned_first, u.last_name as assigned_last
             FROM prospects p LEFT JOIN users u ON p.assigned_to = u.id WHERE p.id = $1`, [id]),
      query('SELECT * FROM prospect_quotes WHERE prospect_id = $1 ORDER BY created_at DESC', [id]),
    ]);
    if (!pRes.rowCount) { res.status(404).json({ success: false, message: 'Prospecto no encontrado' }); return; }
    res.json({ success: true, data: mapProspect(pRes.rows[0], qRes.rows) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
};

export const createProspect = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, contactName, email, phone, source, status, assignedTo, notes, quote } = req.body;

    const pRes = await query(
      `INSERT INTO prospects (name, contact_name, email, phone, source, status, assigned_to, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, contactName || null, email || null, phone || null,
       source || 'directo', status || 'nuevo', assignedTo || null, notes || null, req.user?.userId]
    );
    const prospect = pRes.rows[0];

    let quotes: any[] = [];
    if (quote && (quote.productsDescription || quote.implementationFee || quote.licenseFee || quote.monthlyFee)) {
      const qRes = await query(
        `INSERT INTO prospect_quotes (prospect_id, quote_number, products_description, implementation_fee, license_fee, monthly_fee, currency, exchange_rate, validity_date, status, notes, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [prospect.id, quote.quoteNumber || null, quote.productsDescription || null,
         quote.implementationFee || 0, quote.licenseFee || 0, quote.monthlyFee || 0,
         quote.currency || 'MXN', quote.exchangeRate || 1, quote.validityDate || null,
         quote.status || 'borrador', quote.notes || null, req.user?.userId]
      );
      quotes = [mapQuote(qRes.rows[0])];
      // Auto-avanzar estado a 'cotizado' si aplica
      if (['nuevo', 'contactado'].includes(prospect.status)) {
        await query(`UPDATE prospects SET status='cotizado', updated_at=NOW() WHERE id=$1`, [prospect.id]);
        prospect.status = 'cotizado';
      }
    }

    res.status(201).json({ success: true, data: { ...mapProspect(prospect), quotes } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error al crear prospecto: ${err.message}` });
  }
};

export const updateProspect = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, contactName, email, phone, source, status, assignedTo, notes } = req.body;

    const result = await query(
      `UPDATE prospects SET name=$1, contact_name=$2, email=$3, phone=$4, source=$5, status=$6, assigned_to=$7, notes=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [name, contactName || null, email || null, phone || null,
       source || 'directo', status, assignedTo || null, notes || null, id]
    );

    if (!result.rowCount) { res.status(404).json({ success: false, message: 'Prospecto no encontrado' }); return; }
    res.json({ success: true, data: mapProspect(result.rows[0]) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
};

export const deleteProspect = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM prospects WHERE id=$1 RETURNING id', [id]);
    if (!result.rowCount) { res.status(404).json({ success: false, message: 'Prospecto no encontrado' }); return; }
    res.json({ success: true, message: 'Prospecto eliminado' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
};

export const addQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quoteNumber, productsDescription, implementationFee, licenseFee, monthlyFee, currency, exchangeRate, validityDate, status, notes, fileUrl } = req.body;

    const result = await query(
      `INSERT INTO prospect_quotes (prospect_id, quote_number, products_description, implementation_fee, license_fee, monthly_fee, currency, exchange_rate, validity_date, status, notes, file_url, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [id, quoteNumber || null, productsDescription || null,
       implementationFee || 0, licenseFee || 0, monthlyFee || 0,
       currency || 'MXN', exchangeRate || 1, validityDate || null,
       status || 'borrador', notes || null, fileUrl || null, req.user?.userId]
    );

    await query(`UPDATE prospects SET status='cotizado', updated_at=NOW() WHERE id=$1 AND status IN ('nuevo','contactado')`, [id]);

    res.status(201).json({ success: true, data: mapQuote(result.rows[0]) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
};

export const updateQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, qid } = req.params;
    const { quoteNumber, productsDescription, implementationFee, licenseFee, monthlyFee, currency, exchangeRate, validityDate, status, notes, fileUrl } = req.body;

    const result = await query(
      `UPDATE prospect_quotes SET quote_number=$1, products_description=$2, implementation_fee=$3, license_fee=$4, monthly_fee=$5, currency=$6, exchange_rate=$7, validity_date=$8, status=$9, notes=$10, file_url=$11, updated_at=NOW()
       WHERE id=$12 AND prospect_id=$13 RETURNING *`,
      [quoteNumber || null, productsDescription || null,
       implementationFee || 0, licenseFee || 0, monthlyFee || 0,
       currency || 'MXN', exchangeRate || 1, validityDate || null,
       status, notes || null, fileUrl !== undefined ? fileUrl : null, qid, id]
    );

    if (!result.rowCount) { res.status(404).json({ success: false, message: 'Cotización no encontrada' }); return; }
    res.json({ success: true, data: mapQuote(result.rows[0]) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
};

export const deleteQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, qid } = req.params;
    const result = await query('DELETE FROM prospect_quotes WHERE id=$1 AND prospect_id=$2 RETURNING id', [qid, id]);
    if (!result.rowCount) { res.status(404).json({ success: false, message: 'Cotización no encontrada' }); return; }
    res.json({ success: true, message: 'Cotización eliminada' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
};
