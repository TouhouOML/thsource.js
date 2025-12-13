import {BandcampPage} from './bandcamp-api.js';
import {ThbwikiApi} from './thbwiki-api.js';
import {TouhouOML} from './touhou-oml.js';

// Top-level script begins here
function inIframe() {
  return window.self !== window.top;
}

// Listen for messages from the injected monkey patch
window.addEventListener('load', function() {
  playHook(true);
}, false);

window.addEventListener('message', function(event) {
  if (event.origin !== window.location.origin) {
    // verify origin for security
    return;
  }

  if (event.data.type === 'THSOURCE_MONKEYPATCH') {
    console.log('Received from page:', event.data.payload);
    playHook(false);
  }
});

// Execute when a soundtrack starts playing
function playHook(preload) {
  console.log("thsource: playing now!");

  let pageParserClass = null;
  if (window.location.hostname.includes("bandcamp.com")) {
    console.log("hostname matches!");
    pageParserClass = BandcampPage;
  }
  else {
    return;
  }

  console.log(pageParserClass);

  pageParserClass.createFromUrl('dom').then((albumPage) => {
    console.log(albumPage);
    matchWebpageToTrackArray(albumPage).then((match) => {
      console.log(match);
      if (preload) {
        // Don't find the playing soundtrack because we have none.
        return;
      }

      const desc = touhouOml.searchDesc(
        match[albumPage.getCurrentTrackIdx()].get("original-title")[0]
      );
      console.log(desc);
      showNotif(desc["work"], desc["track"]);
    });
  });
}

async function matchWebpageToTrackArray(albumPage) {
  const name = albumPage.getName();
  const artist = albumPage.getArtist()["name"];
  const tracks = albumPage.getTracks();

  const albumCandidateArray = await thbwiki.queryAlbum(albumPage.getName());
  if (albumCandidateArray.length == 0) {
    console.log(`${name} by ${artist} -> not found!`);
    return [];
  }

  console.log(`Album: ${name} by ${artist} -> `);
  console.log(albumCandidateArray[0]);
  const albumTrackArray = await thbwiki.queryTracks(
    albumCandidateArray[0].get("smwid")
  );

  //console.log(tracks);
  //console.log(albumTrackArray);
  if (tracks.length == albumTrackArray.length) {
    return albumTrackArray;
  }
  else {
    return [];
  }
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

// Inject the monkey patch into DOM
//
// Warning: The injected script runs inside the Web page environment, not
// the Userscript environment, so it doesn't have access to webpack resources
// or global variables. Attempting to use webpack resources can fail or succeed
// in an unpredictable way!
//
// Only use the monkey patch script as an in-page event listener, all logic
// should be delegated to the top-level Userscript by sending messages via
// window.postMessage().
function monkeyPatch() {
  // monkey-patch window.Audio before page load
  Audio.prototype.origPlay = Audio.prototype.play
  Audio.prototype.play = function() {
    console.log("thsource - audio: play!");
    if (!document._thsource_audioArray.includes(this)) {
      this.addEventListener('playing', (event) => {
	window.postMessage({
	  type: 'THSOURCE_MONKEYPATCH',
	  payload: "playing"
	});
      });
      document._thsource_audioArray.push(this);
    }
    return this.origPlay(arguments);
  }
}

function injectScripttoDom() {
  let script = document.createElement('script');
  script.appendChild(document.createTextNode('('+ monkeyPatch +')();'));
  (document.body || document.head || document.documentElement).appendChild(script);
  document._thsource_audioArray = [];
}

let touhouOml = null;
let thbwiki = null;
if (!inIframe()) {
  touhouOml = new TouhouOML();
  thbwiki = new ThbwikiApi();

  injectScripttoDom();
  console.log("thsource.js: script injected!!!");

  Notification.requestPermission().then((result) => {
    console.log("thsource " + result);
  });
}
else {
  console.log("not injecting the script.");
}
