import type {GoldenCase} from './GoldenCase';

export const IMAGE_GOLDEN_SET: readonly GoldenCase[] = [
  {query: 'un tranvía por una calle empedrada', expected: 'tranvia-en-lisboa.jpg'},
  {query: 'bici aparcada de noche', expected: 'bicicleta-de-carretera.jpg'},
  {query: 'un plato de lentejas', expected: 'guiso-de-lentejas-con-salchicha.jpg'},
  {query: 'planta de hojas grandes con agujeros', expected: 'hojas-de-monstera.jpg'},
  {query: 'hogaza de pan recién horneada', expected: 'pan-de-masa-madre.jpg'},
  {query: 'el router de casa', expected: 'router-wifi.jpg'},
  {
    query: 'gente corriendo una carrera por la ciudad',
    expected: 'corredores-de-maraton.jpg'
  },
  {query: 'un perro mordiendo un palo', expected: 'golden-retriever-con-un-palo.jpg'},
  {query: 'un pico con nieve', expected: 'montana-nevada.jpg'},
  {query: 'puesta de sol en la playa', expected: 'atardecer-en-la-playa.jpg'},
  {query: 'cocina con armarios de madera', expected: 'cocina-moderna.jpg'},
  {query: 'dog chewing a stick', expected: 'golden-retriever-con-un-palo.jpg'},
  {query: 'snowy mountain peak', expected: 'montana-nevada.jpg'},
  {query: 'sourdough loaf on a cutting board', expected: 'pan-de-masa-madre.jpg'},
  {query: 'Lisboa', expected: 'tranvia-en-lisboa.jpg'},
  {query: 'mi mascota', expected: 'golden-retriever-con-un-palo.jpg'},
  {query: 'la conexión a internet', expected: 'router-wifi.jpg'},
  {query: 'entrenar para una media maratón', expected: 'corredores-de-maraton.jpg'},
  {query: 'vacaciones en la sierra', expected: 'montana-nevada.jpg'},
  {query: 'una planta de interior', expected: 'hojas-de-monstera.jpg'},
  {query: 'comida de cuchara', expected: 'guiso-de-lentejas-con-salchicha.jpg'},
  {query: 'where I cook at home', expected: 'cocina-moderna.jpg'},
  {query: 'un gato durmiendo en el sofá', expected: null},
  {query: 'una bicicleta de montaña en el barro', expected: null},
  {query: 'un tren de alta velocidad', expected: null},
  {query: 'coches de Fórmula 1 en un circuito', expected: null},
  {query: 'partitura de piano', expected: null},
  {query: 'a birthday cake with candles', expected: null}
];
