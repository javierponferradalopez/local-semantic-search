// The query sets that siglip-floor.mjs and siglip-calib.mjs share.
//
// `present` queries name something that the 16 images of fetch-images.sh
// really contain. `absent` queries name a subject that no image contains.
// `noise` is not language at all.
//
// Each subject appears four times: English caption, Spanish caption,
// English bare noun, Spanish bare noun. That is how the report measures
// whether one number survives a change of language or of phrasing.

export const PRESENT = [
  { en: 'a photo of two cats', es: 'una foto de dos gatos', enBare: 'cats', esBare: 'gatos' },
  { en: 'a photo of a brown bear', es: 'una foto de un oso pardo', enBare: 'bear', esBare: 'oso' },
  { en: 'a photo of a bedroom', es: 'una foto de un dormitorio', enBare: 'bedroom', esBare: 'dormitorio' },
  { en: 'a photo of a stop sign', es: 'una foto de una señal de stop', enBare: 'stop sign', esBare: 'señal de stop' },
  { en: 'a photo of teddy bears', es: 'una foto de ositos de peluche', enBare: 'teddy bears', esBare: 'ositos de peluche' },
  { en: 'a photo of a person who skis', es: 'una foto de una persona esquiando', enBare: 'skiing', esBare: 'esquí' },
  { en: 'a photo of a kitchen', es: 'una foto de una cocina', enBare: 'kitchen', esBare: 'cocina' },
  { en: 'a photo of a baseball game', es: 'una foto de un partido de béisbol', enBare: 'baseball', esBare: 'béisbol' },
  { en: 'a photo of a man who plays tennis', es: 'una foto de un hombre jugando al tenis', enBare: 'tennis', esBare: 'tenis' },
  { en: 'a photo of a woman with a mobile telephone', es: 'una foto de una mujer con un teléfono móvil', enBare: 'mobile telephone', esBare: 'teléfono móvil' },
  { en: 'a photo of a computer on a desk', es: 'una foto de un ordenador en un escritorio', enBare: 'computer', esBare: 'ordenador' },
  { en: 'a photo of a man on a paddleboard', es: 'una foto de un hombre en una tabla de paddle surf', enBare: 'paddleboard', esBare: 'paddle surf' },
];

export const ABSENT = [
  { en: 'a photo of a giraffe', es: 'una foto de una jirafa', enBare: 'giraffe', esBare: 'jirafa' },
  { en: 'a photo of an aeroplane that takes off', es: 'una foto de un avión despegando', enBare: 'aeroplane', esBare: 'avión' },
  { en: 'a photo of a chessboard', es: 'una foto de un tablero de ajedrez', enBare: 'chess', esBare: 'ajedrez' },
  { en: 'a photo of a violin', es: 'una foto de un violín', enBare: 'violin', esBare: 'violín' },
  { en: 'a photo of a volcano that erupts', es: 'una foto de un volcán en erupción', enBare: 'volcano', esBare: 'volcán' },
  { en: 'a photo of a submarine under the sea', es: 'una foto de un submarino bajo el mar', enBare: 'submarine', esBare: 'submarino' },
  { en: 'a photo of a wedding cake', es: 'una foto de una tarta de boda', enBare: 'wedding cake', esBare: 'tarta de boda' },
  { en: 'a photo of a microscope in a laboratory', es: 'una foto de un microscopio en un laboratorio', enBare: 'microscope', esBare: 'microscopio' },
];

export const NOISE = [
  'asdfghjkl',
  'qwertyuiop zxcvbnm',
  'xkcd blorp fnord',
  'lorem ipsum dolor sit amet',
  '#### ???? ####',
];

// Flatten into (bucket, variant, text) rows.
export function rows() {
  const out = [];
  for (const [bucket, set] of [['present', PRESENT], ['absent', ABSENT]]) {
    for (const q of set) {
      out.push({ bucket, variant: 'en-caption', text: q.en });
      out.push({ bucket, variant: 'es-caption', text: q.es });
      out.push({ bucket, variant: 'en-bare', text: q.enBare });
      out.push({ bucket, variant: 'es-bare', text: q.esBare });
    }
  }
  for (const n of NOISE) out.push({ bucket: 'noise', variant: 'noise', text: n });
  return out;
}
