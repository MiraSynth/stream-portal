const { JSDOM } = require("jsdom");
const { exiftool } = require("exiftool-vendored");
const sharp = require("sharp");
const path = require("path")
const { promises: { readFile, writeFile }, existsSync } = require("fs");
const { findByType } = require("../utils/file-search.util")
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function start() {
    const target = "./gallery/index.html";
    const images = (await findByType("./assets/images/gallery", ".jpg"))
        .filter(x => !x.includes("_thumb"));

    const galleryDom = await getDOM(target);
    if (!galleryDom) {
       return;
    }

    const galleryFigure = galleryDom.window.document.querySelector(".image-gallery figure");
    if (!galleryFigure) {
        return;
    }

    const imageGallery = galleryDom.window.document.querySelector(".image-gallery");
    imageGallery.innerHTML = "";

    for (const image of images) {
        console.log("")
        console.log(`Now processing [${image}]`)
        const clonedGalleryFigure = galleryFigure.cloneNode(true);

        const exifToolData = await exiftool.read(image);

        let titleText = exifToolData?.XPTitle;
        if (!titleText) {
            console.log("No title text found on the image EXIF");
            titleText = await question("Enter title: ")
            await exiftool.write(image, {
                XPTitle: titleText,
            });
        }

        let subjectText = exifToolData?.XPSubject;
        if (!subjectText) {
            console.log("No subject text found on the image EXIF");
            subjectText = await question("Enter a subject: ")
            await exiftool.write(image, {
                XPSubject: subjectText,
            });
        }

        let commentText = exifToolData?.XPComment
        if (!commentText) {
            console.log("No comment text found on the image EXIF");
            commentText = await question("Enter a comment: ")
            await exiftool.write(image, {
                XPComment: commentText,
            });
        }

        let artistText = exifToolData?.Artist;
        if (!artistText) {
            console.log("No keywords text found on the image EXIF");
            artistText = await question("Enter artist name: ")
            await exiftool.write(image, {
                Artist: artistText,
            });
        }

        let tagsText = exifToolData?.XPKeywords;
        if (!tagsText) {
            console.log("No keywords text found on the image EXIF");
            tagsText = await question("Enter space seperated keywords: ")
            await exiftool.write(image, {
                XPKeywords: tagsText,
            });
        }

        console.log("Data:");
        console.log("  Title: ", titleText);
        console.log("  Subject: ", subjectText);
        console.log("  Comment: ", commentText);
        console.log("  Artist: ", artistText);
        console.log("  Keywords: ", tagsText);

        let artistData;
        if (artistText) {
            const artistDataSplit = artistText.split(";");
            artistData = {
                name: artistDataSplit[0],
                href: artistDataSplit[1]
            };
        }

        const img = clonedGalleryFigure.querySelector("img");
        img.src = await resizeImage(image, "thumb", 500);
        img.alt = subjectText;

        const anchor = clonedGalleryFigure.querySelector("a");
        const linkName = path.basename(image, path.extname(image));
        anchor.href = `/gallery/${linkName}`

        imageGallery.appendChild(clonedGalleryFigure);

        const captionElement = clonedGalleryFigure.querySelector("figcaption");
        captionElement.innerHTML = "";
        captionElement.appendChild(galleryDom.window.document.createTextNode(titleText));

        await createImageView(linkName, titleText, commentText, subjectText, artistData, tagsText, image);
        console.log("")
        console.log("")
    }

    const result = galleryDom.serialize();
    await writeFile(target, result)

    process.exit(0);
}

async function resizeImage(imagePath, nameDecoration, size) {
    const image = await readFile(imagePath);

    const imageDir = path.dirname(imagePath);
    const imageExt = path.extname(imagePath);
    const imageName = path.basename(imagePath, imageExt);

    const newImagePath = path.join(imageDir, `${imageName}_thumb${imageExt}`)

    if (existsSync(newImagePath)) {
        return newImagePath;
    }

    await sharp(image)
        .resize(size)
        .toFile(path.join(imageDir, `${imageName}_${nameDecoration}${imageExt}`))

    return newImagePath;
}

async function createImageView(linkName, title, comment, subject, artist, tags, src) {
    const imageViewDom = await getDOM(path.join("./", "gallery", "gallery.html"));
    if (!imageViewDom) {
        return;
    }

    const imageViewFigureElement = imageViewDom.window.document.querySelector(".image-gallery figure");
    if (!imageViewFigureElement) {
        return;
    }

    const headerElement = imageViewDom.window.document.querySelector("h1");
    if (!headerElement) {
        return;
    }

    const subjectElement = imageViewDom.window.document.querySelector("p");
    if (!subjectElement) {
        return;
    }

    const subjectTextElement = subjectElement.querySelector(".image-gallery-subject");
    const artistTextElement = subjectElement.querySelector(".image-gallery-artist");
    const imgElement = imageViewFigureElement.querySelector("img");
    const galleryBlurElement = imageViewFigureElement.querySelector(".image-gallery-blur");
    if (tags.includes("nsfw")) {
        galleryBlurElement.classList.add("active");
        const tagsSplit = tags.split(";");
        imgElement.src = tagsSplit[1];
    } else {
        imgElement.src = src;
    }
    
    const captionElement = imageViewFigureElement.querySelector("figcaption");

    headerElement.innerHTML = "";
    headerElement.appendChild(imageViewDom.window.document.createTextNode(title))

    captionElement.innerHTML = "";
    captionElement.appendChild(imageViewDom.window.document.createTextNode(comment))

    subjectTextElement.innerHTML = "";
    subjectTextElement.appendChild(imageViewDom.window.document.createTextNode(subject));
    if (artist) {
        const artistLinkElement = imageViewDom.window.document.createElement("a");
        artistLinkElement.href = artist.href;
        artistLinkElement.innerHTML = artist.name;
        artistTextElement.innerHTML = "";
        artistTextElement.appendChild(artistLinkElement);
    } else {
        artistTextElement.remove();
    }

    const result = imageViewDom.serialize();
    const outputPath = path.join("gallery", `${linkName}.html`)
    return await writeFile(outputPath, result);
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