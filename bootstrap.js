const {interfaces: Ci,	utils: Cu} = Components;
Cu.import('resource://gre/modules/Services.jsm');
var cRep = {}; //object holding details of what is currently repeating //useufl for
var tRep = {}; //temp object, for between mousedown and repeat funcs, object holding details of what is currently repeating //useufl for

var mutConfig = {attributes: true};
function mutFunc(ms) {
	for (var m of ms) {
		Cu.reportError('SoundStorm - mut fired att changed = "' + m.attributeName + '""');
		if (m.attributeName == 'class') {
			var mClass = m.target.getAttribute('class');
			Cu.reportError('SoundStorm - mClass Changed = "' + mClass + '""');
			if (!/(pause|playing)/.test(mClass)) {
				Cu.reportError('SoundStorm - clicking now');
				//click it to play it again
				m.target.click();
			}
			break;
		}
	}
}

var heldTimer;
var repeated;

function focus() {
	if (cRep.DOMWin) {
		if (cRep.DOMWin.closed) {
			Cu.reportError('SoundStorm - The DOMWin of the song has been closed, cannot focus anything');
			return;
		}
		//cRep.DOMWin is meant to check if cRep is an empty object or not
		//to test if DOMWin is closed do DOMWin.closed
		//to test if tab is closed check tab.parentNode
		//cRep.DOMWin.focus();
		//ok up to this point we verify DOMWin is open
		if (cWin.tab) { //check to see if theres a tab in cRep, if there is then this tells us there is obviously a tabContainer in this DOMWin
			if (tab.parentNode) {
				//cRep.DOMWin.gBrowser.selectedTab = tab;
				//ok up to this point we verify that tab is open
			} else {
				//it had a tab but its now closed so return
				Cu.reportError('SoundStorm - Tab that had song is no longer open, cannot focus anything');
				return;
			}
		}
		
		if (btn.parentNode) { //im guessing this tells if btn exists or not
			//ok we verify btn exists, so now focus it
			cRep.DOMWin.focus();
			if (cRep.tab) {
				cRep.DOMWin.gBrowser.selectedTab = cRep.tab;
			}
			btn.scrollIntoView(true);
			//todo: add downlaod style arrows pointing to the play button
		} else {
			Cu.reportError('SoundStorm - Btn is no longer there, cannot focus anything');
			return;
		}
	}
}

function repeat(e) {
	repeated = true;
	Cu.reportError('SoundStorm - Repeat triggered');
	var label = tRep.btn.parentNode.querySelector('.soundStormLabel');

	if (!label) {
		Cu.reportError('SoundStorm - NO LABEL!!!!!!!!');
		label.childNodes[0].innerHTML = 'Repeating..';
	}
	
	if (cRep.btn == tRep.btn) {
		//its currently repeating so turn repeat off
		tRep.DOMWin.soundStormMut.disconnect();
		cRep = {};
	} else {
		tRep.DOMWin.soundStormMut.disconnect();
		tRep.DOMWin.soundStormMut.observe(tRep.btn, mutConfig);
		cRep.DOMWin = tRep.DOMWin;
		cRep.tab = tRep.tab;
		cRep.win = tRep.win;
		cRep.btn = tRep.btn;
	}

}

function mousedown(e) {
	var doc = e.target.ownerDocument;
	var win = doc.defaultView;
	
	var btn = e.target;
	var doc = e.target.ownerDocument;
	var win = doc.defaultView;
	var DOMWin = win.QueryInterface(Ci.nsIInterfaceRequestor)
					.getInterface(Ci.nsIWebNavigation)
					.QueryInterface(Ci.nsIDocShellTreeItem)
					.rootTreeItem
					.QueryInterface(Ci.nsIInterfaceRequestor)
					.getInterface(Ci.nsIDOMWindow);
	if (DOMWin.gBrowser) {
		var tab = DOMWin.gBrowser._getTabForContentWindow(win);
		/*
		for (let i = 0; i < this.browsers.length; i++) {
			if (this.browsers[i].contentWindow == aWindow)
				return this.tabs[i];
			}
			return null;
		}
		*/
		tRep.tab = tab;
	}
	
	tRep.btn = btn;
	tRep.win = win;
	tRep.DOMWin = DOMWin;
	mClassBetweenMouseupAndClick = null;
	repeated = false;
	heldTimer = tRep.DOMWin.setTimeout(repeat, 500);
}

