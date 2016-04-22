/**
 * author:prk
 * date:2008-08-04
 * comment:comment for selector of jQuery
 * 
 */
var chars = jQuery.browser.safari && parseInt(jQuery.browser.version) < 417
		? "(?:[\\w*_-]|\\\\.)"
		: "(?:[\\w\u0128-\uFFFF*_-]|\\\\.)", quickChild = new RegExp("^>\\s*("
		+ chars + "+)"), 
		quickID = new RegExp("^(" + chars + "+)(#)(" + chars
		+ "+)"), // ^((?:[\\w*_-]|\\\\.))(#)((?:[\\w*_-]|\\\\.))
quickClass = new RegExp("^([#.]?)(" + chars + "*)");// ^([#.]?)((?:[\\w*_-]|\\\\.)*)

jQuery.extend( {
	expr : {
		"" : function(a, i, m) {
			return m[2] == "*" || jQuery.nodeName(a, m[2]);
		},
		"#" : function(a, i, m) {
			return a.getAttribute("id") == m[2];
		},
		":" : {
			// Position Checks
		lt : function(a, i, m) {
			return i < m[3] - 0;
		},
		gt : function(a, i, m) {
			return i > m[3] - 0;
		},
		nth : function(a, i, m) {
			return m[3] - 0 == i;
		},
		eq : function(a, i, m) {
			return m[3] - 0 == i;
		},
		first : function(a, i) {
			return i == 0;
		},
		last : function(a, i, m, r) {
			return i == r.length - 1;
		},
		even : function(a, i) {
			return i % 2 == 0;
		},
		odd : function(a, i) {
			return i % 2;
		},

		// Child Checks
		"first-child" : function(a) {
			return a.parentNode.getElementsByTagName("*")[0] == a;
		},
		"last-child" : function(a) {
			return jQuery.nth(a.parentNode.lastChild, 1, "previousSibling") == a;
		},
		"only-child" : function(a) {
			return !jQuery.nth(a.parentNode.lastChild, 2, "previousSibling");
		},

		// Parent Checks
		parent : function(a) {
			return a.firstChild;
		},
		empty : function(a) {
			return !a.firstChild;
		},

		// Text Check
		contains : function(a, i, m) {
			return (a.textContent || a.innerText || jQuery(a).text() || "")
					.indexOf(m[3]) >= 0;
		},

		// Visibility
		visible : function(a) {
			return "hidden" != a.type && jQuery.css(a, "display") != "none"
					&& jQuery.css(a, "visibility") != "hidden";
		},
		hidden : function(a) {
			return "hidden" == a.type || jQuery.css(a, "display") == "none"
					|| jQuery.css(a, "visibility") == "hidden";
		},

		// Form attributes
		enabled : function(a) {
			return !a.disabled;
		},
		disabled : function(a) {
			return a.disabled;
		},
		checked : function(a) {
			return a.checked;
		},
		selected : function(a) {
			return a.selected || jQuery.attr(a, "selected");
		},

		// Form elements
		text : function(a) {
			return "text" == a.type;
		},
		radio : function(a) {
			return "radio" == a.type;
		},
		checkbox : function(a) {
			return "checkbox" == a.type;
		},
		file : function(a) {
			return "file" == a.type;
		},
		password : function(a) {
			return "password" == a.type;
		},
		submit : function(a) {
			return "submit" == a.type;
		},
		image : function(a) {
			return "image" == a.type;
		},
		reset : function(a) {
			return "reset" == a.type;
		},
		button : function(a) {
			return "button" == a.type || jQuery.nodeName(a, "button");
		},
		input : function(a) {
			return /input|select|textarea|button/i.test(a.nodeName);
		},

		// :has()
		has : function(a, i, m) {
			return jQuery.find(m[3], a).length;
		},

		// :header
		header : function(a) {
			return /h\d/i.test(a.nodeName);
		},

		// :animated
		animated : function(a) {
			return jQuery.grep(jQuery.timers, function(fn) {
				return a == fn.elem;
			}).length;
		}
	}
},

// The regular expressions that power the parsing engine
parse : [
// Match: [@value='test'], [@foo]
		/^(\[) *@?([\w:-]+) *([!*$^~=]*) *('?"?)(.*?)\4 *\]/,

		// Match: :contains('foo')
		/^(:)([\w-]+)\("?'?(.*?(\(.*?\))?[^(]*?)"?'?\)/,

		// Match: :even, :last-child, #id, .class
		new RegExp("^([:.#]*)(" + chars + "+)")],

multiFilter : function(expr, elems, not) {
	var old, cur = [];

	while (expr && expr != old) {// 存在且改变
		old = expr;
		var f = jQuery.filter(expr, elems, not);
		expr = f.t.replace(/^\s*,\s*/, "");
		cur = not ? elems = f.r : jQuery.merge(cur, f.r);
	}

	return cur;
},

find : function(t, context) {
	if (typeof t != "string")
		return [t];// 快速处理非字符表达式
	if (context && context.nodeType != 1 && context.nodeType != 9)
		return [];// 确保context是DOM元素或document
	context = context || document;// 缺省的context
	// 初始化，ret:result, done:已经完成，last:上一次的t,nodeName:节点名，如p
	var ret = [context], done = [], last, nodeName;
  
	//这里就是把复合选择器的字符串从左到右取最小单元的选择进行分析操作
	//分析操作完之后就这个分析过的字符串部分给删除，
	//然后循环分析接下来的剩余的部分。直到字符串为空。
	//这里的最小单元指如#id,~F(+F,>F),.class,[id='xx'],F,:last()之类
	while (t && last != t) {// t存在，且变化
		var r = []; // ret的tempValue
		last = t; // last:上一次的t
		t = jQuery.trim(t);// 去首尾空格

		var foundToken = false, re = quickChild, // 以>开头的regexp
		m = re.exec(t);
		
       //这一部分处理了>,+,~的元素选择器。当然有的后代，有的兄弟选择的。
		if (m) {// 首先判断是不是以>开头，因为每次处理都处理都删除分析过的字符串部分 1
			//这里可以看作是>作为找到tagName元素的子节点们的标记
			nodeName = m[1].toUpperCase();//tagName

			//在结果集中（第一次是默认是给定的context）找到满足的tagName元素的所有子节点。
			//两个循环，第一是对结果集中每个元素进行，第二个是对每个元素中每个子元素节点。
			//找到结果集中所有的元素的所有子元素的集合。
			for (var i = 0;ret[i]; i++)
				for (var c = ret[i].firstChild;c; c = c.nextSibling)
					if (c.nodeType == 1
							&& (nodeName == "*" || c.nodeName.toUpperCase() == nodeName))
						r.push(c);

			ret = r; // 现在找到的所有元素都是结果集
			t = t.replace(re, "");// remove已经处理过的字符串部分
			
			//对于E （F，>F,+F etc)的形式，这里跳过后面的代码又回到while处执行。
			//但是在while处之后会把这个空格去掉。好像没有进行操作。这里变化了是ret。
			//无论后面是怎样的最小单元选择器，都是要根据这个个ret中的元素来进行操作。
			//如果是tagName，那么就是转4处执行ret[i].getElementsByTagName().
			//如果是>tagName,就执行1处的代码，其它的省略，
			//可见每个最小单元之后都可以是任意的空格分隔。			
			if (t.indexOf(" ") == 0)continue;
			
			foundToken = true;// 找到标识

		} else {// 第二判断是不是以+~开头                 2
			re = /^([>+~])\s*(\w*)/i;
			if ((m = re.exec(t)) != null) {// 以+~开头的
				r = [];
				var merge = {};
				nodeName = m[2].toUpperCase();// 节点名
				m = m[1];// 符号，如+，~
				// 如果selector字符串的匹配+或~（子元素），在结果集中所有元素中找到其兄弟元素节点。
				//不同的+找的是后续的第一个兄弟元素，而~是找到所有的后续的兄弟元素节点。
				//之后把找到的所有的元素放到结果集合中。
				for (var j = 0, rl = ret.length;j < rl; j++) {
					// 把~和+的操作统一在一起进行处理
					var n = (m == "~" || m == "+"
							? ret[j].nextSibling: ret[j].firstChild);
					for (;n; n = n.nextSibling)
						if (n.nodeType == 1) {// 保证节点是元素类型
							var id = jQuery.data(n);// 为n元素生成全局唯一的id

							if (m == "~" && merge[id])// 保证ret中元素不重复
								break;// nextSibling会循环到第一个节点？
							if (!nodeName|| n.nodeName.toUpperCase() == nodeName) {
								if (m == "~")// 找到元素保存起来
									merge[id] = true;
								r.push(n);
							}
							if (m == "+")// 直接后续兄弟节点，只进行一次操作。
								break;
						}
				}

				ret = r;// 找到的所有的元素放到结果集合中。
				t = jQuery.trim(t.replace(re, ""));
				foundToken = true;
			}
		}
       
		//// 不是以>~+开头的或者说除去已经分析过的字符，接下来的字符是不是>~+开头
		if (t && !foundToken) {
			//这里的意思是在开始的位置找到,号，说明一个selector已经完成了，那么
			//结果集就要存到已经完成的集合中。结果集也应该初如化。
			if (!t.indexOf(",")) {               
				//说明运行到这里的时候，还是单个selector的字符串分析是刚刚开始
			    //因为>~+不可能得到ret[0]元素等于元素的自身。如果等于的话，
				//那就清除出ret,因为接下来就要把ret结果集中的元素存入done中
				if (context == ret[0])
					ret.shift();
					
				done = jQuery.merge(done, ret);// ret的其它元素放入done
				r = ret = [context];// 重新初始化
				//把,采用空格代替。
				t = " " + t.substr(1, t.length);
			} else {
				// 说明这一个selector部分还没有完成，同时还没有找到元素
				 // 或者是 >F的后面用空格来分隔。				
				 //* qId:^((?:[\w*_-]|\.)+)(#)((?:[\w*_-]|\.)+)
				// * qclass:^([#.]?)((?:[\\w*_-]|\.)*)				
				var re2 = quickID;// 如(.)nodeName#idName
				var m = re2.exec(t);// 找到第一个相配的

				if (m) {
					m = [0, m[2], m[3], m[1]];// m=[0,#,idName,nodeName]
				} else {
					re2 = quickClass;// #nodeName,.className
					m = re2.exec(t);// m=[all,#,idName]
				}

				m[2] = m[2].replace(/\\/g, "");// 去除转义字符
				
				//取数组的最后一个元素，其实就是为了取到是不是为document,
				//因为只有document才有getElementById，为什么不直接采用
				//document呢？难道document的查找会比先根据element.
				//getElementsByTagName找到元素下面的tagname的相符的
				//集合然后采用id属性去判断对比来得更慢吗？不一定？对于大的Dom树，
				//而element的范围又很小的话，可能会慢一些。
				//不过由于这里还要通过属性选择器来进行验证进行验证，一般来说	
				//element.getElementsByTagName会快一点。
				var elem = ret[ret.length - 1];			
				if (m[1] == "#" && elem && elem.getElementById
						&& !jQuery.isXMLDoc(elem)) {
					var oid = elem.getElementById(m[2]);

					// 回测元素的ID的确存在，在IE中会取name属性的值，同时在form 元素中
					// 会选中在form中元素的name属性为id的元素。
					if ((jQuery.browser.msie || jQuery.browser.opera) && oid
							&& typeof oid.id == "string" && oid.id != m[2])
						//通过属性选择器来进行验证。	
						oid = jQuery('[@id="' + m[2] + '"]', elem)[0];

					// 回测元素的node Name是否相同，如div#foo,可以提交效率
					ret = r = oid && (!m[3] || jQuery.nodeName(oid, m[3]))
							? [oid]	: [];
				} else {
					//这里处理了#id,.class tagName,div#id四种形式
					//这里我们还可以看出E F形式。并没有特殊的处理。就是采用了
					//E.getElementsByTagName(F)就可以了。
					//这个就能取后元素的所有后代为F和F的元素节点。
					//和F使用是统一的起来。因为E都是结果集。
					for (var i = 0;ret[i]; i++) {
						//因为m有两种情况：[0,#,idName,nodeName]、[all,#/.,idName/class/tagName]
						//这里就是根据这两种情况来取得tagName，m[1] == "#" && m[3]
						//为真，说明是第一种，取nodeName。如果m[1] == "#" && m[3]为假
						//说明m[1] <> "#"||!m[3],而m[1] != ""说明只能是第二个数组中的.或#
						//说明了对于#nodeName,.className采用element.getElementsByTagName(*).
						//当m[1] == ""，说明是一个E 元素选择器，它不带任何的前缀。如：p。这个时候
						//m[2]是tagName.
						//m[0] == "" ，只能指第二个数组中的。它=="",说明没有找到符合qclass的regExp.
						//其它的情况都不会为"",它为"",!m[1],!m[2]也都为true.						
						var tag = (m[1] == "#" && m[3] ? m[3] : (m[1] != ""
								|| m[0] == "" ? "*" : m[2]));// 分情况取tagName
                       
						//*的情况下，对于object标签转换为param标签进行操作。
						if (tag == "*"&& ret[i].nodeName.toLowerCase() == "object")
							tag = "param";// Handle IE7 being really dumb about <object>s
							
                        //把结果集合中第一个元素的getElementsByTagName存入到临时的结果集中。
						r = jQuery.merge(r, ret[i].getElementsByTagName(tag));
					}
                    
					//class选择器的话，就根据class属性在找到结果集合中过滤
					if (m[1] == ".") 
						r = jQuery.classFilter(r, m[2]);
                     
					//id选择器的话，就根据id属性在找到结果集合中过滤
					if (m[1] == "#") {
						var tmp = [];
						for (var i = 0;r[i]; i++)
							if (r[i].getAttribute("id") == m[2]) {
								tmp = [r[i]];
								break;
							}

						r = tmp;
					}

					ret = r;
				}

				t = t.replace(re2, "");
			}

		}

		//这个时候已经找到结果的集合，对于如CSS Selector为:hidden的属性筛选器，
		//它的集合就是context的下面的所有元素节点。也就是说上面的
		//代码无论如何都能找到元素的集合。这个集合可能是>/+~ F
		//或#id,.class tagName,div#id，对于不满足这些条件的，就采用
		//context.getElementsByTagName(*)要取得其下所有的元素
		//确保接下来的过滤（筛选）
		if (t) {// 根据余下的selector，对找到的r集合中的元素进行过滤
			var val = jQuery.filter(t, r);
			ret = r = val.r;
			t = jQuery.trim(val.t);// 去首尾空格
		}
	}
   
	//如果还会有t存在说明一个问题：last == t
	//也就是上一次的过程中没有进行成功的解析一个最小单元的选择器
	//原因是输入的 t 字符串有语法上的错误。如果是采用,分隔的多选择器
	//那么就是当前及之后的选择器不分析。完成的done就是之前的结果集。
	//觉得这样处理不好，很多时间我们都会写错CSS selectror,不报错，
	//对于调试发现问题特难。	
	if (t)	ret = [];

	//出现这种情况说明运行到这里的时候，还是单个selector的字符串分析是刚刚开始
	//如果等于的话，那就清除出ret,因为接下来就要把ret结果集中的元素存入done中
	if (ret && context == ret[0])
		ret.shift();// 去掉根上下文

	done = jQuery.merge(done, ret);// 合并

	return done;
},
// 找到r中element中的className中含有m 或不含有的所有的元素
classFilter : function(r, m, not) {
	m = " " + m + " ";
	var tmp = [];
	for (var i = 0;r[i]; i++) {
		var pass = (" " + r[i].className + " ").indexOf(m) >= 0;
		if (!not && pass || not && !pass)
			tmp.push(r[i]);
	}
	return tmp;
},

//根据CSS selector表达式查找集合中满足该表达式的所有元素
//还可以根据not来指定不满足CSS selector表达式元素集
filter : function(t, r, not) {
	var last;

	while (t && t != last) {// t存在，且改变
		last = t;
		// Match: [@value='test'], [@foo]
		// 1、^(\[) *@?([\w:-]+) *([!*$^~=]*) *('?"?)(.*?)\4 *\]/,

		// Match: :contains('foo')
		// 2、^(:)([\w-]+)\("?'?(.*?(\(.*?\))?[^(]*?)"?'?\)/,

		// Match: :even, :last-child, #id, .class
		// 3、new RegExp("^([:.#]*)(" + chars + "+)")],		
		
		//这里可以看出我们直接调用filter的时候的selector如不是筛选器的话，
		//那就不进行筛选了，这里的selector语法如[@value='test'], [@foo]、
		//:contains('foo')，:even, :last-child, #id, .class的形式
		//可以是上面这几种形式的组合，但不能包括元素选择器。
		//而且复合的形式中间不能采用空格隔开，如[@value='test']#id.class可行的。
		var p = jQuery.parse, m;
		for (var i = 0;p[i]; i++) {// 找到与jQuery.parse中regexp相配的
			m = p[i].exec(t);
			if (m) {
				t = t.substring(m[0].length);//删除处理过的字符部分
				m[2] = m[2].replace(/\\/g, "");// 有可能会有没有转换的\去掉
				break;
			}
		}        
		// 与上面三种的regexp都不相配
		if (!m)	break;

		//处理 ：not(.class)的形式，返回集合中不包含.class的其它的元素
		if (m[1] == ":" && m[2] == "not")
			// 性能上优化 m[3]是.class经常出现
			r = isSimple.test(m[3])// isSimple = /^.[^:#\[\.]*$/
					? jQuery.filter(m[3], r, true).r: jQuery(r).not(m[3]);
					
		//处理.class的过滤。只要看看m[2]这个class是不是被集合中元素的class包含。
		else if (m[1] == ".")// 性能上优化考虑
			r = jQuery.classFilter(r, m[2], not);
			//处理属性过滤。如[@value='test']形式的属性选择
		else if (m[1] == "[") {
			var tmp = [], type = m[3];// 符号，如=

			for (var i = 0, rl = r.length;i < rl; i++) {
				//jQuery.props[m[2]]进行tag中属性名和对应的元素的属性名转换，
				//因为tag中属性名是元素中简写，z取到 元素的属性值
				var a = r[i], z = a[jQuery.props[m[2]] || m[2]];
                
				//直接取元素的属性值，没有取到，说明有的浏览器不支持这种方法
				//进一步尝试采用jQuery.attr来进行非标准的兼容取属性值。
				//就算是取到了值，但对于属性名为style|href|src|selected，
				//它们不能直接取值，要进行特殊的处理，这个在jQuery.attr进行。
				//其实这里可以直接采用jQuery.attr(a, m[2])，一步到位。
				if (z == null || /style|href|src|selected/.test(m[2]))
					z = jQuery.attr(a, m[2]) || '';// 几个特殊的处理

				//如果属性选择器满足这[foo],[foo=aa][foo!=aa][foo^=aa][foo$=aa][foo~=aa]
				//这几种方式之一，这个元素就可能通过。即满足条件。m[5]属性值。
				if (   (type == "" && !!z//[foo]
				        || type == "=" && z == m[5]//[foo=aa]
						|| type == "!=" && z != m[5]//[foo!=aa]
						|| type == "^=" && z&& !z.indexOf(m[5])//[foo^=aa]
						|| type == "$="	&& z.substr(z.length - m[5].length) == m[5]//[foo$=aa]
						|| (type == "*=" || type == "~=")&& z.indexOf(m[5]) >= 0//[foo~=aa]
						)
					^ not)
					tmp.push(a);
			}
			r = tmp;

		}
		//处理：nth-child（n+1）。其实这里也改变了结果集，
		//不过这里是采用的是间接引用的方式，只要知道元素就可以了，
		//不需要dom树去查找。因为它要解析参数中的表达式
		else if (m[1] == ":" && m[2] == "nth-child") {// 性能考量
			var merge = {}, tmp = [],
			// 分析：nth-child（n+1）中的参数，这里支持
			//'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'几种形式
			//test[1]="-或空"，test[2]="n前面的数或空"，test[3]="n后面的数或空"
			//这样把参数分成三个部分：1是负号的处理，2是xn中的x处理，3是n-x中-x的处理
			//3中的是带有符号的。也就是+或-。
			test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(m[3] == "even" && "2n"
					|| m[3] == "odd" && "2n+1" || !/\D/.test(m[3]) && "0n+"
					+ m[3] || m[3]),

			// 计算(first)n+(last)
			first = (test[1] + (test[2] || 1)) - 0, last = test[3] - 0;
            
			//找到符合(first)n+(last)表达式的所有子元素
			for (var i = 0, rl = r.length;i < rl; i++) {
				var node = r[i], parentNode = node.parentNode, 
				id = jQuery.data(parentNode);//为该元素parentNode分配了一个全局的id

				if (!merge[id]) {// 为元素的每个子节点标上顺序号，作了不重复标识
					var c = 1;
					for (var n = parentNode.firstChild;n; n = n.nextSibling)
						if (n.nodeType == 1)n.nodeIndex = c++;
					merge[id] = true;
				}

				var add = false;//初始化add的标记
                
				//常数的形式，如1，2等等，当然还要判断元素的序号和这个数是否相等。
				if (first == 0) {// 0不能作除数
					if (node.nodeIndex == last)
						add = true;
				}
				// 处理3n+2这种形式同时表达式要大于0
				//当前的子节点的序号要满足两个条件：
				//1、其序号进行first求余的结果=last.
				//2、其序号要大于last。对于-n的形式，要大于-last.
				else if ((node.nodeIndex - last) % first == 0
						&& (node.nodeIndex - last) / first >= 0)
					add = true;

				if (add ^ not)	tmp.push(node);
			}

			r = tmp;

		} 
		else {// 根据m[1]m[2]在Query.expr找到对应的处理函数
			var fn = jQuery.expr[m[1]];
			//支持一个符号（如：last）后的方法名与函数的对应
			if (typeof fn == "object")
				fn = fn[m[2]];
             
				//支持更简短的string来代替jQuery.expr中的funciton。
				//这里没有用到。
			if (typeof fn == "string")
				fn = eval("false||function(a,i){return " + fn + ";}");

			// 执行处理函数fn过滤。对于r中每个元素，如果fn返回的结果为true，保留下来。
			r = jQuery.grep(r, function(elem, i) {
				return fn(elem, i, m, r);
			}, not);
		}
	}

	// Return an array of filtered elements (r)
	// and the modified expression string (t)
	return {
		r : r,
		t : t
	};
},

//递归取得dir，如，parentNode
dir : function(elem, dir) {
	var matched = [], cur = elem[dir];
	while (cur && cur != document) {
		if (cur.nodeType == 1)
			matched.push(cur);
		cur = cur[dir];
	}
	return matched;
},
// dir：nextSibling result:deep cur:current. elem :no use
nth : function(cur, result, dir, elem) {
	result = result || 1;
	var num = 0;

	for (;cur; cur = cur[dir])
		if (cur.nodeType == 1 && ++num == result)
			break;

	return cur;
},

// 从包含n元素开始的所有后续兄弟，但不包含elem。
sibling : function(n, elem) {
	var r = [];

	for (;n; n = n.nextSibling) {
		if (n.nodeType == 1 && n != elem)
			r.push(n);
	}

	return r;
}
});
