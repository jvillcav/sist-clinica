import swaggerJsdoc from 'swagger-jsdoc';

const rutas = [
  ['get', '/api/health', 'Estado básico de la API', [], false],
  ['get', '/api/ready', 'Disponibilidad de MongoDB y ML', [], false],
  ['post', '/api/usuarios/login', 'Iniciar sesión', [], false],
  ['post', '/api/usuarios/solicitar-recuperacion', 'Solicitar recuperación de contraseña', [], false],
  ['post', '/api/usuarios/restablecer-password', 'Restablecer contraseña', [], false],
  ['get', '/api/usuarios/me', 'Consultar la sesión vigente', ['autenticado']],
  ['post', '/api/usuarios/registro', 'Registrar usuario', ['administrador']],
  ['get', '/api/usuarios/odontologos', 'Listar odontólogos activos', ['autenticado']],
  ['get', '/api/usuarios', 'Listar usuarios', ['administrador']],
  ['put', '/api/usuarios/:id/rol', 'Actualizar rol', ['administrador']],
  ['put', '/api/usuarios/:id', 'Actualizar usuario', ['administrador']],
  ['delete', '/api/usuarios/:id', 'Desactivar usuario', ['administrador']],
  ['get', '/api/pacientes/mi-perfil', 'Consultar perfil propio', ['paciente']],
  ['put', '/api/pacientes/mi-perfil', 'Actualizar perfil propio', ['paciente']],
  ['put', '/api/pacientes/mi-password', 'Cambiar contraseña propia', ['paciente']],
  ['get', '/api/pacientes', 'Listar pacientes', ['administrador', 'recepcionista', 'odontologo']],
  ['post', '/api/pacientes', 'Registrar paciente', ['administrador', 'recepcionista']],
  ['get', '/api/pacientes/:id', 'Consultar paciente', ['personal']],
  ['put', '/api/pacientes/:id', 'Actualizar paciente', ['administrador', 'recepcionista']],
  ['delete', '/api/pacientes/:id', 'Desactivar paciente', ['administrador']],
  ['get', '/api/citas', 'Listar citas', ['personal']],
  ['post', '/api/citas', 'Crear cita', ['autenticado']],
  ['get', '/api/citas/mis-citas', 'Listar citas propias', ['paciente']],
  ['get', '/api/citas/disponibilidad', 'Consultar disponibilidad', ['autenticado']],
  ['get', '/api/citas/odontologo/agenda', 'Consultar agenda propia', ['odontologo']],
  ['patch', '/api/citas/:id/confirmar', 'Confirmar cita', ['administrador', 'recepcionista']],
  ['patch', '/api/citas/:id/reprogramar', 'Reprogramar cita', ['personal']],
  ['patch', '/api/citas/:id/cancelar', 'Cancelar cita', ['administrador', 'recepcionista']],
  ['patch', '/api/citas/mis-citas/:id/reprogramar', 'Reprogramar cita propia', ['paciente']],
  ['patch', '/api/citas/mis-citas/:id/cancelar', 'Cancelar cita propia', ['paciente']],
  ['post', '/api/solicitudes-citas', 'Crear solicitud pública', [], false],
  ['get', '/api/solicitudes-citas', 'Listar solicitudes', ['administrador', 'recepcionista']],
  ['patch', '/api/solicitudes-citas/:id/confirmar', 'Convertir solicitud en cita', ['administrador', 'recepcionista']],
  ['patch', '/api/solicitudes-citas/:id/rechazar', 'Rechazar solicitud', ['administrador', 'recepcionista']],
  ['post', '/api/expedientes/atencion-completa', 'Registrar atención clínica transaccional', ['odontologo']],
  ['get', '/api/expedientes', 'Listar expedientes', ['administrador', 'odontologo']],
  ['get', '/api/expedientes/mi-expediente', 'Consultar expediente propio', ['paciente']],
  ['get', '/api/insumos', 'Listar insumos', ['personal']],
  ['post', '/api/insumos', 'Crear insumo', ['administrador']],
  ['get', '/api/consumos-insumos', 'Listar consumos', ['administrador', 'odontologo']],
  ['get', '/api/reabastecimientos', 'Listar reabastecimientos', ['administrador', 'odontologo']],
  ['get', '/api/reportes/resumen', 'Obtener resumen general', ['personal']],
  ['get', '/api/pacientes/:id/expediente', 'Consultar expediente de paciente', ['administrador', 'odontologo']],
  ['post', '/api/pacientes/:id/acceso', 'Crear acceso al portal', ['administrador', 'recepcionista']],
  ['put', '/api/pacientes/:id/acceso/estado', 'Cambiar estado de acceso', ['administrador']],
  ['get', '/api/citas/:id', 'Consultar cita', ['personal']],
  ['put', '/api/citas/:id', 'Actualizar datos editables de cita', ['personal']],
  ['get', '/api/insumos/resumen', 'Resumen de inventario', ['administrador']],
  ['get', '/api/insumos/alertas/bajo-stock', 'Alertas de bajo stock', ['administrador', 'odontologo']],
  ['get', '/api/insumos/:id', 'Consultar insumo', ['administrador', 'odontologo']],
  ['patch', '/api/insumos/:id', 'Actualizar insumo', ['administrador']],
  ['patch', '/api/insumos/:id/estado', 'Cambiar estado del insumo', ['administrador']],
  ['patch', '/api/insumos/:id/reabastecer', 'Reabastecer insumo', ['administrador']],
  ['delete', '/api/insumos/:id', 'Desactivar insumo', ['administrador']],
  ['get', '/api/consumos-insumos/odontologo', 'Consumos propios del odontólogo', ['odontologo']],
  ['post', '/api/consumos-insumos', 'Registrar ajuste de consumo', ['administrador']],
  ['get', '/api/reabastecimientos/resumen', 'Resumen de reabastecimientos', ['administrador', 'odontologo']],
  ['get', '/api/reabastecimientos/insumo/:insumoId', 'Historial de reabastecimiento por insumo', ['administrador', 'odontologo']],
  ['get', '/api/expedientes/resumen', 'Resumen de expedientes', ['administrador', 'odontologo']],
  ['get', '/api/expedientes/paciente/:pacienteId', 'Historial por paciente', ['administrador', 'odontologo']],
  ['get', '/api/expedientes/:id', 'Consultar expediente', ['administrador', 'odontologo']],
  ['patch', '/api/expedientes/:id', 'Actualizar expediente propio', ['odontologo']],
  ['patch', '/api/expedientes/:id/anular', 'Anular expediente', ['administrador']],
  ['get', '/api/reportes/dataset-consumo', 'Dataset de consumo', ['administrador', 'odontologo']],
  ['get', '/api/reportes/odontologo/estadisticas', 'Estadísticas propias', ['odontologo']],
  ['get', '/api/reportes/odontologo', 'Reporte de odontólogo', ['administrador', 'odontologo']],
  ['get', '/api/reportes/recepcion', 'Panel de recepción', ['administrador', 'recepcionista']],
  ['get', '/api/predicciones/estado', 'Consultar servicio ML', ['administrador', 'odontologo']],
  ['get', '/api/predicciones/resumen-dataset', 'Resumir dataset ML', ['administrador', 'odontologo']],
  ['get', '/api/predicciones/consumo-insumos', 'Predecir consumo general', ['administrador', 'odontologo']],
  ['get', '/api/predicciones/consumo-insumos/:insumoId', 'Predecir consumo de un insumo', ['administrador', 'odontologo']]
];

