/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

/* eslint-disable no-invalid-this */
const puppeteer = require('puppeteer');
const assert = require('assert');
const config = require('./config-provider.cjs');

let page;
const { url, timeout } = config;
describe('QCG', function () {
  let browser;
  this.timeout(timeout);
  this.slow(1000);

  before(async () => {
    // Start browser to test UI
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: false });
    page = await browser.newPage();

    exports.page = page;
  });

  it('should load first page "/"', async () => {
    // Try many times until backend server is ready
    for (let i = 0; i < 40; i++) {
      try {
        await page.goto(url, { waitUntil: 'networkidle0' });
        break; // Connection ok, this test passed
      } catch (e) {
        if (e.message.includes('net::ERR_CONNECTION_REFUSED')) {
          await new Promise((done) => setTimeout(done, 500));
          continue; // Try again
        }
        throw e;
      }
    }
  });

  it('should have redirected to default page "/?page=layoutList"', async () => {
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=layoutList', 'Could not load home page of QCG');
  });

  require('./offline-mode.cjs');
  require('./online-mode.cjs');

  after(async () => {
    await browser.close();
  });
});
