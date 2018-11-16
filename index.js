//Start Browser
var webdriver = require("selenium-webdriver"),
	By = webdriver.By,
	until = webdriver.until;

var chromeCapabilities = webdriver.Capabilities.chrome();
var chromeOptions = {'args': ['--disable-infobars']};
chromeCapabilities.set('chromeOptions', chromeOptions);
var driver = new webdriver.Builder().withCapabilities(chromeCapabilities).build();
driver.manage().window().setRect({x: 0, y: 1000, width: 640, height: 480});
var browser = new Browser(driver);

//Read providers config
var fs = require("fs");
var contents = fs.readFileSync("providers.json");
var providers = JSON.parse(contents).providers;

//Start handlebars app
var express = require('express');
var exphbs  = require('express-handlebars');

var app = express();
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(express.static('public'));
 
(async function() {
	browser.busy = true;

	var p_id  = 0;
	for (let provider of providers){
		provider.id = p_id;
		p_id ++;
		var m_id = 0;
		for (let menu of provider.menus){
			menu.id = m_id;
			m_id ++;
			for (let order of provider.login){
				await browser.runAction(order.action, order.target);
				await console.log(order.target);
			}
			for (let order of menu.show){
				await browser.runAction(order.action, order.target);
				await console.log(order.target);
			}
			let elemList = await browser.listElements(menu.label.target, menu.label.attribute, menu.label.regex);
			menu.channels = elemList;
		}
	}

	browser.busy = false;
	})();

app.get('/', function (req, res) {
	if (browser.busy) {
		res.render('busy');
		return;
	}
    res.render('home', {providers: providers});
});

app.get('/:p_id/:m_id/:c_id', function (req, res) {
	if (browser.busy) {
		res.render('busy');
		return;
	}

	(async function() {
		browser.busy = true;
		await browser.reset();
		for (let order of providers[req.params.p_id].login){
			await browser.runAction(order.action, order.target);
			await console.log(order.target);
		}
		for (let order of providers[req.params.p_id].menus[req.params.m_id].show){
			await browser.runAction(order.action, order.target);
			await console.log(order.target);
		}
		await browser.runAction(providers[req.params.p_id].menus[req.params.m_id].load.action, providers[req.params.p_id].menus[req.params.m_id].load.target, req.params.c_id);
		for (let order of providers[req.params.p_id].menus[req.params.m_id].play){
			await browser.runAction(order.action, order.target);
			await console.log(order.target);
		}
		browser.busy = false;
	})();

	res.redirect('/');
});
 
app.listen(3000);

function Browser(driver) {
	this.busy = false;
	this.runAction = async function(action, target, index = null){
		switch (action) {
			case 'get':
				await driver.get(target);
				break;
			case 'login':
				await driver.findElement(By.xpath(target)).sendKeys('amnarciso@gmail.com');
				break;
			case 'password':
				await driver.findElement(By.xpath(target)).sendKeys('mypass');
				break;
			case 'click':
				if (index) {
				    let elements = await driver.findElements(By.xpath(target));
					await elements[index].click();
				} else {
					await driver.findElement(By.xpath(target)).click();
				}
				break;
			case 'switch':
			    await driver.switchTo().frame(driver.findElement(By.xpath(target)));
				break;
			case 'popup':
				let handlePromise = await driver.getAllWindowHandles();
				await driver.switchTo().window(handlePromise[1]);	
				break;
		} 
	}

	this.listElements = async function(target, attrib, regex){
		var elemList = [];
		var e_id = 0;
	    let elements = await driver.findElements(By.xpath(target));
		for(let elem of elements) {
		    let text = await elem.getAttribute(attrib);
		    await elemList.push({
		    		name: text,
		    		id: e_id
		    	});
		    await e_id ++;
		}
		return await elemList;
	}

	this.reset = async function(){
		let handlePromise = await driver.getAllWindowHandles();
		while (handlePromise.length > 1) {
			await driver.switchTo().window(handlePromise[1]);
			await driver.close();	
			await driver.switchTo().window(handlePromise[0]);
			handlePromise = await driver.getAllWindowHandles();
		}
	}
}