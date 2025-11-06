import { GoogleGenerativeAI } from '@google/generative-ai';

const TEMPLATE_PROMPT = `Actúa como un asistente para resumir reuniones. Devuelve un JSON con las claves summary (texto corto), actionItems (lista de strings) y participants (lista de emails).`;

export const summarizeMeetingNotes = async (notes) => {
  if (!process.env.GEMINI_API_KEY) {
    throw Object.assign(new Error('GEMINI_API_KEY no configurado'), { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `${TEMPLATE_PROMPT}\n\nNotas:\n${notes}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const json = JSON.parse(text);
    return json;
  } catch (error) {
    throw Object.assign(new Error('No se pudo interpretar la respuesta de la IA'), {
      status: 502,
      details: text,
    });
  }
};
