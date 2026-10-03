import type {GoldenQuery} from './GoldenQuery';

export const TEXT_GOLDEN_SET: readonly GoldenQuery[] = [
  {
    query: 'cómo hacer un guiso de legumbres con chorizo',
    language: 'es',
    subject: 'lentils',
    answers: ['receta-de-lentejas.md'],
    near: [
      'red-lentil-soup-for-the-week.md',
      'menu-del-comedor-escolar.pdf',
      'chickpea-hummus.md'
    ]
  },
  {
    query: 'hay que dejar las lentejas en remojo',
    language: 'es',
    subject: 'lentils',
    answers: ['receta-de-lentejas.md', 'red-lentil-soup-for-the-week.md'],
    near: ['menu-del-comedor-escolar.pdf', 'chickpea-hummus.md']
  },
  {
    query: 'truco para que el caldo quede más espeso',
    language: 'es',
    subject: 'lentils',
    answers: ['receta-de-lentejas.md', 'red-lentil-soup-for-the-week.md'],
    near: ['menu-del-comedor-escolar.pdf', 'chickpea-hummus.md']
  },
  {
    query: 'how long do cooked lentils keep in the fridge',
    language: 'en',
    subject: 'lentils',
    answers: ['receta-de-lentejas.md', 'red-lentil-soup-for-the-week.md'],
    near: ['menu-del-comedor-escolar.pdf', 'chickpea-hummus.md']
  },
  {
    query: 'can I freeze lentil soup',
    language: 'en',
    subject: 'lentils',
    answers: ['red-lentil-soup-for-the-week.md'],
    near: ['receta-de-lentejas.md', 'menu-del-comedor-escolar.pdf', 'chickpea-hummus.md']
  },
  {
    query: 'cada cuánto se engrasa la cadena de la bici',
    language: 'es',
    subject: 'bicycle-care',
    answers: ['mantenimiento-de-la-bicicleta.md', 'revision-antes-de-cada-salida.txt'],
    near: [
      'tubeless-tyres-and-pressure.md',
      'factura-del-taller.pdf',
      'cycling-to-work.md'
    ]
  },
  {
    query: 'el cambio salta entre los piñones',
    language: 'es',
    subject: 'bicycle-care',
    answers: ['mantenimiento-de-la-bicicleta.md'],
    near: [
      'tubeless-tyres-and-pressure.md',
      'revision-antes-de-cada-salida.txt',
      'factura-del-taller.pdf',
      'cycling-to-work.md'
    ]
  },
  {
    query: 'presión de las ruedas de la bicicleta',
    language: 'es',
    subject: 'bicycle-care',
    answers: [
      'mantenimiento-de-la-bicicleta.md',
      'tubeless-tyres-and-pressure.md',
      'revision-antes-de-cada-salida.txt'
    ],
    near: ['factura-del-taller.pdf', 'cycling-to-work.md']
  },
  {
    query: 'limpiar la cadena después de una salida con lluvia',
    language: 'es',
    subject: 'bicycle-care',
    answers: ['mantenimiento-de-la-bicicleta.md', 'revision-antes-de-cada-salida.txt'],
    near: [
      'tubeless-tyres-and-pressure.md',
      'factura-del-taller.pdf',
      'cycling-to-work.md'
    ]
  },
  {
    query: 'how often to top up tubeless sealant',
    language: 'en',
    subject: 'bicycle-care',
    answers: ['tubeless-tyres-and-pressure.md'],
    near: [
      'mantenimiento-de-la-bicicleta.md',
      'revision-antes-de-cada-salida.txt',
      'factura-del-taller.pdf',
      'cycling-to-work.md'
    ]
  },
  {
    query: 'how to fix a puncture on the road',
    language: 'en',
    subject: 'bicycle-care',
    answers: ['tubeless-tyres-and-pressure.md'],
    near: [
      'mantenimiento-de-la-bicicleta.md',
      'revision-antes-de-cada-salida.txt',
      'factura-del-taller.pdf',
      'cycling-to-work.md'
    ]
  },
  {
    query: 'when is a chain worn out and needs replacing',
    language: 'en',
    subject: 'bicycle-care',
    answers: ['mantenimiento-de-la-bicicleta.md'],
    near: [
      'tubeless-tyres-and-pressure.md',
      'revision-antes-de-cada-salida.txt',
      'factura-del-taller.pdf',
      'cycling-to-work.md'
    ]
  },
  {
    query: 'qué visitar en Portugal',
    language: 'es',
    subject: 'trip-to-lisbon',
    answers: ['notas-del-viaje-a-lisboa.txt', 'lisbon-itinerary-for-friends.md'],
    near: [
      'reserva-del-piso-en-alfama.pdf',
      'portuguese-phrases-for-the-trip.txt',
      'gastos-del-viaje-a-lisboa.txt'
    ]
  },
  {
    query: 'dónde coger el tranvía sin que vaya lleno',
    language: 'es',
    subject: 'trip-to-lisbon',
    answers: ['notas-del-viaje-a-lisboa.txt', 'lisbon-itinerary-for-friends.md'],
    near: [
      'reserva-del-piso-en-alfama.pdf',
      'portuguese-phrases-for-the-trip.txt',
      'gastos-del-viaje-a-lisboa.txt'
    ]
  },
  {
    query: 'dulces típicos con canela',
    language: 'es',
    subject: 'trip-to-lisbon',
    answers: ['notas-del-viaje-a-lisboa.txt', 'lisbon-itinerary-for-friends.md'],
    near: [
      'reserva-del-piso-en-alfama.pdf',
      'portuguese-phrases-for-the-trip.txt',
      'gastos-del-viaje-a-lisboa.txt'
    ]
  },
  {
    query: 'tarjeta de transporte para el tranvía y el ferry',
    language: 'es',
    subject: 'trip-to-lisbon',
    answers: ['notas-del-viaje-a-lisboa.txt', 'lisbon-itinerary-for-friends.md'],
    near: [
      'reserva-del-piso-en-alfama.pdf',
      'portuguese-phrases-for-the-trip.txt',
      'gastos-del-viaje-a-lisboa.txt'
    ]
  },
  {
    query: 'a qué hora se puede entrar en el piso de Lisboa',
    language: 'es',
    subject: 'trip-to-lisbon',
    answers: ['reserva-del-piso-en-alfama.pdf'],
    near: [
      'notas-del-viaje-a-lisboa.txt',
      'lisbon-itinerary-for-friends.md',
      'portuguese-phrases-for-the-trip.txt',
      'gastos-del-viaje-a-lisboa.txt'
    ]
  },
  {
    query: 'day trip from Lisbon to Sintra',
    language: 'en',
    subject: 'trip-to-lisbon',
    answers: ['lisbon-itinerary-for-friends.md'],
    near: [
      'notas-del-viaje-a-lisboa.txt',
      'reserva-del-piso-en-alfama.pdf',
      'portuguese-phrases-for-the-trip.txt',
      'gastos-del-viaje-a-lisboa.txt'
    ]
  },
  {
    query: 'can we cancel the Alfama flat for free',
    language: 'en',
    subject: 'trip-to-lisbon',
    answers: ['reserva-del-piso-en-alfama.pdf'],
    near: [
      'notas-del-viaje-a-lisboa.txt',
      'lisbon-itinerary-for-friends.md',
      'portuguese-phrases-for-the-trip.txt',
      'gastos-del-viaje-a-lisboa.txt'
    ]
  },
  {
    query: 'cada cuánto riego la monstera',
    language: 'es',
    subject: 'house-plants',
    answers: ['cuidado-de-las-plantas-de-interior.txt', 'monstera-care-sheet.md'],
    near: ['ticket-del-vivero.pdf', 'cactus-and-succulents.md']
  },
  {
    query: 'por qué se ponen amarillas las hojas',
    language: 'es',
    subject: 'house-plants',
    answers: ['cuidado-de-las-plantas-de-interior.txt', 'monstera-care-sheet.md'],
    near: ['ticket-del-vivero.pdf', 'cactus-and-succulents.md']
  },
  {
    query: 'cuándo cambiar una planta de maceta',
    language: 'es',
    subject: 'house-plants',
    answers: ['cuidado-de-las-plantas-de-interior.txt', 'monstera-care-sheet.md'],
    near: ['ticket-del-vivero.pdf', 'cactus-and-succulents.md']
  },
  {
    query: 'le puede dar el sol directo a la monstera',
    language: 'es',
    subject: 'house-plants',
    answers: ['cuidado-de-las-plantas-de-interior.txt', 'monstera-care-sheet.md'],
    near: ['ticket-del-vivero.pdf', 'cactus-and-succulents.md']
  },
  {
    query: 'how to propagate a monstera cutting',
    language: 'en',
    subject: 'house-plants',
    answers: ['monstera-care-sheet.md'],
    near: [
      'cuidado-de-las-plantas-de-interior.txt',
      'ticket-del-vivero.pdf',
      'cactus-and-succulents.md'
    ]
  },
  {
    query: 'how often should I fertilise indoor plants',
    language: 'en',
    subject: 'house-plants',
    answers: ['cuidado-de-las-plantas-de-interior.txt'],
    near: ['monstera-care-sheet.md', 'ticket-del-vivero.pdf', 'cactus-and-succulents.md']
  },
  {
    query: 'alimentar la masa madre',
    language: 'es',
    subject: 'sourdough',
    answers: ['sourdough-starter.md', 'masa-madre-desde-cero.md'],
    near: [
      'pan-de-masa-madre.pdf',
      'flour-types-for-bread.txt',
      'focaccia-con-levadura.md'
    ]
  },
  {
    query: 'la masa madre tiene un líquido gris encima',
    language: 'es',
    subject: 'sourdough',
    answers: ['sourdough-starter.md', 'masa-madre-desde-cero.md'],
    near: [
      'pan-de-masa-madre.pdf',
      'flour-types-for-bread.txt',
      'focaccia-con-levadura.md'
    ]
  },
  {
    query: 'how do I know my starter is ready to bake',
    language: 'en',
    subject: 'sourdough',
    answers: ['sourdough-starter.md', 'masa-madre-desde-cero.md'],
    near: [
      'pan-de-masa-madre.pdf',
      'flour-types-for-bread.txt',
      'focaccia-con-levadura.md'
    ]
  },
  {
    query: 'cuántos días tarda en estar lista una masa madre nueva',
    language: 'es',
    subject: 'sourdough',
    answers: ['masa-madre-desde-cero.md'],
    near: [
      'sourdough-starter.md',
      'pan-de-masa-madre.pdf',
      'flour-types-for-bread.txt',
      'focaccia-con-levadura.md'
    ]
  },
  {
    query: 'a qué temperatura se hornea el pan de masa madre',
    language: 'es',
    subject: 'sourdough',
    answers: ['pan-de-masa-madre.pdf'],
    near: [
      'sourdough-starter.md',
      'masa-madre-desde-cero.md',
      'flour-types-for-bread.txt',
      'focaccia-con-levadura.md'
    ]
  },
  {
    query: 'how much salt in a sourdough loaf',
    language: 'en',
    subject: 'sourdough',
    answers: ['pan-de-masa-madre.pdf'],
    near: [
      'sourdough-starter.md',
      'masa-madre-desde-cero.md',
      'flour-types-for-bread.txt',
      'focaccia-con-levadura.md'
    ]
  },
  {
    query: 'can I keep my starter in the fridge',
    language: 'en',
    subject: 'sourdough',
    answers: ['masa-madre-desde-cero.md'],
    near: [
      'sourdough-starter.md',
      'pan-de-masa-madre.pdf',
      'flour-types-for-bread.txt',
      'focaccia-con-levadura.md'
    ]
  },
  {
    query: 'contraseña del wifi de invitados',
    language: 'es',
    subject: 'home-network',
    answers: ['wifi-para-invitados.txt'],
    near: [
      'home-network-setup.txt',
      'fibre-router-quick-guide.pdf',
      'oferta-de-fibra-y-movil.pdf',
      'nas-backup-plan.md'
    ]
  },
  {
    query: 'se ha caído internet, qué reinicio primero',
    language: 'es',
    subject: 'home-network',
    answers: ['home-network-setup.txt', 'fibre-router-quick-guide.pdf'],
    near: ['wifi-para-invitados.txt', 'oferta-de-fibra-y-movil.pdf', 'nas-backup-plan.md']
  },
  {
    query: 'why the smart plugs use a separate network',
    language: 'en',
    subject: 'home-network',
    answers: ['home-network-setup.txt'],
    near: [
      'wifi-para-invitados.txt',
      'fibre-router-quick-guide.pdf',
      'oferta-de-fibra-y-movil.pdf',
      'nas-backup-plan.md'
    ]
  },
  {
    query: 'la impresora no se ve desde la red de invitados',
    language: 'es',
    subject: 'home-network',
    answers: ['home-network-setup.txt', 'wifi-para-invitados.txt'],
    near: [
      'fibre-router-quick-guide.pdf',
      'oferta-de-fibra-y-movil.pdf',
      'nas-backup-plan.md'
    ]
  },
  {
    query: 'cómo se llama la red wifi para las visitas',
    language: 'es',
    subject: 'home-network',
    answers: ['wifi-para-invitados.txt'],
    near: [
      'home-network-setup.txt',
      'fibre-router-quick-guide.pdf',
      'oferta-de-fibra-y-movil.pdf',
      'nas-backup-plan.md'
    ]
  },
  {
    query: 'cómo reseteo el router de fábrica',
    language: 'es',
    subject: 'home-network',
    answers: ['fibre-router-quick-guide.pdf'],
    near: [
      'home-network-setup.txt',
      'wifi-para-invitados.txt',
      'oferta-de-fibra-y-movil.pdf',
      'nas-backup-plan.md'
    ]
  },
  {
    query: 'what does the red LOS light mean on the router',
    language: 'en',
    subject: 'home-network',
    answers: ['fibre-router-quick-guide.pdf'],
    near: [
      'home-network-setup.txt',
      'wifi-para-invitados.txt',
      'oferta-de-fibra-y-movil.pdf',
      'nas-backup-plan.md'
    ]
  },
  {
    query: 'why is the office node wired with a cable',
    language: 'en',
    subject: 'home-network',
    answers: ['home-network-setup.txt'],
    near: [
      'wifi-para-invitados.txt',
      'fibre-router-quick-guide.pdf',
      'oferta-de-fibra-y-movil.pdf',
      'nas-backup-plan.md'
    ]
  },
  {
    query: 'plan de carrera de 21 kilómetros',
    language: 'es',
    subject: 'half-marathon',
    answers: ['entrenamiento-media-maraton.md'],
    near: [
      'race-day-checklist.md',
      'inscripcion-media-maraton.pdf',
      'zapatillas-para-correr.txt',
      'why-a-marathon-is-42-km.txt'
    ]
  },
  {
    query: 'series de un kilómetro los martes',
    language: 'es',
    subject: 'half-marathon',
    answers: ['entrenamiento-media-maraton.md'],
    near: [
      'race-day-checklist.md',
      'inscripcion-media-maraton.pdf',
      'zapatillas-para-correr.txt',
      'why-a-marathon-is-42-km.txt'
    ]
  },
  {
    query: 'qué comer antes de una carrera',
    language: 'es',
    subject: 'half-marathon',
    answers: ['entrenamiento-media-maraton.md', 'race-day-checklist.md'],
    near: [
      'inscripcion-media-maraton.pdf',
      'zapatillas-para-correr.txt',
      'why-a-marathon-is-42-km.txt'
    ]
  },
  {
    query: 'desayuno la mañana de la carrera',
    language: 'es',
    subject: 'half-marathon',
    answers: ['entrenamiento-media-maraton.md', 'race-day-checklist.md'],
    near: [
      'inscripcion-media-maraton.pdf',
      'zapatillas-para-correr.txt',
      'why-a-marathon-is-42-km.txt'
    ]
  },
  {
    query: 'dónde se recoge el dorsal',
    language: 'es',
    subject: 'half-marathon',
    answers: ['inscripcion-media-maraton.pdf'],
    near: [
      'entrenamiento-media-maraton.md',
      'race-day-checklist.md',
      'zapatillas-para-correr.txt',
      'why-a-marathon-is-42-km.txt'
    ]
  },
  {
    query: 'how often to take energy gels during a half marathon',
    language: 'en',
    subject: 'half-marathon',
    answers: ['race-day-checklist.md'],
    near: [
      'entrenamiento-media-maraton.md',
      'inscripcion-media-maraton.pdf',
      'zapatillas-para-correr.txt',
      'why-a-marathon-is-42-km.txt'
    ]
  },
  {
    query: 'what time does the half marathon start',
    language: 'en',
    subject: 'half-marathon',
    answers: ['inscripcion-media-maraton.pdf'],
    near: [
      'entrenamiento-media-maraton.md',
      'race-day-checklist.md',
      'zapatillas-para-correr.txt',
      'why-a-marathon-is-42-km.txt'
    ]
  },
  {
    query: 'tapering in the last two weeks before the race',
    language: 'en',
    subject: 'half-marathon',
    answers: ['entrenamiento-media-maraton.md'],
    near: [
      'race-day-checklist.md',
      'inscripcion-media-maraton.pdf',
      'zapatillas-para-correr.txt',
      'why-a-marathon-is-42-km.txt'
    ]
  },
  {
    query: 'cuánto pago de alquiler al mes',
    language: 'es',
    subject: 'rental-contract',
    answers: ['contrato-de-alquiler.pdf', 'anexo-del-contrato-de-alquiler.pdf'],
    near: [
      'emails-with-the-landlady.txt',
      'buscar-piso-de-alquiler.md',
      'inventario-del-piso.pdf'
    ]
  },
  {
    query: 'me devuelven el depósito al irme del piso',
    language: 'es',
    subject: 'rental-contract',
    answers: ['contrato-de-alquiler.pdf', 'emails-with-the-landlady.txt'],
    near: [
      'anexo-del-contrato-de-alquiler.pdf',
      'buscar-piso-de-alquiler.md',
      'inventario-del-piso.pdf'
    ]
  },
  {
    query: 'se pueden tener perros en la vivienda',
    language: 'es',
    subject: 'rental-contract',
    answers: ['contrato-de-alquiler.pdf'],
    near: [
      'anexo-del-contrato-de-alquiler.pdf',
      'emails-with-the-landlady.txt',
      'buscar-piso-de-alquiler.md',
      'inventario-del-piso.pdf'
    ]
  },
  {
    query: 'cuánto cuesta la plaza de garaje',
    language: 'es',
    subject: 'rental-contract',
    answers: ['anexo-del-contrato-de-alquiler.pdf'],
    near: [
      'contrato-de-alquiler.pdf',
      'emails-with-the-landlady.txt',
      'buscar-piso-de-alquiler.md',
      'inventario-del-piso.pdf'
    ]
  },
  {
    query: 'how much is the rent after the yearly update',
    language: 'en',
    subject: 'rental-contract',
    answers: ['anexo-del-contrato-de-alquiler.pdf'],
    near: [
      'contrato-de-alquiler.pdf',
      'emails-with-the-landlady.txt',
      'buscar-piso-de-alquiler.md',
      'inventario-del-piso.pdf'
    ]
  },
  {
    query: 'can I paint the walls of the flat',
    language: 'en',
    subject: 'rental-contract',
    answers: ['emails-with-the-landlady.txt'],
    near: [
      'contrato-de-alquiler.pdf',
      'anexo-del-contrato-de-alquiler.pdf',
      'buscar-piso-de-alquiler.md',
      'inventario-del-piso.pdf'
    ]
  },
  {
    query: 'who pays for the boiler repair',
    language: 'en',
    subject: 'rental-contract',
    answers: ['emails-with-the-landlady.txt'],
    near: [
      'contrato-de-alquiler.pdf',
      'anexo-del-contrato-de-alquiler.pdf',
      'buscar-piso-de-alquiler.md',
      'inventario-del-piso.pdf'
    ]
  },
  {
    query: 'lesión de menisco',
    language: 'es',
    subject: 'knee-injury',
    answers: [
      'informe-de-la-rodilla.pdf',
      'ejercicios-para-la-rodilla.md',
      'knee-follow-up-notes.txt'
    ],
    near: ['baja-laboral.pdf', 'ankle-sprain-first-aid.md']
  },
  {
    query: 'me hice daño en la rodilla jugando al pádel',
    language: 'es',
    subject: 'knee-injury',
    answers: ['informe-de-la-rodilla.pdf'],
    near: [
      'ejercicios-para-la-rodilla.md',
      'knee-follow-up-notes.txt',
      'baja-laboral.pdf',
      'ankle-sprain-first-aid.md'
    ]
  },
  {
    query: 'do I need knee surgery',
    language: 'en',
    subject: 'knee-injury',
    answers: ['informe-de-la-rodilla.pdf', 'knee-follow-up-notes.txt'],
    near: [
      'ejercicios-para-la-rodilla.md',
      'baja-laboral.pdf',
      'ankle-sprain-first-aid.md'
    ]
  },
  {
    query: 'ejercicios para fortalecer el cuádriceps',
    language: 'es',
    subject: 'knee-injury',
    answers: ['ejercicios-para-la-rodilla.md'],
    near: [
      'informe-de-la-rodilla.pdf',
      'knee-follow-up-notes.txt',
      'baja-laboral.pdf',
      'ankle-sprain-first-aid.md'
    ]
  },
  {
    query: 'cuánto tiempo pongo hielo en la rodilla',
    language: 'es',
    subject: 'knee-injury',
    answers: ['informe-de-la-rodilla.pdf'],
    near: [
      'ejercicios-para-la-rodilla.md',
      'knee-follow-up-notes.txt',
      'baja-laboral.pdf',
      'ankle-sprain-first-aid.md'
    ]
  },
  {
    query: 'when can I go back to sport after a meniscus tear',
    language: 'en',
    subject: 'knee-injury',
    answers: ['ejercicios-para-la-rodilla.md', 'knee-follow-up-notes.txt'],
    near: ['informe-de-la-rodilla.pdf', 'baja-laboral.pdf', 'ankle-sprain-first-aid.md']
  },
  {
    query: 'how is my knee at the six week review',
    language: 'en',
    subject: 'knee-injury',
    answers: ['knee-follow-up-notes.txt'],
    near: [
      'informe-de-la-rodilla.pdf',
      'ejercicios-para-la-rodilla.md',
      'baja-laboral.pdf',
      'ankle-sprain-first-aid.md'
    ]
  },
  {
    query: 'cuánto cuesta reformar la cocina',
    language: 'es',
    subject: 'kitchen-renovation',
    answers: ['presupuesto-de-la-cocina.pdf', 'segundo-presupuesto-de-la-cocina.pdf'],
    near: [
      'kitchen-design-decisions.md',
      'licencia-de-obra-menor.txt',
      'bathroom-renovation-ideas.md'
    ]
  },
  {
    query: 'precio de la encimera de cuarzo',
    language: 'es',
    subject: 'kitchen-renovation',
    answers: ['presupuesto-de-la-cocina.pdf', 'segundo-presupuesto-de-la-cocina.pdf'],
    near: [
      'kitchen-design-decisions.md',
      'licencia-de-obra-menor.txt',
      'bathroom-renovation-ideas.md'
    ]
  },
  {
    query: 'kitchen renovation payment schedule',
    language: 'en',
    subject: 'kitchen-renovation',
    answers: ['presupuesto-de-la-cocina.pdf', 'segundo-presupuesto-de-la-cocina.pdf'],
    near: [
      'kitchen-design-decisions.md',
      'licencia-de-obra-menor.txt',
      'bathroom-renovation-ideas.md'
    ]
  },
  {
    query: 'cuánto tarda la obra de la cocina',
    language: 'es',
    subject: 'kitchen-renovation',
    answers: ['presupuesto-de-la-cocina.pdf', 'segundo-presupuesto-de-la-cocina.pdf'],
    near: [
      'kitchen-design-decisions.md',
      'licencia-de-obra-menor.txt',
      'bathroom-renovation-ideas.md'
    ]
  },
  {
    query: 'inducción o gas para la placa',
    language: 'es',
    subject: 'kitchen-renovation',
    answers: ['kitchen-design-decisions.md'],
    near: [
      'presupuesto-de-la-cocina.pdf',
      'segundo-presupuesto-de-la-cocina.pdf',
      'licencia-de-obra-menor.txt',
      'bathroom-renovation-ideas.md'
    ]
  },
  {
    query: 'why choose quartz over granite',
    language: 'en',
    subject: 'kitchen-renovation',
    answers: ['kitchen-design-decisions.md'],
    near: [
      'presupuesto-de-la-cocina.pdf',
      'segundo-presupuesto-de-la-cocina.pdf',
      'licencia-de-obra-menor.txt',
      'bathroom-renovation-ideas.md'
    ]
  },
  // A long Markdown with lists and tables.
  {
    query: 'por qué no se fondea sobre la posidonia',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: []
  },
  {
    query: 'qué es el blanqueamiento del coral',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: []
  },
  {
    query: 'a qué temperatura del agua muere un coral',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: []
  },
  {
    query: 'cuándo ponen los huevos las tortugas',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: []
  },
  {
    query: 'qué hago si me pica una medusa',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: []
  },
  {
    query: 'bandera morada en la playa',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: []
  },
  {
    query: 'por qué el mar sube más con luna llena',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: []
  },
  {
    query: 'dónde avistar ballenas en el sur',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: []
  },
  {
    query: 'animal que cambia de color para esconderse en las rocas',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: []
  },
  {
    query: 'consejos para hacer snorkel',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: []
  },
  {
    query: 'delfines',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: []
  },
  // A technical Markdown with code blocks, as the owner's are (#88).
  {
    query: 'cómo cancelo una petición si el componente se desmonta',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: []
  },
  {
    query: 'reintentar una petición que falla',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: []
  },
  {
    query: 'qué hago con un error 401',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: []
  },
  {
    query: 'invalidar la caché después de guardar',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: []
  },
  {
    query: 'actualización optimista con useMutation',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: []
  },
  {
    query: 'paginación con cursor en una lista larga',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: []
  },
  {
    query: 'mostrar el progreso de la subida de un archivo',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: []
  },
  {
    query: 'cómo mockear el servidor en los tests de un hook',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: []
  },
  {
    query: 'staleTime',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: []
  },
  {query: 'gatos', language: 'es', absent: 'off the subject', split: 'tuning', near: []},
  {
    query: 'cómo declarar la renta como autónomo',
    language: 'es',
    absent: 'off the subject',
    split: 'tuning',
    near: []
  },
  {
    query: 'reglas del ajedrez para principiantes',
    language: 'es',
    absent: 'off the subject',
    split: 'tuning',
    near: []
  },
  {
    query: 'the history of the Roman Empire',
    language: 'en',
    absent: 'off the subject',
    split: 'holdout',
    near: []
  },
  {
    query: 'aprender a tocar la guitarra',
    language: 'es',
    absent: 'off the subject',
    split: 'tuning',
    near: []
  },
  {
    query: 'el tiempo mañana en Madrid',
    language: 'es',
    absent: 'off the subject',
    split: 'holdout',
    near: []
  },
  // The owner's words on their technical Markdown (#89). No Resource of the corpus answers them.
  {
    query: 'feature flags',
    language: 'en',
    absent: 'technical term of the owner',
    split: 'tuning',
    near: []
  },
  {
    query: 'cómo abro un modal',
    language: 'es',
    absent: 'technical term of the owner',
    split: 'tuning',
    near: []
  },
  {
    query: 'componentes del design system',
    language: 'es',
    absent: 'technical term of the owner',
    split: 'tuning',
    near: []
  },
  {
    query: 'traducciones con react-polyglot',
    language: 'es',
    absent: 'technical term of the owner',
    split: 'holdout',
    near: []
  },
  {
    query: 'migrar el brand kit antiguo al resources center',
    language: 'es',
    absent: 'technical term of the owner',
    split: 'holdout',
    near: []
  },
  {query: 'asdkjh qwe', language: 'es', absent: 'noise', split: 'tuning', near: []},
  {query: 'qwerty', language: 'es', absent: 'noise', split: 'tuning', near: []},
  {query: 'zzzz', language: 'es', absent: 'noise', split: 'tuning', near: []},
  {query: 'jkl ñlk', language: 'es', absent: 'noise', split: 'holdout', near: []},
  {query: 'aaaa bbbb', language: 'es', absent: 'noise', split: 'tuning', near: []},
  {query: 'xkcd lol', language: 'es', absent: 'noise', split: 'tuning', near: []},
  {query: '123 456', language: 'es', absent: 'noise', split: 'holdout', near: []},
  {query: 'fdsfsd', language: 'es', absent: 'noise', split: 'holdout', near: []},
  {
    query: 'best hiking boots for the Pyrenees',
    language: 'en',
    absent: 'off the subject',
    split: 'holdout',
    near: []
  },
  {
    query: 'how to write a Storybook story for a component',
    language: 'en',
    absent: 'technical term of the owner',
    split: 'tuning',
    near: []
  },
  {query: 'lorem ipsum dolor', language: 'en', absent: 'noise', split: 'tuning', near: []}
];
