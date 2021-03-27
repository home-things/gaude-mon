import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { formatRelative } from "https://deno.land/x/date_fns@v2.15.0/index.js";
import { ru } from "https://deno.land/x/date_fns@v2.15.0/locale/index.js";

const router = new Router();

const port = 8080;
const locale = ru;
const paths = { template: "./template.html", store: "./.store.json" };
const store: Data = (await readJsonFile(paths.store)) || { cld: 0, hot: 0, upd: new Date().toISOString() };

//
//
//

router
  //
  .put("/roscha/api/wc/water", async ({ request, response }) => {
    console.log(`${request.method} ${request.url}`);

    try {
      const data: Data = await (await request.body()).value;
      Object.assign(store, data);
      try {
        await Deno.writeTextFile(paths.store, JSON.stringify(store, null, 4));
        response.body = { status: "OK" };
      } catch (e) {
        const errMsg = "DIDNOT_PERSIST";
        console.error(errMsg, e);
        response.body = { status: errMsg };
      }
    } catch (e) {
      const errStr = "Updating failed";
      console.error(errStr, e);
      Object.assign(response, { status: 500, body: errStr + "\n" + e.message });
    }
  })
  .get("/roscha/water.html", async ({ request, response }) => {
    console.log(`${request.method} ${request.url}`);

    const template = await Deno.readTextFile(paths.template);
    response.body = subst(template, store);
  });


//
//
//

const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (context) => {
  if (context.request.method !== "GET") return;
  console.log('static', 'GET', context.request.url.pathname);
  if (!context.request.url.pathname.startsWith("/roscha")) return;

  try {
    await send(context, context.request.url.pathname.replace("/roscha", ""), {
      root: `${Deno.cwd()}/static`,
      index: "index.html",
    });
  } catch (e) {
    const errStr = 'Static upload failed'
    console.error(errStr, e)
    Object.assign(context.response, {status: 500, body: errStr + '\n' + e.message});
  }
});

console.log(`http://localhost:${port}/`);
await app.listen({ port });


type Data = {
  hot: number;
  cld: number;
  upd: string; // DateTimeIso
};

function subst(template: string, data: Data) {
  const upd = formatDate(data.upd);
  return template.replace("{hot}", data.hot.toFixed(3)).replace("{cld}", data.cld.toFixed(3)).replace("{upd}", upd);
}

async function readJsonFile(path: string) {
  const json = await Deno.readTextFile(path);
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error(`JSON hadn't parsed: ${e}\npath: ${path}\ncontent: «${json}»`)
    return undefined;
  }
}

function formatDate(date: string) {
   try {
     return formatRelative(new Date(date), new Date(), { locale });
   } catch (e) {
     console.error("Date had not formatted", e, date);
     return date;
   }
}
