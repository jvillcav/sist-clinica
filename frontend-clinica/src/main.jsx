import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

//import './styles/public.css';
import './styles/public/login.css';
import './styles/public/servicios.css';
import './styles/public/inicio.css';
import './styles/public/contactanos.css';
import './styles/public/nosotros.css';

import './styles/global.css';

import './styles/admin/administradorLayout.css';
import './styles/admin/dashboardAdmin.css';
import './styles/admin/pacientesAdmin.css';
import './styles/admin/citasAdmin.css';
import './styles/admin/usuariosAdmin.css';
import './styles/admin/expedientesAdmin.css';
import './styles/admin/insumosAdmin.css';
import './styles/admin/prediccionesAdmin.css';

import './styles/recepcionistaLayout.css';

import './styles/paciente/pacienteLayout.css';
import './styles/paciente/AgendarCitaPaciente.css';
import './styles/paciente/InicioPaciente.css';
import './styles/paciente/ExpedientePaciente.css';
import './styles/paciente/MisCitasPaciente.css';
import './styles/paciente/PerfilPaciente.css';

import './styles/odontologo/odontologoLayout.css';
import './styles/odontologo/atencionMedica.css';
import './styles/odontologo/dashboardOdontologo.css';
import './styles/odontologo/citasOdontologo.css';
import './styles/odontologo/reportesOdontologo.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

//perfecto, puedes hacer un analisis mas acabo de agregar algunas cosas, realiza un analisis completo del proyecto sobre todo lo que estaria mal. 