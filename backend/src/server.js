import createApp from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Red7x7 API escuchando en el puerto ${PORT}`);
});
