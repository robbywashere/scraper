import * as request from "request-promise-native";
import { readFileSync, existsSync, writeFileSync } from "fs";
import cheerio from "cheerio";

const SPOTIFY_TOKEN =
  "BQCiDj6ClP17CQtGKZ5ZGNIugDr-9HQi66Zbc_MHFtPToKvErl8ezNe4TfdrcZLumOvkbOcKCbQxWGLOjgz6pIUDPQ4CLabctITQXJk2qBAeuX7KU1zdZdobTDEQMMYJXGp4nVrGeeqQdyQ0";

interface DateType {
  acts: string[];
  venue: string,
  info: string;
  time: Date;
}

async function cachedGet(url: string) {
  const name: string = "." + Buffer.from(url).toString("base64") + ".cached";
  let response;
  if (existsSync(name)) {
    response = readFileSync(name, "utf-8");
  } else {
    response = await request.get(url);
    writeFileSync(name, response);
  }
  return response;
}

async function findArtist(name: string) {
  //curl -X "GET" "https://api.spotify.com/v1/search?q=tania%20bowra&type=artist" -H "Accept: application/json" -H "Content-Type: application/json" -H "Authorization: Bearer BQCiDj6ClP17CQtGKZ5ZGNIugDr-9HQi66Zbc_MHFtPToKvErl8ezNe4TfdrcZLumOvkbOcKCbQxWGLOjgz6pIUDPQ4CLabctITQXJk2qBAeuX7KU1zdZdobTDEQMMYJXGp4nVrGeeqQdyQ0"
  request.get("https://api.spotify.com/v1/search", {
    json: true,
    headers: {
      Authorization: "Bearer " + SPOTIFY_TOKEN
    },
    qs: {
      q: name,
      type: "artist"
    }
  });
}
function CrawlGrogShop() {
  return _Crawl({ url: "https://grogshop.gs/calendar", venue: "GrogShop" });
}
function CrawlBeachland() {
  return _Crawl({ url: "https://www.Beachlandballroom.com/calendar", venue: "Beachland" });
}
async function _Crawl({ url, venue }: { url: string; venue: string }) {
  const response = await cachedGet(url);
  const $ = cheerio.load(response);
  const tableCells = $("td.has-event");
  const Shows = [];
  for (let cell of Array.from(tableCells)) {
    //Get the time and parse
    const time = new Date(
      $(cell)
        .find("section.date.dtstart .value-title")
        .attr("title")
        .trim()
    );
    const info = $(cell)
      .find("section.times")
      .text();
    //Get the Acts, store them into an array
    const acts = Array.from($(cell).find("h1.headliners,h2.supports"))
      .map(el =>
        $(el)
          .text()
          .trim()
      )
      //Filter where there may be no info / empty day
      .filter(Boolean);


    if (acts.length) {
      const Show: DateType = {
        acts,
        venue,
        time,
        info
      };
      Shows.push(Show);
    }
  }
  return Shows;
}
(async function() {
  const beachshows = await CrawlBeachland();
  console.log(beachshows);
  const grogshows = await CrawlGrogShop();
  console.log(grogshows);
})();
