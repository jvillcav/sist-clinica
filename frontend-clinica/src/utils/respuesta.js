export const obtenerArreglo = (respuesta, propiedad) => {
  const datos =
    respuesta?.data?.[propiedad] ??
    respuesta?.data;

  return Array.isArray(datos)
    ? datos
    : [];
};
