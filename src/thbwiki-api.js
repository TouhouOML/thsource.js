const THBWIKI_API = "https://thwiki.cc/album.php?";

export class ThbwikiApi {
  #albumCache;
  #tracksCache;

  constructor() {
    this.#albumCache = new Map();
    this.#tracksCache = new Map();
  }

  async queryAlbum(albumTitle) {
    if (this.#albumCache.has(albumTitle)) {
      console.log("queryAlbum cache hit!")
      return this.#albumCache.get(albumTitle);
    }

    const albumParams = new URLSearchParams({
        m: 'sa',          // search album
        d: "nm",          // return n results as arr[n] = [id, title]
        v: albumTitle,
    });
    const albumQueryString = THBWIKI_API + albumParams.toString();

    const albumRequest = new Request(albumQueryString);
    const albumResponse = await fetch(albumRequest);
    if (!albumResponse.ok) {
      console.error("thsource - Something went wrong on API server!");
      return
    }

    const rawAlbumJson = await albumResponse.json();

    if (!rawAlbumJson || Object.keys(rawAlbumJson).length == 0) {
      //console.log(`thsource - Unable to find album ${albumTitle}`);
      return [];
    }

    const albumArray = [];
    for (const rawItem of rawAlbumJson) {
      const item = new Map();
      item.set("smwid", rawItem[0]);
      item.set("title", rawItem[1]);

      albumArray.push(item);
    }
    this.#albumCache.set(albumTitle, albumArray);
    return albumArray;
  }

  async queryTracks(albumSmwid) {
    if (this.#tracksCache.has(albumSmwid)) {
      console.log("queryTracks cache hit!")
      return this.#tracksCache.get(albumSmwid);
    }

    const trackParams = new URLSearchParams({
      m: '2',              // search soundtracks in album
      d: "nm",             // return n results as arr[n] = [id, title]
      p: "name, ogmusic",  // get both track names and their original names
      a: albumSmwid        // smwid of the album
    });
    const paramMap = {
      id: "smwid",
      name: "title",
      ogmusic: "original-title",
    }
    const trackQueryString = THBWIKI_API + trackParams.toString();

    const request = new Request(trackQueryString);
    const trackResponse = await fetch(request);
    if (!trackResponse.ok) {
      console.error("thsource - Something went wrong on API server!");
      return
    }

    const trackJson = await trackResponse.json();

    const trackArray = [];

    for (const rawTrack of trackJson) {
      const trackMap = new Map();

      for (const kv of rawTrack) {
        let key = kv[0];
        if (key in paramMap) {
          key = paramMap[key];
        }
        trackMap.set(key, kv[1]);
      }
      trackArray.push(trackMap);
    };

    this.#tracksCache.set(albumSmwid, trackArray);
    return trackArray;
  }
}
