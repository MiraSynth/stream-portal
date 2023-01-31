const { JSDOM } = require("jsdom");
const { ExifImage } = require("exif");
const sharp = require("sharp");
const path = require("path")
const { promises: { readFile, writeFile }, existsSync } = require("fs");

const { findByType } = require("../utils/file-search.util")

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
        const exifData = await new Promise((resolve, reject) => {
            try {
                new ExifImage({
                    image
                }, (error, data) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(data);
                });
            } catch (error) {
                reject(error)
            }
        })

        const clonedGalleryFigure = galleryFigure.cloneNode(true);
        
        
        const commentText = exifData && exifData.image && exifData.image.XPComment
            ? exifData.image.XPComment.filter(x => x > 0).map(x => String.fromCharCode(x)).join("")
            : "No caption available.";

        
        const subjectText = exifData && exifData.image && exifData.image.XPSubject
            ? exifData.image.XPSubject.filter(x => x > 0).map(x => String.fromCharCode(x)).join("")
            : "No data.";

        const artistText = exifData && exifData.image && exifData.image.Artist
            ? exifData.image.Artist
            : null;
        let artistData;
        if (artistText) {
            const artistDataSplit = artistText.split(";");
            artistData = {
                name: artistDataSplit[0],
                href: artistDataSplit[1]
            };
        }

        const img = clonedGalleryFigure.querySelector("img");
        const thumbPath = await resizeImage(image, "thumb", 500);
        img.src = thumbPath;
        img.alt = subjectText;

        const anchor = clonedGalleryFigure.querySelector("a");
        const linkName = path.basename(image, path.extname(image));
        anchor.href = `/gallery/${linkName}`
        

        imageGallery.appendChild(clonedGalleryFigure);

        const titleText = exifData && exifData.image && exifData.image.XPTitle
            ? exifData.image.XPTitle.filter(x => x > 0).map(x => String.fromCharCode(x)).join("")
            : linkName.split("-").map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(" ")

        const captionElement = clonedGalleryFigure.querySelector("figcaption");
        captionElement.innerHTML = "";
        captionElement.appendChild(galleryDom.window.document.createTextNode(titleText));

        await createImageView(linkName, titleText, commentText, subjectText, artistData, image);
    }

    const result = galleryDom.serialize();
    await writeFile(target, result)
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

async function createImageView(linkName, title, comment, subject, artist, src) {
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

    const imgElement = imageViewFigureElement.querySelector("img");
    const captionElement = imageViewFigureElement.querySelector("figcaption");

    headerElement.innerHTML = "";
    headerElement.appendChild(imageViewDom.window.document.createTextNode(title))

    imgElement.src = src;

    captionElement.innerHTML = "";
    captionElement.appendChild(imageViewDom.window.document.createTextNode(comment))

    subjectElement.innerHTML = "";
    subjectElement.appendChild(imageViewDom.window.document.createTextNode(artist ? `${subject} by ` : subject));
    if (artist) {
        const artistLinkElement = imageViewDom.window.document.createElement("a");
        artistLinkElement.href = artist.href;
        artistLinkElement.innerHTML = artist.name;
        subjectElement.appendChild(artistLinkElement);
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