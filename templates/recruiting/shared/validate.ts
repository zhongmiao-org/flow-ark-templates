import Ajv from 'ajv/dist/2020.js';
import schema from './business.schema.json';
const ajv=new Ajv({strict:false,allErrors:true});ajv.addSchema(schema);
export function validateObject<T>(name:string,value:unknown):T {const check=ajv.getSchema(schema.$id+'#/$defs/'+name)!;if(!check(value))throw new Error('格式无效 '+ajv.errorsText(check.errors));return value as T;}
