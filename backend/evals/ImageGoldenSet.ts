import type {GoldenQuery} from './GoldenQuery';

export const IMAGE_GOLDEN_SET: readonly GoldenQuery[] = [
  {
    query: 'puesta de sol en la playa',
    language: 'es',
    subject: 'beach',
    answers: ['atardecer-en-la-orilla.jpg'],
    near: ['castillo-de-arena.jpg', 'sombrilla-y-sillas.jpg', 'surfista-en-una-ola.jpg']
  },
  {
    query: 'sunset over the sea',
    language: 'en',
    subject: 'beach',
    answers: ['atardecer-en-la-orilla.jpg'],
    near: ['castillo-de-arena.jpg', 'sombrilla-y-sillas.jpg', 'surfista-en-una-ola.jpg']
  },
  {
    query: 'una sombrilla de colores',
    language: 'es',
    subject: 'beach',
    answers: ['sombrilla-y-sillas.jpg'],
    near: [
      'atardecer-en-la-orilla.jpg',
      'castillo-de-arena.jpg',
      'surfista-en-una-ola.jpg'
    ]
  },
  {
    query: 'sillas de playa',
    language: 'es',
    subject: 'beach',
    answers: ['sombrilla-y-sillas.jpg'],
    near: [
      'atardecer-en-la-orilla.jpg',
      'castillo-de-arena.jpg',
      'surfista-en-una-ola.jpg'
    ]
  },
  {
    query: 'castillo de arena',
    language: 'es',
    subject: 'beach',
    answers: ['castillo-de-arena.jpg'],
    near: [
      'atardecer-en-la-orilla.jpg',
      'sombrilla-y-sillas.jpg',
      'surfista-en-una-ola.jpg'
    ]
  },
  {
    query: 'gente en la playa',
    language: 'es',
    subject: 'beach',
    answers: ['atardecer-en-la-orilla.jpg', 'castillo-de-arena.jpg'],
    near: ['sombrilla-y-sillas.jpg', 'surfista-en-una-ola.jpg']
  },
  {
    query: 'un día de playa',
    language: 'es',
    subject: 'beach',
    answers: [
      'sombrilla-y-sillas.jpg',
      'castillo-de-arena.jpg',
      'atardecer-en-la-orilla.jpg'
    ],
    near: ['surfista-en-una-ola.jpg']
  },
  {
    query: 'a day at the beach',
    language: 'en',
    subject: 'beach',
    answers: [
      'sombrilla-y-sillas.jpg',
      'castillo-de-arena.jpg',
      'atardecer-en-la-orilla.jpg'
    ],
    near: ['surfista-en-una-ola.jpg']
  },
  {
    query: 'una ola enorme',
    language: 'es',
    subject: 'beach',
    answers: ['surfista-en-una-ola.jpg'],
    near: [
      'atardecer-en-la-orilla.jpg',
      'castillo-de-arena.jpg',
      'sombrilla-y-sillas.jpg'
    ]
  },
  {
    query: 'surfing a wave',
    language: 'en',
    subject: 'beach',
    answers: ['surfista-en-una-ola.jpg'],
    near: [
      'atardecer-en-la-orilla.jpg',
      'castillo-de-arena.jpg',
      'sombrilla-y-sillas.jpg'
    ]
  },
  {
    query: 'una bici de carretera',
    language: 'es',
    subject: 'bicycle-care',
    answers: ['bici-de-carretera-contra-una-pared.jpg'],
    near: [
      'cadena-y-pinones.jpg',
      'en-bici-bajo-la-lluvia-con-paraguas.jpg',
      'reparar-la-bici-en-el-taller.jpg'
    ]
  },
  {
    query: 'road bike leaning on a wall',
    language: 'en',
    subject: 'bicycle-care',
    answers: ['bici-de-carretera-contra-una-pared.jpg'],
    near: [
      'cadena-y-pinones.jpg',
      'en-bici-bajo-la-lluvia-con-paraguas.jpg',
      'reparar-la-bici-en-el-taller.jpg'
    ]
  },
  {
    query: 'la cadena de la bici',
    language: 'es',
    subject: 'bicycle-care',
    answers: ['cadena-y-pinones.jpg'],
    near: [
      'bici-de-carretera-contra-una-pared.jpg',
      'en-bici-bajo-la-lluvia-con-paraguas.jpg',
      'reparar-la-bici-en-el-taller.jpg'
    ]
  },
  {
    query: 'el taller de bicis',
    language: 'es',
    subject: 'bicycle-care',
    answers: ['reparar-la-bici-en-el-taller.jpg'],
    near: [
      'bici-de-carretera-contra-una-pared.jpg',
      'cadena-y-pinones.jpg',
      'en-bici-bajo-la-lluvia-con-paraguas.jpg'
    ]
  },
  {
    query: 'mantenimiento de la bicicleta',
    language: 'es',
    subject: 'bicycle-care',
    answers: ['cadena-y-pinones.jpg', 'reparar-la-bici-en-el-taller.jpg'],
    near: [
      'bici-de-carretera-contra-una-pared.jpg',
      'en-bici-bajo-la-lluvia-con-paraguas.jpg'
    ]
  },
  {
    query: 'fixing a bike',
    language: 'en',
    subject: 'bicycle-care',
    answers: ['reparar-la-bici-en-el-taller.jpg'],
    near: [
      'bici-de-carretera-contra-una-pared.jpg',
      'cadena-y-pinones.jpg',
      'en-bici-bajo-la-lluvia-con-paraguas.jpg'
    ]
  },
  {
    query: 'ir en bici bajo la lluvia',
    language: 'es',
    subject: 'bicycle-care',
    answers: ['en-bici-bajo-la-lluvia-con-paraguas.jpg'],
    near: [
      'bici-de-carretera-contra-una-pared.jpg',
      'cadena-y-pinones.jpg',
      'reparar-la-bici-en-el-taller.jpg'
    ]
  },
  {
    query: 'cycling in the rain with an umbrella',
    language: 'en',
    subject: 'bicycle-care',
    answers: ['en-bici-bajo-la-lluvia-con-paraguas.jpg'],
    near: [
      'bici-de-carretera-contra-una-pared.jpg',
      'cadena-y-pinones.jpg',
      'reparar-la-bici-en-el-taller.jpg'
    ]
  },
  {
    query: 'una bicicleta',
    language: 'es',
    subject: 'bicycle-care',
    answers: [
      'bici-de-carretera-contra-una-pared.jpg',
      'reparar-la-bici-en-el-taller.jpg',
      'en-bici-bajo-la-lluvia-con-paraguas.jpg'
    ],
    near: ['cadena-y-pinones.jpg']
  },
  {
    query: 'un atleta en una carrera con público',
    language: 'es',
    subject: 'half-marathon',
    answers: ['carrera-popular-por-la-ciudad.jpg'],
    near: [
      'estiramientos-en-el-parque.jpg',
      'medalla-de-finisher.jpg',
      'zapatillas-de-correr.jpg'
    ]
  },
  {
    query: 'an athlete in a race in London',
    language: 'en',
    subject: 'half-marathon',
    answers: ['carrera-popular-por-la-ciudad.jpg'],
    near: [
      'estiramientos-en-el-parque.jpg',
      'medalla-de-finisher.jpg',
      'zapatillas-de-correr.jpg'
    ]
  },
  {
    query: 'zapatillas para correr',
    language: 'es',
    subject: 'half-marathon',
    answers: ['zapatillas-de-correr.jpg'],
    near: [
      'carrera-popular-por-la-ciudad.jpg',
      'estiramientos-en-el-parque.jpg',
      'medalla-de-finisher.jpg'
    ]
  },
  {
    query: 'running shoes',
    language: 'en',
    subject: 'half-marathon',
    answers: ['zapatillas-de-correr.jpg'],
    near: [
      'carrera-popular-por-la-ciudad.jpg',
      'estiramientos-en-el-parque.jpg',
      'medalla-de-finisher.jpg'
    ]
  },
  {
    query: 'la medalla de la carrera',
    language: 'es',
    subject: 'half-marathon',
    answers: ['medalla-de-finisher.jpg'],
    near: [
      'carrera-popular-por-la-ciudad.jpg',
      'estiramientos-en-el-parque.jpg',
      'zapatillas-de-correr.jpg'
    ]
  },
  {
    query: 'estirar después de correr',
    language: 'es',
    subject: 'half-marathon',
    answers: ['estiramientos-en-el-parque.jpg'],
    near: [
      'carrera-popular-por-la-ciudad.jpg',
      'medalla-de-finisher.jpg',
      'zapatillas-de-correr.jpg'
    ]
  },
  {
    query: 'entrenar para una media maratón',
    language: 'es',
    subject: 'half-marathon',
    answers: ['estiramientos-en-el-parque.jpg', 'zapatillas-de-correr.jpg'],
    near: ['carrera-popular-por-la-ciudad.jpg', 'medalla-de-finisher.jpg']
  },
  {
    query: 'race day',
    language: 'en',
    subject: 'half-marathon',
    answers: ['carrera-popular-por-la-ciudad.jpg', 'medalla-de-finisher.jpg'],
    near: ['estiramientos-en-el-parque.jpg', 'zapatillas-de-correr.jpg']
  },
  {
    query: 'planta de hojas grandes con agujeros',
    language: 'es',
    subject: 'house-plants',
    answers: ['monstera-en-una-maceta.jpg'],
    near: [
      'cactus-en-macetas-de-barro.jpg',
      'potus-en-la-ventana.jpg',
      'trasplantar-una-planta.jpg'
    ]
  },
  {
    query: 'una planta de interior',
    language: 'es',
    subject: 'house-plants',
    answers: ['monstera-en-una-maceta.jpg', 'potus-en-la-ventana.jpg'],
    near: ['cactus-en-macetas-de-barro.jpg', 'trasplantar-una-planta.jpg']
  },
  {
    query: 'leafy green plants indoors',
    language: 'en',
    subject: 'house-plants',
    answers: ['monstera-en-una-maceta.jpg', 'potus-en-la-ventana.jpg'],
    near: ['cactus-en-macetas-de-barro.jpg', 'trasplantar-una-planta.jpg']
  },
  {
    query: 'cactus en macetas',
    language: 'es',
    subject: 'house-plants',
    answers: ['cactus-en-macetas-de-barro.jpg'],
    near: [
      'potus-en-la-ventana.jpg',
      'monstera-en-una-maceta.jpg',
      'trasplantar-una-planta.jpg'
    ]
  },
  {
    query: 'succulents in terracotta pots',
    language: 'en',
    subject: 'house-plants',
    answers: ['cactus-en-macetas-de-barro.jpg'],
    near: [
      'potus-en-la-ventana.jpg',
      'monstera-en-una-maceta.jpg',
      'trasplantar-una-planta.jpg'
    ]
  },
  {
    query: 'cambiar una planta de maceta',
    language: 'es',
    subject: 'house-plants',
    answers: ['trasplantar-una-planta.jpg'],
    near: [
      'cactus-en-macetas-de-barro.jpg',
      'potus-en-la-ventana.jpg',
      'monstera-en-una-maceta.jpg'
    ]
  },
  {
    query: 'raíces y tierra',
    language: 'es',
    subject: 'house-plants',
    answers: ['trasplantar-una-planta.jpg'],
    near: [
      'cactus-en-macetas-de-barro.jpg',
      'potus-en-la-ventana.jpg',
      'monstera-en-una-maceta.jpg'
    ]
  },
  {
    query: 'una planta colgante en la ventana',
    language: 'es',
    subject: 'house-plants',
    answers: ['potus-en-la-ventana.jpg'],
    near: [
      'cactus-en-macetas-de-barro.jpg',
      'monstera-en-una-maceta.jpg',
      'trasplantar-una-planta.jpg'
    ]
  },
  {
    query: 'cocina con armarios de madera',
    language: 'es',
    subject: 'kitchen-renovation',
    answers: ['cocina-con-armarios-de-madera.jpg', 'cocina-en-obras.jpg'],
    near: ['ducha-con-azulejos-azules.jpg', 'muestras-de-azulejos.jpg']
  },
  {
    query: 'where I cook at home',
    language: 'en',
    subject: 'kitchen-renovation',
    answers: ['cocina-con-armarios-de-madera.jpg', 'cocina-en-obras.jpg'],
    near: ['ducha-con-azulejos-azules.jpg', 'muestras-de-azulejos.jpg']
  },
  {
    query: 'la cocina en obras',
    language: 'es',
    subject: 'kitchen-renovation',
    answers: ['cocina-en-obras.jpg'],
    near: [
      'cocina-con-armarios-de-madera.jpg',
      'ducha-con-azulejos-azules.jpg',
      'muestras-de-azulejos.jpg'
    ]
  },
  {
    query: 'una cocina con microondas',
    language: 'es',
    subject: 'kitchen-renovation',
    answers: ['cocina-con-armarios-de-madera.jpg'],
    near: [
      'cocina-en-obras.jpg',
      'ducha-con-azulejos-azules.jpg',
      'muestras-de-azulejos.jpg'
    ]
  },
  {
    query: 'elegir los azulejos',
    language: 'es',
    subject: 'kitchen-renovation',
    answers: ['muestras-de-azulejos.jpg'],
    near: [
      'cocina-con-armarios-de-madera.jpg',
      'cocina-en-obras.jpg',
      'ducha-con-azulejos-azules.jpg'
    ]
  },
  {
    query: 'una cocina',
    language: 'es',
    subject: 'kitchen-renovation',
    answers: ['cocina-con-armarios-de-madera.jpg', 'cocina-en-obras.jpg'],
    near: ['muestras-de-azulejos.jpg', 'ducha-con-azulejos-azules.jpg']
  },
  {
    query: 'una ducha',
    language: 'es',
    subject: 'kitchen-renovation',
    answers: ['ducha-con-azulejos-azules.jpg'],
    near: [
      'cocina-con-armarios-de-madera.jpg',
      'cocina-en-obras.jpg',
      'muestras-de-azulejos.jpg'
    ]
  },
  {
    query: 'kitchen and bathroom after the renovation',
    language: 'en',
    subject: 'kitchen-renovation',
    answers: ['cocina-con-armarios-de-madera.jpg', 'ducha-con-azulejos-azules.jpg'],
    near: ['cocina-en-obras.jpg', 'muestras-de-azulejos.jpg']
  },
  {
    query: 'un plato de lentejas',
    language: 'es',
    subject: 'lentils',
    answers: ['lentejas-con-salchichas.jpg', 'sopa-de-lentejas-rojas.jpg'],
    near: ['hummus-con-pan.jpg', 'lentejas-secas-en-un-cuenco.jpg']
  },
  {
    query: 'lentil dishes',
    language: 'en',
    subject: 'lentils',
    answers: ['lentejas-con-salchichas.jpg', 'sopa-de-lentejas-rojas.jpg'],
    near: ['hummus-con-pan.jpg', 'lentejas-secas-en-un-cuenco.jpg']
  },
  {
    query: 'lentejas',
    language: 'es',
    subject: 'lentils',
    answers: [
      'lentejas-con-salchichas.jpg',
      'lentejas-secas-en-un-cuenco.jpg',
      'sopa-de-lentejas-rojas.jpg'
    ],
    near: ['hummus-con-pan.jpg']
  },
  {
    query: 'comida de cuchara',
    language: 'es',
    subject: 'lentils',
    answers: ['sopa-de-lentejas-rojas.jpg'],
    near: [
      'hummus-con-pan.jpg',
      'lentejas-con-salchichas.jpg',
      'lentejas-secas-en-un-cuenco.jpg'
    ]
  },
  {
    query: 'lentejas secas',
    language: 'es',
    subject: 'lentils',
    answers: ['lentejas-secas-en-un-cuenco.jpg'],
    near: [
      'hummus-con-pan.jpg',
      'lentejas-con-salchichas.jpg',
      'sopa-de-lentejas-rojas.jpg'
    ]
  },
  {
    query: 'lentejas con salchichas',
    language: 'es',
    subject: 'lentils',
    answers: ['lentejas-con-salchichas.jpg'],
    near: [
      'hummus-con-pan.jpg',
      'lentejas-secas-en-un-cuenco.jpg',
      'sopa-de-lentejas-rojas.jpg'
    ]
  },
  {
    query: 'red lentil soup',
    language: 'en',
    subject: 'lentils',
    answers: ['sopa-de-lentejas-rojas.jpg'],
    near: [
      'hummus-con-pan.jpg',
      'lentejas-con-salchichas.jpg',
      'lentejas-secas-en-un-cuenco.jpg'
    ]
  },
  {
    query: 'hummus with toast',
    language: 'en',
    subject: 'lentils',
    answers: ['hummus-con-pan.jpg'],
    near: [
      'lentejas-con-salchichas.jpg',
      'lentejas-secas-en-un-cuenco.jpg',
      'sopa-de-lentejas-rojas.jpg'
    ]
  },
  {
    query: 'un pico con nieve',
    language: 'es',
    subject: 'mountains',
    answers: ['pico-nevado.jpg'],
    near: [
      'lago-de-alta-montana.jpg',
      'refugio-de-montana.jpg',
      'senderista-en-un-sendero.jpg'
    ]
  },
  {
    query: 'snowy mountain peak',
    language: 'en',
    subject: 'mountains',
    answers: ['pico-nevado.jpg'],
    near: [
      'lago-de-alta-montana.jpg',
      'refugio-de-montana.jpg',
      'senderista-en-un-sendero.jpg'
    ]
  },
  {
    query: 'paisaje de alta montaña',
    language: 'es',
    subject: 'mountains',
    answers: ['pico-nevado.jpg', 'lago-de-alta-montana.jpg'],
    near: ['refugio-de-montana.jpg', 'senderista-en-un-sendero.jpg']
  },
  {
    query: 'a lake between mountains',
    language: 'en',
    subject: 'mountains',
    answers: ['lago-de-alta-montana.jpg', 'pico-nevado.jpg'],
    near: ['refugio-de-montana.jpg', 'senderista-en-un-sendero.jpg']
  },
  {
    query: 'un lago que refleja el cielo',
    language: 'es',
    subject: 'mountains',
    answers: ['lago-de-alta-montana.jpg'],
    near: ['pico-nevado.jpg', 'refugio-de-montana.jpg', 'senderista-en-un-sendero.jpg']
  },
  {
    query: 'una persona haciendo senderismo',
    language: 'es',
    subject: 'mountains',
    answers: ['senderista-en-un-sendero.jpg'],
    near: ['lago-de-alta-montana.jpg', 'pico-nevado.jpg', 'refugio-de-montana.jpg']
  },
  {
    query: 'mountain hiking trip',
    language: 'en',
    subject: 'mountains',
    answers: ['senderista-en-un-sendero.jpg', 'refugio-de-montana.jpg'],
    near: ['lago-de-alta-montana.jpg', 'pico-nevado.jpg']
  },
  {
    query: 'un refugio de montaña',
    language: 'es',
    subject: 'mountains',
    answers: ['refugio-de-montana.jpg'],
    near: ['lago-de-alta-montana.jpg', 'pico-nevado.jpg', 'senderista-en-un-sendero.jpg']
  },
  {
    query: 'un perro mordiendo un palo',
    language: 'es',
    subject: 'pets',
    answers: ['corgi-nadando-con-un-palo.jpg'],
    near: [
      'cachorro-dormido-en-su-cama.jpg',
      'cuencos-del-perro.jpg',
      'golden-retriever-con-la-lengua-fuera.jpg'
    ]
  },
  {
    query: 'dog chewing a stick',
    language: 'en',
    subject: 'pets',
    answers: ['corgi-nadando-con-un-palo.jpg'],
    near: [
      'cachorro-dormido-en-su-cama.jpg',
      'cuencos-del-perro.jpg',
      'golden-retriever-con-la-lengua-fuera.jpg'
    ]
  },
  {
    query: 'dog swimming',
    language: 'en',
    subject: 'pets',
    answers: ['corgi-nadando-con-un-palo.jpg'],
    near: [
      'cachorro-dormido-en-su-cama.jpg',
      'cuencos-del-perro.jpg',
      'golden-retriever-con-la-lengua-fuera.jpg'
    ]
  },
  {
    query: 'un perro sacando la lengua',
    language: 'es',
    subject: 'pets',
    answers: ['golden-retriever-con-la-lengua-fuera.jpg'],
    near: [
      'cachorro-dormido-en-su-cama.jpg',
      'corgi-nadando-con-un-palo.jpg',
      'cuencos-del-perro.jpg'
    ]
  },
  {
    query: 'un cachorro durmiendo',
    language: 'es',
    subject: 'pets',
    answers: ['cachorro-dormido-en-su-cama.jpg'],
    near: [
      'corgi-nadando-con-un-palo.jpg',
      'cuencos-del-perro.jpg',
      'golden-retriever-con-la-lengua-fuera.jpg'
    ]
  },
  {
    query: 'mi mascota',
    language: 'es',
    subject: 'pets',
    answers: [
      'golden-retriever-con-la-lengua-fuera.jpg',
      'cachorro-dormido-en-su-cama.jpg',
      'corgi-nadando-con-un-palo.jpg'
    ],
    near: ['cuencos-del-perro.jpg']
  },
  {
    query: 'a dog',
    language: 'en',
    subject: 'pets',
    answers: [
      'golden-retriever-con-la-lengua-fuera.jpg',
      'cachorro-dormido-en-su-cama.jpg',
      'corgi-nadando-con-un-palo.jpg'
    ],
    near: ['cuencos-del-perro.jpg']
  },
  {
    query: 'los cuencos del perro',
    language: 'es',
    subject: 'pets',
    answers: ['cuencos-del-perro.jpg'],
    near: [
      'cachorro-dormido-en-su-cama.jpg',
      'corgi-nadando-con-un-palo.jpg',
      'golden-retriever-con-la-lengua-fuera.jpg'
    ]
  },
  {
    query: 'hogaza de pan recién horneada',
    language: 'es',
    subject: 'sourdough',
    answers: ['hogaza-de-masa-madre-cortada.jpg'],
    near: [
      'focaccia-con-romero.jpg',
      'sacos-de-harina.jpg',
      'tarro-de-masa-madre-burbujeante.jpg'
    ]
  },
  {
    query: 'sliced sourdough loaf with butter',
    language: 'en',
    subject: 'sourdough',
    answers: ['hogaza-de-masa-madre-cortada.jpg'],
    near: [
      'focaccia-con-romero.jpg',
      'sacos-de-harina.jpg',
      'tarro-de-masa-madre-burbujeante.jpg'
    ]
  },
  {
    query: 'un tarro de masa madre con burbujas',
    language: 'es',
    subject: 'sourdough',
    answers: ['tarro-de-masa-madre-burbujeante.jpg'],
    near: [
      'focaccia-con-romero.jpg',
      'hogaza-de-masa-madre-cortada.jpg',
      'sacos-de-harina.jpg'
    ]
  },
  {
    query: 'masa madre',
    language: 'es',
    subject: 'sourdough',
    answers: ['tarro-de-masa-madre-burbujeante.jpg', 'hogaza-de-masa-madre-cortada.jpg'],
    near: ['focaccia-con-romero.jpg', 'sacos-de-harina.jpg']
  },
  {
    query: 'pan hecho en casa',
    language: 'es',
    subject: 'sourdough',
    answers: ['hogaza-de-masa-madre-cortada.jpg', 'focaccia-con-romero.jpg'],
    near: ['sacos-de-harina.jpg', 'tarro-de-masa-madre-burbujeante.jpg']
  },
  {
    query: 'bread',
    language: 'en',
    subject: 'sourdough',
    answers: ['hogaza-de-masa-madre-cortada.jpg', 'focaccia-con-romero.jpg'],
    near: ['sacos-de-harina.jpg', 'tarro-de-masa-madre-burbujeante.jpg']
  },
  {
    query: 'focaccia with rosemary',
    language: 'en',
    subject: 'sourdough',
    answers: ['focaccia-con-romero.jpg'],
    near: [
      'hogaza-de-masa-madre-cortada.jpg',
      'sacos-de-harina.jpg',
      'tarro-de-masa-madre-burbujeante.jpg'
    ]
  },
  {
    query: 'sacos de harina',
    language: 'es',
    subject: 'sourdough',
    answers: ['sacos-de-harina.jpg'],
    near: [
      'focaccia-con-romero.jpg',
      'hogaza-de-masa-madre-cortada.jpg',
      'tarro-de-masa-madre-burbujeante.jpg'
    ]
  },
  {
    query: 'un tranvía por una calle empedrada',
    language: 'es',
    subject: 'trip-to-lisbon',
    answers: ['tranvia-amarillo-en-una-calle.jpg'],
    near: [
      'panel-de-azulejos.jpg',
      'pasteis-de-nata-con-cafe.jpg',
      'tejados-de-alfama-y-el-rio.jpg'
    ]
  },
  {
    query: 'calles de Lisboa',
    language: 'es',
    subject: 'trip-to-lisbon',
    answers: ['tranvia-amarillo-en-una-calle.jpg'],
    near: [
      'panel-de-azulejos.jpg',
      'pasteis-de-nata-con-cafe.jpg',
      'tejados-de-alfama-y-el-rio.jpg'
    ]
  },
  {
    query: 'Lisboa',
    language: 'es',
    subject: 'trip-to-lisbon',
    answers: ['tranvia-amarillo-en-una-calle.jpg', 'tejados-de-alfama-y-el-rio.jpg'],
    near: ['panel-de-azulejos.jpg', 'pasteis-de-nata-con-cafe.jpg']
  },
  {
    query: 'old town of Lisbon',
    language: 'en',
    subject: 'trip-to-lisbon',
    answers: ['tranvia-amarillo-en-una-calle.jpg', 'tejados-de-alfama-y-el-rio.jpg'],
    near: ['panel-de-azulejos.jpg', 'pasteis-de-nata-con-cafe.jpg']
  },
  {
    query: 'vistas de la ciudad desde un mirador',
    language: 'es',
    subject: 'trip-to-lisbon',
    answers: ['tejados-de-alfama-y-el-rio.jpg'],
    near: [
      'panel-de-azulejos.jpg',
      'pasteis-de-nata-con-cafe.jpg',
      'tranvia-amarillo-en-una-calle.jpg'
    ]
  },
  {
    query: 'pasteles de nata con café',
    language: 'es',
    subject: 'trip-to-lisbon',
    answers: ['pasteis-de-nata-con-cafe.jpg'],
    near: [
      'panel-de-azulejos.jpg',
      'tejados-de-alfama-y-el-rio.jpg',
      'tranvia-amarillo-en-una-calle.jpg'
    ]
  },
  {
    query: 'azulejos portugueses',
    language: 'es',
    subject: 'trip-to-lisbon',
    answers: ['panel-de-azulejos.jpg'],
    near: [
      'pasteis-de-nata-con-cafe.jpg',
      'tejados-de-alfama-y-el-rio.jpg',
      'tranvia-amarillo-en-una-calle.jpg'
    ]
  },
  {
    query: 'blue and white painted tiles',
    language: 'en',
    subject: 'trip-to-lisbon',
    answers: ['panel-de-azulejos.jpg'],
    near: [
      'pasteis-de-nata-con-cafe.jpg',
      'tejados-de-alfama-y-el-rio.jpg',
      'tranvia-amarillo-en-una-calle.jpg'
    ]
  },
  {
    query: 'perros',
    language: 'es',
    subject: 'pets',
    answers: [
      'golden-retriever-con-la-lengua-fuera.jpg',
      'cachorro-dormido-en-su-cama.jpg',
      'corgi-nadando-con-un-palo.jpg'
    ],
    near: ['cuencos-del-perro.jpg']
  },
  {
    query: 'pan',
    language: 'es',
    subject: 'sourdough',
    answers: ['hogaza-de-masa-madre-cortada.jpg', 'focaccia-con-romero.jpg'],
    near: ['sacos-de-harina.jpg', 'tarro-de-masa-madre-burbujeante.jpg']
  },
  {
    query: 'plantas en macetas',
    language: 'es',
    subject: 'house-plants',
    answers: [
      'monstera-en-una-maceta.jpg',
      'cactus-en-macetas-de-barro.jpg',
      'potus-en-la-ventana.jpg'
    ],
    near: ['trasplantar-una-planta.jpg']
  },
  {
    query: 'un gato durmiendo en el sofá',
    language: 'es',
    absent: 'off the subject',
    split: 'holdout',
    near: []
  },
  {
    query: 'una bicicleta de montaña en el barro',
    language: 'es',
    absent: 'off the subject',
    split: 'tuning',
    near: []
  },
  {
    query: 'un tren de alta velocidad',
    language: 'es',
    absent: 'off the subject',
    split: 'holdout',
    near: []
  },
  {
    query: 'coches de Fórmula 1 en un circuito',
    language: 'es',
    absent: 'off the subject',
    split: 'tuning',
    near: []
  },
  {
    query: 'partitura de piano',
    language: 'es',
    absent: 'off the subject',
    split: 'tuning',
    near: []
  },
  {
    query: 'un velero en el puerto',
    language: 'es',
    absent: 'off the subject',
    split: 'holdout',
    near: []
  },
  {
    query: 'una guitarra eléctrica',
    language: 'es',
    absent: 'off the subject',
    split: 'tuning',
    near: []
  },
  {
    query: 'a birthday cake with candles',
    language: 'en',
    absent: 'off the subject',
    split: 'holdout',
    near: []
  },
  {
    query: 'el diagrama de la arquitectura hexagonal',
    language: 'es',
    absent: 'technical term of the owner',
    split: 'tuning',
    near: []
  },
  {
    query: 'captura de la terminal con los tests en verde',
    language: 'es',
    absent: 'technical term of the owner',
    split: 'tuning',
    near: []
  },
  {
    query: 'el esquema de pgvector',
    language: 'es',
    absent: 'technical term of the owner',
    split: 'holdout',
    near: []
  },
  {
    query: 'el Reranker',
    language: 'es',
    absent: 'technical term of the owner',
    split: 'tuning',
    near: []
  },
  {
    query: 'CI pipeline status page',
    language: 'en',
    absent: 'technical term of the owner',
    split: 'holdout',
    near: []
  },
  {
    query: 'screenshot of the Drizzle migration',
    language: 'en',
    absent: 'technical term of the owner',
    split: 'tuning',
    near: []
  },
  {
    query: 'the Docker logo',
    language: 'en',
    absent: 'technical term of the owner',
    split: 'tuning',
    near: []
  },
  {
    query: 'asdkjh qwe',
    language: 'es',
    absent: 'noise',
    split: 'tuning',
    near: []
  },
  {
    query: 'zzzz',
    language: 'es',
    absent: 'noise',
    split: 'tuning',
    near: []
  },
  {
    query: 'jkl ñlk',
    language: 'es',
    absent: 'noise',
    split: 'holdout',
    near: []
  },
  {
    query: '123 456',
    language: 'es',
    absent: 'noise',
    split: 'tuning',
    near: []
  },
  {
    query: 'ññññ',
    language: 'es',
    absent: 'noise',
    split: 'holdout',
    near: []
  },
  {
    query: 'lorem ipsum dolor',
    language: 'en',
    absent: 'noise',
    split: 'tuning',
    near: []
  }
];
