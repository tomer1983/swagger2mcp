/**
 * Toast system - upgraded to Sonner for better UX
 * Sonner provides: promise-based toasts, better animations, swipe to dismiss
 */
import { Toaster, toast as sonnerToast } from 'sonner';
import type { ExternalToast } from 'sonner';

/**
 * Toast container - add this once in your app root
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <Toaster
                theme="dark"
                position="top-right"
                toastOptions={{
                    style: {
                        background: 'hsl(217.2 32.6% 17.5%)',
                        border: '1px solid hsl(217.2 32.6% 25%)',
                        color: 'hsl(210 40% 98%)',
                    },
                    className: 'font-sans',
                }}
                richColors
                closeButton
                duration={4000}
            />
        </>
    );
}

/**
 * Toast hook - provides typed toast methods
 */
export function useToast() {
    return {
        success: (title: string, description?: string) => {
            sonnerToast.success(title, { description });
        },
        error: (title: string, description?: string) => {
            sonnerToast.error(title, { description });
        },
        warning: (title: string, description?: string) => {
            sonnerToast.warning(title, { description });
        },
        info: (title: string, description?: string) => {
            sonnerToast.info(title, { description });
        },
        /**
         * Promise-based toast - shows loading, then success/error
         * @example
         * toast.promise(fetchData(), {
         *   loading: 'Loading...',
         *   success: 'Data loaded!',
         *   error: 'Failed to load'
         * })
         */
        promise: <T,>(
            promise: Promise<T>,
            options: {
                loading: string;
                success: string | ((data: T) => string);
                error: string | ((error: Error) => string);
            }
        ) => {
            return sonnerToast.promise(promise, options);
        },
        /**
         * Dismissable toast with custom content
         */
        custom: (title: string, options?: ExternalToast) => {
            sonnerToast(title, options);
        },
        dismiss: (toastId?: string | number) => {
            sonnerToast.dismiss(toastId);
        },
    };
}

// Re-export toast directly for non-hook usage
export { sonnerToast as toast };
