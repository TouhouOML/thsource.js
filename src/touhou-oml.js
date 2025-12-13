const tomlContext = require.context(
  "../TouhouOML/data/ost/", false, /\.toml$/
);

export class TouhouOML {
  #tomlArray;

  #sortedTomlKeys(tomlContext) {
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
    return tomlKeys;
  }

  constructor() {
    this.#tomlArray = [];

    for (const key of this.#sortedTomlKeys(tomlContext)) {
      this.#tomlArray.push(tomlContext(key));
    }
  }

  searchDesc(origTrackTitle) {
    for (const work of this.#tomlArray) {
      for (const track of work["soundtrack-list"]) {
        if (origTrackTitle == track["title"]["ja"]) {
          return {"work": work, "track": track};
        }
      }
    }
  }
}
