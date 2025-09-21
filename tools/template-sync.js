const { JSDOM } = require("jsdom");
const { promises: { readFile, readdir, writeFile } } = require("fs");
const {discoverHtmlFiles} = require("./utils/file-search.util");

async function start() {

    const htmlFiles = await discoverHtmlFiles("./");

    const templateDom = await getDOM("index.html")
    if (!templateDom) {
        return;
    }

    const templateContentElement = templateDom.window.document.querySelector("simple-router");
    if (!templateContentElement) {
        return;
    }

    for (const target of htmlFiles) {
        const targetDom = await getDOM(target)
        if (!targetDom) {
            return;
        }

        const targetContentElement = targetDom.window.document.querySelector("simple-router");
        if (!targetContentElement) {
            return;
        }

        templateContentElement.innerHTML = targetContentElement.innerHTML

        const result = templateDom.serialize();
        await writeFile(target, result)
    }
}

async function getDOM(templateName) {
    const template = await readFile(templateName);

    const templateDom = new JSDOM(template);
    if (!templateDom) {
        return;
    }

    return Promise.resolve(templateDom);
}

start();