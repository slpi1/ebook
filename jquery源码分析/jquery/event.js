/*
 * author:prk
 * date:2008-08-17
 * comment:analyse of jquery event
 * 
 */
jQuery.event = {
	// add 事件到一个元素上。
	add : function(elem, types, handler, data) {
		if (elem.nodeType == 3 || elem.nodeType == 8)// 空白节点或注释
			return;

		// IE不能传入window,先复制一下。
		if (jQuery.browser.msie && elem.setInterval)
			elem = window;

		// 为handler分配一个全局唯一的Id
		if (!handler.guid)
			handler.guid = this.guid++;

		// 把data附到handler.data中
		if (data != undefined) {
			var fn = handler;
			handler = this.proxy(fn, function() {// 唯一Id,wrap原始handler Fn
						return fn.apply(this, arguments);
					});
			handler.data = data;
		}

		// 如果没有取到events属性值，就初始化data: {}	
		var events = jQuery.data(elem, "events")
				|| jQuery.data(elem, "events", {}),
		// 如果没有取到handle属性值，就初始化data: function() {....}
		handle = jQuery.data(elem, "handle")
				|| jQuery.data(elem, "handle", function() {
					// 处理一个触发器的第二个事件和当page已经unload之后调用一个事件。
						if (typeof jQuery != "undefined"
								&& !jQuery.event.triggered)
							return jQuery.event.handle.apply(// arguments.callee.elem=handle.elem
									arguments.callee.elem, arguments);
					});
		// 增加elem做为handle属性，防止IE由于没有本地Event而内存泄露。
		handle.elem = elem;

		// 处理采用空格分隔多个事件名，如jQuery(...).bind("mouseover mouseout", fn);
		jQuery.each(types.split(/\s+/), function(index, type) {
			// 命名空间的事件，一般不会用到。
				var parts = type.split(".");
				type = parts[0];
				handler.type = parts[1];

				// 捆绑到本元素type事件的所有处理函数
				var handlers = events[type];
				//{uuid_1:{events:{mouseover:{fn_uuid:fn1,fn_uuid1:fn2},
				//mouseout:{fn_uuid:fn1,fn_uuid1:fn2}},handle:fn}}
				if (!handlers) {// 没有找到处理函数列表就初始化事件队列
					handlers = events[type] = {};

					// 对于自定义的事件不注册到浏览器中的事件去。
					if (!jQuery.event.special[type]
							|| jQuery.event.special[type].setup
									.call(elem, data) === false) {
						// 调用系统的事件函数来注册事件
						if (elem.addEventListener)// FF
							elem.addEventListener(type, handle, false);
						else if (elem.attachEvent)// IE
							elem.attachEvent("on" + type, handle);
					}
				}

				// 把处理器的id和handler形式属性对的形式保存在handlers列表中，
				// 也存在events[type][handler.guid]中。
				handlers[handler.guid] = handler;

				// 全局缓存这个事件的使用标识
				jQuery.event.global[type] = true;
			});

		// 防止IE内存泄露。
		elem = null;
	},

	guid : 1,
	global : {},

	// 从元素中remove一个事件
	remove : function(elem, types, handler) {
		if (elem.nodeType == 3 || elem.nodeType == 8)
			return;
		// 取出元素的events中Fn列表
		var events = jQuery.data(elem, "events"), ret, index;
    
		if (events) {
			
			//{uuid_1:{events:{mouseover:{fn_uuid:fn1,fn_uuid1:fn2},
			//mouseout:{fn_uuid:fn1,fn_uuid1:fn2}},handle:fn}}
			
			// remove所有的该元素的事件 .是命名空间的处理
			if (types == undefined
					|| (typeof types == "string" && types.charAt(0) == "."))
				for (var type in events)
					this.remove(elem, type + (types || ""));//xx.yy
			else {
				// types, handler参数采用{type:xxx,handler:yyy}形式
				if (types.type) {
					handler = types.handler;
					types = types.type;
				}

				// 处理采用空格分隔多个事件名 jQuery(...).unbind("mouseover mouseout", fn);
				jQuery
						.each(types.split(/\s+/), function(index, type) {
							// 命名空间的事件，一般不会用到。
								var parts = type.split(".");
								type = parts[0];

								if (events[type]) {// 事件名找到
									if (handler)// handler传入，就remove事件名的这个处理函数
										delete events[type][handler.guid];//guid的作用
									else	// remove这个事件的所有处理函数，带有命名空间的处理
										for (handler in events[type])
											if (!parts[1]
													|| events[type][handler].type == parts[1])
												delete events[type][handler];

									// 如果没有该事件的处理函数存在，就remove事件名
									for (ret in events[type])// 看看有没有？
										break;
									if (!ret) {// 没有
										if (!jQuery.event.special[type]//不是自定义的事件
												|| jQuery.event.special[type].teardown
														.call(elem) === false) {// type不等于ready
											if (elem.removeEventListener)// 在浏览器中remove事件名
												elem.removeEventListener(type,
														jQuery.data(elem,
																"handle"),
														false);
											else if (elem.detachEvent)
												elem.detachEvent("on" + type,
														jQuery.data(elem,
																"handle"));
										}
										ret = null;
										delete events[type];// 在缓存中除去。
									}
								}
							});
			}

			// 不再使用，除去expando
			for (ret in events)
				break;
			if (!ret) {
				var handle = jQuery.data(elem, "handle");
				if (handle)
					handle.elem = null;
				jQuery.removeData(elem, "events");
				jQuery.removeData(elem, "handle");
			}
		}
	},

	trigger : function(type, data, elem, donative, extra) {
		data = jQuery.makeArray(data);//data可以为{xx:yy}
       
		//支持getData!这样的形式，exclusive = true表现会对add的注册的
		//事件的所有函数进行命名空间的分种类的来执行。
		if (type.indexOf("!") >= 0) {
			type = type.slice(0, -1);
			var exclusive = true;
		}

		if (!elem) {// 处理全局的fire事件
			if (this.global[type])
				jQuery.each(jQuery.cache, function() {
					// 从cache中找到所有注册该事件的元素，触发改事件的处理函数
						if (this.events && this.events[type])
							jQuery.event.trigger(type, data, this.handle.elem);
					});
		} else {// 处理单个元素事件的fire事件
			if (elem.nodeType == 3 || elem.nodeType == 8)
				return undefined;
            //elem.onclick=aaa
			var val, ret, fn = jQuery.isFunction(elem[type] || null),
			
			// 如果data参数传进入的不是浏览器的event对象的话，event变量为true.
			//如果data参数本身是娄组，那么第一个元素不是浏览器的event对象时为true.
			//对于event为true。即没有event传进入，先构建一个伪造的event对象存在data[0]。
			event = !data[0] || !data[0].preventDefault;
    
			// 在没有传入event对象的情况下，构建伪造event对象。
			if (event) {
				data.unshift( {//存到数组中的第一个
					type : type,
					target : elem,
					preventDefault : function() {
					},
					stopPropagation : function() {
					},
					timeStamp : now()
				});
				data[0][expando] = true; // 不需要修正伪造的event对象
			}

			//防止事件名出错
			data[0].type = type;
			//表现会进行事件注册函数的分类（命名空间）执行。不是所有的。
			if (exclusive)
				data[0].exclusive = true;
			
			//与prototype等传统的处理方式不一样，没有采用fireEvent来
			//来fire通过注册到浏览器事件中的事件处理方法。
			//这里分了三步，先fire通过jQuery.event.add来注册的事件，这个事件
			//有可能是自定义的事件（没有注册到浏览器事件中）。
			//第二步是fire通过elem.onclick方式注册的事件的本地处理函数
            //第三步是fire默认的事件处理方式（在本地的onclick的方式注册
			//不存在的情况下）。	
			
			// 这里是触发通过jQuery.event.add来注册的事件，
			var handle = jQuery.data(elem, "handle");
			if (handle)//这里data分成多个参数了
				val = handle.apply(elem, data);

			
			//处理触发通过elem.onfoo=function()这样的注册本地处理方法，
			//但是是对于links 's .click()不触发,这个不会执行通过addEvent
			//方式注册的事件处理方式。			
			if ((!fn || (jQuery.nodeName(elem, 'a') && type == "click"))
					&& elem["on" + type]&& elem["on" + type].apply(elem, data) === false)
				val = false;

			//额外的函数参数的开始几个是通过data给定的。这里会把伪造加上的event给去掉。
			//它的最后一个参数是一系列的事件处理函数返回的结果，一般为bool值
			//这个函数可以根据这个结果来处理一个扫尾的工作。
			if (event)
				data.shift();

			// 处理触发extra给定的函数处理。
			if (extra && jQuery.isFunction(extra)) {
		        //执行extra
				ret = extra.apply(elem, val == null ? data : data.concat(val));
			  //如果这个函数有返回值，那么trigger的返回值就是它的返回值
			  //没有的话就是串连的事件处理函数的最后一个返回值。一般为bool
				if (ret !== undefined)
					val = ret;
			}

			// 触发默认本地事件方法，它是在没有如.onclick注册事件
			//加上前面的执行事件处理函数返回值都不为false的情况下，才会执行。
			//它还可以通donative来控制是否执行。
			//如form中可以采用this.submit()来提交form.
			
			if (fn && donative !== false && val !== false
					&& !(jQuery.nodeName(elem, 'a') && type == "click")) {
				this.triggered = true;
				try {
					elem[type]();
					//对于一些hidden的元素，IE会报错
				} catch (e) {
				}
			}

			this.triggered = false;
		}

		return val;
	},

	handle : function(event) {
		// 返回 undefined or false
		var val, ret, namespace, all, handlers;
       //修改了传入的参数，这里是引用。
		event = arguments[0] = jQuery.event.fix(event || window.event);

		// 命名空间处理
		namespace = event.type.split(".");
		event.type = namespace[0];
		namespace = namespace[1];
		// all = true 表明任何 handler,namespace不存在，同时
		//event.exclusive不存在或为假时，all=true.
		all = !namespace && !event.exclusive;
		// 找到元素的events中缓存的事件名的处理函数列表
		handlers = (jQuery.data(this, "events") || {})[event.type];

		for (var j in handlers) {// 每个处理函数执行
			var handler = handlers[j];

			// Filter the functions by class
			if (all || handler.type == namespace) {
				// 传入引用，为了之后删除它们
				event.handler = handler;
				event.data = handler.data;//add的时候加上的

				ret = handler.apply(this, arguments);// 执行事件处理函数

				if (val !== false)
					val = ret;// 只要有一个处理函数返回false，本函数就返回false.

				if (ret === false) {// 不执行浏览器默认的动作
					event.preventDefault();
					event.stopPropagation();
				}
			}
		}

		return val;
	},

	props : "altKey attrChange attrName bubbles button cancelable charCode clientX "
			+ "clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode "
			+ "metaKey newValue originalTarget pageX pageY prevValue relatedNode relatedTarget screenX "
			+ "screenY shiftKey srcElement target timeStamp toElement type view wheelDelta which"
					.split(" "),

	//对事件进行包裹。
	fix : function(event) {
		if (event[expando] == true)//表明事件已经包裹过
			return event;

		//保存原始event,同时clone一个。
		var originalEvent = event;
		event = {
			originalEvent : originalEvent
		};

		for (var i = this.props.length, prop;i;) {
			prop = this.props[--i];
			event[prop] = originalEvent[prop];
		}
		
		event[expando] = true;
		
		//加上preventDefault and stopPropagation，在clone不会运行
		event.preventDefault = function() {
			// 在原始事件上运行
			if (originalEvent.preventDefault)
				originalEvent.preventDefault();
			
			originalEvent.returnValue = false;
		};
		event.stopPropagation = function() {
			// 在原始事件上运行
			if (originalEvent.stopPropagation)
				originalEvent.stopPropagation();
			
			originalEvent.cancelBubble = true;
		};

		// 修正 timeStamp
		event.timeStamp = event.timeStamp || now();

		// 修正target
		if (!event.target)
			event.target = event.srcElement || document; 			
		if (event.target.nodeType == 3)//文本节点是父节点。
			event.target = event.target.parentNode;

		// relatedTarget
		if (!event.relatedTarget && event.fromElement)
			event.relatedTarget = event.fromElement == event.target
					? event.toElement
					: event.fromElement;

		// Calculate pageX/Y if missing and clientX/Y available
		if (event.pageX == null && event.clientX != null) {
			var doc = document.documentElement, body = document.body;
			event.pageX = event.clientX
					+ (doc && doc.scrollLeft || body && body.scrollLeft || 0)
					- (doc.clientLeft || 0);
			event.pageY = event.clientY
					+ (doc && doc.scrollTop || body && body.scrollTop || 0)
					- (doc.clientTop || 0);
		}

		// Add which for key events
		if (!event.which
				&& ((event.charCode || event.charCode === 0)
						? event.charCode
						: event.keyCode))
			event.which = event.charCode || event.keyCode;

		// Add metaKey to non-Mac browsers (use ctrl for PC's and Meta for Macs)
		if (!event.metaKey && event.ctrlKey)
			event.metaKey = event.ctrlKey;

		// Add which for click: 1 == left; 2 == middle; 3 == right
		// Note: button is not normalized, so don't use it
		if (!event.which && event.button)
			event.which = (event.button & 1 ? 1 : (event.button & 2
					? 3
					: (event.button & 4 ? 2 : 0)));

		return event;
	},

	proxy : function(fn, proxy) {
		// 作用就是分配全局guid.
		proxy.guid = fn.guid = fn.guid || proxy.guid || this.guid++;
		return proxy;
	},

	special : {
		ready : {
			// Make sure the ready event is setup
			setup : bindReady,
			teardown : function() {
			}
		}
	}
};

