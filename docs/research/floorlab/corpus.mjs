// A small stand-in corpus for the text space: 20 passages of about the length
// a chunk will have, over five subjects that do not overlap.
//
// The subjects are coffee, Postgres, bicycle maintenance, Spanish cooking and
// a rental contract. Nothing in the corpus is about medicine, astronomy,
// football or music -- those are the subjects the "absent" queries use.

export const PASSAGES = [
  // coffee
  ['coffee-1', 'A pour-over brew needs water between 92 and 96 degrees Celsius. Below that range the extraction is thin and sour. Above it the coffee turns bitter because the water pulls out the heavier compounds too fast.'],
  ['coffee-2', 'Grind size decides how long the water stays in contact with the bed. A coarse grind drains quickly and suits a French press. A fine grind resists the flow and suits an espresso machine, where the pressure does the work.'],
  ['coffee-3', 'Store roasted beans in an opaque container with a one-way valve. Oxygen is the enemy, not the freezer. Beans lose most of their aroma within three weeks of the roast date, whatever the bag promises.'],
  ['coffee-4', 'A typical espresso shot uses 18 grams of ground coffee and gives about 36 grams of liquid in 25 to 30 seconds. If the shot runs faster, grind finer. If it chokes the machine, grind coarser.'],
  // postgres
  ['pg-1', 'The pgvector extension adds a vector column type to PostgreSQL. You must run CREATE EXTENSION vector once per database before any table can declare such a column. The extension ships the distance operators as well.'],
  ['pg-2', 'An HNSW index trades recall for speed. Without an index PostgreSQL scans every row and the result is exact. With an index the search follows a graph and can miss a neighbour, so the recall must be measured, not assumed.'],
  ['pg-3', 'A foreign key with ON DELETE CASCADE removes the child rows when the parent row goes. It keeps the lifecycle in the database instead of in application code, where a forgotten branch leaves orphan rows behind.'],
  ['pg-4', 'VACUUM reclaims the space that dead tuples hold. PostgreSQL never overwrites a row in place; an update writes a new version and marks the old one dead. Autovacuum normally does this, but a heavy write load can outrun it.'],
  // bicycle
  ['bike-1', 'A chain wears by stretching between the rollers. Measure it with a chain checker. Replace the chain at 0.5 percent wear and the cassette survives; wait until 1 percent and you replace both.'],
  ['bike-2', 'Hydraulic disc brakes need bleeding when the lever feels spongy. Air enters the line through the seals over time. The procedure pushes fresh mineral oil or DOT fluid from the caliper upward to the lever reservoir.'],
  ['bike-3', 'Tyre pressure depends on rider weight and tyre width more than on the number printed on the sidewall. A wide tyre at lower pressure rolls faster on rough tarmac because it loses less energy to vibration.'],
  ['bike-4', 'Adjust the derailleur limit screws before you touch the cable tension. The high screw stops the chain falling outside the largest sprocket and the low screw stops it dropping into the spokes.'],
  // cooking
  ['food-1', 'A Spanish omelette needs potatoes cooked slowly in plenty of olive oil until soft, never browned. Drain them, mix them into the beaten eggs, and rest the mixture for ten minutes before it returns to the pan.'],
  ['food-2', 'Paella rice must not be stirred once the stock goes in. Stirring releases starch and the grains turn creamy, which is what a risotto wants and a paella does not. The crust at the bottom is the point.'],
  ['food-3', 'Gazpacho is a cold soup of raw tomato, cucumber, pepper, garlic, bread, oil and vinegar. Blend it, pass it through a sieve, and chill it for at least two hours so the flavours settle.'],
  ['food-4', 'Salt the water for pasta heavily; it is the only chance to season the pasta itself. Keep a cup of the starchy cooking water to loosen the sauce at the end, because it binds the fat and the water together.'],
  // rental contract
  ['rent-1', 'The tenant pays a deposit of one month of rent at the signature of the contract. The landlord returns it within thirty days of the end of the lease, less any amount for damage beyond normal wear.'],
  ['rent-2', 'The lease runs for twelve months and renews automatically unless either party gives notice in writing at least sixty days before the end date. Notice by electronic mail is valid under this clause.'],
  ['rent-3', 'Repairs to the structure, the roof and the installations are the responsibility of the landlord. Small repairs that come from daily use, such as a tap washer or a light fitting, are the responsibility of the tenant.'],
  ['rent-4', 'The tenant may not sublet the property or assign the contract without the written consent of the landlord. A breach of this clause allows the landlord to terminate the lease immediately.'],
];

// Queries whose answer is really in the corpus.
export const PRESENT = [
  ['coffee', 'what water temperature should I use to brew coffee'],
  ['coffee', 'how fine should I grind for espresso'],
  ['coffee', 'how do I keep coffee beans fresh'],
  ['pg', 'how do I enable the vector type in postgres'],
  ['pg', 'does an approximate index lose results'],
  ['pg', 'what removes dead rows in postgres'],
  ['bike', 'when should I replace a bicycle chain'],
  ['bike', 'my brake lever feels soft'],
  ['bike', 'how much air should I put in my tyres'],
  ['food', 'how do I make a spanish omelette'],
  ['food', 'should I stir paella while it cooks'],
  ['food', 'cold tomato soup recipe'],
  ['rent', 'when do I get my deposit back'],
  ['rent', 'how much notice to end the lease'],
  ['rent', 'who pays for repairs in a rented flat'],
];

// Queries about a subject that is not in the corpus at all.
export const ABSENT = [
  ['medicine', 'what are the side effects of ibuprofen'],
  ['astronomy', 'how far is the nearest star from the sun'],
  ['football', 'who won the world cup in 1986'],
  ['music', 'how do I tune a violin'],
  ['law', 'how do I register a trademark in the european union'],
  ['travel', 'what visa do I need to visit japan'],
  ['pets', 'how often should I feed a kitten'],
  ['finance', 'what is the difference between a stock and a bond'],
];

export const NOISE = [
  'asdfghjkl',
  'qwertyuiop zxcvbnm',
  'xkcd blorp fnord',
  '#### ???? ####',
  'aaaaaaaaaaaa',
];

// The same present queries in Spanish. The stand-in model is English-only, so
// this set measures how badly a monolingual text model breaks the floor.
export const PRESENT_ES = [
  ['coffee', 'a qué temperatura debe estar el agua para hacer café'],
  ['coffee', 'qué molienda uso para el espresso'],
  ['coffee', 'cómo conservo los granos de café frescos'],
  ['pg', 'cómo activo el tipo vector en postgres'],
  ['pg', 'un índice aproximado pierde resultados'],
  ['pg', 'qué elimina las filas muertas en postgres'],
  ['bike', 'cuándo debo cambiar la cadena de la bicicleta'],
  ['bike', 'la maneta del freno está blanda'],
  ['bike', 'cuánta presión pongo en las ruedas'],
  ['food', 'cómo se hace una tortilla de patatas'],
  ['food', 'hay que remover la paella mientras se cocina'],
  ['food', 'receta de sopa fría de tomate'],
  ['rent', 'cuándo me devuelven la fianza'],
  ['rent', 'cuánto preaviso hay para terminar el contrato'],
  ['rent', 'quién paga las reparaciones en un piso alquilado'],
];