const convertirRuta = (ruta) => ruta.replace(/:([A-Za-z0-9_]+)/g, '{$1}');

const paths = Object.fromEntries(
  rutas.reduce((acumulado, [metodo, ruta, resumen, roles = [], protegida = true]) => {
    const rutaOpenApi = convertirRuta(ruta);
    const operacion = {
      summary: resumen,
      tags: [ruta.split('/')[2] || 'sistema'],
      security: protegida ? [{ bearerAuth: [] }] : [],
      responses: {
        200: {
          description: 'Operación correcta',
          content: {
            'application/json': {
              schema: { type: 'object' }
            }
          }
        },
        400: { $ref: '#/components/responses/Error400' },
        401: { $ref: '#/components/responses/Error401' },
        403: { $ref: '#/components/responses/Error403' },
        500: { $ref: '#/components/responses/Error500' }
      },
      'x-roles-permitidos': roles
    };

    const parametros = [...ruta.matchAll(/:([A-Za-z0-9_]+)/g)].map((coincidencia) => ({
      name: coincidencia[1],
      in: 'path',
      required: true,
      schema: { type: 'string' }
    }));

    if (metodo === 'get' && !ruta.includes(':id') && !ruta.endsWith('/health') && !ruta.endsWith('/ready')) {
      parametros.push(
        { $ref: '#/components/parameters/Pagina' },
        { $ref: '#/components/parameters/Limite' }
      );
    }

    if (parametros.length) operacion.parameters = parametros;

    if (['post', 'put', 'patch'].includes(metodo)) {
      operacion.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object', additionalProperties: true }
          }
        }
      };
    }

    const existente = acumulado.get(rutaOpenApi) || {};
    existente[metodo] = operacion;
    acumulado.set(rutaOpenApi, existente);
    return acumulado;
  }, new Map())
);

const esquemaError = {
  type: 'object',
  required: ['mensaje', 'codigo', 'requestId'],
  properties: {
    mensaje: { type: 'string' },
    codigo: { type: 'string' },
    requestId: { type: 'string' }
  }
};

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'API SIST-CLINICA',
      version: '2.0.0',
      description: 'API de clínica odontológica con autenticación por roles, citas concurrentes, inventario, expedientes y predicción de consumo.'
    },
    servers: [{ url: '/', description: 'Servidor actual' }],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      parameters: {
        Pagina: {
          name: 'pagina',
          in: 'query',
          schema: { type: 'integer', minimum: 1, default: 1 }
        },
        Limite: {
          name: 'limite',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 }
        }
      },
      schemas: { Error: esquemaError },
      responses: Object.fromEntries(
        [400, 401, 403, 500].map((estado) => [
          `Error${estado}`,
          {
            description: `Error HTTP ${estado}`,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        ])
      )
    }
  },
  apis: []
};

export default swaggerJsdoc(options);
