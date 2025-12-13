export class BandcampPage {
  #albumJson;

  constructor(json) {
    this.#albumJson = json;
  }

  static async createFromUrl(url) {
    const albumJson = await this.#getAlbumJson(url);
    if (!albumJson) {
      throw new Error('getAlbumJson() failed!');
    }
    return new BandcampPage(albumJson);
  }

  static async #getAlbumJson(url) {
    const ALBUM_METADATA_SELECTOR = 'script[type="application/ld+json"]';

    let dom = new Object();
    if (url != "dom") {
      /*
      const resp = await fetch(url);
      if (!resp.ok) {
        console.error("thsource - Something went wrong in Bandcamp API!");
        return
      }
      const text = await resp.text();

      const jsdom = require("jsdom");
      const jsdomObject = new jsdom.JSDOM(text);
      dom.document = jsdomObject.window.document;
      */
    }
    else {
      dom.document = document;
    }

    const scriptArray = dom.document.querySelectorAll(ALBUM_METADATA_SELECTOR);

    if (scriptArray.length == 0) {
      return null;
    }
    else if (scriptArray.length >= 1) {
      const script = scriptArray[0];
      return JSON.parse(script.textContent);
    }
  }

  getTracks() {
    const trackArray = [];

    for (const track of this.#albumJson["track"]["itemListElement"]) {
      const item = new Map();
      item.set("name", track["item"]["name"]);
      item.set("link", track["item"]["@id"]);
      trackArray.push(item);
    }

    return trackArray;
  }

  getArtist() {
    const artist = new Map();
    artist.set("name", this.#albumJson["byArtist"]["name"]);
    artist.set("link", this.#albumJson["byArtist"]["@id"]);

    return artist;
  }

  getName() {
    return this.#albumJson["name"];
  }

  getCurrentTrackIdx() {
    const currentTrack = document.querySelectorAll('.current_track')[0];
    const trackNumString = currentTrack.getAttribute("rel");
    const trackNum  = parseInt(trackNumString.split("=")[1] - 1);
    return trackNum;
  }
}
