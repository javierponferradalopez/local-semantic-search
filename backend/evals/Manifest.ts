// You tune on the tuning split, and the holdout split judges.
// The split does not change after the baseline.
export type Split = 'tuning' | 'holdout';

export type Language = 'es' | 'en';

export type Manifest = {
  subjects: Readonly<Record<string, Split>>;
  texts: Readonly<Record<string, {subject: string; language: Language}>>;
  // A picture has no language.
  images: Readonly<Record<string, {subject: string}>>;
};

export const MANIFEST: Manifest = {
  subjects: {
    lentils: 'tuning',
    'bicycle-care': 'tuning',
    'trip-to-lisbon': 'holdout',
    'house-plants': 'tuning',
    sourdough: 'holdout',
    'home-network': 'tuning',
    'half-marathon': 'tuning',
    'rental-contract': 'tuning',
    'knee-injury': 'holdout',
    'kitchen-renovation': 'tuning',
    'marine-life': 'holdout',
    'server-requests': 'tuning',
    'electricity-bill': 'tuning',
    'car-insurance': 'tuning',
    photography: 'tuning',
    'job-interview': 'tuning',
    'vegetable-garden': 'tuning',
    'wedding-planning': 'holdout',
    'moving-house': 'holdout',
    'coffee-brewing': 'holdout',
    pets: 'holdout',
    mountains: 'tuning',
    beach: 'holdout'
  },
  texts: {
    'receta-de-lentejas.md': {subject: 'lentils', language: 'es'},
    'red-lentil-soup-for-the-week.md': {subject: 'lentils', language: 'en'},
    'menu-del-comedor-escolar.pdf': {subject: 'lentils', language: 'es'},
    'chickpea-hummus.md': {subject: 'lentils', language: 'en'},
    'mantenimiento-de-la-bicicleta.md': {subject: 'bicycle-care', language: 'es'},
    'tubeless-tyres-and-pressure.md': {subject: 'bicycle-care', language: 'en'},
    'revision-antes-de-cada-salida.txt': {subject: 'bicycle-care', language: 'es'},
    'factura-del-taller.pdf': {subject: 'bicycle-care', language: 'es'},
    'cycling-to-work.md': {subject: 'bicycle-care', language: 'en'},
    'notas-del-viaje-a-lisboa.txt': {subject: 'trip-to-lisbon', language: 'es'},
    'lisbon-itinerary-for-friends.md': {subject: 'trip-to-lisbon', language: 'en'},
    'reserva-del-piso-en-alfama.pdf': {subject: 'trip-to-lisbon', language: 'es'},
    'portuguese-phrases-for-the-trip.txt': {subject: 'trip-to-lisbon', language: 'en'},
    'gastos-del-viaje-a-lisboa.txt': {subject: 'trip-to-lisbon', language: 'es'},
    'cuidado-de-las-plantas-de-interior.txt': {subject: 'house-plants', language: 'es'},
    'monstera-care-sheet.md': {subject: 'house-plants', language: 'en'},
    'ticket-del-vivero.pdf': {subject: 'house-plants', language: 'es'},
    'cactus-and-succulents.md': {subject: 'house-plants', language: 'en'},
    'sourdough-starter.md': {subject: 'sourdough', language: 'en'},
    'masa-madre-desde-cero.md': {subject: 'sourdough', language: 'es'},
    'pan-de-masa-madre.pdf': {subject: 'sourdough', language: 'es'},
    'flour-types-for-bread.txt': {subject: 'sourdough', language: 'en'},
    'focaccia-con-levadura.md': {subject: 'sourdough', language: 'es'},
    'home-network-setup.txt': {subject: 'home-network', language: 'en'},
    'wifi-para-invitados.txt': {subject: 'home-network', language: 'es'},
    'fibre-router-quick-guide.pdf': {subject: 'home-network', language: 'en'},
    'oferta-de-fibra-y-movil.pdf': {subject: 'home-network', language: 'es'},
    'nas-backup-plan.md': {subject: 'home-network', language: 'en'},
    'entrenamiento-media-maraton.md': {subject: 'half-marathon', language: 'es'},
    'race-day-checklist.md': {subject: 'half-marathon', language: 'en'},
    'inscripcion-media-maraton.pdf': {subject: 'half-marathon', language: 'es'},
    'zapatillas-para-correr.txt': {subject: 'half-marathon', language: 'es'},
    'why-a-marathon-is-42-km.txt': {subject: 'half-marathon', language: 'en'},
    'contrato-de-alquiler.pdf': {subject: 'rental-contract', language: 'es'},
    'anexo-del-contrato-de-alquiler.pdf': {subject: 'rental-contract', language: 'es'},
    'emails-with-the-landlady.txt': {subject: 'rental-contract', language: 'en'},
    'buscar-piso-de-alquiler.md': {subject: 'rental-contract', language: 'es'},
    'inventario-del-piso.pdf': {subject: 'rental-contract', language: 'es'},
    'informe-de-la-rodilla.pdf': {subject: 'knee-injury', language: 'es'},
    'ejercicios-para-la-rodilla.md': {subject: 'knee-injury', language: 'es'},
    'knee-follow-up-notes.txt': {subject: 'knee-injury', language: 'en'},
    'baja-laboral.pdf': {subject: 'knee-injury', language: 'es'},
    'ankle-sprain-first-aid.md': {subject: 'knee-injury', language: 'en'},
    'presupuesto-de-la-cocina.pdf': {subject: 'kitchen-renovation', language: 'es'},
    'segundo-presupuesto-de-la-cocina.pdf': {
      subject: 'kitchen-renovation',
      language: 'es'
    },
    'kitchen-design-decisions.md': {subject: 'kitchen-renovation', language: 'en'},
    'licencia-de-obra-menor.txt': {subject: 'kitchen-renovation', language: 'es'},
    'bathroom-renovation-ideas.md': {subject: 'kitchen-renovation', language: 'en'},
    'guia-de-la-vida-marina.md': {subject: 'marine-life', language: 'es'},
    'patrones-de-peticiones-al-servidor.md': {subject: 'server-requests', language: 'es'}
  },
  images: {
    'atardecer-en-la-playa.jpg': {subject: 'beach'},
    'bicicleta-de-carretera.jpg': {subject: 'bicycle-care'},
    'cocina-moderna.jpg': {subject: 'kitchen-renovation'},
    'corredores-de-maraton.jpg': {subject: 'half-marathon'},
    'golden-retriever-con-un-palo.jpg': {subject: 'pets'},
    'guiso-de-lentejas-con-salchicha.jpg': {subject: 'lentils'},
    'hojas-de-monstera.jpg': {subject: 'house-plants'},
    'montana-nevada.jpg': {subject: 'mountains'},
    'pan-de-masa-madre.jpg': {subject: 'sourdough'},
    'router-wifi.jpg': {subject: 'home-network'},
    'tranvia-en-lisboa.jpg': {subject: 'trip-to-lisbon'}
  }
};
