const baseUrl = "https://9animetv.to"
const refererUrl = "https://rapid-cloud.co/" // Works for JJK at least
let url = baseUrl + "/watch/jujutsu-kaisen-2nd-season-18413?ep=107179"
const ublock = new URL('uBlock0.chromium', import.meta.url).toString().substring("file:///".length)

const LAST_EPISODE = 23

import puppeteer from "puppeteer-extra";
import puppeteer_extra_plugin_stealth from "puppeteer-extra-plugin-stealth";
import puppeteer_extra_plugin_adblocker from "puppeteer-extra-plugin-adblocker"
import ffmpeg from "fluent-ffmpeg";

const stealth = puppeteer_extra_plugin_stealth();
stealth.enabledEvasions.delete('chrome.runtime');
stealth.enabledEvasions.delete('iframe.contentWindow');
puppeteer.use(stealth);

const adblocker = puppeteer_extra_plugin_adblocker()
puppeteer.use(adblocker)

const downloadQueue = [];
const downloadPromises = [];

let browser
let startTime

async function injectPage(page) {
    await page.setRequestInterception(true);
    page.on("request", r => {
        if (r.url().includes("devtool")) {
            r.abort();
            return
        }
        let toBlock = ["font", "stylesheet", "image", "media"];
        if (toBlock.indexOf(r.resourceType()) !== -1) {
            r.abort();
        } else {
            r.continue()
        }
    });
}

function injectGrabber(page) {
    return new Promise((resolve) => {
        page.on("request", r => {
            if(r.url().includes(".m3u8")) {
                resolve(r.url())
                return
            }
        });
    })
}

async function handleDownload(page, video) {
    let element = await page.waitForSelector("#servers-content > div.ps_-status > div > div > strong > b")
    const episodeName = await element.evaluate(el => el.textContent);
    await downloadURL(episodeName, video)

    const nextEpisodeNumber = (+(episodeName.split(" ")[1])) + 1
    if (nextEpisodeNumber <= LAST_EPISODE) {
        element = await page.waitForSelector(`#episodes-page-1 > [data-number='${nextEpisodeNumber}']`)
        const nextUrl = await element.evaluate(el => el.getAttribute("href"));
        url = baseUrl + nextUrl;
        handle(page.browser(), false)
    }

    await page.close()
}

async function downloadURL(name, video) {
    console.log("Downloading " + name + "...")
    if (downloadQueue.indexOf(name) !== -1) return;
    let currentEpisodeNumber = +(name.split(" ")[1])
    downloadQueue.push(name)
    downloadPromises.push(new Promise((res, rej) => {
        ffmpeg(video)
            .inputOption('-referer', refererUrl)
            .outputOption('-c copy')
            .output(`./downloads/${name.replace(" ", "-")}-dub.mp4`)
            .on('end', () => {
                console.log("Downloaded " + name + "!")
                res();  
            })
            .on('error', (err) => {
                console.error('Error: ' + err.message);
                rej();
            })
            .run();
    }));

    if (currentEpisodeNumber == LAST_EPISODE) {
        Promise.all(downloadPromises).then(x => {
            console.log("Everything is done downloading! You can close the browser now.")
            if (startTime) console.log("Done after " + ((Date.now() - startTime) / 1000) + " seconds!")
            if (browser) browser.close()
        });
    }
}

async function search() {
    browser = await puppeteer.launch({
        headless: false,
        devtools: false,
        args: [`--load-extension=${ublock}`]
    });

    console.warn("Starting process...")
    console.warn("+==================================================+")
    console.warn("+                                                  +")
    console.warn("+ DO NOT CLOSE THE APP/BROWSER UNTIL IT SAYS DONE! +")
    console.warn("+                                                  +")
    console.warn("+==================================================+")
    startTime = Date.now()
    await handle(browser, true);

    // await browser.close();
}

search();

async function handle(browser, shouldWait) {
    const page = await browser.newPage();
    await injectPage(page);
    if (shouldWait) {
        await page.waitForTimeout(2000)
        await page.goto('https://www.bing.com/search?q=web+hosting');
        // Give ublock time to load its settings or something?
        // Without this wait next page ends up with ads too
        await page.waitForTimeout(3000);
    }
    await page.goto(url);
    let button = await page.waitForSelector("#servers-content > div.ps_-block.ps_-block-sub.servers-dub > div.ps__-list > div:nth-child(2) > a")
    await button.click();
    await page.waitForTimeout(1000)
    injectGrabber(page).then(videoUrl => {
        handleDownload(page, videoUrl)
    })
}