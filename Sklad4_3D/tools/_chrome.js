// Путь к Chrome / Chromium / Edge для puppeteer-core: переменная окружения CHROME_PATH или типичные места установки.
const fs=require('fs');
const C=[process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'];
const p=C.find(x=>x&&fs.existsSync(x));
if(!p) throw new Error('Не найден Chrome/Edge: укажите путь в переменной CHROME_PATH');
module.exports=p;
