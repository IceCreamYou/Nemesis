/**
 * @fileoverview game-shim - Shims to normalize gaming-related APIs to their respective specs
 * @author Brandon Jones
 * @version 0.9
 * @url https://github.com/toji/game-shim
 */

/*
 * Copyright (c) 2012 Brandon Jones
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

/*
 * Modified from the original; only contains pointer lock code.
 */

(function(global) {
    "use strict";

    var elementPrototype = (global.HTMLElement || global.Element)["prototype"];
    var getter;

    var GameShim = global.GameShim = {
        supports: {
            pointerLock: true,
        }
    };
    
    //=====================
    // Pointer Lock
    //=====================
    
    var mouseEventPrototype = global.MouseEvent.prototype;
    
    if(!("movementX" in mouseEventPrototype)) {
        Object.defineProperty(mouseEventPrototype, "movementX", {
            enumerable: true, configurable: false, writeable: false,
            get: function() { return this.webkitMovementX || this.mozMovementX || 0; }
        });
    }
    
    if(!("movementY" in mouseEventPrototype)) {
        Object.defineProperty(mouseEventPrototype, "movementY", {
            enumerable: true, configurable: false, writeable: false,
            get: function() { return this.webkitMovementY || this.mozMovementY || 0; }
        });
    }
    
    // Navigator pointer is not the right interface according to spec.
    // Here for backwards compatibility only
    if(!navigator.pointer) {
        navigator.pointer = navigator.webkitPointer || navigator.mozPointer;
    }

    // Document event: pointerlockchange
    function pointerlockchange(oldEvent) {
        var newEvent = document.createEvent("CustomEvent");
        newEvent.initCustomEvent("pointerlockchange", true, false, null);
        document.dispatchEvent(newEvent);
    }
    document.addEventListener("webkitpointerlockchange", pointerlockchange, false);
    document.addEventListener("webkitpointerlocklost", pointerlockchange, false);
    document.addEventListener("mozpointerlockchange", pointerlockchange, false);
    document.addEventListener("mozpointerlocklost", pointerlockchange, false);

    // Document event: pointerlockerror
    function pointerlockerror(oldEvent) {
        var newEvent = document.createEvent("CustomEvent");
        newEvent.initCustomEvent("pointerlockerror", true, false, null);
        document.dispatchEvent(newEvent);
    }
    document.addEventListener("webkitpointerlockerror", pointerlockerror, false);
    document.addEventListener("mozpointerlockerror", pointerlockerror, false);
    
    if(!document.hasOwnProperty("pointerLockElement")) {
        getter = (function() {
            // These are the functions that match the spec, and should be preferred
            if("webkitPointerLockElement" in document) {
                return function() { return document.webkitPointerLockElement; };
            }
            if("mozPointerLockElement" in document) {
                return function() { return document.mozPointerLockElement; };
            }
            return function() { return null; }; // not supported
        })();
        
        Object.defineProperty(document, "pointerLockElement", {
            enumerable: true, configurable: false, writeable: false,
            get: getter
        });
    }
    
    // element.requestPointerLock
    if(!elementPrototype.requestPointerLock) {
        elementPrototype.requestPointerLock = (function() {
            if(elementPrototype.webkitRequestPointerLock) {
                return function() {
                    this.webkitRequestPointerLock();
                };
            }

            if(elementPrototype.mozRequestPointerLock) {
                return function() {
                    this.mozRequestPointerLock();
                };
            }

            if(navigator.pointer) {
                return function() {
                    var elem = this;
                    navigator.pointer.lock(elem, pointerlockchange, pointerlockerror);
                };
            }

            GameShim.supports.pointerLock = false;

            return function(){}; // not supported
        })();
    }
    
    // document.exitPointerLock
    if(!document.exitPointerLock) {
        document.exitPointerLock = (function() {
            return  document.webkitExitPointerLock ||
                    document.mozExitPointerLock ||
                    function(){
                        if(navigator.pointer) {
                            var elem = this;
                            navigator.pointer.unlock();
                        }
                    };
        })();
    }
    
})((typeof(exports) != 'undefined') ? global : window); // Account for CommonJS environments
