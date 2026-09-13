const cheerio = require('cheerio');

async function test() {
  const res = await fetch('https://aqi.punjab.gov.pk/lahore');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const snap = $('[wire\\:snapshot]').attr('wire:snapshot');
  if (snap) {
      const data = JSON.parse(snap);
      const lahoreData = data.data.pageData[0].lahoreData[0];
      
      console.log('City AQI:', lahoreData.average_aqi);
      
      // Look at the first station to see the shape
      const firstStation = lahoreData.stations[0][0][0];
      console.log('First station:', JSON.stringify(firstStation, null, 2));
      
      // Calculate average across all stations
      let stations = [];
      try {
         // It's deeply nested: lahoreData.stations is an array of something...
         // Let's flatten it
         stations = lahoreData.stations.flat(Infinity);
      } catch(e) {}
      
      console.log('Total stations found:', stations.length);
      console.log(stations.map(s => s.station_name));
  }
}

test();
