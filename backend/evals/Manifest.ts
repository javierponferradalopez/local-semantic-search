// Dev tunes and test judges. The split does not change after the baseline.
export type Split = 'dev' | 'test';

export type Language = 'es' | 'en';

export type Manifest = {
  subjects: Readonly<Record<string, Split>>;
  resources: Readonly<Record<string, {subject: string; language: Language}>>;
};

export const MANIFEST: Manifest = {
  subjects: {
    lentils: 'dev',
    'bicycle-care': 'dev',
    'trip-to-lisbon': 'test',
    'house-plants': 'dev',
    sourdough: 'test',
    'home-network': 'dev',
    'half-marathon': 'dev',
    'rental-contract': 'dev',
    'knee-injury': 'test',
    'kitchen-renovation': 'dev',
    'marine-life': 'test',
    'server-requests': 'dev'
  },
  resources: {
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
  }
};
