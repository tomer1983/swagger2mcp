import { Toaster as SonnerToaster } from 'sonner';

export type { ToastT } from 'sonner';

interface ToasterProps {
  position?: React.ComponentProps<typeof SonnerToaster>['position'];
  closeButton?: boolean;
  richColors?: boolean;
  expand?: boolean;
}

export function Toaster({ position = 'top-right', closeButton = true, richColors = true, expand = false }: ToasterProps) {
  return (
    <SonnerToaster
      position={position}
      closeButton={closeButton}
      richColors={richColors}
      expand={expand}
      toastOptions={{
        classNames: {
          toast: 'border border-border bg-background text-foreground shadow-md',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
        },
      }}
    />
  );
}