function mouseup(e) {
	if (!repeated) {
		//do nothing
		tRep.DOMWin.clearTimeout(heldTimer);
		//start - this block here should allow user to pause even if its repeating
		if (cRep.btn && cRep.btn.parentNode) {
			if (cRep.btn == tRep.btn) { //check if cRep is not empty, then check if btn still exists, THEN check if cRep btn == tRep btn
				if (/(pause|playing)/.test(cRep.btn.getAttribute('class'))) {
					Cu.reportError('SoundStorm - it was playing will now be PAUSING');
					cRep.DOMWin.soundStormMut.disconnect();
				} else {
					//its not playing
					Cu.reportError('SoundStorm - it was paused will now be PLAYING');
					cRep.DOMWin.soundStormMut.observe(cRep.btn, mutConfig);
				}
			//end - this block here should allow user to pause even if its repeating
			} else { //start - this block here should allow user to play another one by clicking
				//so tRep.btn (the user just clicked) is not == the cRep.btn which is last repeating
				//must use tRep in this block obviously as it is not equal to cRep
				if (/(pause|playing)/.test(tRep.btn.getAttribute('class'))) { //must use tRep.btn here
					Cu.reportError('SoundStorm - it was playing will now be PAUSING');
					tRep.DOMWin.soundStormMut.disconnect();
				} else {
					//its not playing
					Cu.reportError('SoundStorm - it was paused will now do NOTHING as user is playing another by click');
				}
			} //end - this block here should allow user to play another one by clicking
		}
	} else {
		var mClass = tRep.btn.getAttribute('class');
		mClassBetweenMouseupAndClick = mClass;
		Cu.reportError('mClass mouseup == "' + mClass + '"');
		if (/(pause|playing)/.test(tRep.btn.getAttribute('class'))) {
			//its playing so just toggle repeat
			e.stopPropagation();
			e.preventDefault();
			e.returnValue = false;
			Cu.reportError('SHOULD HAVE STOPPED MOUSEUP EVENT');
		} else {
			//do nothing let the click through so it plays
		}
		tRep.DOMWin.setTimeout(function() { Cu.reportError('mouseup timer fired repeated == ' + repeated); repeated = false }, 100); //set repeated to false after 100ms in case click event doesnt fire
	}
}

var mClassBetweenMouseupAndClick;

function click(e) {
	if (repeated) {
		Cu.reportError('click event fired while repeated == TRUE')
		//var mClass = tRep.btn.getAttribute('class'); //cant do this here, need to read attr from when in mouseup, before it gets to click and after mouseup it already has the pause class
		var mClass = mClassBetweenMouseupAndClick;
		//Cu.reportError('mClass click == "' + mClass + '"');
		Cu.reportError('mClass click but from mClassBetweenMouseupAndClick== "' + mClass + '"');
		if (/(pause|playing)/.test(tRep.btn.getAttribute('class'))) {
			//its playing so just toggle repeat
			e.stopPropagation();
			e.preventDefault();
			e.returnValue = false;
			Cu.reportError('SHOULD HAVE STOPPED CLICK EVENT');
		} else {
			//do nothing let the click through so it plays
		}
		repeated = false;
	}
}

function mouseenter(e) {
	//e.target.style.transform = 'scale(3,3)';
	var doc = e.target.ownerDocument;
	var win = doc.defaultView;
	var btn = e.target;
	
	//test if btn is really the btn
	var parentNode = btn.target;
	var btnClass = btn.getAttribute('class');
	if (!btnClass) {
		Cu.reportError('SoundStorm - NOT BTN')
		return;
	}
	if (/(sc-button-play|playButton)/.test(btnClass)) {
		Cu.reportError('SoundStorm - YES its btn')
	}
	
	var label = btn.parentNode.querySelector('.soundStormLabel');

	if (!label) {
		//btn.style.outline = '1px solid red';

		var mydiv = doc.createElementNS('http://www.w3.org/1999/xhtml', 'div');
		mydiv.style.width = btn.offsetWidth + 'px';
		mydiv.style.height = btn.offsetHeight + 'px';
		mydiv.style.position = 'absolute';
		mydiv.style.top = btn.offsetTop + 'px';
		mydiv.style.left = btn.offsetLeft + 'px';
		mydiv.style.pointerEvents = 'none';
		mydiv.style.display = 'flex';
		mydiv.style.justifyContent = 'flex-start';
		mydiv.style.alignItems = 'center';
		mydiv.style.flexWrap = 'nowrap';
		mydiv.style.overflow = 'visible';
		mydiv.setAttribute('class','soundStormLabel');
		
		mydiv.innerHTML = '<div class="dialog sc-border-box g-z-index-overlay dialog__leftcenter" tabindex="-1" style="flex-shrink:0;z-index:900; background-color:white; outline: medium none; position: relative; left: 115%; border-radius: 3px; padding: 3px; text-shadow: 2px 1px 1px rgba(0, 0, 0, 0.05); font-size:14px; white-space:nowrap;">Hold to Repeat<div style="transform:rotate(45deg);top:-5px;left:45%;" class="dialog__arrow"></div></div>';

		btn.parentNode.insertBefore(mydiv, btn);
		
		
	} else {
		label.style.display = 'flex';
		label.childNodes[0].innerHTML = 'Hold to Repeat';
	}
}

