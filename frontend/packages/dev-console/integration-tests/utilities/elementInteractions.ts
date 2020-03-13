import { browser, $, ExpectedConditions as EC, element, by, protractor } from 'protractor';
import { config } from '@console/internal-integration-tests/protractor.conf';
const waitForElement = 5000;
// config.jasmineNodeOpts.defaultTimeoutInterval;

  // Enter the data in textbox by passing parameters like element finder property and text
  export async function enterText(ele: any, text: string, timeoutInMilliseconds = waitForElement) {
    browser.executeScript('arguments[0].scrollIntoView();', ele);
    await browser.wait(EC.visibilityOf(ele), timeoutInMilliseconds, `${ele} is not visible in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await clearText(ele);
    await ele.sendKeys(text);
  }

  export function resolveTimeout(timeout: number, defaultTimeout: number) {
    return timeout !== undefined ? timeout : defaultTimeout;
  }

  export async function click(elem: any, timeout?: number) {
    const _timeout = resolveTimeout(timeout, config.jasmineNodeOpts.defaultTimeoutInterval);
    await browser.wait(EC.elementToBeClickable(elem), _timeout);
    await elem.click();
  }

  export async function clearText(ele:any,timeoutInMilliseconds = waitForElement) {
    browser.executeScript('arguments[0].scrollIntoView();', ele);
    await browser.wait(EC.visibilityOf(ele), timeoutInMilliseconds, `${ele} is not visible in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await ele.click();
    await ele.sendKeys(protractor.Key.chord(protractor.Key.CONTROL, "a"));
    await ele.sendKeys(protractor.Key.BACK_SPACE);
  }
  // It is useful in Resources section
  export async function enterTextSelectDropDown(text_ele: any, text: string, drp_ele:any, drpdownListvalue: string, timeoutInMilliseconds = waitForElement) {
    browser.executeScript('arguments[0].scrollIntoView();', text_ele);
    await browser.wait(EC.visibilityOf(text_ele), timeoutInMilliseconds, `${text_ele} is not visible in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await text_ele.clear();
    await text_ele.sendKeys(text);
    await browser.executeScript('arguments[0].scrollIntoView();', drp_ele);
    await browser.wait(EC.visibilityOf(drp_ele), timeoutInMilliseconds, `${drp_ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await drp_ele.click();
    await browser.wait(EC.elementToBeClickable(element(by.css('ul.pf-c-dropdown__menu'))), timeoutInMilliseconds);
    await element(by.cssContainingText('li button.pf-c-dropdown__menu-item', drpdownListvalue)).click();
  }

  export async function mouseHoverClick(ele: any, timeoutInMilliseconds = waitForElement) {
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    await browser.wait(EC.presenceOf(ele), timeoutInMilliseconds, `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await browser.actions().mouseMove(ele).click().perform();
  }

  export async function selectByVisibleText(ele: any, drpdownListvalue: string, timeoutInMilliseconds = waitForElement) {
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    await browser.wait(EC.visibilityOf(ele), timeoutInMilliseconds, `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await ele.click();
    await browser.wait(EC.elementToBeClickable(element(by.css('ul.pf-c-dropdown__menu'))), timeoutInMilliseconds);
    await element(by.cssContainingText('li button.pf-c-dropdown__menu-item', drpdownListvalue)).click();
  }

  export async function selectByIndex(ele: any, index: number = 0, timeoutInMilliseconds = waitForElement) {
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    await browser.wait(EC.elementToBeClickable(ele), timeoutInMilliseconds, `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    await ele.click();
    await browser.wait(EC.elementToBeClickable(element(by.css('ul.pf-c-dropdown__menu')), timeoutInMilliseconds, `Unable to view the dropdown options even after ${timeoutInMilliseconds} ms`));
    await element.all(by.css('li button.pf-c-dropdown__menu-item')).get(index).click();
  }

  export async function selectCheckBox(ele: any, timeoutInMilliseconds = waitForElement) {
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    await browser.wait(EC.elementToBeClickable(ele), timeoutInMilliseconds, `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    let result = await verifyCheckBox(ele)
    if(result == false) {
      await ele.click(); 
    } else {
      console.log('Check Box is already selected');
    }
  }

  export async function verifyCheckBox(ele: any, timeoutInMilliseconds = waitForElement) {
    await browser.executeScript('arguments[0].scrollIntoView();', ele);
    await browser.wait(EC.elementToBeClickable(ele), timeoutInMilliseconds, `${ele} is not able to click in DOM, even after ${timeoutInMilliseconds} milliseconds`);
    
    if(await ele.getAttribute('value') == true) {
      console.log('Check Box is already selected');
      return true;
    } else {
      return false;
    }
  }


  export const elementByDataTestID = (id: string) => $(`[data-test-id="${id}"]`);
