/*
var a = document.getElementById("twitter-widget-0");
a.contentDocument.body.querySelector(".timeline-TweetList")
 */

const template = `
<a class="twitter-timeline" data-lang="en" data-dnt="true" data-theme="dark" href="https://twitter.com/enniccino"></a>
`

/**
 * @typedef {Object} ReconstructedTweet
 * @property {string} id
 * @property {string} author
 * @property {boolean} isRetweet
 * @property {EventTarget} contentElement
 * @property {string} content
 */


class TwitterIntegration extends HTMLElement {
    _twitterFrame = null;

    /**
     *
     * @type {HTMLElement}
     * @private
     */
    _tweetUiContainer = null;

    /**
     * An array of reconstructed tweets
     * @type {Map<string, ReconstructedTweet>}
     * @private
     */
    _tweets = new Map()

    constructor() {
        super();

        this.innerHTML = template;

        const script = document.createElement('script');
        script.onload = () => {
            this._waitForTwitterFrameLoad();
        };
        script.src = "https://platform.twitter.com/widgets.js";

        this.appendChild(script);

        this._tweetUiContainer = this.querySelector(".twitter-embed ol")
    }

    _waitForTwitterFrameLoad() {
        setTimeout(() => {
            this._twitterFrame = this.querySelector("iframe");
            if (this._twitterFrame === null) {
                this._waitForTwitterFrameLoad();
                return;
            }

            const frameHead = this._twitterFrame.contentDocument.head;
            if (!frameHead.innerHTML.includes("dark.ltr.css")) {
                this._waitForTwitterFrameLoad();
                return;
            }

            this._observeTwitterFeed();
        }, 100);
    }

    _observeTwitterFeed() {
        const tweets = this._twitterFrame.contentDocument.head;
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.type = "text/css";
        style.href = "css/twitter.css";
        tweets.append(style);

        // setInterval(() => {
        //     this._parseTwitterFeed();
        // }, 1000);
    }

    _parseTwitterFeed() {
        const tweets = this._twitterFrame.contentDocument.body.querySelectorAll(".timeline-TweetList-tweet");
        tweets.forEach((tweet) => {
            const isRetweet = tweet.querySelector(".timeline-Tweet--isRetweet") !== null;

            const timelineTweet = tweet.querySelector(".timeline-Tweet");
            const tweetId = timelineTweet.getAttribute("data-tweet-id");

            if (this._tweets.has(tweetId))
            {
                return;
            }

            const tweetTextElement = timelineTweet.querySelector(".timeline-Tweet-text");
            const tweetText = timelineTweet.innerHTML;

            const tweetAuthorElement = timelineTweet.querySelector(".TweetAuthor-name");
            const tweetAuthor = tweetAuthorElement.getAttribute("title");

            /**
             * @type {ReconstructedTweet}
             */
            const rt = {
                id: tweetId,
                isRetweet: isRetweet,
                author: tweetAuthor,
                contentElement: tweetTextElement.cloneNode(true),
                content: tweetText
            };

            this._tweets.set(rt.id, rt);
        });

        this._tweets.forEach((reconstructedTweet) => {
            if (reconstructedTweet.isRetweet) {
                return;
            }

            const containsTweet =
                this._tweetUiContainer.querySelector(`li[data-tweet-id="${reconstructedTweet.id}"]`) !== null;
            if (containsTweet) {
                return;
            }

            const newTweetContainer = document.createElement("li");
            newTweetContainer.setAttribute("data-tweet-id", reconstructedTweet.id);
            newTweetContainer.innerHTML = reconstructedTweet.content;

            newTweetContainer.removeChild(newTweetContainer.querySelector(".timeline-Tweet-brand"));
            newTweetContainer.removeChild(newTweetContainer.querySelector(".timeline-Tweet-metadata"));
            newTweetContainer.removeChild(newTweetContainer.querySelector(".timeline-Tweet-actions"));

            // clean up author section
            this._cleanAuthorSection(newTweetContainer);

            //
            const tweetText = newTweetContainer.querySelector(".timeline-Tweet-text");
            while (tweetText.attributes.length > 0) {
                tweetText.removeAttribute(tweetText.attributes[0].name);
            }
            tweetText.className = "tweet-text";

            const tweetTextImages = tweetText.querySelectorAll("img");
            tweetTextImages.forEach((image) => {
                const src = image.src;
                while (image.attributes.length > 0) {
                    image.removeAttribute(image.attributes[0].name);
                }
                image.src = src;
            });

            const tweetAtags = tweetText.querySelectorAll("a");
            tweetAtags.forEach((atag) => {
                const src = atag.href;
                while (atag.attributes.length > 0) {
                    atag.removeAttribute(atag.attributes[0].name);
                }
                atag.href = src;
                atag.target = "_blank";

                const partialAtagSpans = atag.querySelectorAll("span");
                let newAtagContent = "";
                partialAtagSpans.forEach((atagSpan) => {
                    newAtagContent += atagSpan.innerText;
                });
                atag.innerText = newAtagContent;
            });
            //

            //
            this._cleanMediaSection(newTweetContainer)
            //

            this._tweetUiContainer.append(newTweetContainer);
        });
    }

