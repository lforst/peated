import { open } from "fs/promises";
import { submitEntity } from "./api";

const importJson = async (
  filename: string,
  cb: (row: any) => Promise<void>,
) => {
  const fs = await open(filename, "r");
  const rows = JSON.parse((await fs.readFile()).toString());
  await fs.close();

  for (const r of rows) {
    await cb(r);
  }
};

const importBrands = async () => {
  await importJson("brands.json", async (row) => {
    console.log(row.name);
    await submitEntity({ ...row, type: ["brand"] });
  });
};

const importDistillers = async () => {
  await importJson("distillers.json", async (row) => {
    console.log(row.name);
    await submitEntity({ ...row, type: ["distiller"] });
  });
};

async function main() {
  await importBrands();
  await importDistillers();
}

main();
