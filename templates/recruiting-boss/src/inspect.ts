import {BossRecruitingAdapter} from '../../recruiting/src/sites';
export default async ({template:t,signal}:any)=>{const adapter=new BossRecruitingAdapter({perform:async()=>{throw new Error('检查入口不执行网站动作');}});const result=await adapter.probe(signal);await t.attention({key:'site-unverified',title:result.reason,detail:{site:'boss'}});return t.result(result);};
