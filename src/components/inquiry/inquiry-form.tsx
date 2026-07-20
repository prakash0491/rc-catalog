import * as React from 'react';

import { cn } from '@/lib/utils';

type InquiryFormProps = React.FormHTMLAttributes<HTMLFormElement> & {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  fields: React.ReactNode;
};

export function InquiryForm({ header, footer, fields, children, className, ...props }: InquiryFormProps) {
  return (
    <form className={cn('space-y-6', className)} {...props}>
      {header ? <div>{header}</div> : null}
      <div className="space-y-4">{fields}</div>
      {children}
      {footer ? <div>{footer}</div> : null}
    </form>
  );
}
