import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { existsSync } from 'node:fs';

import Cita from '../src/models/Cita.js';
import Expediente from '../src/models/Expediente.js';
import SolicitudCita from '../src/models/SolicitudCita.js';
import swaggerSpec from '../src/config/swagger.js';
import { obtenerPaginacion, paginarConsulta } from '../src/utils/paginacion.js';

const pacienteId = '507f1f77bcf86cd799439011';
const odontologoId = '507f1f77bcf86cd799439012';

describe('integridad de citas', () => {
  test('calcula cada minuto ocupado y libera una cita cancelada', async () => {
    const cita = new Cita({
      pacienteId,
      odontologoId,
      odontologo: 'Dra. Prueba',
      fecha: new Date('2026-08-01T00:00:00.000Z'),
      hora: '09:10',
      duracionMinutos: 30,
      motivo: 'Control'
    });

    await cita.validate();
    assert.equal(cita.reservaActiva, true);
    assert.equal(cita.minutosOcupados.length, 30);
    assert.equal(cita.minutosOcupados.at(0), 550);
    assert.equal(cita.minutosOcupados.at(-1), 579);

    cita.estado = 'cancelado';
    await cita.validate();
    assert.equal(cita.reservaActiva, false);
    assert.equal(cita.minutosOcupados, undefined);
  });

  test('rechaza citas que se extienden al día siguiente', async () => {
    const cita = new Cita({
      pacienteId,
      odontologoId,
      odontologo: 'Dra. Prueba',
      fecha: new Date('2026-08-01T00:00:00.000Z'),
      hora: '23:50',
      duracionMinutos: 30,
      motivo: 'Urgencia'
    });

    await assert.rejects(cita.validate(), /día siguiente/);
  });

  test('declara todos los índices únicos de concurrencia', () => {
    const nombres = [
      ...Cita.schema.indexes(),
      ...SolicitudCita.schema.indexes(),
      ...Expediente.schema.indexes()
    ].map(([, opciones]) => opciones.name);

    assert.ok(nombres.includes('cita_horario_activo_unico'));
    assert.ok(nombres.includes('cita_paciente_horario_activo_unico'));
    assert.ok(nombres.includes('cita_solicitud_unica'));
    assert.ok(nombres.includes('solicitud_pendiente_unica'));
    assert.ok(nombres.includes('expediente_activo_por_cita'));
  });

  test('genera una clave estable para solicitudes pendientes', async () => {
    const solicitud = new SolicitudCita({
      nombreCompleto: 'Ana Pérez',
      nombre: 'Ana',
      apellido: 'Pérez',
      ci: '1234567',
      email: 'ana@example.com',
      telefono: '70000000',
      servicio: 'Control',
      fecha: new Date('2026-08-02T00:00:00.000Z'),
      hora: '10:00'
    });

    await solicitud.validate();
    assert.equal(solicitud.clavePendiente, '1234567|2026-08-02|10:00');

    solicitud.estado = 'rechazada';
    await solicitud.validate();
    assert.equal(solicitud.clavePendiente, undefined);
  });
});

describe('paginación', () => {
  test('normaliza valores y limita a cien registros', () => {
    assert.deepEqual(
      obtenerPaginacion({ query: { pagina: '3', limite: '500' } }),
      { pagina: 3, limite: 100, salto: 200 }
    );
    assert.deepEqual(
      obtenerPaginacion({ query: { pagina: 'x', limite: '-2' } }),
      { pagina: 1, limite: 50, salto: 0 }
    );
  });

  test('aplica skip/limit y publica metadatos', async () => {
    const estado = {};
    const consulta = {
      skip(valor) { estado.skip = valor; return this; },
      limit(valor) { estado.limit = valor; return this; },
      then(resolve) { resolve(['registro']); }
    };
    const headers = {};
    const resultado = await paginarConsulta({
      req: { query: { pagina: '2', limite: '10' } },
      res: { setHeader(nombre, valor) { headers[nombre] = valor; } },
      consulta,
      contar: Promise.resolve(24)
    });

    assert.deepEqual(resultado.datos, ['registro']);
    assert.equal(estado.skip, 10);
    assert.equal(estado.limit, 10);
    assert.equal(resultado.paginacion.totalPaginas, 3);
    assert.equal(headers['X-Total-Count'], '24');
  });
});

describe('documentación', () => {
  test('incluye documentos operativos y catálogo OpenAPI', () => {
    for (const archivo of [
      '../../docs/ARCHITECTURE.md',
      '../../docs/API.md',
      '../../docs/OPERATIONS.md',
      '../../docs/ML.md',
      '../../docs/VERIFICATION.md'
    ]) {
      assert.equal(existsSync(new URL(archivo, import.meta.url)), true, archivo);
    }

    const operaciones = Object.values(swaggerSpec.paths).reduce(
      (total, metodos) => total + Object.keys(metodos).length,
      0
    );
    assert.ok(operaciones >= 70);
  });
});

describe('API sin base de datos', () => {
  let server;
  let baseUrl;

  before(async () => {
    const { default: app } = await import('../src/app.js');
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => server?.close());

  test('responde health y normaliza rutas inexistentes', async () => {
    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);

    const perdida = await fetch(`${baseUrl}/api/desconocida`);
    const cuerpo = await perdida.json();
    assert.equal(perdida.status, 404);
    assert.equal(cuerpo.codigo, 'RUTA_NO_ENCONTRADA');
    assert.ok(cuerpo.requestId);
  });

  test('readiness falla si las dependencias no están conectadas', async () => {
    const respuesta = await fetch(`${baseUrl}/api/ready`);
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 503);
    assert.equal(cuerpo.estado, 'no_listo');
    assert.equal(cuerpo.dependencias.mongodb, 'no_disponible');
    assert.ok(cuerpo.requestId);
  });

  test('rechaza JSON inválido sin exponer la excepción', async () => {
    const respuesta = await fetch(`${baseUrl}/api/solicitudes-citas`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{'
    });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 400);
    assert.equal(cuerpo.codigo, 'JSON_NO_VALIDO');
    assert.equal('error' in cuerpo, false);
    assert.equal('stack' in cuerpo, false);
  });
});
