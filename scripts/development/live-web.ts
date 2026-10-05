import { spawn,type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { unwatchFile,watchFile } from 'node:fs';

const workspace=process.env.TREESEED_DEVELOPMENT_WORKSPACE_ROOT?.trim();
const session=process.env.TREESEED_DEVELOPMENT_SESSION_ID?.trim();
const markers=workspace&&session?['sdk','ui','core'].map((project)=>resolve(workspace,'packages',project,'.treeseed','cache','development-sessions',session,'package','current','dist','.treeseed-build-complete.json')):[];
const astro=resolve('node_modules/astro/astro.js');
let child:ChildProcess|undefined;
let timer:NodeJS.Timeout|undefined;
let stopping=false;

function start() {
	if(stopping)return;
	child=spawn(process.execPath,[astro,'dev','--config','astro.config.ts','--port','4322','--host','0.0.0.0'],{cwd:process.cwd(),env:process.env,stdio:'inherit'});
	child.once('exit',(code,signal)=>{child=undefined;if(!stopping&&code&&!signal)process.stderr.write(`Admin development server exited with code ${code}; waiting for a dependency rebuild.\n`);});
}

function restart() {
	if(timer)clearTimeout(timer);
	timer=setTimeout(()=>{
		const previous=child;
		if(!previous)return start();
		previous.once('exit',start);
		previous.kill('SIGTERM');
	},500);
}

function stop(signal:NodeJS.Signals) {
	stopping=true;
	if(timer)clearTimeout(timer);
	for(const marker of markers)unwatchFile(marker);
	if(child)child.kill(signal);
}

for(const marker of markers)watchFile(marker,{interval:250},(current,prior)=>{if(current.mtimeMs&&current.mtimeMs!==prior.mtimeMs)restart();});
process.once('SIGINT',()=>stop('SIGINT'));
process.once('SIGTERM',()=>stop('SIGTERM'));
start();
