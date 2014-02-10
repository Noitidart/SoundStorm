const {interfaces: Ci,	utils: Cu} = Components;
Cu.import('resource://gre/modules/Services.jsm');

var mutConfig = {attributes: true};
function mutFunc(ms) {
	for (var m of ms) {
		Services.console.logStringMessage('SoundStorm - mut fired att changed = "' + m.attributeName + '""');
		if (m.attributeName == 'class') {
			var mClass = m.target.getAttribute('class');
			Services.console.logStringMessage('SoundStorm - mClass Changed = "' + mClass + '""');
			
			var DOMWin = m.target.ownerDocument.defaultView.QueryInterface(Ci.nsIInterfaceRequestor)
														   .getInterface(Ci.nsIWebNavigation)
														   .QueryInterface(Ci.nsIDocShellTreeItem)
														   .rootTreeItem
														   .QueryInterface(Ci.nsIInterfaceRequestor)
														   .getInterface(Ci.nsIDOMWindow);

				Services.console.logStringMessage('SoundStorm - 100ms delayed');
				if (!/(pause|playing)/.test(mClass)) {
					DOMWin.setTimeout(function() {
						Services.console.logStringMessage('SoundStorm - clicking now');
						//click it to play it again
						m.target.click();
					}, 100);
				}
			break;
		}
	}
}

function mouseover(e) {
	//e.target.style.transform = 'scale(3,3)';
	var doc = e.target.ownerDocument;
	var win = doc.defaultView;
	var rep = doc.querySelector('#soundStormLabel');
	var btn = e.target;
	Services.console.logStringMessage('btn == e.currentTarget? ' + (btn.innerHTML))
	if (rep.parentNode != e.currentTarget.parentNode) {
		rep.parentNode.removeChild(rep);
		rep = null;
	}
	if (rep) {
		//btn.style.outline = '1px solid red';

		var mydiv = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
		mydiv.style.width = btn.offsetWidth + 'px';
		mydiv.style.height = btn.offsetHeight + 'px';
		mydiv.style.position = 'absolute';
		mydiv.style.top = btn.offsetTop + 'px';
		mydiv.style.left = btn.offsetLeft + 'px';

		mydiv.innerHTML = '<div class="dialog sc-border-box g-z-index-overlay dialog__leftcenter" id="soundStromRepeat" tabindex="-1" style="outline: medium none; position: absolute; border-radius: 3px; padding: 3px; text-shadow: 2px 1px 1px rgba(0, 0, 0, 0.05); font-size:14px; white-space:nowrap; left:-55%; top:110%;">Repeat<div style="transform:rotate(45deg);top:-5px;left:45%;" class="dialog__arrow"></div></div>';

		btn.parentNode.insertBefore(mydiv, btn);
	}
}

function mouseout(e) {
	//e.target.style.transform = '';
	var doc = e.target.ownerDocument;
	var win = doc.defaultView;
	var rep = doc.querySelector('#soundStormLabel');
	var btn = e.target;
	Services.console.logStringMessage('btn == e.currentTarget? ' + (btn.innerHTML))
	if (rep.parentNode != e.currentTarget.parentNode) {
		rep.parentNode.removeChild(rep);
		rep = null;
	}	
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
	
	var DOMWin = win.QueryInterface(Ci.nsIInterfaceRequestor)
                         .getInterface(Ci.nsIWebNavigation)
                         .QueryInterface(Ci.nsIDocShellTreeItem)
                         .rootTreeItem
                         .QueryInterface(Ci.nsIInterfaceRequestor)
                         .getInterface(Ci.nsIDOMWindow);
	
	Services.console.logStringMessage('SoundStorm - # of btns on this page = ' + btns.length);
	[].forEach.call(btns, function(btn, i) {
		Services.console.logStringMessage('SoundStorm - loop ' + i);
		btn.addEventListener('mouseover', mouseover, false);
		btn.addEventListener('mouseout', mouseout, false);
		DOMWin.soundStormMut.observe(btn, mutConfig);
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

		
	if (btns.length > 0) {
		[].forEach.call(btns, function(btn) {
			btn.removeEventListener('mouseover', mouseover, false);
			btn.removeEventListener('mouseout', mouseout, false);
		});
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
			aDOMWindow.soundStormMut = new aDOMWindow.MutationObserver(mutFunc);
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
			aDOMWindow.soundStormMut.disconnect();
			delete aDOMWindow.soundStormMut;
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