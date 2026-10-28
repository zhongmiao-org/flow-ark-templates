export default async ({template:t}:any)=>t.result({configuration:await t.configuration()});
