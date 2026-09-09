import * as React from 'react';
import { cn } from '../../lib/utils';

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        className={cn('inline-block animate-spin rounded-full border-gray-300 border-t-primary-600', sizeClasses[size], className)}
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
Loading.displayName = 'Loading';

export { Loading };
