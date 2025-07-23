import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
// wompi.service.ts
@Injectable({ providedIn: 'root' })
export class WompiService {
  private api = 'http://localhost:3000/api/pago';

  constructor(private http: HttpClient) {}

  iniciarPago(datos: any) {
    return this.http.post<{checkout_url: string}>(this.api, datos);
  }
}
