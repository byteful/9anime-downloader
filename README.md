# 9anime Downloader
This app lets you download all the episodes of an anime off of 9anime. <br>
<h3 color="red">This app has not been designed to be user friendly! I created this for a friend and managed all the inputs through the code.</h3>

You will need technical knowledge with Node.js, JavaScript, and NPM to use this app.

## Usage
1. First clone the repo and run `npm i`.
2. Download uBlock origin's chromium [extension](https://github.com/gorhill/uBlock/releases/latest/) and unzip it in the folder. Make sure the name of the extension is `uBlock0.chromium`.
3. Create a `downloads` folder.
4. Change the `url` in the `index.js` file to whatever 9anime show you want. Use the context of the current URL to figure out what part of it to set.
5. Run the app and wait for everything to download into the `downloads` folder.

<p color="blue">This app was created to download Episodes 9-23 from season 2 JJK.</p>
