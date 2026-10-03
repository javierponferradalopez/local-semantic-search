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
    pets: 'holdout',
    mountains: 'tuning',
    beach: 'holdout'
  },
  texts: {
    'receta-de-lentejas.md': {subject: 'lentils', language: 'es'},
    'mantenimiento-de-la-bicicleta.md': {subject: 'bicycle-care', language: 'es'},
    'notas-del-viaje-a-lisboa.txt': {subject: 'trip-to-lisbon', language: 'es'},
    'cuidado-de-las-plantas-de-interior.txt': {subject: 'house-plants', language: 'es'},
    'sourdough-starter.md': {subject: 'sourdough', language: 'en'},
    'home-network-setup.txt': {subject: 'home-network', language: 'en'},
    'entrenamiento-media-maraton.md': {subject: 'half-marathon', language: 'es'},
    'contrato-de-alquiler.pdf': {subject: 'rental-contract', language: 'es'},
    'informe-de-la-rodilla.pdf': {subject: 'knee-injury', language: 'es'},
    'presupuesto-de-la-cocina.pdf': {subject: 'kitchen-renovation', language: 'es'},
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
