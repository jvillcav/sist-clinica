import mongoose from 'mongoose';

const CODIGOS_POR_ESTADO = {
  400: 'SOLICITUD_NO_VALIDA',
  401: 'NO_AUTENTICADO',
  403: 'NO_AUTORIZADO',
  404: 'NO_ENCONTRADO',
  409: 'CONFLICTO',
  413: 'CUERPO_DEMASIADO_GRANDE',
  429: 'DEMASIADAS_SOLICITUDES',
  500: 'ERROR_INTERNO',
  503: 'SERVICIO_NO_DISPONIBLE'
};

export const normalizarRespuestaError = (req, res, next) => {
  const enviarJson = res.json.bind(res);

  res.json = (contenido) => {
    if (res.statusCode < 400 || !contenido || typeof contenido !== 'object' || Array.isArray(contenido)) {
      return enviarJson(contenido);
    }

    const respuesta = { ...contenido };
    delete respuesta.error;
    delete respuesta.stack;
    delete respuesta.detalle;

    respuesta.mensaje = respuesta.mensaje || 'No se pudo procesar la solicitud.';
    respuesta.codigo = respuesta.codigo || CODIGOS_POR_ESTADO[res.statusCode] || 'ERROR';
    respuesta.requestId = req.id;

    return enviarJson(respuesta);
  };

  next();
};

const mensajeSeguro = (err, status) => {
  if (status >= 500) return 'Ocurrió un error interno. Intenta nuevamente más tarde.';
  return err.message || 'No se pudo procesar la solicitud.';
};

export const rutaNoEncontrada = (req, res) => {
  return res.status(404).json({
    mensaje: 'La ruta solicitada no existe.',
    codigo: 'RUTA_NO_ENCONTRADA',
    requestId: req.id
  });
};

export const manejarErrores = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = Number(err.statusCode || err.status || 500);
  let codigo = err.codigo || 'ERROR_INTERNO';

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    codigo = 'DATOS_NO_VALIDOS';
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    codigo = 'IDENTIFICADOR_NO_VALIDO';
  } else if (err?.code === 11000) {
    status = 409;
    codigo = 'REGISTRO_DUPLICADO';
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    codigo = 'CUERPO_DEMASIADO_GRANDE';
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    status = 400;
    codigo = 'JSON_NO_VALIDO';
  }

  if (status >= 500) {
    console.error(`[${req.id || 'sin-id'}]`, err);
  }

  return res.status(status).json({
    mensaje: mensajeSeguro(err, status),
    codigo,
    requestId: req.id
  });
};
