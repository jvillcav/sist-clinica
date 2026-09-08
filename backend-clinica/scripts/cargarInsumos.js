import 'dotenv/config';
import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import Insumo from '../src/models/Insumo.js';

const argumentos = new Set(process.argv.slice(2));
const grupoArgumento = [...argumentos].find((valor) =>
  valor.startsWith('--grupo=')
);
const grupo = grupoArgumento?.split('=')[1] ?? 'base';
const simular = argumentos.has('--simular');
const soloValidar = argumentos.has('--validar-datos');

if (!['base', 'todos'].includes(grupo)) {
  throw new Error(
    'Grupo no válido. Utiliza --grupo=base o --grupo=todos.'
  );
}

const archivoDatos = new URL(
  `./datos/insumos-${grupo}.json`,
  import.meta.url
);

const normalizar = (valor) =>
  String(valor)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLocaleLowerCase('es');

const crearClave = ({ nombre, unidadMedida }) =>
  `${normalizar(nombre)}::${normalizar(unidadMedida)}`;

const camposMetadatos = [
  'codigo',
  'descripcion',
  'categoria',
  'prioridad',
  'especialidad',
  'aplicacion',
  'usarEnML',
  'controlVencimiento',
  'fuenteReferencia'
];

const extraerMetadatos = (insumo) =>
  Object.fromEntries(
    camposMetadatos.map((campo) => [
      campo,
      insumo[campo]
    ])
  );

const leerYValidarCatalogo = async () => {
  const contenido = await fs.readFile(archivoDatos, 'utf8');
  const insumos = JSON.parse(contenido);

  if (!Array.isArray(insumos) || insumos.length === 0) {
    throw new Error('El archivo de datos no contiene insumos.');
  }

  const claves = new Set();
  const codigos = new Set();

  insumos.forEach((insumo, indice) => {
    const error = new Insumo(insumo).validateSync();

    if (error) {
      throw new Error(
        `Insumo ${indice + 1} inválido (${insumo.nombre ?? 'sin nombre'}): ` +
          error.message
      );
    }

    const clave = crearClave(insumo);
    const codigo = normalizar(insumo.codigo);

    if (claves.has(clave)) {
      throw new Error(
        `El catálogo contiene un duplicado: ${insumo.nombre} ` +
          `(${insumo.unidadMedida}).`
      );
    }

    if (codigos.has(codigo)) {
      throw new Error(
        `El catálogo contiene un código duplicado: ${insumo.codigo}.`
      );
    }

    claves.add(clave);
    codigos.add(codigo);
  });

  return insumos;
};

const obtenerUriMongo = () =>
  process.env.MONGO_URI ??
  process.env.MONGODB_URI ??
  process.env.MONGODB_ATLAS_URI;

const ejecutarCarga = async () => {
  const insumos = await leerYValidarCatalogo();

  if (soloValidar) {
    console.log(
      `Catálogo ${grupo} válido: ${insumos.length} insumos ` +
        'compatibles con el modelo.'
    );
    return;
  }

  const uriMongo = obtenerUriMongo();

  if (!uriMongo) {
    throw new Error(
      'No se encontró la conexión a MongoDB. Define MONGO_URI, ' +
        'MONGODB_URI o MONGODB_ATLAS_URI en el archivo .env.'
    );
  }

  await mongoose.connect(uriMongo);

  const existentes = await Insumo.find(
    {},
    {
      codigo: 1,
      nombre: 1,
      unidadMedida: 1
    }
  ).lean();

  const existentesPorCodigo = new Map(
    existentes
      .filter((insumo) => insumo.codigo)
      .map((insumo) => [
        normalizar(insumo.codigo),
        insumo
      ])
  );

  const existentesPorClave = new Map(
    existentes.map((insumo) => [
      crearClave(insumo),
      insumo
    ])
  );

  const clasificados = insumos.map((insumo) => {
    const existente =
      existentesPorCodigo.get(normalizar(insumo.codigo)) ??
      existentesPorClave.get(crearClave(insumo));

    return {
      insumo,
      existente
    };
  });

  const nuevos = clasificados.filter(
    ({ existente }) => !existente
  );
  const porEnriquecer = clasificados.filter(
    ({ existente }) => existente
  );

  console.log('\nCarga masiva de insumos');
  console.log(`Grupo seleccionado: ${grupo}`);
  console.log(`Registros del catálogo: ${insumos.length}`);
  console.log(
    `Ya existentes (se completarán metadatos): ${porEnriquecer.length}`
  );
  console.log(`Nuevos por registrar: ${nuevos.length}`);

  if (simular) {
    console.log('\nSimulación finalizada. No se escribió en MongoDB.');
    return;
  }

  if (nuevos.length === 0 && porEnriquecer.length === 0) {
    console.log('\nNo hay insumos por procesar.');
    return;
  }

  const operacionesActualizacion = porEnriquecer.map(
    ({ insumo, existente }) => ({
      updateOne: {
        filter: {
          _id: existente._id
        },
        update: {
          $set: extraerMetadatos(insumo)
        }
      }
    })
  );

  const operacionesInsercion = nuevos.map(({ insumo }) => ({
    updateOne: {
      filter: {
        codigo: insumo.codigo
      },
      update: {
        $setOnInsert: insumo
      },
      upsert: true
    }
  }));

  const operaciones = [
    ...operacionesActualizacion,
    ...operacionesInsercion
  ];

  const resultado = await Insumo.bulkWrite(
    operaciones,
    {
      ordered: false
    }
  );

  console.log('\nCarga completada.');
  console.log(
    `Metadatos actualizados: ${resultado.modifiedCount}.`
  );
  console.log(
    `Insumos nuevos registrados: ${resultado.upsertedCount}.`
  );
  console.log(
    'Los stocks, costos y estados de registros existentes no se modificaron.'
  );

  if (grupo === 'todos') {
    console.log(
      'Los insumos condicionales se guardaron como inactivos ' +
        'hasta recibir la confirmación del odontólogo.'
    );
  }
};

try {
  await ejecutarCarga();
} catch (error) {
  console.error(`\nError durante la carga: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
