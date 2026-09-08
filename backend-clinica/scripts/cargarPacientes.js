import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import Paciente from '../src/models/Paciente.js';

const rutaActual = fileURLToPath(import.meta.url);
const directorioScripts = path.dirname(rutaActual);
const raizBackend = path.resolve(directorioScripts, '..');

dotenv.config({
  path: path.join(raizBackend, '.env')
});

const argumentos = new Set(process.argv.slice(2));
const simular = argumentos.has('--simular');
const soloValidar = argumentos.has('--validar-datos');
const archivoDatos = new URL(
  './datos/pacientes.json',
  import.meta.url
);

const normalizarCi = (valor) =>
  String(valor ?? '')
    .trim()
    .toLocaleUpperCase('es');

const leerYValidarPacientes = async () => {
  const contenido = await fs.readFile(
    archivoDatos,
    'utf8'
  );
  const pacientes = JSON.parse(contenido);

  if (!Array.isArray(pacientes) || pacientes.length === 0) {
    throw new Error(
      'El archivo de datos no contiene pacientes.'
    );
  }

  const documentos = new Set();

  pacientes.forEach((paciente, indice) => {
    const error = new Paciente(paciente).validateSync();

    if (error) {
      throw new Error(
        `Paciente ${indice + 1} inválido ` +
          `(${paciente.nombre ?? 'sin nombre'}): ` +
          error.message
      );
    }

    const ci = normalizarCi(paciente.ci);

    if (!ci) {
      throw new Error(
        `Paciente ${indice + 1}: el CI está vacío.`
      );
    }

    if (documentos.has(ci)) {
      throw new Error(
        `El archivo contiene un CI duplicado: ${paciente.ci}.`
      );
    }

    documentos.add(ci);
  });

  return pacientes;
};

const obtenerUriMongo = () =>
  process.env.MONGO_URI ??
  process.env.MONGODB_URI ??
  process.env.MONGODB_ATLAS_URI;

const ejecutarCarga = async () => {
  const pacientes = await leerYValidarPacientes();

  if (soloValidar) {
    console.log('\nDatos de pacientes válidos.');
    console.log(`Registros revisados: ${pacientes.length}.`);
    console.log('CI duplicados en el archivo: 0.');
    console.log(
      'Todos los registros son compatibles con Paciente.js.'
    );
    return;
  }

  const uriMongo = obtenerUriMongo();

  if (!uriMongo) {
    throw new Error(
      'No se encontró la conexión a MongoDB. Define ' +
        'MONGO_URI, MONGODB_URI o MONGODB_ATLAS_URI ' +
        'en el archivo .env del backend.'
    );
  }

  await mongoose.connect(uriMongo);

  const documentos = pacientes.map(
    (paciente) => paciente.ci
  );

  const existentes = await Paciente.find(
    {
      ci: {
        $in: documentos
      }
    },
    {
      ci: 1
    }
  ).lean();

  const documentosExistentes = new Set(
    existentes.map((paciente) =>
      normalizarCi(paciente.ci)
    )
  );

  const nuevos = pacientes.filter(
    (paciente) =>
      !documentosExistentes.has(
        normalizarCi(paciente.ci)
      )
  );

  console.log('\nCarga masiva de pacientes');
  console.log(`Registros del archivo: ${pacientes.length}.`);
  console.log(
    `Pacientes ya existentes por CI: ${existentes.length}.`
  );
  console.log(`Pacientes nuevos por registrar: ${nuevos.length}.`);

  if (simular) {
    console.log(
      '\nSimulación finalizada. No se escribió en MongoDB.'
    );
    return;
  }

  if (nuevos.length === 0) {
    console.log(
      '\nNo hay pacientes nuevos por registrar.'
    );
    return;
  }

  const operaciones = nuevos.map((paciente) => ({
    updateOne: {
      filter: {
        ci: paciente.ci
      },
      update: {
        $setOnInsert: paciente
      },
      upsert: true
    }
  }));

  const resultado = await Paciente.bulkWrite(
    operaciones,
    {
      ordered: false
    }
  );

  console.log('\nCarga completada correctamente.');
  console.log(
    `Pacientes nuevos registrados: ${resultado.upsertedCount}.`
  );
  console.log(
    `Pacientes existentes omitidos: ${existentes.length}.`
  );
  console.log(
    'No se modificó ningún paciente que ya existía.'
  );
};

try {
  await ejecutarCarga();
} catch (error) {
  console.error(
    `\nError durante la carga: ${error.message}`
  );
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
