import { Component, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import PocketBase, { RecordModel } from 'pocketbase';
import { GlobalService } from 'src/app/services/global.service';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
@Component({
  selector: 'app-maps',
  imports: [],
  templateUrl: './maps.component.html',
  styleUrl: './maps.component.css'
})

export class MapsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  private map!: mapboxgl.Map;
  private pb = new PocketBase('https://db.ongomatch.com:8090');
  private markers: Map<string, mapboxgl.Marker> = new Map();
constructor(public global: GlobalService){}
  async ngOnInit() {
    window.addEventListener('resize', () => {
      this.map.resize();
    }); 
  }
  async ngAfterViewInit() {
    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/dark-v11',  // mapa oscuro
      center: [-75.576, 6.244],                  // valor “fallback”
      zoom: 13,
      accessToken: 'pk.eyJ1Ijoib25nb21hdGNoIiwiYSI6ImNtYnNnMDJyeTBrYWQycHB4aHIzYXpybTIifQ.8Wc3ow1OKOUh_fxiXMgTtQ',      // ¡no quemes el token!
      attributionControl:false
    });
  
    /* Control nativo que localiza y sigue al usuario */
    this.map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy:true },
      trackUserLocation:true,
      showUserHeading:true,
    }));
  
    /* Si solo quieres centrar una vez: */
    navigator.geolocation.getCurrentPosition(({coords})=>{
      this.map.setCenter([coords.longitude, coords.latitude]);
    });
    /* this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-75.576, 6.244], // Medellín
      zoom: 13,
      accessToken: 'pk.eyJ1Ijoib25nb21hdGNoIiwiYSI6ImNtYnNnMDJyeTBrYWQycHB4aHIzYXpybTIifQ.8Wc3ow1OKOUh_fxiXMgTtQ',
      attributionControl: false
    }); */

    this.map.addControl(new mapboxgl.NavigationControl());
    this.map.on('load', () => {
      setTimeout(() => this.map.resize(), 300);
    });
    
    await this.cargarLocales();
    this.fitToBounds();
    // Real-time updates
    this.pb.collection('usuariosPartner').subscribe('*', (e) => {
      this.actualizarMarcadores(e.record);
    });

    const geocoder = new MapboxGeocoder({
      accessToken: 'pk.eyJ1Ijoib25nb21hdGNoIiwiYSI6ImNtYnNnMDJyeTBrYWQycHB4aHIzYXpybTIifQ.8Wc3ow1OKOUh_fxiXMgTtQ',
      mapboxgl,
      marker:false,
      placeholder:'Buscar lugar'
    });
  
    /* this.map.addControl(geocoder); */
    geocoder.addTo('#geocoder');

geocoder.on('result', (e)=>{
  const [lng,lat] = e.result.center;
  this.map.flyTo({ center:[lng,lat], zoom:14 });
});
  }

  fitToBounds() {
    const bounds = new mapboxgl.LngLatBounds();
    this.markers.forEach(marker => bounds.extend(marker.getLngLat()));
    this.map.fitBounds(bounds, { padding: 50, maxZoom: 16 });
  }
  
  async cargarLocales() {
    const locales = await this.pb.collection('usuariosPartner').getFullList();

    locales.forEach((local: any) => {
      this.agregarMarcador(local);
    });
  }


      agregarMarcador(local: RecordModel) {
        const lat = parseFloat(local['lat']);
        const lng = parseFloat(local['lng']);
        if (isNaN(lat) || isNaN(lng)) return;
      
        const el = document.createElement('div');
        el.className = 'custom-marker';
      
        const img = document.createElement('img');
        img.src = local['files'][0] || '';
        img.alt = local['venueName'] || 'Local';
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';
        img.style.border = '2px solid white';
        img.style.boxShadow = '0 0 4px rgba(0, 0, 0, 0.5)';
      
        el.appendChild(img);
      
        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div class="popup-content">
              <h3>${local['venueName']}</h3>
              <p>${local['address']}</p>
              <button id="preview-${local.id}" class="btn btn-primary btn-sm mt-2">Ver detalle</button>
            </div>
          `))
          .addTo(this.map);
      
        this.markers.set(local.id, marker);
      
        // Agrega el event listener al botón cuando se abre el popup
        marker.getPopup()?.on('open', () => {
          setTimeout(() => {
            const btn = document.getElementById(`preview-${local.id}`);
            if (btn) {
              btn.addEventListener('click', () => {
                this.global.previewPartner(local);
              });
            }
          }, 0);
        });
      }
  actualizarMarcadores(local: RecordModel) {
    const lat = parseFloat(local['lat']);
    const lng = parseFloat(local['lng']);
    const existingMarker = this.markers.get(local.id);

    if (existingMarker) {
      existingMarker.setLngLat([lng, lat]);
    } else {
      this.agregarMarcador(local);
    }
  }

  ngOnDestroy() {
    this.pb.collection('usuariosPartner').unsubscribe('*');
    this.map.remove();
  }
  
}
