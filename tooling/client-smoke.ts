import assert from 'node:assert/strict';
import { _electron as electron } from 'playwright-core';
import { mkdtemp,writeFile,copyFile,readdir,rename,mkdir,rm } from 'node:fs/promises';
import { join,resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { startFormLab } from '../fixtures/form-lab';
const executablePath=process.env.FLOWARK_TEST_EXECUTABLE;if(!executablePath)throw new Error('Set FLOWARK_TEST_EXECUTABLE to an installed client executable');
const data=await mkdtemp(join(tmpdir(),'flowark-installed-template-'));const packages=join(data,'imports');await mkdir(packages);for(const name of await readdir('dist'))if(name.endsWith('.zip'))await copyFile(join('dist',name),join(packages,name));
const credential=process.env.FLOWARK_TEST_ENCRYPTED_CREDENTIAL;if(credential){await mkdir(join(data,'user-data/credentials'),{recursive:true,mode:0o700});await copyFile(credential,join(data,'user-data/credentials/deepseek.enc'));}
await writeFile(join(data,'input.txt'),'fictional input\nline two');await mkdir('test-results',{recursive:true});const source=resolve('templates'),hidden=resolve('test-results/hidden-source-'+process.pid);await rename(source,hidden);
const lab=await startFormLab();const evidence:any={data,executablePath,sourceDirectoryHidden:source,phases:[],realAI:false,realRecruiting:false};let app:any;
try{
 for(let phase=0;phase<2;phase++){
  app=await electron.launch({executablePath,cwd:data,env:{...process.env,FLOWARK_DATA_DIR:join(data,'user-data')},timeout:30000});const page=await app.firstWindow();await page.waitForFunction(()=>Boolean((window as any).flowark));
  const call=(method:string,args:any={})=>page.evaluate(({method,args})=>(window as any).flowark.request(method,args),{method,args});
  const finish=async(id:string)=>{for(let i=0;i<300;i++){const d=await call('run.detail',{id});if(['SUCCEEDED','FAILED','CANCELLED','INTERRUPTED'].includes(d.run.state)){assert.equal(d.run.state,'SUCCEEDED',d.run.error);return d;}await new Promise(r=>setTimeout(r,100));}throw new Error('Run timeout');};
  const choose=async(path:string)=>app.evaluate(({dialog}:any,path:string)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},path);
  if(phase===0){
   const empty=await call('bootstrap');assert.equal(empty.templates.length,0);assert.equal(empty.flows.length,0);
   await page.getByRole('button',{name:'模板库',exact:true}).click();await choose(join(packages,'file-inspector-1.0.0.flowark-template.zip'));await page.getByRole('button',{name:'导入模板包',exact:true}).click();await page.getByRole('button',{name:'安装模板',exact:true}).click();await page.getByRole('button',{name:'创建实例',exact:true}).click();await page.getByText('纯文件检查 · 实例配置',{exact:true}).waitFor();await choose(join(data,'input.txt'));await page.getByRole('button',{name:'选择',exact:true}).click();await page.getByRole('button',{name:'保存实例配置',exact:true}).click();await page.getByRole('button',{name:'运行 检查文件',exact:true}).click();
   let boot:any;for(let i=0;i<100;i++){boot=await call('bootstrap');if(boot.runs.length)break;await new Promise(r=>setTimeout(r,100));}await finish(boot.runs[0].id);
   // Public IPC for subsequent lifecycle coverage, native chooser remains Main-owned.
   await choose(join(packages,'multi-entry-1.0.0.flowark-template.zip'));const preview=await call('template.inspect');const installed=await call('template.install',{token:preview.token});const instance=await call('template.create',{key:installed.key});await finish((await call('flow.run',{id:instance.entryFlows.inspect})).id);
   await assert.rejects(call('flow.run',{id:instance.entryFlows.draft}),/绑定|AI/);
   const browser=await call('browser.embedded.enable');await call('template.configure',{id:instance.id,configuration:{url:lab.url,name:'虚构验收用户'},resources:{browser:{browserId:browser.id}},grants:{'form-write':'auto'}});await finish((await call('flow.run',{id:instance.entryFlows.fill})).id);
   await call('browser.embedded.visibility',{visible:true});await page.getByRole('button',{name:'模板库',exact:true}).click();await page.locator('.templates-page').evaluate((el:any)=>el.parentElement.scrollTop=0);await page.screenshot({path:resolve('test-results/installed-template-library.png'),fullPage:true});
   const again=await call('template.install',{token:(await call('template.inspect')).token});assert.equal(again.key,installed.key);await assert.rejects(call('template.remove',{key:installed.key}),/引用/);
   if(credential){const model=process.env.FLOWARK_TEST_AI_MODEL;if(!model)throw new Error('Select the explicitly bound model with FLOWARK_TEST_AI_MODEL');await call('template.configure',{id:instance.id,configuration:{url:lab.url,name:'虚构验收用户'},resources:{browser:{browserId:browser.id},ai:{provider:'deepseek',model}},grants:{'form-write':'auto'}});await finish((await call('flow.run',{id:instance.entryFlows.draft})).id);evidence.realAI={provider:'deepseek',model,fictionalInput:true};}
   evidence.phases.push({phase,runs:(await call('bootstrap')).runs.map((r:any)=>({id:r.id,state:r.state})),fileResult:boot.runs[0].id,multiEntry:instance.id});
  }else{const boot=await call('bootstrap');assert.equal(boot.templates.length,2);assert.equal(boot.instances.length,2);assert.ok(boot.runs.every((r:any)=>r.state==='SUCCEEDED'));const instance=boot.instances.find((i:any)=>i.packageKey.startsWith('multi-entry@'));const detail=await call('template.detail',{id:instance.id});assert.equal(detail.instance.configuration.name,'虚构验收用户');await finish((await call('flow.run',{id:instance.entryFlows.inspect})).id);evidence.phases.push({phase,reopened:true,instances:boot.instances.length});}
  await app.close();app=undefined;
 }
 evidence.passed=true;
}finally{if(app)await app.close().catch(()=>{});await lab.close();await rename(hidden,source);if(credential)await rm(join(data,'user-data/credentials/deepseek.enc'),{force:true});await writeFile('test-results/installed-client.json',JSON.stringify(evidence,null,2));}
console.log(JSON.stringify(evidence,null,2));
