const {interfaces: Ci,	utils: Cu} = Components;
Cu.import('resource://gre/modules/Services.jsm');

var mutConfig = {attributes: true};
function mutFunc(ms) {
	for (var m of ms) {
		Services.console.logStringMessage('SoundStorm - mut fired att changed = "' + m.attributeName + '""');
		if (m.attributeName == 'class') {
			var mClass = m.target.getAttribute('class');
			Services.console.logStringMessage('SoundStorm - mClass Changed = "' + mClass + '""');
			if (!/(pause|playing)/.test(mClass)) {
				//click it to play it again
				m.target.click();
			}
			break;
		}
	}
}

function mouseover(e) {
	e.target.style.transform = 'scale(3,3)';
}

function mouseout(e) {
	e.target.style.transform = '';
}

var regedMuts = {};

function addDiv(doc) {
	if (!doc) return;
	if (!(doc instanceof Ci.nsIDOMHTMLDocument)) return;

	var win = doc.defaultView;
	var host = doc.location.host;
	Services.console.logStringMessage('SoundStorm - host = "' + host + '""');
	Services.console.logStringMessage('SoundStorm - isFrame = "' + win.frameElement + '""');

	
	switch(host) {
		case 'w.soundcloud.com':
			var selector = '.playButton';
			var btns = doc.querySelectorAll(selector);
			break;
		case 'soundcloud.com':
			var selector = '.sc-button-play';
			var btns = doc.querySelectorAll(selector);		
			break;
		default:
			return; //SoundStorm does not support other hosts
	}
	Services.console.logStringMessage('SoundStorm - ADD DIV');
	Services.console.logStringMessage('SoundStorm - HOST NAME PASS');
	
	var js = win.wrappedJSObject;
	if (!js.soundStormMut) {
		js.soundStormMutFunc = mutFunc;
		//js.eval("var soundStormMutFunc = function(ms){for(var m of ms){console.log('SoundStorm - mut fired att changed = \"'+m.attributeName+'\"');if(m.attributeName=='class'){var mClass=m.target.getAttribute('class');console.log('SoundStorm - mClass Changed = \"'+mClass+'\"');if(!/(pause|playing)/.test(mClass)){m.target.click()}break}}}");
		//js.eval("var soundStormMutConfig = {attributes:true}");
		js.soundStormMutConfig = {attributes:true};
		js.eval('alert("done: " + soundStormMutFunc)');
		js.soundStormMut = new js.window.MutationObserver(js.soundStormMutFunc);
		Services.console.logStringMessage('SoundStorm - MUT CREATED');
	} else {
		Services.console.logStringMessage('SoundStorm - MUT ALREADY IN regedMuts');
	}
	
	Services.console.logStringMessage('SoundStorm - MUT if block passed but was it created?');
	
	Services.console.logStringMessage('SoundStorm - # of btns on this page = ' + btns.length);
	[].forEach.call(btns, function(btn, i) {
		Services.console.logStringMessage('SoundStorm - loop ' + i + ' started');
		btn.addEventListener('mouseover', mouseover, false);
		btn.addEventListener('mouseout', mouseout, false);
		js.soundStormMut.observe(btn, js.soundStormMutConfig);
		Services.console.logStringMessage('SoundStorm - loop ' + i + ' completed');
	});
	
	Services.console.logStringMessage('SoundStorm - MOUSE EVENTS ADDED');
	
	Services.console.logStringMessage('SoundStorm - add success');
}

function removeDiv(doc) {
	if (!doc) return;
	if (!(doc instanceof Ci.nsIDOMHTMLDocument)) return;
	
	var win = doc.defaultView;
	var host = doc.location.host;
	
	switch (host) {
		case 'w.soundcloud.com':
			var selector = '.playButton';
			var btns = doc.querySelectorAll(selector);
			break;
		case 'soundcloud.com':
			var selector = '.sc-button-play';
			var btns = doc.querySelectorAll(selector);		
			break;
		default:
			return; //SoundStorm does not support other hosts
	}
	Services.console.logStringMessage('SoundStorm - REM DIV');
	Services.console.logStringMessage('SoundStorm - HOST PASS');

	var js = win.wrappedJSObject;
	
	if (js.soundStormMut) {
		js.soundStormMut.disconnect();
		delete js.soundStormMut;
		delete js.soundStormMutFunc;
		[].forEach.call(btns, function(btn) {
			btn.removeEventListener('mouseover', mouseover, false);
			btn.removeEventListener('mouseout', mouseout, false);
		});
		
		Services.console.logStringMessage('SoundStorm - MUT DELETED and MOUSE EVENTS REMOVED');
	}
	
	Services.console.logStringMessage('SoundStorm - remove success');
	
}

function listenPageLoad(event) {
	var win = event.originalTarget.defaultView;
	var doc = win.document;
	if (win.frameElement) {
		//its a frame
		//Cu.reportError('SoundStorm - a frame loaded');
	}
	Services.console.logStringMessage('SoundStorm - listPageLoad fired');
	addDiv(doc);
}

