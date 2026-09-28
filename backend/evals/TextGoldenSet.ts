export type GoldenCase = {query: string; expected: string | null};

// null: the corpus does not hold the answer.
export const TEXT_GOLDEN_SET: readonly GoldenCase[] = [
  {
    query: 'cómo hacer un guiso de legumbres con chorizo',
    expected: 'receta-de-lentejas.md'
  },
  {query: 'hay que dejar las lentejas en remojo', expected: 'receta-de-lentejas.md'},
  {query: 'truco para que el caldo quede más espeso', expected: 'receta-de-lentejas.md'},
  {
    query: 'cada cuánto se engrasa la cadena de la bici',
    expected: 'mantenimiento-de-la-bicicleta.md'
  },
  {
    query: 'el cambio salta entre los piñones',
    expected: 'mantenimiento-de-la-bicicleta.md'
  },
  {
    query: 'presión de las ruedas de la bicicleta',
    expected: 'mantenimiento-de-la-bicicleta.md'
  },
  {query: 'qué visitar en Portugal', expected: 'notas-del-viaje-a-lisboa.txt'},
  {
    query: 'dónde coger el tranvía sin que vaya lleno',
    expected: 'notas-del-viaje-a-lisboa.txt'
  },
  {query: 'dulces típicos con canela', expected: 'notas-del-viaje-a-lisboa.txt'},
  {
    query: 'cada cuánto riego la monstera',
    expected: 'cuidado-de-las-plantas-de-interior.txt'
  },
  {
    query: 'por qué se ponen amarillas las hojas',
    expected: 'cuidado-de-las-plantas-de-interior.txt'
  },
  {
    query: 'cuándo cambiar una planta de maceta',
    expected: 'cuidado-de-las-plantas-de-interior.txt'
  },
  {query: 'alimentar la masa madre', expected: 'sourdough-starter.md'},
  {query: 'la masa madre tiene un líquido gris encima', expected: 'sourdough-starter.md'},
  {query: 'how do I know my starter is ready to bake', expected: 'sourdough-starter.md'},
  {query: 'contraseña del wifi de invitados', expected: 'home-network-setup.txt'},
  {
    query: 'se ha caído internet, qué reinicio primero',
    expected: 'home-network-setup.txt'
  },
  {
    query: 'why the smart plugs use a separate network',
    expected: 'home-network-setup.txt'
  },
  {query: 'plan de carrera de 21 kilómetros', expected: 'entrenamiento-media-maraton.md'},
  {
    query: 'series de un kilómetro los martes',
    expected: 'entrenamiento-media-maraton.md'
  },
  {query: 'qué comer antes de una carrera', expected: 'entrenamiento-media-maraton.md'},
  {query: 'cuánto pago de alquiler al mes', expected: 'contrato-de-alquiler.pdf'},
  {
    query: 'me devuelven el depósito al irme del piso',
    expected: 'contrato-de-alquiler.pdf'
  },
  {query: 'se pueden tener perros en la vivienda', expected: 'contrato-de-alquiler.pdf'},
  {query: 'lesión de menisco', expected: 'informe-de-la-rodilla.pdf'},
  {
    query: 'me hice daño en la rodilla jugando al pádel',
    expected: 'informe-de-la-rodilla.pdf'
  },
  {query: 'do I need knee surgery', expected: 'informe-de-la-rodilla.pdf'},
  {query: 'cuánto cuesta reformar la cocina', expected: 'presupuesto-de-la-cocina.pdf'},
  {query: 'precio de la encimera de cuarzo', expected: 'presupuesto-de-la-cocina.pdf'},
  {
    query: 'kitchen renovation payment schedule',
    expected: 'presupuesto-de-la-cocina.pdf'
  },
  {query: 'gatos', expected: null},
  {query: 'cómo declarar la renta como autónomo', expected: null},
  {query: 'reglas del ajedrez para principiantes', expected: null},
  {query: 'the history of the Roman Empire', expected: null},
  {query: 'aprender a tocar la guitarra', expected: null}
];
