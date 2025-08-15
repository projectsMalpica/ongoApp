import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare global {
  interface Window { WidgetCheckout: any; }
}

@Injectable({ providedIn: 'root' })
export class WompiService {
  private scriptLoaded = false;
  private scriptLoading?: Promise<void>;

  /** Carga el script si hace falta (útil si no lo pusiste en index.html) */
  private ensureScript(): Promise<void> {
    if (this.scriptLoaded) return Promise.resolve();
    if (this.scriptLoading) return this.scriptLoading;

    this.scriptLoading = new Promise<void>((resolve, reject) => {
      if (window.WidgetCheckout) {
        this.scriptLoaded = true; resolve(); return;
      }
      const s = document.createElement('script');
      s.src = 'https://checkout.wompi.co/widget.js';
      s.async = true;
      s.onload = () => { this.scriptLoaded = true; resolve(); };
      s.onerror = () => reject(new Error('No se pudo cargar widget.js de Wompi'));
      document.head.appendChild(s);
    });

    return this.scriptLoading;
  }

  /**
   * Abre el widget de Wompi y resuelve con la transacción que devuelve el callback.
   * Solo necesitas la llave pública.
   */
  async openCheckout(options: {
    amountInCents: number;
    reference: string;
    currency?: 'COP';
    redirectUrl?: string;
    customerEmail?: string;
    publicKey?: string; // si no se pasa, usa la del environment
  }): Promise<any> {
    await this.ensureScript();

    const checkout = new window.WidgetCheckout({
      currency: options.currency ?? 'COP',
      amountInCents: options.amountInCents,
      reference: options.reference,
      publicKey: options.publicKey ?? environment.WOMPI_PUBLIC_KEY,
      redirectUrl: options.redirectUrl,              // opcional
      // Puedes añadir customerData/shippingAddress si quieres
      // customerData: { email: options.customerEmail }
    });

    return new Promise((resolve) => {
      checkout.open((result: any) => resolve(result)); // result.transaction.id, status, etc.
    });
  }
}
