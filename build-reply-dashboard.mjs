import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('./',import.meta.url);
const rules=await readFile(new URL('reply-rules.mjs',root),'utf8');
const profile=await readFile(new URL('hana-profile.mjs',root),'utf8');
const prompt=await readFile(new URL('supabase/functions/threads-replies/prompt.ts',root),'utf8');
const code=await readFile(new URL('supabase/functions/threads-replies/index.ts',root),'utf8');
await writeFile(new URL('threads-replies-dashboard.ts',root),'export {};\n'+rules.replaceAll('export ','')+'\n'+profile.replaceAll('export ','')+'\n'+prompt.replace('export ','')+'\n'+code.replace(/^import .*;\r?\n/gm,''));
