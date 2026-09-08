const VALORES = Object.freeze({
  paginaPredeterminada: 1,
  limitePredeterminado: 50,
  limiteMaximo: 100
});

const enteroPositivo = (valor, predeterminado) => {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : predeterminado;
};

export const obtenerPaginacion = (req) => {
  const pagina = enteroPositivo(req.query.pagina ?? req.query.page, VALORES.paginaPredeterminada);
  const limiteSolicitado = enteroPositivo(req.query.limite ?? req.query.limit, VALORES.limitePredeterminado);
  const limite = Math.min(limiteSolicitado, VALORES.limiteMaximo);

  return {
    pagina,
    limite,
    salto: (pagina - 1) * limite
  };
};

export const paginarConsulta = async ({ req, res, consulta, contar }) => {
  const { pagina, limite, salto } = obtenerPaginacion(req);
  const [datos, total] = await Promise.all([
    consulta.skip(salto).limit(limite),
    contar
  ]);
  const totalPaginas = Math.max(1, Math.ceil(total / limite));
  const paginacion = {
    pagina,
    limite,
    total,
    totalPaginas,
    tieneAnterior: pagina > 1,
    tieneSiguiente: pagina < totalPaginas
  };

  res.setHeader('X-Total-Count', String(total));
  res.setHeader('X-Page', String(pagina));
  res.setHeader('X-Page-Size', String(limite));
  res.setHeader('X-Total-Pages', String(totalPaginas));

  return { datos, paginacion };
};
