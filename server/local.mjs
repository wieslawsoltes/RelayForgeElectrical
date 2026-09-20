import http from 'node:http';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createDatabase} from './sqlite.js';
import worker from '../worker/index.js';
mkdirSync(new URL('../.data',import.meta.url),{recursive:true});
const DB=createDatabase(fileURLToPath(new URL('../.data/relayforge.sqlite',import.meta.url)));
const host=process.env.RELAYFORGE_HOST||'127.0.0.1',port=Number(process.env.PORT||8787);
http.createServer(async(req,res)=>{try{const base=`http://${req.headers.host}`;const headers=new Headers(req.headers); // Local-only development identity; never trust client auth headers.
headers.set('oai-authenticated-user-id','local-engineer');headers.set('oai-authenticated-user-email','engineer@localhost');headers.set('oai-authenticated-user-full-name','Local engineer');const parts=[];for await(const part of req)parts.push(part);const body=Buffer.concat(parts);const abort=new AbortController();res.on('close',()=>abort.abort());const request=new Request(base+req.url,{method:req.method,headers,signal:abort.signal,...(!['GET','HEAD'].includes(req.method)?{body}: {})});const response=await worker.fetch(request,{DB},{});res.writeHead(response.status,Object.fromEntries(response.headers));if(response.body){const reader=response.body.getReader();for(;;){const {done,value}=await reader.read();if(done)break;if(res.destroyed){await reader.cancel();break;}if(!res.write(Buffer.from(value)))await new Promise(resolve=>res.once('drain',resolve));}}res.end();}catch(e){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.message}));}}).listen(port,host,()=>console.log(`RelayForge Electrical: http://${host}:${port}\nLocal development identity only. Do not expose this server to untrusted networks.`));
