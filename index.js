var express = require('express');
var exphbs  = require('express-handlebars');
 
var webdriver = require("selenium-webdriver"),
	By = webdriver.By,
	until = webdriver.until;

var chromeCapabilities = webdriver.Capabilities.chrome();
var chromeOptions = {
	    'args': ['--disable-infobars', '--window-position=0,0']
	};
	chromeCapabilities.set('chromeOptions', chromeOptions);
var driver = new webdriver.Builder().withCapabilities(chromeCapabilities).build();
driver.manage().window().setRect({x: 0, y: 10000, width: 640, height: 480});

var app = express();
 
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
 
app.get('/', function (req, res) {
    res.render('home');
});

app.get('/test', function (req, res) {

	(async function() {
	  try {
		await driver.get('http://mastertv.biz/entrar.htm');
		await driver.findElement(By.xpath('//input[@name="login"]')).sendKeys('amnarciso@gmail.com');
		await driver.findElement(By.xpath('//input[@name="senha"]')).sendKeys('mypass');
		await driver.findElement(By.xpath('//input[@value="Continuar"]')).click();

	    await driver.switchTo().frame(driver.findElement(By.xpath('//iframe[@src="master.php"]')));
	    await driver.findElement(By.xpath('//a[text()="Lista"]')).click();

	    await driver.switchTo().frame(driver.findElement(By.xpath('//iframe[@src="frente.php"]')));
	    await driver.findElement(By.xpath('//a[text()="CANAIS EM SERVIDORES NO BR"]')).click();
	    await driver.findElement(By.xpath('(//a[img])[8]')).click();

		let handlePromise = await driver.getAllWindowHandles();
		await driver.switchTo().window(handlePromise[1]);	
		await driver.findElement(By.xpath('//div[@id="container"]')).click();
		await driver.findElement(By.xpath('//div[contains(@class, "jw-icon-fullscreen")]')).click();
	  } finally {
	  	//
	  }
	})();
 
    res.render('home');
});
 
app.listen(3000);