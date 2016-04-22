jQuery.fn.extend( {
	// Keep a copy of the old load
		_load : jQuery.fn.load,

		// 载入远程 HTML 文件代码并插入至 DOM 中。
		// 默认使用 GET 方式 - 传递附加参数时自动转换为 POST 方式。
		// jQuery 1.2 中，可以指定选择符，来筛选载入的 HTML 文档，DOM 中将仅插入筛选出的 HTML 代码。
		// 语法形如 "url #some > selector"。
		load : function(url, params, callback) {
			if (typeof url != 'string')
				return this._load(url);

			var off = url.indexOf(" ");// 找到第一个空格处
			if (off >= 0) {
				var selector = url.slice(off, url.length);// 第一个空格之后的字符
				url = url.slice(0, off);// 第一个空格之前的字符
			}

			callback = callback || function() {
			};

			// 默认的是get类型
			var type = "GET";

			// 这里是判断第二参数，如果是fn,那么就是指callback
			// 如果是object,那么就是指data.load(url,[data],[callback])
			if (params)
				if (jQuery.isFunction(params)) {
					callback = params;
					params = null;
				} else if (typeof params == 'object') {
					params = jQuery.param(params);
					type = "POST";
				}

			var self = this;

			//Ajax请求			
			jQuery.ajax( {
				url : url,
				type : type,
				dataType : "html",
				data : params,
				complete : function(res, status) {
					// 成功就注射html到所有匹配的元素中
					if (status == "success" || status == "notmodified")
						// selector是否指定？没有的话就是全部的内容
						// 指定的话，就是生成dom文档的形式，之后在中间找到满足条件的元素。
						// 这中间删除 scripts 是避免IE中的 'Permission Denied' 错误
						self.html(selector ? jQuery("<div/>")
								.append(res.responseText.replace(
										/<script(.|\s)*?\/script>/g, ""))
								.find(selector) : res.responseText);
					// 执行回调
					self.each(callback, [res.responseText, status, res]);
				}
			});
			return this;
		},

		serialize : function() {// 转换成请求字符串
			return jQuery.param(this.serializeArray());
		},
		serializeArray : function() {// 构成数组
			// 第一步：采用map把当前jquery对象中的form元素转换成其下所有子元素。
			// 二：过滤掉没有名字或disabled元素，而且其必须为select|textarea
			// text|hidden|password|checkbox等。
			// 三：取过滤后元素的值形成一个包含name和value的对象。
			// 取这个新形成集合中的所有元素。
			return this
					.map(function() {
						return jQuery.nodeName(this, "form") ? jQuery
								.makeArray(this.elements)// form的所有元素
								: this;
					})
					.filter(function() {
						return this.name
								&& !this.disabled
								&& (this.checked
										|| /select|textarea/i
												.test(this.nodeName) || /text|hidden|password/i
										.test(this.type));
					}).map(function(i, elem) {
						var val = jQuery(this).val();
						return val == null ? null : val.constructor == Array
								? jQuery.map(val, function(val, i) {
									return {
										name : elem.name,
										value : val
									};
								})
								: {
									name : elem.name,
									value : val
								};
					}).get();
		}
	});

// Attach a bunch of functions for handling common AJAX events
jQuery.each("ajaxStart,ajaxStop,ajaxComplete,ajaxError,ajaxSuccess,ajaxSend"
		.split(","), function(i, o) {
	jQuery.fn[o] = function(f) {// f:function
		return this.bind(o, f);
	};
});

var jsc = now();

