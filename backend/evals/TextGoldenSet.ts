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
    near: [
      'acuario-de-agua-salada.md',
      'open-water-course-booking.pdf',
      'rock-pools-with-kids.md'
    ]
  },
  {
    query: 'qué es el blanqueamiento del coral',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: [
      'acuario-de-agua-salada.md',
      'open-water-course-booking.pdf',
      'rock-pools-with-kids.md'
    ]
  },
  {
    query: 'a qué temperatura del agua muere un coral',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: [
      'acuario-de-agua-salada.md',
      'open-water-course-booking.pdf',
      'rock-pools-with-kids.md'
    ]
  },
  {
    query: 'cuándo ponen los huevos las tortugas',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: [
      'acuario-de-agua-salada.md',
      'open-water-course-booking.pdf',
      'rock-pools-with-kids.md'
    ]
  },
  {
    query: 'qué hago si me pica una medusa',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: [
      'acuario-de-agua-salada.md',
      'open-water-course-booking.pdf',
      'rock-pools-with-kids.md'
    ]
  },
  {
    query: 'bandera morada en la playa',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: [
      'acuario-de-agua-salada.md',
      'open-water-course-booking.pdf',
      'rock-pools-with-kids.md'
    ]
  },
  {
    query: 'por qué el mar sube más con luna llena',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: [
      'acuario-de-agua-salada.md',
      'open-water-course-booking.pdf',
      'rock-pools-with-kids.md'
    ]
  },
  {
    query: 'dónde avistar ballenas en el sur',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: [
      'acuario-de-agua-salada.md',
      'open-water-course-booking.pdf',
      'rock-pools-with-kids.md'
    ]
  },
  {
    query: 'animal que cambia de color para esconderse en las rocas',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: [
      'acuario-de-agua-salada.md',
      'open-water-course-booking.pdf',
      'rock-pools-with-kids.md'
    ]
  },
  {
    query: 'consejos para hacer snorkel',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: [
      'acuario-de-agua-salada.md',
      'open-water-course-booking.pdf',
      'rock-pools-with-kids.md'
    ]
  },
  {
    query: 'delfines',
    language: 'es',
    subject: 'marine-life',
    answers: ['guia-de-la-vida-marina.md'],
    near: [
      'acuario-de-agua-salada.md',
      'open-water-course-booking.pdf',
      'rock-pools-with-kids.md'
    ]
  },
  // A technical Markdown with code blocks, as the owner's are (#88).
  {
    query: 'cómo cancelo una petición si el componente se desmonta',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: [
      'server-sent-events-para-avisos.md',
      'cors-errors-in-local-dev.md',
      'contrato-de-la-api-de-pedidos.pdf'
    ]
  },
  {
    query: 'reintentar una petición que falla',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: [
      'server-sent-events-para-avisos.md',
      'cors-errors-in-local-dev.md',
      'contrato-de-la-api-de-pedidos.pdf'
    ]
  },
  {
    query: 'qué hago con un error 401',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: [
      'server-sent-events-para-avisos.md',
      'cors-errors-in-local-dev.md',
      'contrato-de-la-api-de-pedidos.pdf'
    ]
  },
  {
    query: 'invalidar la caché después de guardar',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: [
      'server-sent-events-para-avisos.md',
      'cors-errors-in-local-dev.md',
      'contrato-de-la-api-de-pedidos.pdf'
    ]
  },
  {
    query: 'actualización optimista con useMutation',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: [
      'server-sent-events-para-avisos.md',
      'cors-errors-in-local-dev.md',
      'contrato-de-la-api-de-pedidos.pdf'
    ]
  },
  {
    query: 'paginación con cursor en una lista larga',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: [
      'server-sent-events-para-avisos.md',
      'cors-errors-in-local-dev.md',
      'contrato-de-la-api-de-pedidos.pdf'
    ]
  },
  {
    query: 'mostrar el progreso de la subida de un archivo',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: [
      'server-sent-events-para-avisos.md',
      'cors-errors-in-local-dev.md',
      'contrato-de-la-api-de-pedidos.pdf'
    ]
  },
  {
    query: 'cómo mockear el servidor en los tests de un hook',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: [
      'server-sent-events-para-avisos.md',
      'cors-errors-in-local-dev.md',
      'contrato-de-la-api-de-pedidos.pdf'
    ]
  },
  {
    query: 'staleTime',
    language: 'es',
    subject: 'server-requests',
    answers: ['patrones-de-peticiones-al-servidor.md'],
    near: [
      'server-sent-events-para-avisos.md',
      'cors-errors-in-local-dev.md',
      'contrato-de-la-api-de-pedidos.pdf'
    ]
  },
  {
    query: 'qué salinidad necesita un acuario marino',
    language: 'es',
    subject: 'marine-life',
    answers: ['acuario-de-agua-salada.md'],
    near: [
      'guia-de-la-vida-marina.md',
      'open-water-course-booking.pdf',
      'rock-pools-with-kids.md'
    ]
  },
  {
    query: 'cuánto cuesta sacarse el título de buceo',
    language: 'es',
    subject: 'marine-life',
    answers: ['open-water-course-booking.pdf'],
    near: [
      'guia-de-la-vida-marina.md',
      'acuario-de-agua-salada.md',
      'rock-pools-with-kids.md'
    ]
  },
  {
    query: 'what animals live in the rock pools at low tide',
    language: 'en',
    subject: 'marine-life',
    answers: ['rock-pools-with-kids.md'],
    near: [
      'guia-de-la-vida-marina.md',
      'acuario-de-agua-salada.md',
      'open-water-course-booking.pdf'
    ]
  },
  {
    query: 'por qué usamos server-sent events y no websockets',
    language: 'es',
    subject: 'server-requests',
    answers: ['server-sent-events-para-avisos.md'],
    near: [
      'patrones-de-peticiones-al-servidor.md',
      'cors-errors-in-local-dev.md',
      'contrato-de-la-api-de-pedidos.pdf'
    ]
  },
  {
    query: 'CORS error when the frontend calls the API on localhost',
    language: 'en',
    subject: 'server-requests',
    answers: ['cors-errors-in-local-dev.md'],
    near: [
      'patrones-de-peticiones-al-servidor.md',
      'server-sent-events-para-avisos.md',
      'contrato-de-la-api-de-pedidos.pdf'
    ]
  },
  {
    query: 'qué devuelve la API al crear un pedido',
    language: 'es',
    subject: 'server-requests',
    answers: ['contrato-de-la-api-de-pedidos.pdf'],
    near: [
      'patrones-de-peticiones-al-servidor.md',
      'server-sent-events-para-avisos.md',
      'cors-errors-in-local-dev.md'
    ]
  },
  {
    query: 'cuánto pagué de luz en enero',
    language: 'es',
    subject: 'electricity-bill',
    answers: ['factura-de-la-luz-de-enero.pdf'],
    near: [
      'tarifas-de-la-luz-por-horas.md',
      'switching-electricity-supplier.txt',
      'bono-social-electrico.txt',
      'solar-panels-quote.md'
    ]
  },
  {
    query: 'a qué horas es más barata la luz',
    language: 'es',
    subject: 'electricity-bill',
    answers: ['tarifas-de-la-luz-por-horas.md', 'factura-de-la-luz-de-enero.pdf'],
    near: [
      'switching-electricity-supplier.txt',
      'bono-social-electrico.txt',
      'solar-panels-quote.md'
    ]
  },
  {
    query: 'cuándo pongo la lavadora para que salga más barato',
    language: 'es',
    subject: 'electricity-bill',
    answers: ['tarifas-de-la-luz-por-horas.md', 'factura-de-la-luz-de-enero.pdf'],
    near: [
      'switching-electricity-supplier.txt',
      'bono-social-electrico.txt',
      'solar-panels-quote.md'
    ]
  },
  {
    query: 'qué potencia tengo contratada',
    language: 'es',
    subject: 'electricity-bill',
    answers: ['factura-de-la-luz-de-enero.pdf', 'solar-panels-quote.md'],
    near: [
      'tarifas-de-la-luz-por-horas.md',
      'switching-electricity-supplier.txt',
      'bono-social-electrico.txt'
    ]
  },
  {
    query: 'cómo me cambio de compañía de la luz',
    language: 'es',
    subject: 'electricity-bill',
    answers: ['switching-electricity-supplier.txt'],
    near: [
      'factura-de-la-luz-de-enero.pdf',
      'tarifas-de-la-luz-por-horas.md',
      'bono-social-electrico.txt',
      'solar-panels-quote.md'
    ]
  },
  {
    query: 'where do I find the CUPS code',
    language: 'en',
    subject: 'electricity-bill',
    answers: ['factura-de-la-luz-de-enero.pdf', 'switching-electricity-supplier.txt'],
    near: [
      'tarifas-de-la-luz-por-horas.md',
      'bono-social-electrico.txt',
      'solar-panels-quote.md'
    ]
  },
  {
    query: 'descuento en la luz para familias con pocos ingresos',
    language: 'es',
    subject: 'electricity-bill',
    answers: ['bono-social-electrico.txt'],
    near: [
      'factura-de-la-luz-de-enero.pdf',
      'tarifas-de-la-luz-por-horas.md',
      'switching-electricity-supplier.txt',
      'solar-panels-quote.md'
    ]
  },
  {
    query: 'how many years until the solar panels pay for themselves',
    language: 'en',
    subject: 'electricity-bill',
    answers: ['solar-panels-quote.md'],
    near: [
      'factura-de-la-luz-de-enero.pdf',
      'tarifas-de-la-luz-por-horas.md',
      'switching-electricity-supplier.txt',
      'bono-social-electrico.txt'
    ]
  },
  {
    query: 'cuánto es la franquicia del seguro del coche',
    language: 'es',
    subject: 'car-insurance',
    answers: ['poliza-del-seguro-del-coche.pdf', 'renewal-quote-comparison.md'],
    near: [
      'parte-amistoso-como-rellenarlo.md',
      'itv-del-coche.txt',
      'windscreen-chip-claim.txt'
    ]
  },
  {
    query: 'cómo se rellena el parte amistoso',
    language: 'es',
    subject: 'car-insurance',
    answers: ['parte-amistoso-como-rellenarlo.md'],
    near: [
      'poliza-del-seguro-del-coche.pdf',
      'renewal-quote-comparison.md',
      'itv-del-coche.txt',
      'windscreen-chip-claim.txt'
    ]
  },
  {
    query: 'en cuántos días hay que avisar al seguro de un accidente',
    language: 'es',
    subject: 'car-insurance',
    answers: ['poliza-del-seguro-del-coche.pdf', 'parte-amistoso-como-rellenarlo.md'],
    near: [
      'renewal-quote-comparison.md',
      'itv-del-coche.txt',
      'windscreen-chip-claim.txt'
    ]
  },
  {
    query: 'teléfono de la grúa',
    language: 'es',
    subject: 'car-insurance',
    answers: ['poliza-del-seguro-del-coche.pdf'],
    near: [
      'parte-amistoso-como-rellenarlo.md',
      'renewal-quote-comparison.md',
      'itv-del-coche.txt',
      'windscreen-chip-claim.txt'
    ]
  },
  {
    query: 'is the windscreen repair free',
    language: 'en',
    subject: 'car-insurance',
    answers: ['poliza-del-seguro-del-coche.pdf', 'windscreen-chip-claim.txt'],
    near: [
      'parte-amistoso-como-rellenarlo.md',
      'renewal-quote-comparison.md',
      'itv-del-coche.txt'
    ]
  },
  {
    query: 'can my 20 year old son drive my car',
    language: 'en',
    subject: 'car-insurance',
    answers: ['poliza-del-seguro-del-coche.pdf'],
    near: [
      'parte-amistoso-como-rellenarlo.md',
      'renewal-quote-comparison.md',
      'itv-del-coche.txt',
      'windscreen-chip-claim.txt'
    ]
  },
  {
    query: 'cuándo tengo que pasar la ITV',
    language: 'es',
    subject: 'car-insurance',
    answers: ['itv-del-coche.txt'],
    near: [
      'poliza-del-seguro-del-coche.pdf',
      'parte-amistoso-como-rellenarlo.md',
      'renewal-quote-comparison.md',
      'windscreen-chip-claim.txt'
    ]
  },
  {
    query: 'how much does the car insurance cost per year',
    language: 'en',
    subject: 'car-insurance',
    answers: ['poliza-del-seguro-del-coche.pdf', 'renewal-quote-comparison.md'],
    near: [
      'parte-amistoso-como-rellenarlo.md',
      'itv-del-coche.txt',
      'windscreen-chip-claim.txt'
    ]
  },
  {
    query: 'velocidad mínima para que la foto no salga movida',
    language: 'es',
    subject: 'photography',
    answers: ['exposure-triangle-notes.md', 'fotografia-nocturna.md'],
    near: [
      'factura-de-la-camara.pdf',
      'limpiar-el-sensor.txt',
      'photo-backup-workflow.md'
    ]
  },
  {
    query: 'cómo fotografiar la Vía Láctea',
    language: 'es',
    subject: 'photography',
    answers: ['fotografia-nocturna.md'],
    near: [
      'exposure-triangle-notes.md',
      'factura-de-la-camara.pdf',
      'limpiar-el-sensor.txt',
      'photo-backup-workflow.md'
    ]
  },
  {
    query: 'what ISO for photos at night',
    language: 'en',
    subject: 'photography',
    answers: ['fotografia-nocturna.md', 'exposure-triangle-notes.md'],
    near: [
      'factura-de-la-camara.pdf',
      'limpiar-el-sensor.txt',
      'photo-backup-workflow.md'
    ]
  },
  {
    query: 'cuánto dura la garantía de la cámara',
    language: 'es',
    subject: 'photography',
    answers: ['factura-de-la-camara.pdf'],
    near: [
      'exposure-triangle-notes.md',
      'fotografia-nocturna.md',
      'limpiar-el-sensor.txt',
      'photo-backup-workflow.md'
    ]
  },
  {
    query: 'how to clean dust off the camera sensor',
    language: 'en',
    subject: 'photography',
    answers: ['limpiar-el-sensor.txt'],
    near: [
      'exposure-triangle-notes.md',
      'fotografia-nocturna.md',
      'factura-de-la-camara.pdf',
      'photo-backup-workflow.md'
    ]
  },
  {
    query: 'apertura para desenfocar el fondo en un retrato',
    language: 'es',
    subject: 'photography',
    answers: ['exposure-triangle-notes.md'],
    near: [
      'fotografia-nocturna.md',
      'factura-de-la-camara.pdf',
      'limpiar-el-sensor.txt',
      'photo-backup-workflow.md'
    ]
  },
  {
    query: 'where are the backups of my photos',
    language: 'en',
    subject: 'photography',
    answers: ['photo-backup-workflow.md'],
    near: [
      'exposure-triangle-notes.md',
      'fotografia-nocturna.md',
      'factura-de-la-camara.pdf',
      'limpiar-el-sensor.txt'
    ]
  },
  {
    query: 'puedo limpiar el sensor con aire comprimido',
    language: 'es',
    subject: 'photography',
    answers: ['limpiar-el-sensor.txt'],
    near: [
      'exposure-triangle-notes.md',
      'fotografia-nocturna.md',
      'factura-de-la-camara.pdf',
      'photo-backup-workflow.md'
    ]
  },
  {
    query: 'cuánto cobraría en el trabajo nuevo',
    language: 'es',
    subject: 'job-interview',
    answers: ['oferta-de-trabajo.pdf', 'negociar-el-salario.txt'],
    near: [
      'preparacion-entrevista-backend.md',
      'system-design-practice.md',
      'thank-you-email-after-interview.txt'
    ]
  },
  {
    query: 'cuántos días de teletrabajo tiene la oferta',
    language: 'es',
    subject: 'job-interview',
    answers: ['oferta-de-trabajo.pdf', 'preparacion-entrevista-backend.md'],
    near: [
      'system-design-practice.md',
      'thank-you-email-after-interview.txt',
      'negociar-el-salario.txt'
    ]
  },
  {
    query: 'método STAR para responder en una entrevista',
    language: 'es',
    subject: 'job-interview',
    answers: ['preparacion-entrevista-backend.md'],
    near: [
      'oferta-de-trabajo.pdf',
      'system-design-practice.md',
      'thank-you-email-after-interview.txt',
      'negociar-el-salario.txt'
    ]
  },
  {
    query: 'how to design a URL shortener',
    language: 'en',
    subject: 'job-interview',
    answers: ['system-design-practice.md'],
    near: [
      'preparacion-entrevista-backend.md',
      'oferta-de-trabajo.pdf',
      'thank-you-email-after-interview.txt',
      'negociar-el-salario.txt'
    ]
  },
  {
    query: 'what to write in the email after the interview',
    language: 'en',
    subject: 'job-interview',
    answers: ['thank-you-email-after-interview.txt'],
    near: [
      'preparacion-entrevista-backend.md',
      'oferta-de-trabajo.pdf',
      'system-design-practice.md',
      'negociar-el-salario.txt'
    ]
  },
  {
    query: 'cómo pido más sueldo sin perder la oferta',
    language: 'es',
    subject: 'job-interview',
    answers: ['negociar-el-salario.txt'],
    near: [
      'preparacion-entrevista-backend.md',
      'oferta-de-trabajo.pdf',
      'system-design-practice.md',
      'thank-you-email-after-interview.txt'
    ]
  },
  {
    query: 'qué rango de sueldo pido',
    language: 'es',
    subject: 'job-interview',
    answers: ['preparacion-entrevista-backend.md', 'negociar-el-salario.txt'],
    near: [
      'oferta-de-trabajo.pdf',
      'system-design-practice.md',
      'thank-you-email-after-interview.txt'
    ]
  },
  {
    query: 'how long is the trial period of the new job',
    language: 'en',
    subject: 'job-interview',
    answers: ['oferta-de-trabajo.pdf'],
    near: [
      'preparacion-entrevista-backend.md',
      'system-design-practice.md',
      'thank-you-email-after-interview.txt',
      'negociar-el-salario.txt'
    ]
  },
  {
    query: 'cuándo se plantan los tomates',
    language: 'es',
    subject: 'vegetable-garden',
    answers: ['calendario-de-siembra.md'],
    near: [
      'riego-por-goteo-del-huerto.txt',
      'tomato-blight.md',
      'normas-del-huerto-urbano.pdf',
      'compost-bin-notes.txt'
    ]
  },
  {
    query: 'cuándo planto los ajos',
    language: 'es',
    subject: 'vegetable-garden',
    answers: ['calendario-de-siembra.md'],
    near: [
      'riego-por-goteo-del-huerto.txt',
      'tomato-blight.md',
      'normas-del-huerto-urbano.pdf',
      'compost-bin-notes.txt'
    ]
  },
  {
    query: 'cuánto tiempo riego el huerto en verano',
    language: 'es',
    subject: 'vegetable-garden',
    answers: ['riego-por-goteo-del-huerto.txt', 'calendario-de-siembra.md'],
    near: ['tomato-blight.md', 'normas-del-huerto-urbano.pdf', 'compost-bin-notes.txt']
  },
  {
    query: 'manchas marrones en las hojas de la tomatera',
    language: 'es',
    subject: 'vegetable-garden',
    answers: ['tomato-blight.md'],
    near: [
      'calendario-de-siembra.md',
      'riego-por-goteo-del-huerto.txt',
      'normas-del-huerto-urbano.pdf',
      'compost-bin-notes.txt'
    ]
  },
  {
    query: 'can I use chemical sprays on the allotment',
    language: 'en',
    subject: 'vegetable-garden',
    answers: ['normas-del-huerto-urbano.pdf', 'tomato-blight.md'],
    near: [
      'calendario-de-siembra.md',
      'riego-por-goteo-del-huerto.txt',
      'compost-bin-notes.txt'
    ]
  },
  {
    query: 'cuánto cuesta la parcela del huerto urbano',
    language: 'es',
    subject: 'vegetable-garden',
    answers: ['normas-del-huerto-urbano.pdf'],
    near: [
      'calendario-de-siembra.md',
      'riego-por-goteo-del-huerto.txt',
      'tomato-blight.md',
      'compost-bin-notes.txt'
    ]
  },
  {
    query: 'how long until the compost is ready',
    language: 'en',
    subject: 'vegetable-garden',
    answers: ['compost-bin-notes.txt'],
    near: [
      'calendario-de-siembra.md',
      'riego-por-goteo-del-huerto.txt',
      'tomato-blight.md',
      'normas-del-huerto-urbano.pdf'
    ]
  },
  {
    query: 'regar las tomateras por la mañana o por la tarde',
    language: 'es',
    subject: 'vegetable-garden',
    answers: [
      'riego-por-goteo-del-huerto.txt',
      'tomato-blight.md',
      'calendario-de-siembra.md'
    ],
    near: ['normas-del-huerto-urbano.pdf', 'compost-bin-notes.txt']
  },
  {
    query: 'cuánto cuesta el menú de la boda por persona',
    language: 'es',
    subject: 'wedding-planning',
    answers: ['presupuesto-del-banquete.pdf', 'wedding-timeline.md'],
    near: [
      'lista-de-invitados.txt',
      'discurso-del-padrino.md',
      'papeles-para-casarse-por-lo-civil.md'
    ]
  },
  {
    query: 'cuánto hay que dejar de señal al restaurante',
    language: 'es',
    subject: 'wedding-planning',
    answers: ['presupuesto-del-banquete.pdf', 'wedding-timeline.md'],
    near: [
      'lista-de-invitados.txt',
      'discurso-del-padrino.md',
      'papeles-para-casarse-por-lo-civil.md'
    ]
  },
  {
    query: 'qué papeles hacen falta para casarse por lo civil',
    language: 'es',
    subject: 'wedding-planning',
    answers: ['papeles-para-casarse-por-lo-civil.md'],
    near: [
      'presupuesto-del-banquete.pdf',
      'lista-de-invitados.txt',
      'wedding-timeline.md',
      'discurso-del-padrino.md'
    ]
  },
  {
    query: 'cuántos testigos necesitamos para la boda',
    language: 'es',
    subject: 'wedding-planning',
    answers: ['papeles-para-casarse-por-lo-civil.md'],
    near: [
      'presupuesto-del-banquete.pdf',
      'lista-de-invitados.txt',
      'wedding-timeline.md',
      'discurso-del-padrino.md'
    ]
  },
  {
    query: 'when do we send the wedding invitations',
    language: 'en',
    subject: 'wedding-planning',
    answers: ['wedding-timeline.md'],
    near: [
      'presupuesto-del-banquete.pdf',
      'lista-de-invitados.txt',
      'discurso-del-padrino.md',
      'papeles-para-casarse-por-lo-civil.md'
    ]
  },
  {
    query: 'how many guests are coming to the wedding',
    language: 'en',
    subject: 'wedding-planning',
    answers: ['lista-de-invitados.txt', 'presupuesto-del-banquete.pdf'],
    near: [
      'wedding-timeline.md',
      'discurso-del-padrino.md',
      'papeles-para-casarse-por-lo-civil.md'
    ]
  },
  {
    query: 'ideas para el discurso del padrino',
    language: 'es',
    subject: 'wedding-planning',
    answers: ['discurso-del-padrino.md'],
    near: [
      'presupuesto-del-banquete.pdf',
      'lista-de-invitados.txt',
      'wedding-timeline.md',
      'papeles-para-casarse-por-lo-civil.md'
    ]
  },
  {
    query: 'cuánto cuesta la empresa de mudanzas',
    language: 'es',
    subject: 'moving-house',
    answers: ['presupuesto-de-la-mudanza.pdf', 'checklist-cambio-de-domicilio.md'],
    near: ['packing-tips.md', 'inventory-of-boxes.txt']
  },
  {
    query: 'la mudanza tiene seguro si se rompe algo',
    language: 'es',
    subject: 'moving-house',
    answers: ['presupuesto-de-la-mudanza.pdf'],
    near: [
      'checklist-cambio-de-domicilio.md',
      'packing-tips.md',
      'inventory-of-boxes.txt'
    ]
  },
  {
    query: 'dónde me empadrono al cambiar de piso',
    language: 'es',
    subject: 'moving-house',
    answers: ['checklist-cambio-de-domicilio.md'],
    near: ['presupuesto-de-la-mudanza.pdf', 'packing-tips.md', 'inventory-of-boxes.txt']
  },
  {
    query: 'a quién aviso del cambio de dirección',
    language: 'es',
    subject: 'moving-house',
    answers: ['checklist-cambio-de-domicilio.md'],
    near: ['presupuesto-de-la-mudanza.pdf', 'packing-tips.md', 'inventory-of-boxes.txt']
  },
  {
    query: 'how to pack books for a move',
    language: 'en',
    subject: 'moving-house',
    answers: ['packing-tips.md'],
    near: [
      'presupuesto-de-la-mudanza.pdf',
      'checklist-cambio-de-domicilio.md',
      'inventory-of-boxes.txt'
    ]
  },
  {
    query: 'qué meto en la caja de la primera noche',
    language: 'es',
    subject: 'moving-house',
    answers: ['packing-tips.md', 'inventory-of-boxes.txt'],
    near: ['presupuesto-de-la-mudanza.pdf', 'checklist-cambio-de-domicilio.md']
  },
  {
    query: 'which box has the kettle',
    language: 'en',
    subject: 'moving-house',
    answers: ['inventory-of-boxes.txt', 'packing-tips.md'],
    near: ['presupuesto-de-la-mudanza.pdf', 'checklist-cambio-de-domicilio.md']
  },
  {
    query: 'do the movers pack the boxes for us',
    language: 'en',
    subject: 'moving-house',
    answers: ['presupuesto-de-la-mudanza.pdf', 'packing-tips.md'],
    near: ['checklist-cambio-de-domicilio.md', 'inventory-of-boxes.txt']
  },
  {
    query: 'proporción de café y agua para el V60',
    language: 'es',
    subject: 'coffee-brewing',
    answers: ['v60-recipe.md'],
    near: [
      'cafetera-italiana.md',
      'descalcificar-la-cafetera.txt',
      'ticket-de-la-tostaduria.pdf',
      'coffee-and-sleep.txt'
    ]
  },
  {
    query: 'temperatura del agua para el café de filtro',
    language: 'es',
    subject: 'coffee-brewing',
    answers: ['v60-recipe.md'],
    near: [
      'cafetera-italiana.md',
      'descalcificar-la-cafetera.txt',
      'ticket-de-la-tostaduria.pdf',
      'coffee-and-sleep.txt'
    ]
  },
  {
    query: 'how fine to grind coffee for a moka pot',
    language: 'en',
    subject: 'coffee-brewing',
    answers: ['cafetera-italiana.md', 'v60-recipe.md'],
    near: [
      'descalcificar-la-cafetera.txt',
      'ticket-de-la-tostaduria.pdf',
      'coffee-and-sleep.txt'
    ]
  },
  {
    query: 'se aprieta el café en la cafetera italiana',
    language: 'es',
    subject: 'coffee-brewing',
    answers: ['cafetera-italiana.md'],
    near: [
      'v60-recipe.md',
      'descalcificar-la-cafetera.txt',
      'ticket-de-la-tostaduria.pdf',
      'coffee-and-sleep.txt'
    ]
  },
  {
    query: 'cada cuánto hay que descalcificar la cafetera',
    language: 'es',
    subject: 'coffee-brewing',
    answers: ['descalcificar-la-cafetera.txt'],
    near: [
      'v60-recipe.md',
      'cafetera-italiana.md',
      'ticket-de-la-tostaduria.pdf',
      'coffee-and-sleep.txt'
    ]
  },
  {
    query: 'how many days after roasting is coffee at its best',
    language: 'en',
    subject: 'coffee-brewing',
    answers: ['ticket-de-la-tostaduria.pdf', 'v60-recipe.md'],
    near: [
      'cafetera-italiana.md',
      'descalcificar-la-cafetera.txt',
      'coffee-and-sleep.txt'
    ]
  },
  {
    query: 'a partir de qué hora no tomar café para dormir bien',
    language: 'es',
    subject: 'coffee-brewing',
    answers: ['coffee-and-sleep.txt'],
    near: [
      'v60-recipe.md',
      'cafetera-italiana.md',
      'descalcificar-la-cafetera.txt',
      'ticket-de-la-tostaduria.pdf'
    ]
  },
  {
    query: 'agua del grifo o filtrada para el café',
    language: 'es',
    subject: 'coffee-brewing',
    answers: ['v60-recipe.md', 'descalcificar-la-cafetera.txt'],
    near: ['cafetera-italiana.md', 'ticket-de-la-tostaduria.pdf', 'coffee-and-sleep.txt']
  },
  {
    query: 'suscripciones de GraphQL',
    language: 'es',
    absent: 'technical term of the owner',
    subject: 'server-requests',
    near: [
      'patrones-de-peticiones-al-servidor.md',
      'server-sent-events-para-avisos.md',
      'cors-errors-in-local-dev.md',
      'contrato-de-la-api-de-pedidos.pdf'
    ]
  },
  {
    query: 'configurar el service worker para usar la app sin conexión',
    language: 'es',
    absent: 'technical term of the owner',
    subject: 'server-requests',
    near: [
      'patrones-de-peticiones-al-servidor.md',
      'server-sent-events-para-avisos.md',
      'cors-errors-in-local-dev.md',
      'contrato-de-la-api-de-pedidos.pdf'
    ]
  },
  {
    query: 'rate limiting with Redis in the backend',
    language: 'en',
    absent: 'technical term of the owner',
    subject: 'server-requests',
    near: [
      'patrones-de-peticiones-al-servidor.md',
      'server-sent-events-para-avisos.md',
      'cors-errors-in-local-dev.md',
      'contrato-de-la-api-de-pedidos.pdf'
    ]
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
  {
    query: 'receta de tortilla de patatas',
    language: 'es',
    absent: 'off the subject',
    split: 'tuning',
    near: []
  },
  {
    query: 'síntomas de la gripe',
    language: 'es',
    absent: 'off the subject',
    split: 'holdout',
    near: []
  },
  {
    query: 'historia de la catedral de Burgos',
    language: 'es',
    absent: 'off the subject',
    split: 'tuning',
    near: []
  },
  {
    query: 'cómo hacer punto de cruz',
    language: 'es',
    absent: 'off the subject',
    split: 'tuning',
    near: []
  },
  {
    query: 'how to play poker',
    language: 'en',
    absent: 'off the subject',
    split: 'holdout',
    near: []
  },
  {
    query: 'horario de la biblioteca municipal',
    language: 'es',
    absent: 'off the subject',
    split: 'tuning',
    near: []
  },
  {
    query: 'añadir un evento de analítica en el editor',
    language: 'es',
    absent: 'technical term of the owner',
    split: 'tuning',
    near: []
  },
  {
    query: 'despliegue con el pipeline de Jenkins',
    language: 'es',
    absent: 'technical term of the owner',
    split: 'holdout',
    near: []
  },
  {
    query: 'theme tokens for dark mode',
    language: 'en',
    absent: 'technical term of the owner',
    split: 'tuning',
    near: []
  },
  {
    query: 'permisos del rol de editor en el workspace',
    language: 'es',
    absent: 'technical term of the owner',
    split: 'tuning',
    near: []
  },
  {query: 'ññññ', language: 'es', absent: 'noise', split: 'tuning', near: []},
  {query: 'asdf asdf', language: 'es', absent: 'noise', split: 'holdout', near: []},
  {query: 'kkkk jjjj', language: 'es', absent: 'noise', split: 'tuning', near: []},
  {query: 'hjkl', language: 'en', absent: 'noise', split: 'tuning', near: []},
  {query: '0000', language: 'es', absent: 'noise', split: 'holdout', near: []},
  {query: 'lorem ipsum dolor', language: 'en', absent: 'noise', split: 'tuning', near: []}
];
