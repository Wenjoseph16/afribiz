import { Router } from 'express';
import {
  listMenuItems, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem,
  toggleMenuItemActive, updateMenuItemStatus, getMenuItemStats,
  listCategories, createCategory, updateCategory, deleteCategory,
  listOrders, getOrder, createOrder, updateOrderStatus, getOrderStats,
  listTables, createTable, updateTable, deleteTable, updateTableStatus,
  listIngredients, createIngredient, updateIngredient, deleteIngredient, adjustStock, getIngredientStats,
  getQrMenuInfo,
} from '../controllers/menu';
import { validateBody } from '../middlewares/validators';
import {
  createMenuItemSchema, updateMenuItemSchema, updateMenuItemStatusSchema,
  createCategorySchema, updateCategorySchema,
  createOrderSchema, updateOrderStatusSchema,
  createTableSchema, updateTableSchema, updateTableStatusSchema,
  createIngredientSchema, updateIngredientSchema, adjustStockSchema,
} from '../validators/menu';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['BUSINESS', 'ADMIN']));

// Menu Items
router.get('/stats', getMenuItemStats);
router.get('/items', listMenuItems);
router.post('/items', validateBody(createMenuItemSchema), createMenuItem);
router.get('/items/:id', getMenuItem);
router.put('/items/:id', validateBody(updateMenuItemSchema), updateMenuItem);
router.delete('/items/:id', deleteMenuItem);
router.patch('/items/:id/toggle', toggleMenuItemActive);
router.patch('/items/:id/status', validateBody(updateMenuItemStatusSchema), updateMenuItemStatus);

// Categories
router.get('/categories', listCategories);
router.post('/categories', validateBody(createCategorySchema), createCategory);
router.put('/categories/:id', validateBody(updateCategorySchema), updateCategory);
router.delete('/categories/:id', deleteCategory);

// Orders
router.get('/orders/stats', getOrderStats);
router.get('/orders', listOrders);
router.post('/orders', validateBody(createOrderSchema), createOrder);
router.get('/orders/:id', getOrder);
router.patch('/orders/:id/status', validateBody(updateOrderStatusSchema), updateOrderStatus);

// Tables
router.get('/tables', listTables);
router.post('/tables', validateBody(createTableSchema), createTable);
router.put('/tables/:id', validateBody(updateTableSchema), updateTable);
router.delete('/tables/:id', deleteTable);
router.patch('/tables/:id/status', validateBody(updateTableStatusSchema), updateTableStatus);

// Ingredients & Stock
router.get('/ingredients/stats', getIngredientStats);
router.get('/ingredients', listIngredients);
router.post('/ingredients', validateBody(createIngredientSchema), createIngredient);
router.put('/ingredients/:id', validateBody(updateIngredientSchema), updateIngredient);
router.delete('/ingredients/:id', deleteIngredient);
router.post('/ingredients/:id/stock', validateBody(adjustStockSchema), adjustStock);

// QR Menu
router.get('/qr-menu', getQrMenuInfo);

export default router;
