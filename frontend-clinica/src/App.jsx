import { 
  BrowserRouter, 
  Routes, 
  Route 
} from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';

import PublicLayout from './layouts/PublicLayout';

import Inicio from './pages/Inicio';
import Servicios from './pages/Servicios';
import Nosotros from './pages/Nosotros';
import Contactanos from './pages/Contactanos';
import Login from './pages/Login';

import AdministradorLayout from './layouts/AdministradorLayout';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import UsuariosAdmin from './pages/admin/UsuariosAdmin';
import PacientesAdmin from './pages/admin/PacientesAdmin';
import CitasAdmin from './pages/admin/CitasAdmin';
import ExpedientesAdmin from './pages/admin/ExpedientesAdmin';
import InsumosAdmin from './pages/admin/InsumosAdmin';
import PrediccionesAdmin from './pages/admin/PrediccionesAdmin';

import RecepcionistaLayout from './layouts/RecepcionistaLayout';
import DashboardRecepcionista from './pages/recepcionista/DashboardRecepcionista';
import RegistrarPacienteRecepcion from './pages/recepcionista/RegistrarPacienteRecepcion';
import GestionCitasRecepcion from './pages/recepcionista/GestionCitasRecepcion';
import CancelarCitaRecepcion from './pages/recepcionista/CancelarCitaRecepcion';
import BuscarPacienteRecepcion from './pages/recepcionista/BuscarPacienteRecepcion';

import PacienteLayout from './layouts/PacienteLayout';
import PerfilPaciente from './pages/paciente/PerfilPaciente';
import InicioPaciente from './pages/paciente/InicioPaciente';
import AgendarCitaPaciente from './pages/paciente/AgendarCitaPaciente';
import MisCitasPaciente from './pages/paciente/MisCitasPaciente';
import ExpedientePaciente from './pages/paciente/ExpedientePaciente';

import OdontologoLayout from './layouts/OdontologoLayout';
import DashboardOdontologo from './pages/odontologo/DashboardOdontologo';
import PacientesOdontologo from './pages/odontologo/PacientesOdontologo';
import CitasOdontologo from './pages/odontologo/CitasOdontologo';
import AtencionMedica from './pages/odontologo/AtencionMedica';
import InsumosOdontologo from './pages/odontologo/InsumosOdontologo';
import ReportesOdontologo from './pages/odontologo/ReportesOdontologo';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/contactanos" element={<Contactanos />} />
          <Route path="/nosotros" element={<Nosotros />} />
        </Route>

        <Route
          element={
            <ProtectedRoute rolesPermitidos={['administrador']}>
              <AdministradorLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<DashboardAdmin />} />
          <Route path="/admin/usuarios" element={<UsuariosAdmin />} />
          <Route path="/admin/pacientes" element={<PacientesAdmin />} />
          <Route path="/admin/citas" element={<CitasAdmin />} />
          <Route path="/admin/expedientes" element={<ExpedientesAdmin />} />
          <Route path="/admin/insumos" element={<InsumosAdmin />} />
          <Route path="/admin/predicciones" element={<PrediccionesAdmin />} />
        </Route>

        <Route
          element={
            <ProtectedRoute rolesPermitidos={['paciente']}>
              <PacienteLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/paciente/inicio" element={<InicioPaciente />} />
          <Route path="/paciente/agendar" element={<AgendarCitaPaciente />} />
          <Route path="/paciente/mis-citas" element={<MisCitasPaciente />} />
          <Route path="/paciente/expediente" element={<ExpedientePaciente />} />
          <Route path="/paciente/perfil" element={<PerfilPaciente />} />
        </Route>

        <Route
          element={
            <ProtectedRoute rolesPermitidos={['odontologo']}>
              <OdontologoLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/odontologo/dashboard" element={<DashboardOdontologo />} />
          <Route path="/odontologo/citas" element={<CitasOdontologo />} />
          <Route path="/odontologo/pacientes" element={<PacientesOdontologo />} />
          <Route path="/odontologo/atencion" element={<AtencionMedica />} />
          <Route path="/odontologo/insumos" element={<InsumosOdontologo />} />
          <Route path="/odontologo/reportes" element={<ReportesOdontologo />} />
        </Route>
        
        <Route
          element={
           <ProtectedRoute rolesPermitidos={['recepcionista']}>
             <RecepcionistaLayout />
              </ProtectedRoute>
            }
          >
           <Route path="/recepcionista/inicio" element={<DashboardRecepcionista />} />
           <Route path="/recepcionista/registrar" element={<RegistrarPacienteRecepcion />} />
           <Route path="/recepcionista/citas" element={<GestionCitasRecepcion />} />
           <Route path="/recepcionista/cancelar" element={<CancelarCitaRecepcion />} />
           <Route path="/recepcionista/buscar" element={<BuscarPacienteRecepcion />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;