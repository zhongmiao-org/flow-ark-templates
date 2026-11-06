import { setTimeout as wait } from 'node:timers/promises';
export default async function main(ctx: any) {
 const before = await ctx.template.configuration();
 await wait(12000, undefined, { signal: ctx.signal });
 const after = await ctx.template.configuration();
 return {before,after,constants:ctx.constants,codeVersion:1,frozen:Object.isFrozen(ctx.constants)&&Object.isFrozen(ctx.constants.nested)};
}
