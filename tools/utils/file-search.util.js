const { promises: { readdir } } = require("fs");
const { join } = require("path");

async function findByType(path, type) {
    const entries = await readdir(path, { withFileTypes: true });

    const files = entries
        .filter(file => !file.isDirectory() && file.name.endsWith(type))
        .map(file => join(path, file.name));

    const folders = entries.filter(folder => folder.isDirectory());

    for (const folder of folders) {
        files.push(...await findByType(`${path}${folder.name}/`), type);
    }

    return files;
}

async function findDirBySuffix(path, suffix) {
    const entries = await readdir(path, { withFileTypes: true });

    const files = entries
        .filter(file => file.isDirectory() && file.name.endsWith(suffix))
        .map(file => join(path, file.name));

    return files;
}

module.exports = {
    findByType,
    findDirBySuffix
}