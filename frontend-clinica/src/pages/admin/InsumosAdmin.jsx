import {
  useEffect,
  useMemo,
  useState
} from 'react';

import api from '../../api/axios';
import Pagination from '../../components/Pagination';
import { obtenerArreglo } from '../../utils/respuesta';

import '../../styles/admin/insumosAdmin.css';

/* =====================================================
   ESTADOS INICIALES
===================================================== */

const formularioInsumoInicial = {
  codigo: '',
  nombre: '',
  descripcion: '',
  categoria: 'General',
  unidadMedida: '',
  stockActual: '',
  stockMinimo: '',
  costoUnitario: '',
  prioridad: 'media',
  especialidad: 'Todas',
  aplicacion: 'base',
  usarEnML: true,
  controlVencimiento: false,
  lote: '',
  fechaVencimiento: '',
  fuenteReferencia: ''
};

const formularioReabastecimientoInicial = {
  cantidad: '',
  proveedor: '',
  observacion: ''
};

/* =====================================================
   CATÁLOGOS
===================================================== */

const categoriasSugeridas = [
  'General',
  'Anestesia',
  'Bioseguridad',
  'Desechables',
  'Endodoncia',
  'Instrumental',
  'Medicamentos',
  'Ortodoncia',
  'Restauración',
  'Materiales'
];

const unidadesSugeridas = [
  'unidad',
  'caja',
  'cartucho',
  'frasco',
  'gramo',
  'jeringa',
  'kit',
  'litro',
  'metro',
  'mililitro',
  'paquete',
  'par',
  'rollo',
  'sobre',
  'tubo'
];

const especialidadesSugeridas = [
  'Todas',
  'Odontología general',
  'Bioseguridad',
  'Cirugía oral',
  'Endodoncia',
  'Odontopediatría',
  'Ortodoncia',
  'Restauración',
  'Blanqueamiento'
];

/* =====================================================
   UTILIDADES
===================================================== */

const normalizarTexto = (
  valor = ''
) => {
  return String(valor)
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLowerCase()
    .trim();
};

const convertirNumero = (
  valor
) => {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : 0;
};

const formatearNumero = (
  valor
) => {
  return new Intl.NumberFormat(
    'es-BO',
    {
      maximumFractionDigits: 2
    }
  ).format(
    convertirNumero(valor)
  );
};

const formatearMoneda = (
  valor
) => {
  return new Intl.NumberFormat(
    'es-BO',
    {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }
  ).format(
    convertirNumero(valor)
  );
};

const formatearFecha = (
  valor
) => {
  if (!valor) {
    return 'Sin fecha';
  }

  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return 'Fecha inválida';
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
    }
  ).format(fecha);
};

const convertirFechaParaInput = (
  valor
) => {
  if (!valor) {
    return '';
  }

  const coincidencia =
    String(valor).match(
      /^\d{4}-\d{2}-\d{2}/
    );

  return coincidencia
    ? coincidencia[0]
    : '';
};

const obtenerEstadoVencimiento = (
  insumo
) => {
  if (
    !insumo
      ?.controlVencimiento
  ) {
    return {
      clave: 'no-aplica',
      etiqueta: 'No aplica'
    };
  }

  if (
    !insumo.fechaVencimiento
  ) {
    return {
      clave: 'pendiente',
      etiqueta: 'Fecha pendiente'
    };
  }

  const fechaTexto =
    convertirFechaParaInput(
      insumo.fechaVencimiento
    );

  const fecha =
    new Date(
      `${fechaTexto}T00:00:00`
    );

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return {
      clave: 'pendiente',
      etiqueta: 'Fecha pendiente'
    };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const limite =
    new Date(hoy);

  limite.setDate(
    limite.getDate() + 90
  );

  if (fecha < hoy) {
    return {
      clave: 'vencido',
      etiqueta: 'Vencido'
    };
  }

  if (fecha <= limite) {
    return {
      clave: 'por-vencer',
      etiqueta: 'Por vencer'
    };
  }

  return {
    clave: 'vigente',
    etiqueta: 'Vigente'
  };
};

const obtenerEstadoStock = (
  insumo
) => {
  const stockActual =
    convertirNumero(
      insumo?.stockActual
    );

  const stockMinimo =
    convertirNumero(
      insumo?.stockMinimo
    );

  if (
    insumo?.estado ===
    'inactivo'
  ) {
    return {
      clave: 'inactivo',
      etiqueta: 'Inactivo'
    };
  }

  if (stockActual <= 0) {
    return {
      clave: 'agotado',
      etiqueta: 'Agotado'
    };
  }

  if (
    stockActual <= stockMinimo
  ) {
    return {
      clave: 'bajo',
      etiqueta: 'Bajo stock'
    };
  }

  return {
    clave: 'disponible',
    etiqueta: 'Disponible'
  };
};

const obtenerPorcentajeStock = (
  insumo
) => {
  const actual =
    convertirNumero(
      insumo?.stockActual
    );

  const minimo =
    convertirNumero(
      insumo?.stockMinimo
    );

  const referencia =
    Math.max(
      minimo * 3,
      actual,
      1
    );

  return Math.min(
    100,
    Math.max(
      0,
      (actual / referencia) * 100
    )
  );
};

/* =====================================================
   ICONOS
===================================================== */

const IconoActualizar = () => (
  <svg viewBox="0 0 24 24">
    <path d="M20 7v5h-5" />
    <path d="M4 17v-5h5" />
    <path d="M6 8a7 7 0 0 1 12-2l2 2" />
    <path d="M18 16a7 7 0 0 1-12 2l-2-2" />
  </svg>
);

const IconoAgregar = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconoBuscar = () => (
  <svg viewBox="0 0 24 24">
    <circle
      cx="11"
      cy="11"
      r="7"
    />

    <path d="m20 20-4-4" />
  </svg>
);

const IconoCaja = () => (
  <svg viewBox="0 0 24 24">
    <path d="m4 7 8-4 8 4-8 4-8-4Z" />
    <path d="M4 7v10l8 4 8-4V7" />
    <path d="M12 11v10" />
  </svg>
);

const IconoActivo = () => (
  <svg viewBox="0 0 24 24">
    <circle
      cx="12"
      cy="12"
      r="9"
    />

    <path d="m8 12 3 3 5-6" />
  </svg>
);

const IconoAdvertencia = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 4 3 20h18L12 4Z" />
    <path d="M12 9v5M12 17h.01" />
  </svg>
);

const IconoAgotado = () => (
  <svg viewBox="0 0 24 24">
    <circle
      cx="12"
      cy="12"
      r="9"
    />

    <path d="M8 12h8" />
  </svg>
);

