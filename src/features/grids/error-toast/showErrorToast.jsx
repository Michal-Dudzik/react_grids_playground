import { toast } from 'react-hot-toast';

export function showErrorToast({ title, message, error, location }) {
  const details = message ?? error?.message ?? 'Unexpected error';
  const locationSuffix = location ? ` (${location})` : '';

  toast.error(`${title ?? 'Error'}: ${details}${locationSuffix}`);
}
