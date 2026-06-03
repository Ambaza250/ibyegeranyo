import fs from 'fs';
const s = fs.readFileSync('server.js','utf8');
console.log('len', s.length);
console.log('has documentaries', s.includes("/api/documentaries"));
console.log('has upload-documentary', s.includes('/api/upload-documentary'));