if (!jQuery.browser.msie) {
	// Checks if an event happened on an element within another element
	// Used in jQuery.event.special.mouseenter and mouseleave handlers
	var withinElement = function(event) {
		// Check if mouse(over|out) are still within the same parent element
		var parent = event.relatedTarget;
		// Traverse up the tree
		while (parent && parent != this)
			try {
				parent = parent.parentNode;
			} catch (e) {
				parent = this;
			}

		if (parent != this) {
			// set the correct event type
			event.type = event.data;
			// handle event if we actually just moused on to a non sub-element
			jQuery.event.handle.apply(this, arguments);
		}
	};

	jQuery.each( {
		mouseover : 'mouseenter',
		mouseout : 'mouseleave'
	}, function(orig, fix) {
		jQuery.event.special[fix] = {
			setup : function() {
				jQuery.event.add(this, orig, withinElement, fix);
			},
			teardown : function() {
				jQuery.event.remove(this, orig, withinElement);
			}
		};
	});
}

jQuery.fn.extend( {
	bind : function(type, data, fn) {
		return type == "unload" ? this.one(type, data, fn) : this
				.each(function() {// fn || data, fn && data实现了data参数可有可无
					jQuery.event.add(this, type, fn || data, fn && data);
				});
	},

	    // 为每一个匹配元素的特定事件（像click）绑定一个一次性的事件处理函数。
		// 在每个对象上，这个事件处理函数只会被执行一次。其他规则与bind()函数相同。
		// 这个事件处理函数会接收到一个事件对象，可以通过它来阻止（浏览器）默认的行为。
		// 如果既想取消默认的行为，又想阻止事件起泡，这个事件处理函数必须返回false。
		one : function(type, data, fn) {
			var one = jQuery.event.proxy(fn || data, function(event) {
				jQuery(this).unbind(event, one);
				return (fn || data).apply(this, arguments);// this-->当前的元素
				});
			return this.each(function() {
				jQuery.event.add(this, type, one, fn && data);
			});
		},

		// bind()的反向操作，从每一个匹配的元素中删除绑定的事件。
		// 如果没有参数，则删除所有绑定的事件。
		// 你可以将你用bind()注册的自定义事件取消绑定。
		// I如果提供了事件类型作为参数，则只删除该类型的绑定事件。
		// 如果把在绑定时传递的处理函数作为第二个参数，则只有这个特定的事件处理函数会被删除。
		unbind : function(type, fn) {
			return this.each(function() {
				jQuery.event.remove(this, type, fn);
			});
		},

	
		trigger : function(type, data, fn) {
			return this.each(function() {
				jQuery.event.trigger(type, data, this, true, fn);
			});
		},
       	//这个特别的方法将会触发指定的事件类型上所有绑定的处理函数。但不会执行浏览器默认动作.
		triggerHandler : function(type, data, fn) {
			return this[0]
					&& jQuery.event.trigger(type, data, this[0], false, fn);
		},
		
		//每次点击后依次调用函数。
		toggle : function(fn) {		
			var args = arguments, i = 1;
			
			while (i < args.length)//每个函数分配GUID
				jQuery.event.proxy(fn, args[i++]);

			return this.click(jQuery.event
					.proxy(fn, function(event) {//分配GUID					
							this.lastToggle = (this.lastToggle || 0) % i;//上一个函数							
							event.preventDefault();//阻止缺省动作
							//执行参数中的第几个函数，apply可以采用array-like的参数
							//With apply, you can use an array literal, 
							//for example, fun.apply(this, [name, value]),
							//or an Array object, for example, fun.apply(this, new Array(name, value)). 
							return args[this.lastToggle++].apply(this,
									arguments) || false;
						}));
		},
        
		//一个模仿悬停事件（鼠标移动到一个对象上面及移出这个对象）的方法。
		//这是一个自定义的方法，它为频繁使用的任务提供了一种“保持在其中”的状态。
        //当鼠标移动到一个匹配的元素上面时，会触发指定的第一个函数。当鼠标移出这个元素时，
		//会触发指定的第二个函数。而且，会伴随着对鼠标是否仍然处在特定元素中的检测（例如，处在div中的图像），
        //如果是，则会继续保持“悬停”状态，而不触发移出事件（修正了使用mouseout事件的一个常见错误）。
		hover : function(fnOver, fnOut) {
			return this.bind('mouseenter', fnOver).bind('mouseleave', fnOut);
		},
        
		//dom ready时执行 fn
		ready : function(fn) {			
			bindReady();//注册监听			
			if (jQuery.isReady)//ready就运行				
				fn.call(document, jQuery);			
			else
				// 增加这个函数到queue中。可见支持无数的ready的调用。
				jQuery.readyList.push(function() {
					return fn.call(this, jQuery);
				});

			return this;
		}
	});

