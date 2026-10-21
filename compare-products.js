//[pang kuha ng product name and link]

const { chromium } = require('playwright');
const { createObjectCsvWriter } = require('csv-writer');

(async () => {
  const browser = await chromium.launch({
    headless: false // gawing true kapag working na
  });

  const page = await browser.newPage();

  const products = [];
  const visitedUrls = new Set();

  let pageNumber = 1;

  while (true) {
    const url =
      pageNumber === 1
        ? 'https://fcw.fluiddev.co.uk/shop/'
        : `https://fcw.fluiddev.co.uk/shop/page/${pageNumber}/`;

    console.log(`\nScraping page ${pageNumber}`);
    console.log(url);

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      await page.waitForTimeout(5000);

      const productCards = page.locator('li.product');

      const count = await productCards.count();

      console.log(`Products found on page: ${count}`);

      if (count === 0) {
        console.log('No products found. Stopping.');
        break;
      }

      for (let i = 0; i < count; i++) {
        try {
          const card = productCards.nth(i);

          const name = await card
            .locator('h2')
            .innerText()
            .catch(() => '');

          const productUrl = await card
            .locator('a')
            .first()
            .getAttribute('href')
            .catch(() => '');

          if (!name || !productUrl) {
            continue;
          }

          if (visitedUrls.has(productUrl)) {
            continue;
          }

          visitedUrls.add(productUrl);

          products.push({
            'Staging Name': name.trim(),
            'Staging URL': productUrl
          });

          console.log(`✓ ${name}`);
        } catch (err) {
          console.log(`Failed product ${i + 1}`);
        }
      }

      pageNumber++;

    } catch (err) {
      console.log(`Failed page ${pageNumber}`);
      console.log(err.message);
      break;
    }
  }

  console.log('\nWriting CSV...');

  const csvWriter = createObjectCsvWriter({
    path: 'staging-products.csv',
    header: [
      {
        id: 'Staging Name',
        title: 'Staging Name'
      },
      {
        id: 'Staging URL',
        title: 'Staging URL'
      }
    ]
  });

  await csvWriter.writeRecords(products);

  console.log('\n==============================');
  console.log(`Total Products: ${products.length}`);
  console.log('Created: staging-products.csv');
  console.log('==============================');

  await browser.close();
})();