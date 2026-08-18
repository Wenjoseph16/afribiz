import { createRouter } from '../middlewares/createRouter';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  toggleProductActive,
  updateStock,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getStockAlerts,
  getProductStats,
  exportProducts,
  importProducts,
  bulkDeleteProducts,
  bulkToggleActive,
  bulkUpdateStock,
  lookupBarcode,
} from '../controllers/product';
import { validateBody } from '../middlewares/validators';
import {
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  updateStockSchema,
} from '../validators/product';

const router = createRouter({ requireAuth: true, permissions: ['VIEW_ORDERS'] });

router.get('/', listProducts);
router.get('/stats', getProductStats);
router.get('/alerts', getStockAlerts);
router.get('/export', exportProducts);
router.get('/barcode/:code', lookupBarcode);
router.post('/import', importProducts);
router.post('/bulk/delete', bulkDeleteProducts);
router.patch('/bulk/toggle', bulkToggleActive);
router.patch('/bulk/stock', bulkUpdateStock);
router.get('/categories', listCategories);
router.post('/categories', validateBody(createCategorySchema), createCategory);
router.put('/categories/:id', validateBody(updateCategorySchema), updateCategory);
router.delete('/categories/:id', deleteCategory);
router.get('/:id', getProduct);
router.post('/', validateBody(createProductSchema), createProduct);
router.put('/:id', validateBody(updateProductSchema), updateProduct);
router.delete('/:id', deleteProduct);
router.post('/:id/duplicate', duplicateProduct);
router.patch('/:id/toggle', toggleProductActive);
router.patch('/:id/stock', validateBody(updateStockSchema), updateStock);

export default router;
