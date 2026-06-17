import { registerLicense } from '@syncfusion/ej2-base';

export function registerSyncfusionLicense() {
  const licenseKey = import.meta.env.VITE_SYNCFUSION_LICENSE_KEY?.trim();

  if (licenseKey) {
    registerLicense(licenseKey);
  }
}