const IconoDinero = () => (
  <svg viewBox="0 0 24 24">
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2"
    />

    <path d="M7 9h.01M17 15h.01" />
    <circle
      cx="12"
      cy="12"
      r="2.5"
    />
  </svg>
);

const IconoEditar = () => (
  <svg viewBox="0 0 24 24">
    <path d="m4 20 4-1 10-10-3-3L5 16l-1 4Z" />
    <path d="m13 8 3 3" />
  </svg>
);

const IconoReabastecer = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 20h14" />
  </svg>
);

const IconoEstado = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 3v9" />
    <path d="M7.5 5.5a8 8 0 1 0 9 0" />
  </svg>
);

const IconoCerrar = () => (
  <svg viewBox="0 0 24 24">
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

const IconoCheck = () => (
  <svg viewBox="0 0 24 24">
    <path d="m5 12 4 4L19 6" />
  </svg>
);

/* =====================================================
   COMPONENTE
===================================================== */

const Insumos = () => {
  const [
    insumos,
    setInsumos
  ] = useState([]);

  const [
    resumen,
    setResumen
  ] = useState({
    totalInsumos: 0,
    insumosActivos: 0,
    insumosInactivos: 0,
    insumosBajoStock: 0,
    insumosAgotados: 0,
    unidadesDisponibles: 0,
    valorInventario: 0
  });

  const [
    busqueda,
    setBusqueda
  ] = useState('');

  const [
    filtroCategoria,
    setFiltroCategoria
  ] = useState('todas');

  const [
    filtroEstado,
    setFiltroEstado
  ] = useState('todos');

  const [
    filtroStock,
    setFiltroStock
  ] = useState('todos');

  const [
    filtroPrioridad,
    setFiltroPrioridad
  ] = useState('todas');

  const [
    filtroML,
    setFiltroML
  ] = useState('todos');

  const [paginaActual, setPaginaActual] =
    useState(1);

  const [tamanoPagina, setTamanoPagina] =
    useState(10);

  const [
    modalInsumo,
    setModalInsumo
  ] = useState(false);

  const [
    modalidadInsumo,
    setModalidadInsumo
  ] = useState('crear');

  const [
    insumoSeleccionado,
    setInsumoSeleccionado
  ] = useState(null);

  const [
    formularioInsumo,
    setFormularioInsumo
  ] = useState(
    formularioInsumoInicial
  );

  const [
    modalReabastecimiento,
    setModalReabastecimiento
  ] = useState(false);

  const [
    formularioReabastecimiento,
    setFormularioReabastecimiento
  ] = useState(
    formularioReabastecimientoInicial
  );

  const [
    modalEstado,
    setModalEstado
  ] = useState(false);

  const [
    cargando,
    setCargando
  ] = useState(true);

  const [
    actualizando,
    setActualizando
  ] = useState(false);

  const [
    procesando,
    setProcesando
  ] = useState(false);

  const [
    mensaje,
    setMensaje
  ] = useState('');

  const [
    error,
    setError
  ] = useState('');

  useEffect(() => {
    cargarInformacion();
  }, []);

  /* ===================================================
     CARGA
  =================================================== */

  const cargarInformacion =
    async () => {
      try {
        setActualizando(true);
        setError('');

        const resultados =
          await Promise.allSettled([
            api.get(
              '/insumos',
              {
                params: {
                  sinPaginar: true
                }
              }
            ),
            api.get(
              '/insumos/resumen'
            )
          ]);

        const [
          resultadoInsumos,
          resultadoResumen
        ] = resultados;

        if (
          resultadoInsumos.status ===
          'fulfilled'
        ) {
          setInsumos(
            obtenerArreglo(
              resultadoInsumos.value,
              'insumos'
            )
          );
        } else {
          console.error(
            'Error al cargar insumos:',
            resultadoInsumos.reason
          );

          setInsumos([]);
        }

        if (
          resultadoResumen.status ===
          'fulfilled'
        ) {
          setResumen({
            totalInsumos:
              Number(
                resultadoResumen.value
                  .data?.resumen
                  ?.totalInsumos || 0
              ),

            insumosActivos:
              Number(
                resultadoResumen.value
                  .data?.resumen
                  ?.insumosActivos || 0
              ),

            insumosInactivos:
              Number(
                resultadoResumen.value
                  .data?.resumen
                  ?.insumosInactivos || 0
              ),

            insumosBajoStock:
              Number(
                resultadoResumen.value
                  .data?.resumen
                  ?.insumosBajoStock || 0
              ),

            insumosAgotados:
              Number(
                resultadoResumen.value
                  .data?.resumen
                  ?.insumosAgotados || 0
              ),

            unidadesDisponibles:
              Number(
                resultadoResumen.value
                  .data?.resumen
                  ?.unidadesDisponibles || 0
              ),

            valorInventario:
              Number(
                resultadoResumen.value
                  .data?.resumen
                  ?.valorInventario || 0
              )
          });
        } else {
          console.error(
            'Error al cargar resumen:',
            resultadoResumen.reason
          );
        }

        const seccionesFallidas = [];

        if (
          resultadoInsumos.status ===
          'rejected'
        ) {
          seccionesFallidas.push(
            'el inventario'
          );
        }

        if (
          resultadoResumen.status ===
          'rejected'
        ) {
          seccionesFallidas.push(
            'los indicadores'
          );
        }

        if (
          seccionesFallidas.length > 0
        ) {
          setError(
            `No se pudieron cargar ${seccionesFallidas.join(
              ' ni '
            )}.`
          );
        }
      } catch (
        errorPeticion
      ) {
        console.error(
          'Error general al cargar inventario:',
          errorPeticion
        );

        setError(
          'No se pudo cargar el módulo de inventario.'
        );
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    };

  /* ===================================================
     FILTROS
  =================================================== */

  const categoriasDisponibles =
    useMemo(() => {
      return Array.from(
        new Set(
          insumos
            .map(
              (insumo) =>
                insumo.categoria ||
                'General'
            )
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(
          b,
          'es'
        )
      );
    }, [insumos]);

  const insumosFiltrados =
    useMemo(() => {
      const texto =
        normalizarTexto(
          busqueda
        );

      return insumos.filter(
        (insumo) => {
          const estadoStock =
            obtenerEstadoStock(
              insumo
            );

          const coincideBusqueda =
            !texto ||
            normalizarTexto(
              [
                insumo.codigo,
                insumo.nombre,
                insumo.descripcion,
                insumo.categoria,
                insumo.unidadMedida,
                insumo.especialidad,
                insumo.lote
              ]
                .filter(Boolean)
                .join(' ')
            ).includes(texto);

          const coincideCategoria =
            filtroCategoria ===
              'todas' ||
            insumo.categoria ===
              filtroCategoria;

          const estadoReal =
            insumo.estado ||
            'activo';

          const coincideEstado =
            filtroEstado ===
              'todos' ||
            estadoReal ===
              filtroEstado;

          const coincideStock =
            filtroStock ===
              'todos' ||
            estadoStock.clave ===
              filtroStock;

          const coincidePrioridad =
            filtroPrioridad ===
              'todas' ||
            (
              insumo.prioridad ||
              'media'
            ) ===
              filtroPrioridad;

          const coincideML =
            filtroML ===
              'todos' ||
            (
              filtroML ===
                'si' &&
              insumo.usarEnML !==
                false
            ) ||
            (
              filtroML ===
                'no' &&
              insumo.usarEnML ===
                false
            );

          return (
            coincideBusqueda &&
            coincideCategoria &&
            coincideEstado &&
            coincideStock &&
            coincidePrioridad &&
            coincideML
          );
        }
      );
    }, [
      insumos,
      busqueda,
      filtroCategoria,
      filtroEstado,
      filtroStock,
      filtroPrioridad,
      filtroML
    ]);

  useEffect(() => {
    setPaginaActual(1);
  }, [
    busqueda,
    filtroCategoria,
    filtroEstado,
    filtroStock,
    filtroPrioridad,
    filtroML
  ]);

  const insumosPaginados = useMemo(() => {
    const inicio =
      (paginaActual - 1) * tamanoPagina;

    return insumosFiltrados.slice(
      inicio,
      inicio + tamanoPagina
    );
  }, [insumosFiltrados, paginaActual, tamanoPagina]);

  /* ===================================================
     MODAL CREAR / EDITAR
  =================================================== */

  const abrirCrearInsumo = () => {
    setModalidadInsumo(
      'crear'
    );

    setInsumoSeleccionado(
      null
    );

    setFormularioInsumo(
      formularioInsumoInicial
    );

    setError('');
    setModalInsumo(true);
  };

  const abrirEditarInsumo = (
    insumo
  ) => {
    setModalidadInsumo(
      'editar'
    );

    setInsumoSeleccionado(
      insumo
    );

    setFormularioInsumo({
      codigo:
        insumo.codigo || '',

      nombre:
        insumo.nombre || '',

      descripcion:
        insumo.descripcion || '',

      categoria:
        insumo.categoria ||
        'General',

      unidadMedida:
        insumo.unidadMedida ||
        '',

      stockActual:
        String(
          insumo.stockActual ??
            0
        ),

      stockMinimo:
        String(
          insumo.stockMinimo ??
            0
        ),

      costoUnitario:
        String(
          insumo.costoUnitario ??
            0
        ),

      prioridad:
        insumo.prioridad ||
        'media',

      especialidad:
        insumo.especialidad ||
        'Todas',

      aplicacion:
        insumo.aplicacion ||
        'base',

      usarEnML:
        insumo.usarEnML !==
        false,

      controlVencimiento:
        Boolean(
          insumo.controlVencimiento
        ),

      lote:
        insumo.lote || '',

      fechaVencimiento:
        convertirFechaParaInput(
          insumo.fechaVencimiento
        ),

      fuenteReferencia:
        insumo.fuenteReferencia ||
        ''
    });

    setError('');
    setModalInsumo(true);
  };

  const cerrarModalInsumo = () => {
    if (procesando) {
      return;
    }

    setModalInsumo(false);

    setInsumoSeleccionado(
      null
    );

    setFormularioInsumo(
      formularioInsumoInicial
    );
  };

  const actualizarCampoInsumo = (
    campo,
    valor
  ) => {
    setFormularioInsumo(
      (anterior) => ({
        ...anterior,
        [campo]: valor
      })
    );
  };

  const guardarInsumo =
    async (evento) => {
      evento.preventDefault();

      setError('');
      setMensaje('');

      const codigo =
        formularioInsumo.codigo
          .trim()
          .toUpperCase();

      const nombre =
        formularioInsumo.nombre.trim();

      const unidadMedida =
        formularioInsumo.unidadMedida.trim();

      const stockActual =
        Number(
          formularioInsumo.stockActual
        );

      const stockMinimo =
        Number(
          formularioInsumo.stockMinimo
        );

      const costoUnitario =
        Number(
          formularioInsumo.costoUnitario
        );

      if (
        !codigo ||
        !nombre ||
        !unidadMedida
      ) {
        setError(
          'El código, el nombre y la unidad de medida son obligatorios.'
        );

        return;
      }

      if (
        modalidadInsumo ===
          'crear' &&
        (!Number.isFinite(
          stockActual
        ) ||
          stockActual < 0)
      ) {
        setError(
          'El stock actual debe ser igual o mayor que cero.'
        );

        return;
      }

      if (
        !Number.isFinite(
          stockMinimo
        ) ||
        stockMinimo < 0
      ) {
        setError(
          'El stock mínimo debe ser igual o mayor que cero.'
        );

        return;
      }

      if (
        !Number.isFinite(
          costoUnitario
        ) ||
        costoUnitario < 0
      ) {
        setError(
          'El costo unitario debe ser igual o mayor que cero.'
        );

        return;
      }

      const datos = {
        codigo,

        nombre,

        descripcion:
          formularioInsumo.descripcion.trim(),

        categoria:
          formularioInsumo.categoria.trim() ||
          'General',

        unidadMedida,

        stockMinimo,

        costoUnitario,

        prioridad:
          formularioInsumo.prioridad,

        especialidad:
          formularioInsumo.especialidad.trim() ||
          'Todas',

        aplicacion:
          formularioInsumo.aplicacion,

        usarEnML:
          formularioInsumo.usarEnML,

        controlVencimiento:
          formularioInsumo.controlVencimiento,

        lote:
          formularioInsumo.lote.trim(),

        fechaVencimiento:
          formularioInsumo
            .controlVencimiento &&
          formularioInsumo
            .fechaVencimiento
            ? formularioInsumo
                .fechaVencimiento
            : null,

        fuenteReferencia:
          formularioInsumo.fuenteReferencia.trim()
      };

      if (
        modalidadInsumo ===
        'crear'
      ) {
        datos.stockActual =
          stockActual;
      }

      try {
        setProcesando(true);

        if (
          modalidadInsumo ===
          'crear'
        ) {
          const { data } =
            await api.post(
              '/insumos',
              datos
            );

          setMensaje(
            data.mensaje ||
              'Insumo registrado correctamente.'
          );
        } else {
          const { data } =
            await api.patch(
              `/insumos/${insumoSeleccionado._id}`,
              datos
            );

          setMensaje(
            data.mensaje ||
              'Insumo actualizado correctamente.'
          );
        }

        setModalInsumo(false);

        setFormularioInsumo(
          formularioInsumoInicial
        );

        setInsumoSeleccionado(
          null
        );

        await cargarInformacion();
      } catch (
        errorPeticion
      ) {
        console.error(
          'Error al guardar insumo:',
          errorPeticion
        );

        setError(
          errorPeticion.response
            ?.data?.mensaje ||
            'No se pudo guardar el insumo.'
        );
      } finally {
        setProcesando(false);
      }
    };

  /* ===================================================
     REABASTECIMIENTO
  =================================================== */

  const abrirReabastecimiento = (
    insumo
  ) => {
    if (
      insumo.estado ===
      'inactivo'
    ) {
      setError(
        'No se puede reabastecer un insumo inactivo.'
      );

      return;
    }

    setInsumoSeleccionado(
      insumo
    );

    setFormularioReabastecimiento(
      formularioReabastecimientoInicial
    );

    setError('');

    setModalReabastecimiento(
      true
    );
  };

  const abrirReabastecimientoGeneral = () => {
    setInsumoSeleccionado(null);
    setFormularioReabastecimiento(
      formularioReabastecimientoInicial
    );
    setError('');
    setModalReabastecimiento(true);
  };

  const cerrarReabastecimiento =
    () => {
      if (procesando) {
        return;
      }

      setModalReabastecimiento(
        false
      );

      setInsumoSeleccionado(
        null
      );

      setFormularioReabastecimiento(
        formularioReabastecimientoInicial
      );
    };

  const reabastecerInsumo =
    async (evento) => {
      evento.preventDefault();

      if (!insumoSeleccionado) {
        setError(
          'Selecciona un insumo para registrar la entrada.'
        );

        return;
      }

      const cantidad =
        Number(
          formularioReabastecimiento.cantidad
        );

      if (
        !Number.isFinite(
          cantidad
        ) ||
        cantidad <= 0
      ) {
        setError(
          'La cantidad debe ser mayor que cero.'
        );

        return;
      }

      try {
        setProcesando(true);
        setError('');
        setMensaje('');

        const { data } =
          await api.patch(
            `/insumos/${insumoSeleccionado._id}/reabastecer`,
            {
              cantidad,

              proveedor:
                formularioReabastecimiento.proveedor.trim(),

              observacion:
                formularioReabastecimiento.observacion.trim()
            }
          );

        setMensaje(
          data.mensaje ||
            'Insumo reabastecido correctamente.'
        );

        setModalReabastecimiento(
          false
        );

        setInsumoSeleccionado(
          null
        );

        setFormularioReabastecimiento(
          formularioReabastecimientoInicial
        );

        await cargarInformacion();
      } catch (
        errorPeticion
      ) {
        console.error(
          'Error al reabastecer insumo:',
          errorPeticion
        );

        setError(
          errorPeticion.response
            ?.data?.mensaje ||
            'No se pudo reabastecer el insumo.'
        );
      } finally {
        setProcesando(false);
      }
    };

  /* ===================================================
     ACTIVAR / DESACTIVAR
  =================================================== */

  const abrirCambioEstado = (
    insumo
  ) => {
    setInsumoSeleccionado(
      insumo
    );

    setError('');
    setModalEstado(true);
  };

  const cerrarCambioEstado =
    () => {
      if (procesando) {
        return;
      }

      setModalEstado(false);

      setInsumoSeleccionado(
        null
      );
    };

  const cambiarEstadoInsumo =
    async () => {
      const estadoActual =
        insumoSeleccionado
          ?.estado || 'activo';

      const nuevoEstado =
        estadoActual === 'activo'
          ? 'inactivo'
          : 'activo';

      try {
        setProcesando(true);
        setError('');
        setMensaje('');

        const { data } =
          await api.patch(
            `/insumos/${insumoSeleccionado._id}/estado`,
            {
              estado:
                nuevoEstado
            }
          );

        setMensaje(
          data.mensaje ||
            'Estado actualizado correctamente.'
        );

        setModalEstado(false);

        setInsumoSeleccionado(
          null
        );

        await cargarInformacion();
      } catch (
        errorPeticion
      ) {
        console.error(
          'Error al cambiar estado:',
          errorPeticion
        );

        setError(
          errorPeticion.response
            ?.data?.mensaje ||
            'No se pudo cambiar el estado del insumo.'
        );
      } finally {
        setProcesando(false);
      }
    };

  /* ===================================================
     LIMPIAR FILTROS
  =================================================== */

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroCategoria(
      'todas'
    );
    setFiltroEstado(
      'todos'
    );
    setFiltroStock(
      'todos'
    );

    setFiltroPrioridad(
      'todas'
    );

    setFiltroML(
      'todos'
    );
  };

  const existenFiltros =
    busqueda.trim() !== '' ||
    filtroCategoria !==
      'todas' ||
    filtroEstado !== 'todos' ||
    filtroStock !== 'todos' ||
    filtroPrioridad !==
      'todas' ||
    filtroML !== 'todos';

  /* ===================================================
     CARGANDO
  =================================================== */

  if (cargando) {
    return (
      <section className="admin-inventory-loading">
        <div className="admin-inventory-spinner" />

        <h2>
          Cargando inventario
        </h2>

        <p>
          Consultando insumos, existencias y alertas de stock.
        </p>
      </section>
    );
  }

  return (
    <main className="admin-inventory-page">
      {/* ENCABEZADO */}

      <header className="admin-inventory-header">
        <div>
          <span className="admin-inventory-eyebrow">
            Gestión de inventario
          </span>

          <h1>
            Inventario de insumos
          </h1>

          <p>
            Administra existencias, niveles mínimos, costos y reabastecimientos.
          </p>
        </div>

        <div className="admin-inventory-header-actions">
          <button
            type="button"
            className="inventory-refresh-button"
            disabled={actualizando}
            onClick={
              cargarInformacion
            }
          >
            <IconoActualizar />

            {actualizando
              ? 'Actualizando...'
              : 'Actualizar'}
          </button>

          <button
            type="button"
            className="inventory-restock-button"
            onClick={
              abrirReabastecimientoGeneral
            }
          >
            <IconoReabastecer />
            Reabastecer insumo
          </button>

          <button
            type="button"
            className="inventory-primary-button"
            onClick={
              abrirCrearInsumo
            }
          >
            <IconoAgregar />
            Nuevo insumo
          </button>
        </div>
      </header>

      {/* MENSAJES */}

      {mensaje && (
        <div className="inventory-message success">
          <IconoCheck />

          <span>
            {mensaje}
          </span>

          <button
            type="button"
            onClick={() =>
              setMensaje('')
            }
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="inventory-message error">
          <IconoAdvertencia />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError('')
            }
          >
            ×
          </button>
        </div>
      )}

      {/* RESUMEN */}

      <section className="admin-inventory-summary">
        <article className="total">
          <div>
            <span>
              Total insumos
            </span>

            <strong>
              {
                resumen.totalInsumos
              }
            </strong>

            <small>
              Registros del inventario
            </small>
          </div>

          <IconoCaja />
        </article>

        <article className="active">
          <div>
            <span>
              Insumos activos
            </span>

            <strong>
              {
                resumen.insumosActivos
              }
            </strong>

            <small>
              Disponibles para uso
            </small>
          </div>

          <IconoActivo />
        </article>

        <article className="low">
          <div>
            <span>
              Bajo stock
            </span>

            <strong>
              {
                resumen.insumosBajoStock
              }
            </strong>

            <small>
              Requieren reposición
            </small>
          </div>

          <IconoAdvertencia />
        </article>

        <article className="empty">
          <div>
            <span>
              Agotados
            </span>

            <strong>
              {
                resumen.insumosAgotados
              }
            </strong>

            <small>
              Sin existencias
            </small>
          </div>

          <IconoAgotado />
        </article>

        <article className="units">
          <div>
            <span>
              Unidades disponibles
            </span>

            <strong>
              {formatearNumero(
                resumen.unidadesDisponibles
              )}
            </strong>

            <small>
              Suma del stock actual
            </small>
          </div>

          <IconoReabastecer />
        </article>

        <article className="value">
          <div>
            <span>
              Valor del inventario
            </span>

            <strong>
              {formatearMoneda(
                resumen.valorInventario
              )}
            </strong>

            <small>
              Stock por costo unitario
            </small>
          </div>

          <IconoDinero />
        </article>
      </section>

      {/* FILTROS */}

      <section className="admin-inventory-toolbar">
        <label className="inventory-search">
          <span>
            Buscar insumo
          </span>

          <div>
            <IconoBuscar />

            <input
              type="search"
              value={busqueda}
              placeholder="Código, nombre, descripción, categoría, especialidad o lote..."
              onChange={(evento) =>
                setBusqueda(
                  evento.target.value
                )
              }
            />
          </div>
        </label>

        <label>
          <span>
            Categoría
          </span>

          <select
            value={
              filtroCategoria
            }
            onChange={(evento) =>
              setFiltroCategoria(
                evento.target.value
              )
            }
          >
            <option value="todas">
              Todas
            </option>

            {categoriasDisponibles.map(
              (categoria) => (
                <option
                  key={
                    categoria
                  }
                  value={
                    categoria
                  }
                >
                  {categoria}
                </option>
              )
            )}
          </select>
        </label>

        <label>
          <span>
            Estado
          </span>

          <select
            value={
              filtroEstado
            }
            onChange={(evento) =>
              setFiltroEstado(
                evento.target.value
              )
            }
          >
            <option value="todos">
              Todos
            </option>

            <option value="activo">
              Activos
            </option>

            <option value="inactivo">
              Inactivos
            </option>
          </select>
        </label>

        <label>
          <span>
            Stock
          </span>

          <select
            value={
              filtroStock
            }
            onChange={(evento) =>
              setFiltroStock(
                evento.target.value
              )
            }
          >
            <option value="todos">
              Todos
            </option>

            <option value="disponible">
              Disponible
            </option>

            <option value="bajo">
              Bajo stock
            </option>

            <option value="agotado">
              Agotado
            </option>
          </select>
        </label>

        <label>
          <span>
            Prioridad
          </span>

          <select
            value={
              filtroPrioridad
            }
            onChange={(evento) =>
              setFiltroPrioridad(
                evento.target.value
              )
            }
          >
            <option value="todas">
              Todas
            </option>

            <option value="critica">
              Crítica
            </option>

            <option value="alta">
              Alta
            </option>

            <option value="media">
              Media
            </option>

            <option value="baja">
              Baja
            </option>
          </select>
        </label>

        <label>
          <span>
            Machine Learning
          </span>

          <select
            value={filtroML}
            onChange={(evento) =>
              setFiltroML(
                evento.target.value
              )
            }
          >
            <option value="todos">
              Todos
            </option>

            <option value="si">
              Incluidos en ML
            </option>

            <option value="no">
              Excluidos de ML
            </option>
          </select>
        </label>
      </section>

      {/* LISTADO */}

      <section className="admin-inventory-list">
        <header>
          <div>
            <span>
              Control de existencias
            </span>

            <h2>
              Listado de insumos
            </h2>

            <p>
              {
                insumosFiltrados.length
              }{' '}
              {insumosFiltrados.length ===
              1
                ? 'insumo encontrado'
                : 'insumos encontrados'}
            </p>
          </div>
        </header>

        {insumosFiltrados.length ===
        0 ? (
          <div className="inventory-empty-state">
            <IconoCaja />

            <h3>
              No se encontraron insumos
            </h3>

            <p>
              No existen registros que coincidan con los filtros seleccionados.
            </p>

            {existenFiltros && (
              <button
                type="button"
                onClick={
                  limpiarFiltros
                }
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="admin-inventory-table-wrapper">
            <table className="admin-inventory-table">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Clasificación</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Vencimiento</th>
                  <th>Nivel de existencias</th>
                  <th>Costo unitario</th>
                  <th>Valor actual</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {insumosPaginados.map(
                  (insumo) => {
                    const estadoStock =
                      obtenerEstadoStock(
                        insumo
                      );

                    const porcentaje =
                      obtenerPorcentajeStock(
                        insumo
                      );

                    const estadoVencimiento =
                      obtenerEstadoVencimiento(
                        insumo
                      );

                    const valorActual =
                      convertirNumero(
                        insumo.stockActual
                      ) *
                      convertirNumero(
                        insumo.costoUnitario
                      );

                    const estaInactivo =
                      insumo.estado ===
                      'inactivo';

                    return (
                      <tr
                        key={
                          insumo._id
                        }
                        className={
                          estaInactivo
                            ? 'inactive-row'
                            : ''
                        }
                      >
                        <td>
                          <div className="inventory-item-main">
                            <span>
                              <IconoCaja />
                            </span>

                            <div>
                              <strong>
                                {
                                  insumo.nombre
                                }
                              </strong>

                              <span className="inventory-item-code">
                                {insumo.codigo ||
                                  'SIN CÓDIGO'}
                              </span>

                              <small>
                                {insumo.descripcion ||
                                  'Sin descripción'}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="inventory-classification">
                            <span
                              className={`inventory-priority ${
                                insumo.prioridad ||
                                'media'
                              }`}
                            >
                              Prioridad{' '}
                              {insumo.prioridad ===
                              'critica'
                                ? 'crítica'
                                : insumo.prioridad ||
                                  'media'}
                            </span>

                            <span className="inventory-application">
                              {insumo.aplicacion ===
                              'condicional'
                                ? 'Condicional'
                                : 'Base'}
                            </span>

                            <span
                              className={`inventory-ml ${
                                insumo.usarEnML ===
                                false
                                  ? 'excluded'
                                  : 'included'
                              }`}
                            >
                              {insumo.usarEnML ===
                              false
                                ? 'Fuera de ML'
                                : 'Usar en ML'}
                            </span>

                            <small>
                              {insumo.especialidad ||
                                'Todas'}
                            </small>
                          </div>
                        </td>

                        <td>
                          <span className="inventory-category">
                            {insumo.categoria ||
                              'General'}
                          </span>
                        </td>

                        <td>
                          <div className="inventory-stock-numbers">
                            <strong>
                              {formatearNumero(
                                insumo.stockActual
                              )}
                            </strong>

                            <small>
                              {insumo.unidadMedida ||
                                'unidad'}
                            </small>

                            <span>
                              Mínimo:{' '}
                              {formatearNumero(
                                insumo.stockMinimo
                              )}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="inventory-expiration">
                            <span
                              className={
                                estadoVencimiento.clave
                              }
                            >
                              {
                                estadoVencimiento.etiqueta
                              }
                            </span>

                            {insumo
                              .controlVencimiento && (
                              <>
                                <strong>
                                  {formatearFecha(
                                    insumo.fechaVencimiento
                                  )}
                                </strong>

                                <small>
                                  Lote:{' '}
                                  {insumo.lote ||
                                    'pendiente'}
                                </small>
                              </>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="inventory-level">
                            <div>
                              <span
                                style={{
                                  width: `${porcentaje}%`
                                }}
                                className={
                                  estadoStock.clave
                                }
                              />
                            </div>

                            <small>
                              {
                                estadoStock.etiqueta
                              }
                            </small>
                          </div>
                        </td>

                        <td>
                          <strong className="inventory-money">
                            {formatearMoneda(
                              insumo.costoUnitario
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong className="inventory-money total">
                            {formatearMoneda(
                              valorActual
                            )}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`inventory-status ${
                              insumo.estado ||
                              'activo'
                            }`}
                          >
                            {insumo.estado ===
                            'inactivo'
                              ? 'Inactivo'
                              : 'Activo'}
                          </span>
                        </td>

                        <td>
                          <div className="inventory-actions">
                            <button
                              type="button"
                              className="edit"
                              title="Editar insumo"
                              onClick={() =>
                                abrirEditarInsumo(
                                  insumo
                                )
                              }
                            >
                              <IconoEditar />
                            </button>

                            <button
                              type="button"
                              className="restock"
                              title="Reabastecer"
                              disabled={
                                estaInactivo
                              }
                              onClick={() =>
                                abrirReabastecimiento(
                                  insumo
                                )
                              }
                            >
                              <IconoReabastecer />
                            </button>

                            <button
                              type="button"
                              className={
                                estaInactivo
                                  ? 'activate'
                                  : 'deactivate'
                              }
                              title={
                                estaInactivo
                                  ? 'Activar insumo'
                                  : 'Desactivar insumo'
                              }
                              onClick={() =>
                                abrirCambioEstado(
                                  insumo
                                )
                              }
                            >
                              <IconoEstado />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={paginaActual}
          pageSize={tamanoPagina}
          totalItems={insumosFiltrados.length}
          onPageChange={setPaginaActual}
          onPageSizeChange={(size) => {
            setTamanoPagina(size);
            setPaginaActual(1);
          }}
          label="insumos"
        />
      </section>

      {/* MODAL CREAR / EDITAR */}

      {modalInsumo && (
        <div
          className="inventory-modal-overlay"
          onMouseDown={(evento) => {
            if (
              evento.target ===
              evento.currentTarget
            ) {
              cerrarModalInsumo();
            }
          }}
        >
          <section className="inventory-modal">
            <header>
              <div>
                <span>
                  Gestión de inventario
                </span>

                <h2>
                  {modalidadInsumo ===
                  'crear'
                    ? 'Registrar nuevo insumo'
                    : 'Editar insumo'}
                </h2>

                <p>
                  {modalidadInsumo ===
                  'crear'
                    ? 'Añade un nuevo material al inventario odontológico.'
                    : 'Actualiza la información general del insumo.'}
                </p>
              </div>

              <button
                type="button"
                aria-label="Cerrar"
                onClick={
                  cerrarModalInsumo
                }
              >
                <IconoCerrar />
              </button>
            </header>

            <form
              className="inventory-form"
              onSubmit={
                guardarInsumo
              }
            >
              {error && (
                <div className="inventory-message error inventory-form-feedback" role="alert">
                  <IconoAdvertencia />
                  <span>{error}</span>
                </div>
              )}

              <div className="inventory-form-grid">
                <label>
                  <span>
                    Código *
                  </span>

                  <input
                    type="text"
                    value={
                      formularioInsumo.codigo
                    }
                    placeholder="Ejemplo: INS-001"
                    maxLength={20}
                    onChange={(evento) =>
                      actualizarCampoInsumo(
                        'codigo',
                        evento.target.value
                          .toUpperCase()
                      )
                    }
                    required
                  />
                </label>

                <label>
                  <span>
                    Nombre del insumo *
                  </span>

                  <input
                    type="text"
                    value={
                      formularioInsumo.nombre
                    }
                    placeholder="Ejemplo: Anestesia dental"
                    maxLength={120}
                    onChange={(evento) =>
                      actualizarCampoInsumo(
                        'nombre',
                        evento.target.value
                      )
                    }
                    required
                  />
                </label>

                <label>
                  <span>
                    Categoría
                  </span>

                  <input
                    type="text"
                    list="categorias-insumo"
                    value={
                      formularioInsumo.categoria
                    }
                    placeholder="General"
                    maxLength={100}
                    onChange={(evento) =>
                      actualizarCampoInsumo(
                        'categoria',
                        evento.target.value
                      )
                    }
                  />

                  <datalist id="categorias-insumo">
                    {categoriasSugeridas.map(
                      (categoria) => (
                        <option
                          key={
                            categoria
                          }
                          value={
                            categoria
                          }
                        />
                      )
                    )}
                  </datalist>
                </label>

                <label>
                  <span>
                    Unidad de medida *
                  </span>

                  <input
                    type="text"
                    list="unidades-insumo"
                    value={
                      formularioInsumo.unidadMedida
                    }
                    placeholder="Ejemplo: cartucho"
                    maxLength={50}
                    onChange={(evento) =>
                      actualizarCampoInsumo(
                        'unidadMedida',
                        evento.target.value
                      )
                    }
                    required
                  />

                  <datalist id="unidades-insumo">
                    {unidadesSugeridas.map(
                      (unidad) => (
                        <option
                          key={
                            unidad
                          }
                          value={
                            unidad
                          }
                        />
                      )
                    )}
                  </datalist>
                </label>

                {modalidadInsumo ===
                  'crear' && (
                  <label>
                    <span>
                      Stock inicial *
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        formularioInsumo.stockActual
                      }
                      placeholder="0"
                      onChange={(evento) =>
                        actualizarCampoInsumo(
                          'stockActual',
                          evento.target.value
                        )
                      }
                      required
                    />
                  </label>
                )}

                <label>
                  <span>
                    Stock mínimo *
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      formularioInsumo.stockMinimo
                    }
                    placeholder="0"
                    onChange={(evento) =>
                      actualizarCampoInsumo(
                        'stockMinimo',
                        evento.target.value
                      )
                    }
                    required
                  />
                </label>

                <label>
                  <span>
                    Costo unitario (Bs)
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      formularioInsumo.costoUnitario
                    }
                    placeholder="0.00"
                    onChange={(evento) =>
                      actualizarCampoInsumo(
                        'costoUnitario',
                        evento.target.value
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Prioridad
                  </span>

                  <select
                    value={
                      formularioInsumo.prioridad
                    }
                    onChange={(evento) =>
                      actualizarCampoInsumo(
                        'prioridad',
                        evento.target.value
                      )
                    }
                  >
                    <option value="critica">
                      Crítica
                    </option>

                    <option value="alta">
                      Alta
                    </option>

                    <option value="media">
                      Media
                    </option>

                    <option value="baja">
                      Baja
                    </option>
                  </select>
                </label>

                <label>
                  <span>
                    Aplicación
                  </span>

                  <select
                    value={
                      formularioInsumo.aplicacion
                    }
                    onChange={(evento) =>
                      actualizarCampoInsumo(
                        'aplicacion',
                        evento.target.value
                      )
                    }
                  >
                    <option value="base">
                      Base
                    </option>

                    <option value="condicional">
                      Condicional
                    </option>
                  </select>
                </label>

                <label className="wide">
                  <span>
                    Especialidad o uso
                  </span>

                  <input
                    type="text"
                    list="especialidades-insumo"
                    value={
                      formularioInsumo.especialidad
                    }
                    placeholder="Ejemplo: Endodoncia"
                    maxLength={150}
                    onChange={(evento) =>
                      actualizarCampoInsumo(
                        'especialidad',
                        evento.target.value
                      )
                    }
                  />

                  <datalist id="especialidades-insumo">
                    {especialidadesSugeridas.map(
                      (especialidad) => (
                        <option
                          key={
                            especialidad
                          }
                          value={
                            especialidad
                          }
                        />
                      )
                    )}
                  </datalist>
                </label>

                <div className="inventory-form-switches wide">
                  <label className="inventory-switch-field">
                    <input
                      type="checkbox"
                      checked={
                        formularioInsumo.usarEnML
                      }
                      onChange={(evento) =>
                        actualizarCampoInsumo(
                          'usarEnML',
                          evento.target.checked
                        )
                      }
                    />

                    <span>
                      <strong>
                        Utilizar en Machine Learning
                      </strong>

                      <small>
                        Incluye este insumo en la predicción de consumo.
                      </small>
                    </span>
                  </label>

                  <label className="inventory-switch-field">
                    <input
                      type="checkbox"
                      checked={
                        formularioInsumo
                          .controlVencimiento
                      }
                      onChange={(evento) => {
                        const activado =
                          evento.target.checked;

                        setFormularioInsumo(
                          (anterior) => ({
                            ...anterior,
                            controlVencimiento:
                              activado,
                            fechaVencimiento:
                              activado
                                ? anterior
                                    .fechaVencimiento
                                : ''
                          })
                        );
                      }}
                    />

                    <span>
                      <strong>
                        Controlar vencimiento
                      </strong>

                      <small>
                        Activa el seguimiento de lote y fecha del producto.
                      </small>
                    </span>
                  </label>
                </div>

                <label>
                  <span>
                    Lote
                  </span>

                  <input
                    type="text"
                    value={
                      formularioInsumo.lote
                    }
                    placeholder="Completar con el producto físico"
                    maxLength={100}
                    onChange={(evento) =>
                      actualizarCampoInsumo(
                        'lote',
                        evento.target.value
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Fecha de vencimiento
                  </span>

                  <input
                    type="date"
                    value={
                      formularioInsumo.fechaVencimiento
                    }
                    disabled={
                      !formularioInsumo
                        .controlVencimiento
                    }
                    onChange={(evento) =>
                      actualizarCampoInsumo(
                        'fechaVencimiento',
                        evento.target.value
                      )
                    }
                  />
                </label>

                <label className="wide">
                  <span>
                    Descripción
                  </span>

                  <textarea
                    value={
                      formularioInsumo.descripcion
                    }
                    placeholder="Describe brevemente el uso o las características del insumo..."
                    maxLength={500}
                    onChange={(evento) =>
                      actualizarCampoInsumo(
                        'descripcion',
                        evento.target.value
                      )
                    }
                  />
                </label>

                <label className="wide">
                  <span>
                    Fuente de referencia
                  </span>

                  <textarea
                    value={
                      formularioInsumo.fuenteReferencia
                    }
                    placeholder="Norma, guía técnica o referencia utilizada para incluir el insumo..."
                    maxLength={500}
                    onChange={(evento) =>
                      actualizarCampoInsumo(
                        'fuenteReferencia',
                        evento.target.value
                      )
                    }
                  />
                </label>
              </div>

              {modalidadInsumo ===
                'editar' && (
                <p className="inventory-form-note">
                  El stock actual no se modifica desde esta ventana. Utiliza la opción de reabastecimiento o registra consumos desde una atención clínica.
                </p>
              )}

              <footer>
                <button
                  type="button"
                  className="inventory-secondary-button"
                  disabled={
                    procesando
                  }
                  onClick={
                    cerrarModalInsumo
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="inventory-primary-button"
                  disabled={
                    procesando
                  }
                >
                  {procesando
                    ? 'Guardando...'
                    : modalidadInsumo ===
                      'crear'
                      ? 'Registrar insumo'
                      : 'Guardar cambios'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* MODAL REABASTECIMIENTO */}

      {modalReabastecimiento && (
          <div className="inventory-modal-overlay">
            <section className="inventory-modal small">
              <header>
                <div>
                  <span>
                    Movimiento de entrada
                  </span>

                  <h2>
                    Reabastecer insumo
                  </h2>

                  <p>
                    Selecciona el insumo y registra una nueva entrada de existencias.
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={
                    cerrarReabastecimiento
                  }
                >
                  <IconoCerrar />
                </button>
              </header>

              <form
                className="inventory-form"
                onSubmit={
                  reabastecerInsumo
                }
              >
                {error && (
                  <div className="inventory-message error inventory-form-feedback" role="alert">
                    <IconoAdvertencia />
                    <span>{error}</span>
                  </div>
                )}

                {!insumoSeleccionado ? (
                  <label className="inventory-restock-selector">
                    <span>Insumo existente *</span>

                    <select
                      value=""
                      onChange={(evento) => {
                        const insumo = insumos.find(
                          (item) => item._id === evento.target.value
                        );

                        if (insumo) {
                          setInsumoSeleccionado(insumo);
                        }
                      }}
                      required
                    >
                      <option value="" disabled>
                        Selecciona un insumo activo
                      </option>

                      {insumos
                        .filter((insumo) => insumo.estado !== 'inactivo')
                        .map((insumo) => (
                          <option key={insumo._id} value={insumo._id}>
                            {insumo.codigo} - {insumo.nombre}
                          </option>
                        ))}
                    </select>
                  </label>
                ) : (
                  <>
                    <div className="inventory-selected-item">
                      <span>
                        <IconoCaja />
                      </span>

                      <div>
                        <strong>
                          {insumoSeleccionado.nombre}
                        </strong>

                        <small>
                          Stock actual:{' '}
                          {formatearNumero(
                            insumoSeleccionado.stockActual
                          )}{' '}
                          {insumoSeleccionado.unidadMedida}
                        </small>
                      </div>
                    </div>

                    <p className="inventory-restock-note">
                      Se conservarán el lote y la fecha de vencimiento registrados en este insumo. La marca todavía no forma parte de los datos del inventario.
                    </p>
                  </>
                )}

                <div className="inventory-form-grid">
                  <label>
                    <span>
                      Cantidad recibida *
                    </span>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={
                        formularioReabastecimiento.cantidad
                      }
                      placeholder="0"
                      onChange={(evento) =>
                        setFormularioReabastecimiento(
                          (anterior) => ({
                            ...anterior,
                            cantidad:
                              evento.target.value
                          })
                        )
                      }
                      required
                    />
                  </label>

                  <label>
                    <span>
                      Proveedor
                    </span>

                    <input
                      type="text"
                      value={
                        formularioReabastecimiento.proveedor
                      }
                      placeholder="Nombre del proveedor"
                      maxLength={150}
                      onChange={(evento) =>
                        setFormularioReabastecimiento(
                          (anterior) => ({
                            ...anterior,
                            proveedor:
                              evento.target.value
                          })
                        )
                      }
                    />
                  </label>

                  <label className="wide">
                    <span>
                      Observación
                    </span>

                    <textarea
                      value={
                        formularioReabastecimiento.observacion
                      }
                      placeholder="Ejemplo: Reposición mensual de inventario"
                      maxLength={500}
                      onChange={(evento) =>
                        setFormularioReabastecimiento(
                          (anterior) => ({
                            ...anterior,
                            observacion:
                              evento.target.value
                          })
                        )
                      }
                    />
                  </label>
                </div>

                <footer>
                  <button
                    type="button"
                    className="inventory-secondary-button"
                    disabled={
                      procesando
                    }
                    onClick={
                      cerrarReabastecimiento
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="inventory-primary-button"
                    disabled={
                      procesando
                    }
                  >
                    {procesando
                      ? 'Registrando...'
                      : 'Confirmar entrada'}
                  </button>
                </footer>
              </form>
            </section>
          </div>
        )}

      {/* MODAL CAMBIO DE ESTADO */}

      {modalEstado &&
        insumoSeleccionado && (
          <div className="inventory-modal-overlay">
            <section className="inventory-modal confirmation">
              <header>
                <div>
                  <span>
                    Control de inventario
                  </span>

                  <h2>
                    {insumoSeleccionado.estado ===
                    'inactivo'
                      ? 'Activar insumo'
                      : 'Desactivar insumo'}
                  </h2>

                  <p>
                    Confirma el cambio de estado del registro.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    cerrarCambioEstado
                  }
                >
                  <IconoCerrar />
                </button>
              </header>

              <div className="inventory-confirmation-body">
                {error && (
                  <div className="inventory-message error inventory-form-feedback" role="alert">
                    <IconoAdvertencia />
                    <span>{error}</span>
                  </div>
                )}

                <div
                  className={`inventory-confirmation-icon ${
                    insumoSeleccionado.estado ===
                    'inactivo'
                      ? 'activate'
                      : 'deactivate'
                  }`}
                >
                  <IconoEstado />
                </div>

                <h3>
                  {
                    insumoSeleccionado.nombre
                  }
                </h3>

                <p>
                  {insumoSeleccionado.estado ===
                  'inactivo'
                    ? 'El insumo volverá a estar disponible para su gestión y uso clínico.'
                    : 'El insumo permanecerá en el historial, pero no podrá reabastecerse ni utilizarse hasta ser activado nuevamente.'}
                </p>

                <footer>
                  <button
                    type="button"
                    className="inventory-secondary-button"
                    disabled={
                      procesando
                    }
                    onClick={
                      cerrarCambioEstado
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className={
                      insumoSeleccionado.estado ===
                      'inactivo'
                        ? 'inventory-activate-button'
                        : 'inventory-danger-button'
                    }
                    disabled={
                      procesando
                    }
                    onClick={
                      cambiarEstadoInsumo
                    }
                  >
                    {procesando
                      ? 'Procesando...'
                      : insumoSeleccionado.estado ===
                        'inactivo'
                        ? 'Activar insumo'
                        : 'Desactivar insumo'}
                  </button>
                </footer>
              </div>
            </section>
          </div>
        )}
    </main>
  );
};

export default Insumos;