/*start - windowlistener*/
var windowListener = {
	//DO NOT EDIT HERE
	onOpenWindow: function (aXULWindow) {
		// Wait for the window to finish loading
		let aDOMWindow = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
		aDOMWindow.addEventListener("load", function () {
			aDOMWindow.removeEventListener("load", arguments.callee, false);
			windowListener.loadIntoWindow(aDOMWindow, aXULWindow);
		}, false);
	},
	onCloseWindow: function (aXULWindow) {},
	onWindowTitleChange: function (aXULWindow, aNewTitle) {},
	register: function () {
		// Load into any existing windows
		let XULWindows = Services.wm.getXULWindowEnumerator(null);
		while (XULWindows.hasMoreElements()) {
			let aXULWindow = XULWindows.getNext();
			let aDOMWindow = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
			windowListener.loadIntoWindow(aDOMWindow, aXULWindow);
		}
		// Listen to new windows
		Services.wm.addListener(windowListener);
	},
	unregister: function () {
		// Unload from any existing windows
		let XULWindows = Services.wm.getXULWindowEnumerator(null);
		while (XULWindows.hasMoreElements()) {
			let aXULWindow = XULWindows.getNext();
			let aDOMWindow = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
			windowListener.unloadFromWindow(aDOMWindow, aXULWindow);
		}
		//Stop listening so future added windows dont get this attached
		Services.wm.removeListener(windowListener);
	},
	//END - DO NOT EDIT HERE
	loadIntoWindow: function (aDOMWindow, aXULWindow) {
		if (!aDOMWindow) {
			return;
		}
		if (aDOMWindow.gBrowser) {
			aDOMWindow.gBrowser.addEventListener('load', listenPageLoad, true);
			if (aDOMWindow.gBrowser.tabContainer) {
				//has tabContainer
				//start - go through all tabs in this window we just added to
				var tabs = aDOMWindow.gBrowser.tabContainer.childNodes;
				for (var i = 0; i < tabs.length; i++) {
					Cu.reportError('SoundStorm - DOING tab: ' + i);
					var tabBrowser = tabs[i].linkedBrowser;
					var win = tabBrowser.contentWindow;
					loadIntoContentWindowAndItsFrames(win);
				}
				//end - go through all tabs in this window we just added to
			} else {
				//does not have tabContainer
				var win = aDOMWindow.gBrowser.contentWindow;
				loadIntoContentWindowAndItsFrames(win);
			}
		} else {
			//window does not have gBrowser
		}
	},
	unloadFromWindow: function (aDOMWindow, aXULWindow) {
		if (!aDOMWindow) {
			return;
		}
		if (aDOMWindow.gBrowser) {
			aDOMWindow.gBrowser.removeEventListener('load', listenPageLoad, true);
			if (aDOMWindow.gBrowser.tabContainer) {
				//has tabContainer
				//start - go through all tabs in this window we just added to
				var tabs = aDOMWindow.gBrowser.tabContainer.childNodes;
				for (var i = 0; i < tabs.length; i++) {
					Cu.reportError('SoundStorm - DOING tab: ' + i);
					var tabBrowser = tabs[i].linkedBrowser;
					var win = tabBrowser.contentWindow;
					unloadFromContentWindowAndItsFrames(win);
				}
				//end - go through all tabs in this window we just added to
			} else {
				//does not have tabContainer
				var win = aDOMWindow.gBrowser.contentWindow;
				unloadFromContentWindowAndItsFrames(win);
			}
		} else {
			//window does not have gBrowser
		}
	}
};
/*end - windowlistener*/

function loadIntoContentWindowAndItsFrames(theWin) {
	var frames = theWin.frames;
	var winArr = [theWin];
	for (var j = 0; j < frames.length; j++) {
		winArr.push(frames[j].window);
	}
	Cu.reportError('SoundStorm - # of frames in tab: ' + frames.length);
	for (var j = 0; j < winArr.length; j++) {
		if (j == 0) {
			Cu.reportError('SoundStorm - **checking win: ' + j + ' location = ' + winArr[j].document.location);
		} else {
			Cu.reportError('SoundStorm - **checking frame win: ' + j + ' location = ' + winArr[j].document.location);
		}
		var doc = winArr[j].document;
		//START - edit below here
		//addDiv(doc); //note: noit //commented out so can test attaching on load
		//break; //uncomment this line if you don't want to add to frames
		//END - edit above here
	}
}

function unloadFromContentWindowAndItsFrames(theWin) {
	var frames = theWin.frames;
	var winArr = [theWin];
	for (var j = 0; j < frames.length; j++) {
		winArr.push(frames[j].window);
	}
	Cu.reportError('SoundStorm - # of frames in tab: ' + frames.length);
	for (var j = 0; j < winArr.length; j++) {
		if (j == 0) {
			Cu.reportError('SoundStorm - **checking win: ' + j + ' location = ' + winArr[j].document.location);
		} else {
			Cu.reportError('SoundStorm - **checking frame win: ' + j + ' location = ' + winArr[j].document.location);
		}
		var doc = winArr[j].document;
		//START - edit below here
		removeDiv(doc);
		//break; //uncomment this line if you don't want to remove from frames
		//END - edit above here
	}
}

function startup(aData, aReason) {
	windowListener.register();
}

function shutdown(aData, aReason) {
	if (aReason == APP_SHUTDOWN) return;
	windowListener.unregister();
}

function install() {}

function uninstall() {}