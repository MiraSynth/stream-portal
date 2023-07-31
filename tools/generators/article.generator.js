const { JSDOM } = require("jsdom");
const { ExifImage } = require("exif");
const sharp = require("sharp");
const path = require("path")
const showdown = require("showdown");
const { promises: { readFile, writeFile }, existsSync } = require("fs");

const { findDirBySuffix } = require("../utils/file-search.util")

async function start() {
    const target = "./articles/index.html";
    const articles = (await findDirBySuffix("./articles", "-article"));

    var converter = new showdown.Converter();

    for (const article of articles) {
        const articleContent = await readFile(path.join("./", article, "content.md"), "utf8");
        const html = converter.makeHtml(articleContent);

        const articleDom = await getDOM(path.join("./", article, "index.html"));
        if (!articleDom) {
            return;
        }

        const documentSectionElement = articleDom.window.document.querySelector(".document-section");
        documentSectionElement.innerHTML = html;

        const result = articleDom.serialize();
        const outputPath = path.join("./", article, "index.html")
        await writeFile(outputPath, result);
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

start()
    .then();