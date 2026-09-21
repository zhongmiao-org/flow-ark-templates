import {canonical,sha256} from '../../../contracts/package-format';
import {randomUUID} from 'node:crypto';
export const digest=(v:any)=>sha256(canonical(JSON.parse(JSON.stringify(v))));
export const uid=()=>randomUUID();export const now=()=>new Date().toISOString();export const errorText=(e:any)=>e instanceof Error?e.message:String(e);
