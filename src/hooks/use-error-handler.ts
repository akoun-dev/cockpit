'use client';

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorHandlerOptions {
  /** Optional state setter to also update error state */
  setError?: (error: string | null) => void;
}

/**
 * Shared error handling hook that standardizes toast notifications.
 *
 * @example
 * const { handleError, handleSuccess } = useErrorHandler({ setError });
 *
 * try {
 *   const res = await fetch('/api/...');
 *   if (!res.ok) throw new Error('Failed');
 * } catch (e) {
 *   handleError('le chargement des données', e);
 * }
 */
export function useErrorHandler(options?: ErrorHandlerOptions) {
  const { toast } = useToast();
  const setError = options?.setError;

  const handleError = useCallback(
    (context: string, error?: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Une erreur inattendue est survenue';

      // Log to console for debugging (dev only)
      if (process.env.NODE_ENV === 'development') {
        console.error(`[ErrorHandler] ${context}:`, error);
      }

      toast({
        title: 'Erreur',
        description: `Échec de ${context}. ${message}`,
        variant: 'destructive',
      });

      if (setError) {
        setError(`Erreur lors de ${context}`);
      }
    },
    [toast, setError],
  );

  const handleNetworkError = useCallback(
    (context: string) => {
      toast({
        title: 'Erreur réseau',
        description: `Impossible de contacter le serveur pour ${context}. Vérifiez votre connexion.`,
        variant: 'destructive',
      });

      if (setError) {
        setError('Erreur réseau');
      }
    },
    [toast, setError],
  );

  const handleApiError = useCallback(
    async (context: string, response: Response) => {
      let message = 'Erreur serveur';

      try {
        const data = await response.json();
        message = (data as { error?: string }).error || message;
      } catch {
        // ignore parse errors
      }

      toast({
        title: 'Erreur',
        description: `${message} (${context})`,
        variant: 'destructive',
      });

      if (setError) {
        setError(message);
      }
    },
    [toast, setError],
  );

  const handleSuccess = useCallback(
    (title: string, description?: string) => {
      toast({
        title,
        description,
      });
    },
    [toast],
  );

  return { handleError, handleNetworkError, handleApiError, handleSuccess };
}
