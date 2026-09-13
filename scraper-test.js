const cheerio = require('cheerio');

async function test() {
  const res = await fetch('https://aqi.punjab.gov.pk/lahore');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  console.log('Title:', $('title').text());
  
  // Find wire:snapshot
  const snap = $('[wire\\:snapshot]').attr('wire:snapshot');
  if (snap) {
      console.log('Found wire:snapshot attribute!');
      const data = JSON.parse(snap);
      console.log(JSON.stringify(data.data, null, 2).slice(0, 500));
  } else {
      console.log('wire:snapshot not found');
  }

  // Find wire:initial-data
  const init = $('[wire\\:initial-data]').attr('wire:initial-data');
  if (init) {
      console.log('Found wire:initial-data attribute!');
  }
}

test();
