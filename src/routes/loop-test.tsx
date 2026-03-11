import type { Context } from 'hono'

export default async function 循環測試(ctx: Context) {
  // 故意造成循環重導向到自身
  return await ctx.internalRedirect('/loop-test')
}
