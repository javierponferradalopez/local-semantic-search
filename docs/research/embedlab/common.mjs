// Shared table of candidates, shared probe text, shared maths.
// Every probe in this directory imports from here.
import { env } from '@huggingface/transformers';

// Keep the weights inside this throwaway directory, never in node_modules.
env.cacheDir = new URL('./.cache/', import.meta.url).pathname;
env.allowLocalModels = false;

export { env };

// pooling: what the model card asks for.
// qp / dp: the prefix the model card puts before a query and before a passage.
export const CANDIDATES = [
  { key: 'minilm', id: 'Xenova/all-MiniLM-L6-v2', pooling: 'mean', dtypes: ['fp32', 'q8'] },
  { key: 'bge-small', id: 'Xenova/bge-small-en-v1.5', pooling: 'cls', dtypes: ['fp32', 'q8'],
    qp: 'Represent this sentence for searching relevant passages: ' },
  { key: 'bge-base', id: 'Xenova/bge-base-en-v1.5', pooling: 'cls', dtypes: ['fp32', 'q8'],
    qp: 'Represent this sentence for searching relevant passages: ' },
  { key: 'gte-small', id: 'Xenova/gte-small', pooling: 'mean', dtypes: ['fp32', 'q8'] },
  { key: 'gte-base', id: 'Xenova/gte-base', pooling: 'mean', dtypes: ['fp32', 'q8'] },
  { key: 'e5-small-v2', id: 'Xenova/e5-small-v2', pooling: 'mean', dtypes: ['fp32', 'q8'],
    qp: 'query: ', dp: 'passage: ' },
  { key: 'me5-small', id: 'Xenova/multilingual-e5-small', pooling: 'mean', dtypes: ['fp32', 'q8'],
    qp: 'query: ', dp: 'passage: ' },
  { key: 'me5-base', id: 'Xenova/multilingual-e5-base', pooling: 'mean', dtypes: ['fp32', 'q8'],
    qp: 'query: ', dp: 'passage: ' },
  { key: 'nomic-1.5', id: 'nomic-ai/nomic-embed-text-v1.5', pooling: 'mean', dtypes: ['fp32', 'q8'],
    qp: 'search_query: ', dp: 'search_document: ', matryoshka: [64, 128, 256, 512, 768] },
  { key: 'arctic-s', id: 'Snowflake/snowflake-arctic-embed-s', pooling: 'cls', dtypes: ['fp32', 'q8'],
    qp: 'Represent this sentence for searching relevant passages: ' },
  { key: 'arctic-m-1.5', id: 'Snowflake/snowflake-arctic-embed-m-v1.5', pooling: 'cls', dtypes: ['fp32', 'q8'],
    qp: 'Represent this sentence for searching relevant passages: ', matryoshka: [256, 768] },
  { key: 'arctic-m-2.0', id: 'Snowflake/snowflake-arctic-embed-m-v2.0', pooling: 'cls', dtypes: ['q8'],
    qp: 'query: ' },
  { key: 'arctic-l-2.0', id: 'Snowflake/snowflake-arctic-embed-l-v2.0', pooling: 'cls', dtypes: ['q8'],
    qp: 'query: ', matryoshka: [256, 1024] },
  { key: 'pmlm-l12', id: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', pooling: 'mean', dtypes: ['fp32', 'q8'] },
  { key: 'jina-v2-es', id: 'jinaai/jina-embeddings-v2-base-es', pooling: 'mean', dtypes: ['fp32', 'q8'] },
  { key: 'jina-v2-small-en', id: 'jinaai/jina-embeddings-v2-small-en', pooling: 'mean', dtypes: ['fp32'] },
  { key: 'jina-v3', id: 'jinaai/jina-embeddings-v3', pooling: 'mean', dtypes: ['fp32'] },
  { key: 'static-en', id: 'sentence-transformers/static-retrieval-mrl-en-v1', pooling: 'mean', dtypes: ['fp32', 'q8'],
    matryoshka: [32, 64, 128, 256, 512, 1024] },
  { key: 'static-multi', id: 'sentence-transformers/static-similarity-mrl-multilingual-v1', pooling: 'mean', dtypes: ['fp32', 'q8'],
    matryoshka: [32, 64, 128, 256, 512, 1024] },
  { key: 'embgemma', id: 'onnx-community/embeddinggemma-300m-ONNX', pooling: 'mean', dtypes: ['fp32', 'q8'],
    qp: 'task: search result | query: ', dp: 'title: none | text: ', matryoshka: [128, 256, 512, 768] },
  { key: 'qwen3-0.6b', id: 'onnx-community/Qwen3-Embedding-0.6B-ONNX', pooling: 'last_token', dtypes: ['q8'],
    qp: 'Instruct: Given a web search query, retrieve relevant passages that answer the query\nQuery: ' },
  { key: 'mxbai-large', id: 'mixedbread-ai/mxbai-embed-large-v1', pooling: 'cls', dtypes: ['q8'],
    qp: 'Represent this sentence for searching relevant passages: ' },
  { key: 'granite-107m', id: 'ibm-granite/granite-embedding-107m-multilingual', pooling: 'cls', dtypes: ['fp32'] },
  { key: 'granite-r2-97m', id: 'ibm-granite/granite-embedding-97m-multilingual-r2', pooling: 'cls', dtypes: ['fp32', 'q8'],
    matryoshka: [128, 256, 384] },
  { key: 'granite-r2-311m', id: 'ibm-granite/granite-embedding-311m-multilingual-r2', pooling: 'cls', dtypes: ['fp32', 'q8'],
    matryoshka: [128, 256, 512, 768] },
  { key: 'me5-large', id: 'Xenova/multilingual-e5-large', pooling: 'mean', dtypes: ['q8'],
    qp: 'query: ', dp: 'passage: ' },
  { key: 'gte-multi', id: 'Alibaba-NLP/gte-multilingual-base', pooling: 'cls', dtypes: ['fp32'] },
  { key: 'potion-multi', id: 'minishlab/potion-multilingual-128M', pooling: 'mean', dtypes: ['fp32'] },
];

export const byKey = (k) => CANDIDATES.find((c) => c.key === k);

// One ordinary technical paragraph. The same one the #3 report used, so the
// token counts can be compared with it.
export const PARA = `Hexagonal architecture, also known as ports and adapters, is a software design pattern
that isolates the core business logic of an application from the outside world. The core defines ports,
which are interfaces that describe what the application needs or offers. Adapters implement those ports
and connect the core to databases, message queues, web frameworks, and file systems. Because the core
depends only on its own abstractions, it can be tested without any infrastructure. A test can replace a
real database adapter with an in-memory one and the core will not notice the difference. This separation
also makes it easy to swap technologies later. If the team decides to move from PostgreSQL to a vector
database, only the adapter changes. The domain model, the use cases, and the tests stay the same. The
pattern was described by Alistair Cockburn in 2005 and it remains a common choice for systems that need
a long life and a clear boundary between policy and detail.`.replace(/\s+/g, ' ');

// A long text, to find the real ceiling of the ONNX graph.
export const LONG = Array.from({ length: 24 }, (_, i) => `${PARA} Paragraph ${i + 1} ends here.`).join(' ');

// Eight chunks of a realistic size, for the speed probe.
export const CHUNKS = Array.from({ length: 32 }, (_, i) => `${PARA.slice(0, 900)} Variation ${i}.`);

// --- the language probe -----------------------------------------------------
// Ten facts. Each one is written twice, once in Spanish and once in English,
// and each one has a query in each language. The queries never copy the words
// of their passage, so a hit needs meaning and not word overlap.
// The facts come in confusable pairs -- two about a home, two about a vaccine,
// two about software structure, two about a bill, two about insurance -- so a
// model must separate near neighbours and not only find the topic.
// This is a probe, not a benchmark. Twenty passages measure nothing about MTEB.
export const FACTS = [
  {
    id: 'hipoteca',
    es: 'La hipoteca se firmó ante notario el 14 de marzo y el tipo de interés queda fijado en el 3,2 por ciento durante los primeros cinco años.',
    en: 'The mortgage was signed before a notary on 14 March and the interest rate stays fixed at 3.2 per cent for the first five years.',
    q_es: '¿a cuánto está el interés del préstamo de la casa?',
    q_en: 'what rate am I paying on the house loan?',
  },
  {
    id: 'alquiler',
    es: 'El contrato de alquiler del piso exige una fianza de dos mensualidades y termina el 30 de junio de 2027.',
    en: 'The flat rental agreement requires a deposit of two months of rent and it ends on 30 June 2027.',
    q_es: '¿cuánta fianza pedí por el piso y cuándo acaba?',
    q_en: 'how much deposit for the flat and when does it end?',
  },
  {
    id: 'triple-virica',
    es: 'El calendario de vacunación infantil recomienda la segunda dosis de la vacuna triple vírica entre los tres y los cuatro años de edad.',
    en: 'The childhood immunisation schedule recommends the second dose of the measles, mumps and rubella vaccine between three and four years of age.',
    q_es: '¿a qué edad le toca al niño el segundo pinchazo del sarampión?',
    q_en: 'at what age does a child get the second measles shot?',
  },
  {
    id: 'gripe',
    es: 'La vacuna de la gripe se administra cada otoño y se recomienda sobre todo a las personas mayores de 65 años.',
    en: 'The influenza vaccine is given every autumn and is recommended above all to people over 65 years old.',
    q_es: '¿cuándo se vacunan mis padres contra la gripe?',
    q_en: 'when should older people get the flu jab?',
  },
  {
    id: 'hexagonal',
    es: 'La arquitectura hexagonal aísla la lógica de negocio del mundo exterior mediante puertos y adaptadores, de modo que el núcleo se puede probar sin infraestructura.',
    en: 'Hexagonal architecture isolates the business logic from the outside world through ports and adapters, so the core can be tested without infrastructure.',
    q_es: '¿cómo separo el dominio de la base de datos con puertos?',
    q_en: 'how do I keep the domain away from the database with ports?',
  },
  {
    id: 'capas',
    es: 'La arquitectura en capas coloca la presentación encima del servicio y el servicio encima del acceso a datos, y cada capa solo llama a la de debajo.',
    en: 'Layered architecture puts presentation above the service layer and the service above data access, and each layer calls only the layer below it.',
    q_es: '¿qué orden tienen las capas de presentación y de datos?',
    q_en: 'what order do the presentation and data layers go in?',
  },
  {
    id: 'luz',
    es: 'La factura de la luz de mayo asciende a 84,30 euros, con un consumo de 212 kilovatios hora.',
    en: 'The electricity bill for May comes to 84.30 euros, for a consumption of 212 kilowatt hours.',
    q_es: '¿cuánto pagué de electricidad en mayo?',
    q_en: 'how much did I pay for power in May?',
  },
  {
    id: 'agua',
    es: 'La factura del agua del segundo trimestre es de 31,15 euros e incluye la tasa de alcantarillado.',
    en: 'The water bill for the second quarter is 31.15 euros and it includes the sewer charge.',
    q_es: '¿qué importe tiene el recibo del agua del trimestre?',
    q_en: 'what is the amount on the quarterly water invoice?',
  },
  {
    id: 'coche',
    es: 'El seguro del coche a todo riesgo tiene una franquicia de 300 euros y cubre el vehículo de sustitución durante quince días.',
    en: 'The comprehensive car insurance carries an excess of 300 euros and covers a replacement vehicle for fifteen days.',
    q_es: '¿cuánto tengo que poner yo si choco el coche?',
    q_en: 'how much do I pay myself if I crash the car?',
  },
  {
    id: 'viaje',
    es: 'El seguro de viaje cubre la cancelación del billete hasta 2.000 euros y la asistencia médica en el extranjero.',
    en: 'The travel insurance covers ticket cancellation up to 2,000 euros and medical help abroad.',
    q_es: '¿me devuelven el vuelo si anulo las vacaciones?',
    q_en: 'do I get the flight back if I cancel the holiday?',
  },
];

export const PASSAGES = FACTS.flatMap((f) => [
  { id: `es-${f.id}`, fact: f.id, lang: 'es', text: f.es },
  { id: `en-${f.id}`, fact: f.id, lang: 'en', text: f.en },
]);

export const QUERIES = FACTS.flatMap((f) => [
  { id: `qes-${f.id}`, fact: f.id, lang: 'es', text: f.q_es },
  { id: `qen-${f.id}`, fact: f.id, lang: 'en', text: f.q_en },
]);

// --- maths ------------------------------------------------------------------
export function cos(a, b) {
  let d = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    d += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return d / Math.sqrt(na * nb);
}

export function truncateAndRenormalise(v, n) {
  const head = v.slice(0, n);
  let s = 0;
  for (const x of head) s += x * x;
  const inv = 1 / Math.sqrt(s);
  return head.map((x) => x * inv);
}

export function stats(ts) {
  const s = [...ts].sort((a, b) => a - b);
  const mean = ts.reduce((a, b) => a + b, 0) / ts.length;
  return {
    n: ts.length,
    mean: +mean.toFixed(1),
    median: +s[Math.floor(s.length / 2)].toFixed(1),
    min: +s[0].toFixed(1),
    max: +s[s.length - 1].toFixed(1),
  };
}

export async function timeIt(fn, warm = 2, runs = 5) {
  for (let i = 0; i < warm; i++) await fn();
  const ts = [];
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    await fn();
    ts.push(performance.now() - t0);
  }
  return stats(ts);
}