    /**
     *
     * @param {HTMLElement} container
     * @private
     */
    _cleanAuthorSection(container) {
        let tweetAuthor = container.querySelector(".timeline-Tweet-author");
        const tweetAuthorLink = tweetAuthor.querySelector(".TweetAuthor-link");
        const tweetAuthorLinkHref = tweetAuthorLink.href;
        while (tweetAuthorLink.attributes.length > 0) {
            tweetAuthorLink.removeAttribute(tweetAuthorLink.attributes[0].name);
        }
        tweetAuthorLink.href = tweetAuthorLinkHref;
        tweetAuthorLink.className = "tweet-author"
        container.prepend(tweetAuthorLink);
        tweetAuthor.remove();
        tweetAuthor = container.querySelector("a.tweet-author");

        const tweetAuthorName = tweetAuthor.querySelector(".TweetAuthor-name");
        tweetAuthor.append(tweetAuthorName);
        while (tweetAuthorName.attributes.length > 0) {
            tweetAuthorName.removeAttribute(tweetAuthorName.attributes[0].name);
        }
        tweetAuthorName.className = "tweet-author-name";

        const tweetAuthorScreenName = tweetAuthor.querySelector(".TweetAuthor-screenName");
        tweetAuthor.append(tweetAuthorScreenName);
        while (tweetAuthorScreenName.attributes.length > 0) {
            tweetAuthorScreenName.removeAttribute(tweetAuthorScreenName.attributes[0].name);
        }
        tweetAuthorScreenName.className = "tweet-author-screen-name";

        const tweetAuthorContainer = tweetAuthor.querySelector(".TweetAuthor-nameScreenNameContainer");
        tweetAuthor.removeChild(tweetAuthorContainer);
        tweetAuthorContainer.className = "tweet"

        const tweetAuthorImages = tweetAuthor.querySelectorAll("img");
        tweetAuthorImages.forEach((image) => {
            const src = image.src;
            while (image.attributes.length > 0) {
                image.removeAttribute(image.attributes[0].name);
            }
            image.src = src;
        });

        const tweetReplyTo = container.querySelector(".timeline-Tweet-inReplyTo a");
        if (tweetReplyTo) {
            const tweetReplyToSpan = document.createElement("span");
            tweetReplyToSpan.className = "tweet-author-reply-to";
            tweetReplyToSpan.innerHTML = tweetReplyTo.innerHTML;
            tweetReplyTo.remove();
            tweetAuthorLink.append(tweetReplyToSpan);
        }
    }

    /**
     *
     * @param {HTMLElement} container
     * @private
     */
    _cleanMediaSection(container) {
        const tweetMedia = container.querySelector(".timeline-Tweet-media");
        if (!tweetMedia) {
            return;
        }
        while (tweetMedia.attributes.length > 0) {
            tweetMedia.removeAttribute(tweetMedia.attributes[0].name);
        }
        tweetMedia.className = "tweet-media";

        const tweetMediaATags = tweetMedia.querySelectorAll(".ImageGrid-image, .MediaCard-mediaAsset");
        tweetMediaATags.forEach((aTag) => {
            const href = aTag.href;
            while (aTag.attributes.length > 0) {
                aTag.removeAttribute(aTag.attributes[0].name);
            }
            aTag.href = href;
            aTag.target = "_blank";

            const image = aTag.querySelector("img");
            const src = image.src;
            while (image.attributes.length > 0) {
                image.removeAttribute(image.attributes[0].name);
            }
            image.src = src;
        });
        tweetMedia.innerHTML = "";
        tweetMedia.append(...tweetMediaATags);
    }
}

export function LoadTwitter() {
    customElements.define("twitter-integration", TwitterIntegration);
}