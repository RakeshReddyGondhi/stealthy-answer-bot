import axios from 'axios';
import { ipcMain } from 'electron';

async function getAIAnswer(questionText) {
  // OpenAI ChatGPT API example (replace with your API key, configurable)
  const apiKey = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';
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
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // Get first answer
    return response.data.choices[0].message.content.trim();
  } catch (err) {
    return 'AI error: ' + err.message;
  }
}

// Listen for transcripts from renderer and send AI answer to overlay
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
