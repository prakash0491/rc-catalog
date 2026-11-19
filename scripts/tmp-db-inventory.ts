import { prisma as p } from '../src/lib/prisma';

(async () => {
  const [admins, customers, products, categories, orders, payments, carts, wishlist, inquiries, banners, offers, settings] =
    await Promise.all([
      p.admin.count(),
      p.customer.count(),
      p.product.count(),
      p.category.count(),
      p.order.count(),
      p.payment.count(),
      p.cart.count(),
      p.wishlistItem.count(),
      p.inquiry.count(),
      p.banner.count(),
      p.offer.count(),
      p.businessSettings.count(),
    ]);
  const statuses = await p.order.groupBy({ by: ['status'], _count: { _all: true } });
  console.log(JSON.stringify({ admins, customers, products, categories, orders, payments, carts, wishlist, inquiries, banners, offers, settings, orderStatuses: statuses }, null, 2));
})()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => p.$disconnect());
