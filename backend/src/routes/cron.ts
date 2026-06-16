import { Router, Request, Response } from 'express';
import { CronService } from '../services/CronService';

const router = Router();

router.get('/run', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  const querySecret = req.query.secret as string;
  const secret = process.env.CRON_SECRET;
  const validAuth = auth === `Bearer ${secret}`;
  const validQuery = querySecret === secret;
  if (!secret || (!validAuth && !validQuery)) {
    return res.status(401).json({ success: false, error: 'Non autorisé' });
  }

  const task = req.query.task as string;

  try {
    const results: Record<string, string> = {};

    if (task === 'daily') {
      const jobs: [string, () => Promise<void>][] = [
        ['booking-reminders', CronService.checkBookingReminders],
        ['overdue-debts', CronService.checkOverdueDebts],
        ['campaigns', CronService.dispatchCampaigns],
        ['pending-orders', CronService.checkPendingOrders],
        ['abandoned-carts', CronService.checkAbandonedCarts],
        ['inactive-clients', CronService.checkInactiveClients],
        ['subscriptions', CronService.checkExpiringSubscriptions],
        ['trials', CronService.checkExpiringTrials],
        ['rentals', CronService.checkOverdueRentals],
        ['low-stock', CronService.checkLowStock],
        ['cleanup', CronService.cleanup],
      ];
      for (const [name, fn] of jobs) {
        try {
          await fn();
          results[name] = 'ok';
        } catch (e) {
          results[name] = (e as Error).message;
        }
      }
      return res.json({ success: true, task: 'daily', results });
    }

    const taskMap: Record<string, () => Promise<void>> = {
      'booking-reminders': CronService.checkBookingReminders,
      'overdue-debts': CronService.checkOverdueDebts,
      'campaigns': CronService.dispatchCampaigns,
      'pending-orders': CronService.checkPendingOrders,
      'abandoned-carts': CronService.checkAbandonedCarts,
      'inactive-clients': CronService.checkInactiveClients,
      'subscriptions': CronService.checkExpiringSubscriptions,
      'trials': CronService.checkExpiringTrials,
      'rentals': CronService.checkOverdueRentals,
      'low-stock': CronService.checkLowStock,
      'cleanup': CronService.cleanup,
    };

    const fn = taskMap[task];
    if (!fn) {
      return res.status(400).json({ success: false, error: 'Tâche inconnue' });
    }

    await fn();
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
