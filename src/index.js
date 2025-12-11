const tomlContext = require.context(
  "../TouhouOML/data/ost/", false, /\.toml$/
);

function inIframe() {
  return window.self !== window.top;
}

// Populate webpack global resources to document
// 
// tomlContext can only be accessed from the top-level
// for reasons that I don't understand...
function injectWebpackResource(tomlContext) {
  const tomlKeys = tomlContext.keys();
  tomlKeys.sort((filenameA, filenameB) => {
    const tomlA = tomlContext(filenameA);
    const tomlB = tomlContext(filenameB);
  
    if (
      "threlease" in tomlA && tomlA["threlease"].startsWith("TH") &&
      "threlease" in tomlB && tomlB["threlease"].startsWith("TH")
    ) {
      const verA = parseFloat(tomlA["threlease"].slice(2));
      const verB = parseFloat(tomlB["threlease"].slice(2));
      return verA > verB;
    }
    else {
      return filenameA.localeCompare(filenameB);
    }
  });

  document._thsource_tomlArray = [];
  for (const key of tomlKeys) {
    document._thsource_tomlArray.push(tomlContext(key));
  }
}

if (!inIframe()) {
  injectWebpackResource(tomlContext);
}

function getTomlArray()
{
  // This function should NEVER be used at the top level,
  // otherwise webpack rewrites the calls at compile time,
  // and making it impossible to call ever again in a
  // function of the Userscript.
  return document._thsource_tomlArray;
}

// Main script begins here
function monkeyPatch() {
  // monkey-patch window.Audio before page load
  Audio.prototype.origPlay = Audio.prototype.play
  Audio.prototype.play = function() { 
    console.log("thsource - audio: play!");
    if (!document._thsource_audioArray.includes(this)) {
      this.addEventListener('playing', (event) => {
        playingCallback();
      });
      document._thsource_audioArray.push(this);
    }
    return this.origPlay(arguments); 
  }

  Notification.requestPermission().then((result) => {
    console.log("thsource " + result);
  });
}

function playingCallback() {
  console.log("thsource: playing now!");

  if (window.location.hostname.includes("bandcamp.com")) {
    bandcampCallback();
  }
}

function bandcampCallback() {
  const albumTitle = document.querySelector('h2.trackTitle').textContent.trim();
  const trackTitle = document.querySelector('span.title').textContent;
  const artistName = (
    document.querySelector('#band-name-location > span.title').textContent
  );

  const text = `${albumTitle} ${trackTitle} ${artistName}`;

  queryThbwikiApi(albumTitle, trackTitle)
    .then(trackTitle => {
      if (!trackTitle) {
	console.log("!trackTitle");
        return;
      }

      console.log("result: " + trackTitle);
      const result = queryToml(trackTitle);
      if (!result) {
	console.log("!result");
        return;
      }

      showNotif(result[0], result[1]);
    });
}

function showNotif(work, track)
{
  const notifTitle = `${work["threlease"]}: ${work["title"]["ja"]}`;

  const trackTitle = track["title"];
  let notifDesc = `\n${trackTitle["ja"]}\n`
  notifDesc += `${trackTitle["en"]}\n`
  notifDesc += `${trackTitle["zh-hans"]}\n\n`;
  notifDesc += `${track["context"]["scenario-list"]["zh-hans"][0]}\n`;
  notifDesc += `${track["context"]["character-list"]["zh-hans"][0]}`;

  new Notification(notifTitle, { body: notifDesc });
}

async function queryThbwikiApi(albumTitle, trackTitle) {
  console.log("queryThbwikiApi");

  const THBWIKI_API = "https://thwiki.cc/album.php?"
  const albumParams = new URLSearchParams({m: 'sa', v: albumTitle, d: "kv"});
  const albumQueryString = THBWIKI_API + albumParams.toString();

  const albumRequest = new Request(albumQueryString);
  const albumResponse = await fetch(albumRequest);
  if (!albumResponse.ok) {
    console.error("thsource - Something went wrong on API server!");
    return
  }

  const albumJson = await albumResponse.json();
  if (Object.keys(albumJson).length == 0) {
    console.log(`thsource - Unable to find album ${albumJson}`);
    return
  }

  const swmid = Object.keys(albumJson)[0];
  const count = Object.keys(albumJson).length;
  if (Object.keys(albumJson).length > 1) {
    console.log(`thsource - Ambiguous ${albumJson}, found ${count} matches!`);
  }
  else {
    console.log(`thsource - ${albumJson}, id: ${swmid}`);
  }

  const soundtrackParams = new URLSearchParams(
    {m: '2', a: swmid, d: "kv", p: "name,ogmusic"}
  );
  const soundtrackQueryString = THBWIKI_API + soundtrackParams.toString();

  const request = new Request(soundtrackQueryString);
  const soundtrackResponse = await fetch(request);
  if (!soundtrackResponse.ok) {
    console.error("thsource - Something went wrong on API server!");
    return
  }

  const soundtrackJson = await soundtrackResponse.json();
  console.log(soundtrackJson);

  for (const id of Object.keys(soundtrackJson)) {
    const title = soundtrackJson[id]["name"][0];
    const ogtitle = soundtrackJson[id]["ogmusic"][0];

    if (title == trackTitle) {
      return ogtitle;
    }
  };
}

function queryToml(trackTitle) {
  for (const toml of getTomlArray()) {
    for (const track of toml["soundtrack-list"]) {
      if (trackTitle == track["title"]["ja"]) {
        return [toml, track];
      }
    }
  }
}

// inject the monkey patch into DOM
function injectScripttoDom() {
  if (inIframe()) {
    return;
  }
  else {
    let script = document.createElement('script');
    script.appendChild(document.createTextNode('('+ monkeyPatch +')();'));
    (document.body || document.head || document.documentElement).appendChild(script);
    document._thsource_audioArray = [];
  }
}

injectScripttoDom();
