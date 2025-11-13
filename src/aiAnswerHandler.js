import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { ipcMain } from 'electron';

function getConfig() {
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    const configData = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch (err) {
    return { openaiApiKey: '' };
  }
}

async function getAIAnswer(questionText) {
  const { openaiApiKey } = getConfig();
  if (!openaiApiKey) return 'AI Error: API key missing!';
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: questionText }],
        max_tokens: 200,
      },
      {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (err) {
    return 'AI error: ' + err.message;
  }
}

ipcMain.on('question-from-voice', async (event, questionText) => {
  const answerText = await getAIAnswer(questionText);
  if (global.overlayWindow && !global.overlayWindow.isDestroyed()) {
    global.overlayWindow.webContents.send('show-answer', answerText);
    global.overlayWindow.show();
    global.overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    setTimeout(() => {
      if (global.overlayWindow && !global.overlayWindow.isDestroyed()) {
        global.overlayWindow.hide();
      }
    }, 10000);
  }
});
