// You tune on the tuning split, and the holdout split judges.
// The split does not change after the baseline.
export type Split = 'tuning' | 'holdout';

export type Language = 'es' | 'en';

// Each licence lets the repo keep the picture and resize it.
type Licence =
  | 'https://creativecommons.org/licenses/by/2.0/'
  | 'https://creativecommons.org/publicdomain/zero/1.0/'
  | 'https://creativecommons.org/publicdomain/mark/1.0/';

type Picture = {
  subject: string;
  title: string;
  creator: string;
  source: string;
  licence: Licence;
};

export type Manifest = {
  subjects: Readonly<Record<string, Split>>;
  texts: Readonly<Record<string, {subject: string; language: Language}>>;
  // A picture has no language. It is its source, resized to 512 pixels on its long edge.
  // CC BY 2.0 asks for the title, the creator, the source and the licence of the picture.
  images: Readonly<Record<string, Picture>>;
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
    'acuario-de-agua-salada.md': {subject: 'marine-life', language: 'es'},
    'open-water-course-booking.pdf': {subject: 'marine-life', language: 'en'},
    'rock-pools-with-kids.md': {subject: 'marine-life', language: 'en'},
    'patrones-de-peticiones-al-servidor.md': {subject: 'server-requests', language: 'es'},
    'server-sent-events-para-avisos.md': {subject: 'server-requests', language: 'es'},
    'cors-errors-in-local-dev.md': {subject: 'server-requests', language: 'en'},
    'contrato-de-la-api-de-pedidos.pdf': {subject: 'server-requests', language: 'es'},
    'factura-de-la-luz-de-enero.pdf': {subject: 'electricity-bill', language: 'es'},
    'tarifas-de-la-luz-por-horas.md': {subject: 'electricity-bill', language: 'es'},
    'switching-electricity-supplier.txt': {subject: 'electricity-bill', language: 'en'},
    'bono-social-electrico.txt': {subject: 'electricity-bill', language: 'es'},
    'solar-panels-quote.md': {subject: 'electricity-bill', language: 'en'},
    'poliza-del-seguro-del-coche.pdf': {subject: 'car-insurance', language: 'es'},
    'parte-amistoso-como-rellenarlo.md': {subject: 'car-insurance', language: 'es'},
    'renewal-quote-comparison.md': {subject: 'car-insurance', language: 'en'},
    'itv-del-coche.txt': {subject: 'car-insurance', language: 'es'},
    'windscreen-chip-claim.txt': {subject: 'car-insurance', language: 'en'},
    'exposure-triangle-notes.md': {subject: 'photography', language: 'en'},
    'fotografia-nocturna.md': {subject: 'photography', language: 'es'},
    'factura-de-la-camara.pdf': {subject: 'photography', language: 'es'},
    'limpiar-el-sensor.txt': {subject: 'photography', language: 'es'},
    'photo-backup-workflow.md': {subject: 'photography', language: 'en'},
    'preparacion-entrevista-backend.md': {subject: 'job-interview', language: 'es'},
    'oferta-de-trabajo.pdf': {subject: 'job-interview', language: 'es'},
    'system-design-practice.md': {subject: 'job-interview', language: 'en'},
    'thank-you-email-after-interview.txt': {subject: 'job-interview', language: 'en'},
    'negociar-el-salario.txt': {subject: 'job-interview', language: 'es'},
    'calendario-de-siembra.md': {subject: 'vegetable-garden', language: 'es'},
    'riego-por-goteo-del-huerto.txt': {subject: 'vegetable-garden', language: 'es'},
    'tomato-blight.md': {subject: 'vegetable-garden', language: 'en'},
    'normas-del-huerto-urbano.pdf': {subject: 'vegetable-garden', language: 'es'},
    'compost-bin-notes.txt': {subject: 'vegetable-garden', language: 'en'},
    'presupuesto-del-banquete.pdf': {subject: 'wedding-planning', language: 'es'},
    'lista-de-invitados.txt': {subject: 'wedding-planning', language: 'es'},
    'wedding-timeline.md': {subject: 'wedding-planning', language: 'en'},
    'discurso-del-padrino.md': {subject: 'wedding-planning', language: 'es'},
    'papeles-para-casarse-por-lo-civil.md': {subject: 'wedding-planning', language: 'es'},
    'presupuesto-de-la-mudanza.pdf': {subject: 'moving-house', language: 'es'},
    'checklist-cambio-de-domicilio.md': {subject: 'moving-house', language: 'es'},
    'packing-tips.md': {subject: 'moving-house', language: 'en'},
    'inventory-of-boxes.txt': {subject: 'moving-house', language: 'en'},
    'v60-recipe.md': {subject: 'coffee-brewing', language: 'en'},
    'cafetera-italiana.md': {subject: 'coffee-brewing', language: 'es'},
    'descalcificar-la-cafetera.txt': {subject: 'coffee-brewing', language: 'es'},
    'ticket-de-la-tostaduria.pdf': {subject: 'coffee-brewing', language: 'es'},
    'coffee-and-sleep.txt': {subject: 'coffee-brewing', language: 'en'}
  },
  images: {
    'atardecer-en-la-orilla.jpg': {
      subject: 'beach',
      title: 'Sunset Beach Soccer',
      creator: 'mripp',
      source: 'https://www.flickr.com/photos/56218409@N03/27443517518',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'castillo-de-arena.jpg': {
      subject: 'beach',
      title: 'Sandcastle Competition',
      creator: 'Joe Shlabotnik',
      source: 'https://www.flickr.com/photos/40646519@N00/1304346552',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'sombrilla-y-sillas.jpg': {
      subject: 'beach',
      title: 'Beach Umbrella',
      creator: 'downing.amanda',
      source: 'https://www.flickr.com/photos/37973182@N00/2677383835',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'surfista-en-una-ola.jpg': {
      subject: 'beach',
      title: 'Surfer Wave',
      creator: 'Candace McDaniel',
      source: 'https://stocksnap.io/photo/surfer-wave-XLV6XTV1OW',
      licence: 'https://creativecommons.org/publicdomain/zero/1.0/'
    },
    'bici-de-carretera-contra-una-pared.jpg': {
      subject: 'bicycle-care',
      title: 'My new road bike!',
      creator: 'Beneath_B1ue_Skies',
      source: 'https://www.flickr.com/photos/43197952@N00/3358080556',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'cadena-y-pinones.jpg': {
      subject: 'bicycle-care',
      title: 'Bicycle chain',
      creator: 'Wallboat',
      source: 'https://www.flickr.com/photos/151415985@N06/23474980338',
      licence: 'https://creativecommons.org/publicdomain/zero/1.0/'
    },
    'en-bici-bajo-la-lluvia-con-paraguas.jpg': {
      subject: 'bicycle-care',
      title: 'Cyclist in Cyclone',
      creator: 'Fountain_Head',
      source: 'https://www.flickr.com/photos/37626043@N00/6405364921',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'reparar-la-bici-en-el-taller.jpg': {
      subject: 'bicycle-care',
      title: 'Brooks sales rep fixes a flat at Flying Pigeon LA',
      creator: 'ubrayj02',
      source: 'https://www.flickr.com/photos/45152500@N00/5980280307',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'carrera-popular-por-la-ciudad.jpg': {
      subject: 'half-marathon',
      title: 'Olympic Marathon Runner',
      creator: 'abbeyman2002',
      source: 'https://www.flickr.com/photos/34179117@N00/7795200144',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'estiramientos-en-el-parque.jpg': {
      subject: 'half-marathon',
      title: 'Pre-Run Stretch',
      creator: 'Tobyotter',
      source: 'https://www.flickr.com/photos/78428166@N00/13678728083',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'medalla-de-finisher.jpg': {
      subject: 'half-marathon',
      title: 'Day 162 - New York Mini 10K 2011 Finishers Medal',
      creator: 'slgckgc',
      source: 'https://www.flickr.com/photos/14771153@N04/5822497868',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'zapatillas-de-correr.jpg': {
      subject: 'half-marathon',
      title: 'My hideous running shoes',
      creator: 'minorissues',
      source: 'https://www.flickr.com/photos/63051956@N00/3769610224',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'cactus-en-macetas-de-barro.jpg': {
      subject: 'house-plants',
      title: 'cactus-succulents-potted-garden-DSC_8831',
      creator: 'el cajon yacht club',
      source: 'https://www.flickr.com/photos/60944636@N00/28039840398',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'monstera-en-una-maceta.jpg': {
      subject: 'house-plants',
      title: 'Fensterblatt (Monstera deliciosa)',
      creator: 'blumenbiene',
      source: 'https://www.flickr.com/photos/47439717@N05/6629764665',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'potus-en-la-ventana.jpg': {
      subject: 'house-plants',
      title: 'Repotted Plant',
      creator: 'edenpictures',
      source: 'https://www.flickr.com/photos/10485077@N06/52523629205',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'trasplantar-una-planta.jpg': {
      subject: 'house-plants',
      title: '20120515-OC-LSC-0764',
      creator: 'USDAgov',
      source: 'https://www.flickr.com/photos/41284017@N08/7258241366',
      licence: 'https://creativecommons.org/publicdomain/mark/1.0/'
    },
    'cocina-con-armarios-de-madera.jpg': {
      subject: 'kitchen-renovation',
      title: 'Kitchen Cabinets',
      creator: 'EcoIslandLife',
      source: 'https://www.flickr.com/photos/89484852@N06/8142526823',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'cocina-en-obras.jpg': {
      subject: 'kitchen-renovation',
      title: 'Kitchen Remodeling @ Centreville, VA',
      creator: 'GLdesignBuild',
      source: 'https://www.flickr.com/photos/90832744@N05/8286396576',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'ducha-con-azulejos-azules.jpg': {
      subject: 'kitchen-renovation',
      title: 'dual-head shower',
      creator: 'andrechinn',
      source: 'https://www.flickr.com/photos/16167252@N00/27840234',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'muestras-de-azulejos.jpg': {
      subject: 'kitchen-renovation',
      title: 'sample tiles',
      creator: 'bptakoma',
      source: 'https://www.flickr.com/photos/8010145@N08/3499082928',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'hummus-con-pan.jpg': {
      subject: 'lentils',
      title: 'Hummus',
      creator: 'Albertas Agejevas',
      source: 'https://www.flickr.com/photos/74699799@N00/3122887625',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'lentejas-con-salchichas.jpg': {
      subject: 'lentils',
      title: 'Chipolatas with Puy lentil stew and tomato salsa',
      creator: 'Blue moon in her eyes',
      source: 'https://www.flickr.com/photos/58533294@N00/4825016480',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'lentejas-secas-en-un-cuenco.jpg': {
      subject: 'lentils',
      title: 'Puy lentils',
      creator: 'WordRidden',
      source: 'https://www.flickr.com/photos/97844767@N00/69655578',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'sopa-de-lentejas-rojas.jpg': {
      subject: 'lentils',
      title: 'hearty red lentil soup',
      creator: 'jules:stonesoup',
      source: 'https://www.flickr.com/photos/58367355@N00/14717052850',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'lago-de-alta-montana.jpg': {
      subject: 'mountains',
      title: 'Alpine Lake',
      creator: 'Robert J Heath',
      source: 'https://www.flickr.com/photos/67769979@N06/51569874490',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'pico-nevado.jpg': {
      subject: 'mountains',
      title: 'Snowy peak',
      creator: 'Francisco Anzola',
      source: 'https://www.flickr.com/photos/10345599@N03/48891824716',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'refugio-de-montana.jpg': {
      subject: 'mountains',
      title: 'Mountain Hut Brasov Romania #curmatura #dailyshoot',
      creator: 'Leshaines123',
      source: 'https://www.flickr.com/photos/46018453@N06/27895490056',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'senderista-en-un-sendero.jpg': {
      subject: 'mountains',
      title: 'Hikers @ Trail from Kamozawa to summit of Mount Nanatsuishi',
      creator: '*_*',
      source: 'https://www.flickr.com/photos/22539273@N00/11169499274',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'cachorro-dormido-en-su-cama.jpg': {
      subject: 'pets',
      title: 'sleeping puppy',
      creator: 'Muffet',
      source: 'https://www.flickr.com/photos/53133240@N00/17003553515',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'corgi-nadando-con-un-palo.jpg': {
      subject: 'pets',
      title: 'Dog Swimming in Arastradero Lake',
      creator: 'donjd2',
      source: 'https://www.flickr.com/photos/28156071@N00/8734450630',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'cuencos-del-perro.jpg': {
      subject: 'pets',
      title: 'dog bowl',
      creator: 'Joanna Bourne',
      source: 'https://www.flickr.com/photos/66992990@N00/4819554494',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'golden-retriever-con-la-lengua-fuera.jpg': {
      subject: 'pets',
      title: '6766-dog-sticking-out-tongue',
      creator: 'localpups',
      source: 'https://www.flickr.com/photos/133374862@N02/20315786240',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'focaccia-con-romero.jpg': {
      subject: 'sourdough',
      title: 'Mmm... focaccia',
      creator: 'jeffreyw',
      source: 'https://www.flickr.com/photos/7927684@N03/15622276051',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'hogaza-de-masa-madre-cortada.jpg': {
      subject: 'sourdough',
      title: 'rustic homemade sourdough bread and butter',
      creator: 'jules:stonesoup',
      source: 'https://www.flickr.com/photos/58367355@N00/5070438950',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'sacos-de-harina.jpg': {
      subject: 'sourdough',
      title: 'Flour Sacks',
      creator: 'Michela Mongardi',
      source: 'https://www.flickr.com/photos/46766162@N00/41695323',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'tarro-de-masa-madre-burbujeante.jpg': {
      subject: 'sourdough',
      title: 'Squared Circle -Sourdough starter',
      creator: 'basykes',
      source: 'https://www.flickr.com/photos/11399912@N00/8460154',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'panel-de-azulejos.jpg': {
      subject: 'trip-to-lisbon',
      title: 'Museu Nacional del Azulejo, Lisbon, wall ceramic with trees',
      creator: 'Gerda Arendt',
      source: 'https://commons.wikimedia.org/w/index.php?curid=146996847',
      licence: 'https://creativecommons.org/publicdomain/zero/1.0/'
    },
    'pasteis-de-nata-con-cafe.jpg': {
      subject: 'trip-to-lisbon',
      title: 'Pastel de Nata / Pastéis de Belém',
      creator: 'kawanet',
      source: 'https://www.flickr.com/photos/50902562@N00/3780458880',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'tejados-de-alfama-y-el-rio.jpg': {
      subject: 'trip-to-lisbon',
      title: 'Alfama',
      creator: 'Bernt Rostad',
      source: 'https://www.flickr.com/photos/67975030@N00/3903814530',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    },
    'tranvia-amarillo-en-una-calle.jpg': {
      subject: 'trip-to-lisbon',
      title: 'Lisbon Tram',
      creator: 'Martin Cooper Ipswich',
      source: 'https://www.flickr.com/photos/92899351@N08/10721604596',
      licence: 'https://creativecommons.org/licenses/by/2.0/'
    }
  }
};
