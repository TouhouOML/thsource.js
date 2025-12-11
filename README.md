thsource.js
==============

A Userscript to resolve the currently-playing Touhou soundtrack in the
browser to the original soundtrack information and context (game,
character, location), using the THBWiki remote API and the local
[TouhouOML](https://github.com/touhouoml/touhouoml) reference data.

TODO
------

This is an early prototype with more problems than features.

1. Only Bandcamp is supported, need to implement monkey patches for other
   websites such as YouTube, Soundcloud, NicoNico, Bilibili, etc.

2. It's blindingly injecting itself to every web page, which shouldn't
   happen.

3. The soundtrack matching logic is currently very broken, and fail to
   match many soundtracks.

4. It requests the API repetitively per play, which shouldn't happen.
   Information about the whole album should be pre-requested.

5. Need a fallback in-page popup window if system notification API is
   unavailable.

6. Character and location names are not available in English, implementing
   it requires a major update to TouhouOML first to parse TouhouWiki.net
   as a data source.