jQuery.extend( {
	//通过get的type方式进行ajax的请求
	get : function(url, data, callback, type) {
		// 前移 arguments 如data 参数省略
		if (jQuery.isFunction(data)) {
			callback = data;
			data = null;
		}

		return jQuery.ajax( {
			type : "GET",
			url : url,
			data : data,
			success : callback,
			dataType : type
		});
	},
    //取得返回的script
	getScript : function(url, callback) {
		return jQuery.get(url, null, callback, "script");
	},
   //取得json
	getJSON : function(url, data, callback) {
		return jQuery.get(url, data, callback, "json");
	},
   //以post方式进行ajax请求
	post : function(url, data, callback, type) {
		if (jQuery.isFunction(data)) {
			callback = data;
			data = {};
		}

		return jQuery.ajax( {
			type : "POST",
			url : url,
			data : data,
			success : callback,
			dataType : type
		});
	},

	ajaxSetup : function(settings) {
		jQuery.extend(jQuery.ajaxSettings, settings);
	},
    
	//默认的ajax的请求参数
	ajaxSettings : {
		url : location.href,//默认是地址栏中url
		global : true,//默认支持全局的ajax事件
		type : "GET",
		timeout : 0,
		contentType : "application/x-www-form-urlencoded",//data的内容的形式
		processData : true,
		async : true,
		data : null,
		username : null,
		password : null,
		accepts : {
			xml : "application/xml, text/xml",
			html : "text/html",
			script : "text/javascript, application/javascript",
			json : "application/json, text/javascript",
			text : "text/plain",
			_default : "*/*"
		}
	},
	
	//为下一次请求缓存Last-Modified header 
	lastModified : {},

	ajax : function(s) {
		//两次继承s,以便在测试中能检测
		s = jQuery.extend(true, s, jQuery.extend(true, {}, jQuery.ajaxSettings,	s));

		var jsonp, jsre = /=\?(&|$)/g, status, data, type = s.type
				.toUpperCase();

		// 如果不是字符集串就转换在查询字符集串
		if (s.data && s.processData && typeof s.data != "string")
			s.data = jQuery.param(s.data);

		// 构建jsonp请求字符集串。jsonp是跨域请求，要加上callback=？后面将会进行加函数名
		if (s.dataType == "jsonp") {
			if (type == "GET") {//使get的url包含 callback=？后面将会进行加函数名
				if (!s.url.match(jsre))
					s.url += (s.url.match(/\?/) ? "&" : "?")
							+ (s.jsonp || "callback") + "=?";
			} // 构建新的s.data，使其包含callback=function name
			else if (!s.data || !s.data.match(jsre))
				s.data = (s.data ? s.data + "&" : "") + (s.jsonp || "callback")
						+ "=?";
						
			s.dataType = "json";
		}		
		//判断是否为jsonp,如果是，进行处理。
		if (s.dataType == "json"
				&& (s.data && s.data.match(jsre) || s.url.match(jsre))) {
			jsonp = "jsonp" + jsc++;

			//为请求字符集串的callback=加上生成回调函数名
			if (s.data)
				s.data = (s.data + "").replace(jsre, "=" + jsonp + "$1");
			s.url = s.url.replace(jsre, "=" + jsonp + "$1");

			// 我们需要保证jsonp 类型响应能正确地执行
			//jsonp的类型必须为script。这样才能执行服务器返回的
			//代码。这里就是调用这个回调函数。
			s.dataType = "script";

			
			//window下注册一个jsonp回调函数有，让ajax请求返回的代码调用执行它，
			//在服务器端我们生成的代码 如callbackname(data);形式传入data.
			window[jsonp] = function(tmp) {
				data = tmp;//data是全局变量,window下的
				success();
				complete();
				// 垃圾回收,释放联变量，删除jsonp的对象，除去head中加的script元素
				window[jsonp] = undefined;
				try {
					delete window[jsonp];
				} catch (e) {
				}
				if (head)
					head.removeChild(script);
			};
		}

		if (s.dataType == "script" && s.cache == null)
			s.cache = false;

		// 加上时间戳，可见加cache:false就会加上时间戳
		if (s.cache === false && type == "GET") {
			var ts = now();
			var ret = s.url.replace(/(\?|&)_=.*?(&|$)/, "$1_=" + ts + "$2");
			// 没有代替，就追加在url的尾部
			s.url = ret
					+ ((ret == s.url) ? (s.url.match(/\?/) ? "&" : "?") + "_="
							+ ts : "");
		}

		// data有效，追加到get类型的url上去
		if (s.data && type == "GET") {
			s.url += (s.url.match(/\?/) ? "&" : "?") + s.data;

			// 防止IE会重复发送get和post data
			s.data = null;
		}

		// 监听一个新的请求
		if (s.global && !jQuery.active++)
			jQuery.event.trigger("ajaxStart");

		// 监听一个绝对的url,和保存domain
		var parts = /^(\w+:)?\/\/([^\/?#]+)/.exec(s.url);

		// 如果我们正在请求一个远程文档和正在load json或script通过get类型
		//location是window的属性，通过和地址栏中的地址比较判断是不是跨域。
		if (s.dataType == "script"	&& type == "GET"&& parts
				&& (parts[1] && parts[1] != location.protocol || parts[2] != location.host)) {

			// 在head中加上<script src=""></script>
			var head = document.getElementsByTagName("head")[0];
			var script = document.createElement("script");
			script.src = s.url;
			if (s.scriptCharset)
				script.charset = s.scriptCharset;

			//如果datatype不是jsonp，但是url却是跨域的。采用scriptr的
			//onload或onreadystatechange事件来触发回调函数。
			if (!jsonp) {
				var done = false;

				// 对所有浏览器都加上处理器
				script.onload = script.onreadystatechange = function() {
					if (!done
							&& (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) {
						done = true;
						success();
						complete();
						head.removeChild(script);
					}
				};
			}

			head.appendChild(script);

			// 已经使用了script 元素注射来处理所有的事情
			return undefined;
		}

		var requestDone = false;

		// 创建request,IE7不能通过XMLHttpRequest来完成，只能通过ActiveXObject
		var xhr = window.ActiveXObject
				? new ActiveXObject("Microsoft.XMLHTTP")
				: new XMLHttpRequest();

		// Open the socket
		// Passing null username, generates a login popup on Opera (#2865)
		// 创建一个请求的连接，在opera中如果用户名为null会弹出login窗口中。
		if (s.username)
			xhr.open(type, s.url, s.async, s.username, s.password);
		else
			xhr.open(type, s.url, s.async);

		// try/catch是为防止FF3在跨域请求时报错
		try {
			// 设定Content-Type
			if (s.data)
				xhr.setRequestHeader("Content-Type", s.contentType);

			// 设定If-Modified-Since
			if (s.ifModified)
				xhr.setRequestHeader("If-Modified-Since",
						jQuery.lastModified[s.url]
								|| "Thu, 01 Jan 1970 00:00:00 GMT");

			// 这里是为了让服务器能判断这个请求是XMLHttpRequest
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

			// 设定 Accepts header 。指能接收的content-type，在服务器端设定
			xhr.setRequestHeader("Accept", s.dataType && s.accepts[s.dataType]
					? s.accepts[s.dataType] + ", */*"
					: s.accepts._default);
		} catch (e) {
		}

		//拦截方法，我们可以在send之前进行拦截。返回false就不send
		if (s.beforeSend && s.beforeSend(xhr, s) === false) {
			// 清除active 请求计数
			s.global && jQuery.active--;
			// close
			xhr.abort();
			return false;
		}

		// 触发全局的ajaxSend事件
		if (s.global)
			jQuery.event.trigger("ajaxSend", [xhr, s]);

		// 等待response返回，主要是为后面setInterval用。
		var onreadystatechange = function(isTimeout) {

			// 接收成功或请求超时
			if (!requestDone && xhr
					&& (xhr.readyState == 4 || isTimeout == "timeout")) {
				requestDone = true;
				
               //清除定时器
				if (ival) {
					clearInterval(ival);
					ival = null;
				}

				// 分析status:tiemout-->error-->notmodified-->success
				status = isTimeout == "timeout" ? "timeout" : !jQuery
						.httpSuccess(xhr) ? "error" : s.ifModified
						&& jQuery.httpNotModified(xhr, s.url)
						? "notmodified"
						: "success";
                 
				//如果success且返回了数据，那么分析这些数据
				if (status == "success") {					
					try {						
						data = jQuery.httpData(xhr, s.dataType, s);
					} catch (e) {
						status = "parsererror";
					}
				}

				// 分析数据成功之后,进行last-modified和success的处理。				
				if (status == "success") {
					// Cache Last-Modified header, if ifModified mode.
					var modRes;
					try {
						modRes = xhr.getResponseHeader("Last-Modified");
					} catch (e) {
						//FF中如果head取不到，会抛出异常
					} 
					//保存last-mordified的标识。
					if (s.ifModified && modRes)
						jQuery.lastModified[s.url] = modRes;

					// JSONP 有自己的callback
					if (!jsonp)
						success();
				} else
					// 失败时的处理
					jQuery.handleError(s, xhr, status);

				// 无论如何都进行cpmplate.timeout和接收成功
				complete();

				// 防内存泄漏
				if (s.async)
					xhr = null;
			}
		};

		if (s.async) {
			// 这里是采用poll的方式，不是push的方式
			//这里为什么不采用onreadystatechange？
			var ival = setInterval(onreadystatechange, 13);

			//如果过了timeout还没有请求到，会中断请求的。
			if (s.timeout > 0)
				setTimeout(function() {					
						if (xhr) {							
							xhr.abort();

							if (!requestDone)
								onreadystatechange("timeout");
						}
					}, s.timeout);
		}

		// 发送
		try {
			xhr.send(s.data);
		} catch (e) {
			jQuery.handleError(s, xhr, null, e);
		}

		// firefox 1.5 doesn't fire statechange for sync requests
		if (!s.async)
			onreadystatechange();

		function success() {
			// 调用构建请求对象时指定的success回调。
			if (s.success)
				s.success(data, status);

			// 执行全局的回调
			if (s.global)
				jQuery.event.trigger("ajaxSuccess", [xhr, s]);
		}

		function complete() {
			// 本地的回调
			if (s.complete)
				s.complete(xhr, status);

			// 执行全局的回调
			if (s.global)
				jQuery.event.trigger("ajaxComplete", [xhr, s]);

			// 全局的ajax计数器
			if (s.global && !--jQuery.active)
				jQuery.event.trigger("ajaxStop");
		}

		// return XMLHttpRequest便进行about()或其它操作.
		return xhr;
	},

	handleError : function(s, xhr, status, e) {
		// 本地的回调
		if (s.error)
			s.error(xhr, status, e);

		// 执行全局的回调
		if (s.global)
			jQuery.event.trigger("ajaxError", [xhr, s, e]);
	},

	// 激活查询的个数
	active : 0,


	// 判断XMLHttpRequest是否成功
	httpSuccess : function(xhr) {
		try {
			//204——请求收到，但返回信息为空IE有点会返回1223见 #1450
			//如果是地址栏中的地址是file的协议，status永远是0.
			//304--没有修改 ，safari=undefined是没有修改
			return !xhr.status && location.protocol == "file:"
					|| (xhr.status >= 200 && xhr.status < 300)
					|| xhr.status == 304 || xhr.status == 1223
					|| jQuery.browser.safari && xhr.status == undefined;
		} catch (e) {
		}
		return false;
	},

	// 判断XMLHttpRequest是否返回没有修改（304）
	httpNotModified : function(xhr, url) {
		try {
			var xhrRes = xhr.getResponseHeader("Last-Modified");

			// Firefox 永远返回 200.检测 Last-Modified 数据
			return xhr.status == 304 || xhrRes == jQuery.lastModified[url]
					|| jQuery.browser.safari && xhr.status == undefined;
		} catch (e) {
		}
		return false;
	},
    //处理请求返回的数据
	httpData : function(xhr, type, s) {
		var ct = xhr.getResponseHeader("content-type"), 
		    xml = type == "xml"	|| !type && ct && ct.indexOf("xml") >= 0, 
		    data = xml? xhr.responseXML	: xhr.responseText;

		if (xml && data.documentElement.tagName == "parsererror")
			throw "parsererror";

		
		//允许一个pre-filtering函数清洁repsonse		
		if (s && s.dataFilter)
			data = s.dataFilter(data, type);
		
			//script时，就运行
		if (type == "script")
			jQuery.globalEval(data);

		//json，生成json对象。
		if (type == "json")
			data = eval("(" + data + ")");

		return data;
	},

	// 串行化form子元素组成的数组或对象形式查询字符串
	param : function(a) {
		var s = [];

		function add(key, value) {
			s[s.length] = encodeURIComponent(key) + '='
					+ encodeURIComponent(value);
		};

		// 对于数组的参数，每个元素({name:xx,value:yy})都串行化为key/value的字符串。
		if (a.constructor == Array || a.jquery)
			jQuery.each(a, function() {
				add(this.name, this.value);
			});
		// 对于对象{a1:{name:xx,value:yy},a2:{name:xx,value:yy}}
		// 都串行化为key/value的字符串。
		else
			for (var j in a)
				// value是数组，key 名字要重复
				if (a[j] && a[j].constructor == Array)
					jQuery.each(a[j], function() {
						add(j, this);
					});
				else
					add(j, jQuery.isFunction(a[j]) ? a[j]() : a[j]);

		// 返回生成字符串
		return s.join("&").replace(/%20/g, "+");
	}

});
