import { Breadcrumb } from '@/components/ui';
import { cn } from '@/lib/utils';

type ProductBreadcrumbProps = {
  productName: string;
  className?: string;
};

export function ProductBreadcrumb({ productName, className }: ProductBreadcrumbProps) {
  return (
    <Breadcrumb
      items={[
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: productName },
      ]}
      className={cn('text-sm', className)}
    />
  );
}