jQuery.extend( {
	isReady : false,
	readyList : [],
	// Handle when the DOM is ready
		ready : function() {			
			if (!jQuery.isReady) {		
				jQuery.isReady = true;
				
				if (jQuery.readyList) {					
					jQuery.each(jQuery.readyList, function() {
						this.call(document);
					});				
					jQuery.readyList = null;
				}
				
				jQuery(document).triggerHandler("ready");
			}
		}
	});

var readyBound = false;

function bindReady() {
	if (readyBound)
		return;
	readyBound = true;

	// Mozilla, Opera, webkit nightlies 支持DOMContentLoaded事件	
	if (document.addEventListener && !jQuery.browser.opera)
		//当DOMContentLoaded事件触发时就运行jQuery.ready
		document.addEventListener("DOMContentLoaded", jQuery.ready, false);

	//IE或不是frame的window
	if (jQuery.browser.msie && window == top)
		(function() {
			if (jQuery.isReady)
				return;
			try {
				// 在ondocumentready之前，一直都会抛出异常				
				// http://javascript.nwbox.com/IEContentLoaded/
				document.documentElement.doScroll("left");
			} catch (error) {
				//一直运行bindReady()(=arguments.callee)
				setTimeout(arguments.callee, 0);
				return;
			}			
			jQuery.ready();//documentready就运行jQuery.ready
		})();

	if (jQuery.browser.opera)
		document.addEventListener("DOMContentLoaded", function() {
			if (jQuery.isReady)
				return;
				//只有styleSheets完全enable时，才是完全的load,其实还有pic
			for (var i = 0;i < document.styleSheets.length; i++)
				if (document.styleSheets[i].disabled) {//通过styleSheets来判断
					setTimeout(arguments.callee, 0);
					return;
				}			
				jQuery.ready();
			}, false);

	if (jQuery.browser.safari) {
		var numStyles;
		(function() {
			if (jQuery.isReady)
				return;
				//首先得得到readyState=loaded或=complete
			if (document.readyState != "loaded"
					&& document.readyState != "complete") {
				setTimeout(arguments.callee, 0);
				return;
			}
			//取得style的length,比较它们之间的长度，看看是不是完成loaded
			if (numStyles === undefined)
				numStyles = jQuery("style, link[rel=stylesheet]").length;
			if (document.styleSheets.length != numStyles) {
				setTimeout(arguments.callee, 0);
				return;
			}			
			jQuery.ready();
		})();
	}

	//最后只能依赖于window.load.
	jQuery.event.add(window, "load", jQuery.ready);
}

//为jquery对象增加常用的事件方法
jQuery
		.each(
				("blur,focus,load,resize,scroll,unload,click,dblclick,"
						+ "mousedown,mouseup,mousemove,mouseover,mouseout,change,select," + "submit,keydown,keypress,keyup,error")
						.split(","), function(i, name) {					
				jQuery.fn[name] = function(fn) {
					return fn ? this.bind(name, fn) : this.trigger(name);
				};
			});

// Prevent memory leaks in IE
// And prevent errors on refresh with events like mouseover in other browsers
// Window isn't included so as not to unbind existing unload events
jQuery(window).bind('unload', function() {
	for (var id in jQuery.cache)
		// Skip the window
		if (id != 1 && jQuery.cache[id].handle)
			jQuery.event.remove(jQuery.cache[id].handle.elem);
});