function mouseleave(e) {
	//e.target.style.transform = '';
	var doc = e.target.ownerDocument;
	var win = doc.defaultView;
	var btn = e.target;
	
	if (!repeated) {
		if (tRep.DOMWin) {
			tRep.DOMWin.clearTimeout(heldTimer);
		}
	}
	
	var label = btn.parentNode.querySelector('.soundStormLabel');

	if (!label) {
		Cu.reportError('SoundStorm - No label on mouseleave!')
	} else {
		label.style.display = 'none';
	}
	var btn = e.target;
}

var regedMuts = {};

function addDiv(doc) {
	if (!doc) return;
	if (!(doc instanceof Ci.nsIDOMHTMLDocument)) return;

	var win = doc.defaultView;
	var host = doc.location.host;
	Cu.reportError('SoundStorm - host = "' + host + '""');
	Cu.reportError('SoundStorm - isFrame = "' + win.frameElement + '""');

	
	switch(host) {
		case 'w.soundcloud.com':
			var selector = '.playButton';
			var btns = doc.querySelectorAll(selector);
			break;
		case 'soundcloud.com':
			var selector = '.sc-button-play,.playControl';
			var btns = doc.querySelectorAll(selector);		
			break;
		default:
			return; //SoundStorm does not support other hosts
	}
	Cu.reportError('SoundStorm - ADD DIV');
	Cu.reportError('SoundStorm - HOST NAME PASS');
	
	Cu.reportError('SoundStorm - # of btns on this page = ' + btns.length);
	[].forEach.call(btns, function(btn, i) {
		Cu.reportError('SoundStorm - loop ' + i);
		btn.addEventListener('mouseenter', mouseenter, false);
		btn.addEventListener('mouseleave', mouseleave, false);
		btn.addEventListener('mousedown', mousedown, true);
		btn.addEventListener('mouseup', mouseup, true);
		btn.addEventListener('click', click, true);
		//DOMWin.soundStormMut.observe(btn, mutConfig);
	});
	
	Cu.reportError('SoundStorm - MOUSE EVENTS ADDED');
	
	Cu.reportError('SoundStorm - add success');
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
			var selector = '.sc-button-play,.playControl';
			var btns = doc.querySelectorAll(selector);		
			break;
		default:
			return; //SoundStorm does not support other hosts
	}
	Cu.reportError('SoundStorm - REM DIV');
	Cu.reportError('SoundStorm - HOST PASS');

		
	if (btns.length > 0) {
		[].forEach.call(btns, function(btn) {
			btn.removeEventListener('mouseenter', mouseenter, false);
			btn.removeEventListener('mouseleave', mouseleave, false);
			btn.removeEventListener('mousedown', mousedown, true);
			btn.removeEventListener('mouseup', mouseup, true);
			btn.removeEventListener('click', click, true);
			
			var label = btn.parentNode.querySelector('.soundStormLabel');
			if (label) {
				label.parentNode.removeChild(label);
			}
		});
	}
	
	Cu.reportError('SoundStorm - remove success');
	
}

function listenPageLoad(event) {
	var win = event.originalTarget.defaultView;
	var doc = win.document; //note: noit: i got a win is not defined error here once but i didnt look into it 2/9/14 1235a
	if (win.frameElement) {
		//its a frame
		//Cu.reportError('SoundStorm - a frame loaded');
	}
	Cu.reportError('SoundStorm - listPageLoad fired');
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
		addDiv(doc); //note: noit //commented out so can test attaching on load
		//break; //comment this line if you don't want to add to frames
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
		//break; //comment this line if you don't want to remove from frames
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