import { randomUUID } from 'node:crypto';
/** Business records live in one instance state. Flush before any external effect. No database access. */
export class Store {
 private records:Record<string,Record<string,any>>={};
 constructor(..._testArgs:any[]){}
 attach(records:any,privateFlush?:(state:any)=>Promise<any>){this.records=structuredClone(records??{});this.persist=privateFlush;return this;}
 private persist?: (state:any)=>Promise<any>;
 get<T=any>(kind:string,id:string):T|undefined{return structuredClone(this.records[kind]?.[id]);}
 list<T=any>(kind:string):T[]{return Object.values(structuredClone(this.records[kind]??{}));}
 put(kind:string,id:string,value:any){(this.records[kind]??={})[id]=structuredClone(value);}
 tx<T>(fn:()=>T):T{const prior=structuredClone(this.records);try{return fn();}catch(e){this.records=prior;throw e;}}
 attention(kind:string,title:string,detail:any,key:string){const old=this.list<any>('attention').find(a=>a.dedupeKey===key);if(old)return old;const a={id:randomUUID(),kind,title,detail,dedupeKey:key,read:false,time:new Date().toISOString()};this.put('attention',a.id,a);return a;}
 async flush(){await this.persist?.(structuredClone(this.records));}
 close(){}
 recover(){for(const a of this.list<any>('action'))if(a.state==='SUBMITTING')this.put('action',a.id,{...a,state:'UNKNOWN'});}
}
