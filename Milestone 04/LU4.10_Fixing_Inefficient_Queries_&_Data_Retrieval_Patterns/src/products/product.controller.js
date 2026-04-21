import {
  getProducts,
  getProductById,
  MAX_LIMIT,
  PRODUCT_SORTABLE_FIELDS,
  PRODUCT_SELECTABLE_FIELDS,
} from './product.service.js';

export async function listProducts(req, res) {
  try {
    const pageRaw = req.query.page ?? '1';
    const limitRaw = req.query.limit ?? '20';
    const sortBy = req.query.sortBy ?? 'createdAt';
    const orderRaw = req.query.order ?? 'desc';
    const fieldsRaw = req.query.fields;

    const page = Number.parseInt(pageRaw, 10);
    const limit = Number.parseInt(limitRaw, 10);
    const order = String(orderRaw).toLowerCase();

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({ error: 'Invalid page. Must be a positive integer.' });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      return res.status(400).json({
        error: `Invalid limit. Must be a positive integer up to ${MAX_LIMIT}.`,
      });
    }

    if (!PRODUCT_SORTABLE_FIELDS.has(sortBy)) {
      return res.status(400).json({ error: 'Invalid sortBy field.' });
    }

    if (order !== 'asc' && order !== 'desc') {
      return res.status(400).json({ error: "Invalid order. Use 'asc' or 'desc'." });
    }

    const fields = fieldsRaw
      ? String(fieldsRaw)
          .split(',')
          .map((field) => field.trim())
          .filter(Boolean)
      : null;

    if (fields?.length) {
      const invalidFields = fields.filter((field) => !PRODUCT_SELECTABLE_FIELDS.has(field));
      if (invalidFields.length) {
        return res.status(400).json({
          error: `Invalid fields requested: ${invalidFields.join(', ')}`,
        });
      }
    }

    const products = await getProducts({
      page,
      limit,
      sortBy,
      order,
      fields,
    });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getProduct(req, res) {
  try {
    const id = parseInt(req.params.id);
    const product = await getProductById(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}