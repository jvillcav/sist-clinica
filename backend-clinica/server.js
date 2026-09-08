import 'dotenv/config';
import app from './src/app.js';
import conectarDB from './src/config/db.js';
import { config } from './src/config/env.js';

try {
  await conectarDB();

  const servidor = app.listen(config.port, () => {
    console.log(`API disponible en http://localhost:${config.port}`);
  });

  const cerrar = (senal) => {
    console.log(`\n${senal} recibido. Cerrando API...`);
    servidor.close(() => process.exit(0));
  };

  process.on('SIGINT', cerrar);
  process.on('SIGTERM', cerrar);
} catch (error) {
  console.error('No se pudo iniciar la API:', error.message);
  process.exit(1);
}
