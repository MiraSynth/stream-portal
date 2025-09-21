const { JSDOM } = require("jsdom");
const { promises: { readFile, readdir, writeFile } } = require("fs");
const {discoverHtmlFiles} = require("./utils/file-search.util");

async function start(href) {
    const htmlFiles = await discoverHtmlFiles("./");

    for (const htmlFile of htmlFiles) {
        const template = await readFile(htmlFile);

        const templateDom = new JSDOM(template);
        if (!templateDom) {
            continue;
        }

        const base = templateDom.window.document.querySelector("base");
        if (!base) {
            continue;
        }

        base.href = href;

        const result = templateDom.serialize();
        await writeFile(htmlFile, result);
    }
}

const baseUrl = process.argv[2]
if (!baseUrl) {
    process.exit(1)
    return;
}

start(baseUrl)
    .then();

