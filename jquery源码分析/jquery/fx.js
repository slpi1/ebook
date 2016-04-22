/*
 * author：prk date:2008-08-07 comment:analyse the fx of jQuery.
 * 
 */
jQuery.fn.extend({
	
	// show(speed,[callback])
	// 以优雅的动画隐藏所有匹配的元素，并在显示完成后可选地触发一个回调函数。
    // 可以根据指定的速度动态地改变每个匹配元素的高度、宽度和不透明度。
	// 显示隐藏的匹配元素 show()
	show: function(speed,callback){
		return speed ?
			this.animate({
				height: "show", width: "show", opacity: "show"
			}, speed, callback) :

			this.filter(":hidden").each(function(){
				this.style.display = this.oldblock || "";
				if ( jQuery.css(this,"display") == "none" ) {
					var elem = jQuery("<" + this.tagName + " />").appendTo("body");
					this.style.display = elem.css("display");// 默认的显示的display
					// handle an edge condition where css is - div {
					// display:none; } or similar
					if (this.style.display == "none")// 处理显式地设定了该tag不显示，只好采用b
						this.style.display = "block";
					elem.remove();// 上面这些的处理有没有必要呢？
				}
			}).end();// 回到前一个jQuery对象
	},
	
    // 与show相反
	hide: function(speed,callback){
		return speed ?
			this.animate({
				height: "hide", width: "hide", opacity: "hide"
			}, speed, callback) :

			this.filter(":visible").each(function(){
				this.oldblock = this.oldblock || jQuery.css(this,"display");
				this.style.display = "none";
			}).end();
	},

	// Save the old toggle function
	_toggle: jQuery.fn.toggle,
     
	// 切换元素的可见状态。
    // 如果元素是可见的，切换为隐藏的；如果元素是隐藏的，切换为可见的。
	
	// 每次点击后依次调用函数。
    // 如果点击了一个匹配的元素，则触发指定的第一个函数，当再次点击同一元素时，则触发指定的第二个函数，
    // 如果有更多函数，则再次触发，直到最后一个。随后的每次点击都重复对这几个函数的轮番调用。
    // 可以使用unbind("click")来删除。
	toggle: function( fn, fn2 ){
		return jQuery.isFunction(fn) && jQuery.isFunction(fn2) ?
			this._toggle.apply( this, arguments ) :// 原来的toggle
			(fn ?
			   this.animate({height: "toggle", width: "toggle", opacity: "toggle"}, fn, fn2)
			:  this.each(function(){jQuery(this)[ jQuery(this).is(":hidden") ? "show" : "hide" ]();}
			// 对每个元素都调用show,或hide函数。
			)
		);
	},

	// 把所有匹配元素的不透明度以渐进方式调整到指定的不透明度，并在动画完成后可选地触发一个回调函数。
     // 这个动画只调整元素的不透明度，也就是说所有匹配的元素的高度和宽度不会发生变化。
	fadeTo: function(speed,to,callback){
		return this.animate({opacity: to}, speed, callback);
	},
	
	/**
	 * 用于创建自定义动画的函数。
	 * 这个函数的关键在于指定动画形式及结果样式属性对象。这个对象中每个属性都表示一个可以变化的样式属性（如“height”、“top”或“opacity”）。
	 * 注意：所有指定的属性必须用骆驼形式，比如用marginLeft代替margin-left.
	 * 而每个属性的值表示这个样式属性到多少时动画结束。如果是一个数值，样式属性就会从当前的值渐变到指定的值。如果使用的是“hide”、“show”或“toggle”这样的字符串值，则会为该属性调用默认的动画形式。
	 * 在 jQuery 1.2 中，你可以使用 em 和 % 单位。另外，在 jQuery 1.2 中，你可以通过在属性值前面指定 "+=" 或
	 * "-=" 来让元素做相对运动。
	 * 
	 * params (Options) : 一组包含作为动画属性和终值的样式属性和及其值的集合 。 duration (String,Number)
	 * :(可选) 三种预定速度之一的字符串("slow", "normal", or "fast")或表示动画时长的毫秒数值(如：1000)
	 * easing (String) : (可选) 要使用的擦除效果的名称(需要插件支持).默认jQuery提供"linear" 和 "swing".
	 * callback (Function) : (可选) 在动画完成时执行的函数
	 */
	animate: function( prop, speed, easing, callback ) {
		var optall = jQuery.speed(speed, easing, callback);

		return this[ optall.queue === false ? "each" : "queue" ](function(){// 执行each或queue方法
			var opt = jQuery.extend({}, optall), p,
				hidden = this.nodeType == 1 && jQuery(this).is(":hidden"),// 是元素节点且是隐藏的
				self = this;// 当前的元素
	
			for ( p in prop ) {
				//如果是完成的状态，就直接调用complate函数
				if ( prop[p] == "hide" && hidden || prop[p] == "show" && !hidden )// 已经是
					return opt.complete.call(this);//，在用户的callback加上队列的处理

				if ( ( p == "height" || p == "width" ) && this.style ) {// style中高度，宽度
					opt.display = jQuery.css(this, "display");// 保存当前元素的display
					opt.overflow = this.style.overflow;// 保证没有暗中进行的
				}
			}
			if ( opt.overflow != null )// 超出部分不见
				this.style.overflow = "hidden";

			opt.curAnim = jQuery.extend({}, prop);//clone传入的参数prop
   
			jQuery.each( prop, function(name, val){// 对当前元素的给定的属性进行变化的操作
				var e = new jQuery.fx( self, opt, name );
                
				if ( /toggle|show|hide/.test(val) )// 传参的属性可以用toggle，show，hide，其它
				// 调用当前e.show,e.hide,e.val的方法，jQuery.fx.prototype
					e[ val == "toggle" ? hidden ? "show" : "hide" : val ]( prop );					
				else {// 支持"+=" 或 "-=" 来让元素做相对运动。
					var parts = val.toString().match(/^([+-]=)?([\d+-.]+)(.*)$/),
						start = e.cur(true) || 0;// 当前元素当前属性的值
                      // +=" 或 "-=" 来让元素做相对运动。
					if ( parts ) {
						var end = parseFloat(parts[2]),// 值
							unit = parts[3] || "px";// 单位
						
						if ( unit != "px" ) {// 计算开始的值=(end/cur)*start
							self.style[ name ] = (end || 1) + unit;
							start = ((end || 1) / e.cur(true)) * start;
							self.style[ name ] = start + unit;
						}

						if ( parts[1] )// +=/-=,做相对运行
							end = ((parts[1] == "-=" ? -1 : 1) * end) + start;

						e.custom( start, end, unit );// 动画
					} 
					//直接计算start和end的位置来动画。val是数值的end,start当前的属性值。
					else
						e.custom( start, val, "" );// 动画
				}
			});
			// For JS strict compliance
			return true;
		});
	},

	// 实现队列操作，为jQuery对象中的每个元素都加type的属性，值为fn.
	queue: function(type, fn){
		// 可能看出支持一个参数的fn或array形式的集合其type为默认的fx的形式。
		if ( jQuery.isFunction(type) || ( type && type.constructor == Array )) {
			fn = type;
			type = "fx";
		}
		// type不存在,空字符等，无参数，type:string,fn不存在。肯定不是函数，也不是数组
		if ( !type || (typeof type == "string" && !fn) )
			return queue( this[0], type );//从queue取出

		return this.each(function(){
			//fn是数组的形式fn集合，直接构建queue
			if ( fn.constructor == Array )// 数组的形式
				queue(this, type, fn);// 存储在元素的type属性中
			  //取得queue,后push，只有一个立即运行。
			else {
				queue(this, type).push( fn );
				if ( queue(this, type).length == 1 )
					fn.call(this);
			}
		});
	},

	stop: function(clearQueue, gotoEnd){
		var timers = jQuery.timers;

		if (clearQueue)
			this.queue([]);// 清除

		this.each(function(){
			//倒序是为了能把在loop过程加入timers的当前元素的属性的动画step也给删除。
			for ( var i = timers.length - 1; i >= 0; i-- )
				if ( timers[i].elem == this ) {
					if (gotoEnd) timers[i](true);
						// 强迫动画结束						
					timers.splice(i, 1);
				}
		});
		// start the next in the queue if the last step wasn't forced
		if (!gotoEnd)
			this.dequeue();

		return this;
	}

});

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: { height:"show" },
	slideUp: { height: "hide" },
	slideToggle: { height: "toggle" },
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" }
}, function( name, props ){
	jQuery.fn[ name ] = function( speed, callback ){
		return this.animate( props, speed, callback );
	};
});

// 为元素加上type的array的属性，或返回取到elem上type的值
var queue = function( elem, type, array ) {
	if ( elem ){
		type = type || "fx";
		var q = jQuery.data( elem, type + "queue" );
		if ( !q || array )
			q = jQuery.data( elem, type + "queue", jQuery.makeArray(array) );
	}
	return q;
};
// 出列，根据type
jQuery.fn.dequeue = function(type){
	type = type || "fx";
	return this.each(function(){
		var q = queue(this, type);// 得取type的的值
		q.shift();// 移出一个
		if ( q.length )
			q[0].call( this );
	});
};


jQuery.extend({
     // 主要用于辅助性的工作
	speed: function(speed, easing, fn) {
		var opt = speed && speed.constructor == Object ? speed : {// 采用紧凑型方式
			complete: fn || !fn && easing ||
				jQuery.isFunction( speed ) && speed,// coplete是至多三个参数的最后一个，当然是Fn.
			duration: speed,// 持继的时间
			easing: fn && easing || easing && easing.constructor != Function && easing// 不是Fn
		};

		opt.duration = (opt.duration && (opt.duration.constructor == Number ?
			opt.duration :	jQuery.fx.speeds[opt.duration])) // 存在，不是数值，转找
			|| jQuery.fx.speeds._default;// 默认的

		// Queueing
		opt.old = opt.complete;
		opt.complete = function(){// 排队的处理
			if ( opt.queue !== false )//可能通过参数指定queue
				jQuery(this).dequeue();//出queue
			if ( jQuery.isFunction( opt.old ) )
				opt.old.call( this );//执行完成之后的回调
		};

		return opt;
	},

	// 擦除效果
	easing: {
		linear: function( p, n, firstNum, diff ) {
			return firstNum + diff * p;
		},
		swing: function( p, n, firstNum, diff ) {
			return ((-Math.cos(p*Math.PI)/2) + 0.5) * diff + firstNum;
		}
	},

	timers: [],// jQuery.timers
	timerId: null,
    
	// 根据参数构成一个对象
	fx: function( elem, options, prop ){
		this.options = options;
		this.elem = elem;
		this.prop = prop;

		if ( !options.orig )
			options.orig = {};
	}

});

jQuery.fx.prototype = {

	// 为元素设值，更新显示
	update: function(){
		//可以在显示之前进行自定义的显示操作
		//这里可以是改变this.now或元素的其它属性。
		//改变this.now是改变动画的轨迹，改变其它的属性会有更多的效果
		if ( this.options.step )
			this.options.step.call( this.elem, this.now, this );
         //根据this.now来改变/设值当前属性的值。也就改变了样式。
		(jQuery.fx.step[this.prop] || jQuery.fx.step._default)( this );

		// 对于高度和宽度，肯定是要能看出效果的，故采用display=block。
		if ( ( this.prop == "height" || this.prop == "width" ) && this.elem.style )
			this.elem.style.display = "block";
	},

	// 当前元素当前属性的值
	cur: function(force){
		if ( this.elem[this.prop] != null && (!this.elem.style || this.elem.style[this.prop] == null) )
			return this.elem[ this.prop ];

		var r = parseFloat(jQuery.css(this.elem, this.prop, force));
		return r && r > -10000 ? r : parseFloat(jQuery.curCSS(this.elem, this.prop)) || 0;
	},

	// 开动一个动画
	custom: function(from, to, unit){
		this.startTime = now();//动画开始的时候
		this.start = from;//位置开始点
		this.end = to;//位置结果点
		this.unit = unit || this.unit || "px";
		this.now = this.start;//位置当前点
		//state是时间间隔在总的duration的比率
		//pos是按一定算法把时间上的比率折算到位置上的比率
		this.pos = this.state = 0;
		//根据this.now位置当前点的值来设定元素的属性显示出来
		this.update();

		var self = this;
		function t(gotoEnd){
			return self.step(gotoEnd);// 调用step(gotoEnd)//本对象的
		}
		t.elem = this.elem;//删除的时候做判断用
		//timers栈是公共的，不同的元素的不同的属性step都是放在这里面。
		jQuery.timers.push(t);
         
		if ( jQuery.timerId == null ) {
			jQuery.timerId = setInterval(function(){
				var timers = jQuery.timers;
				//倒是觉得这里会有同步冲突的问题。Ext.observable中就有解决方法
				for ( var i = 0; i < timers.length; i++ )// 执行timers中所有
				  
				//当一个属性的动画完成，或强迫完成的时候，把step从数组中删除.
				//同时把i的位置不改变。继续下一个。
				if ( !timers[i]() )					
						timers.splice(i--, 1);						
                  
				  //说明还有属性的动画没有完成，step还在timers中。
				  //那么就不clearInterval，13ms之后再继续。直到数组
				  //中所有的step都被删除。
				if ( !timers.length ) {
					clearInterval( jQuery.timerId );
					jQuery.timerId = null;
				}
			}, 13);
		}
	},

	// Simple 'show' function
	show: function(){
		// 保存当前的，以被修改之后能得到初始的值
		this.options.orig[this.prop] = jQuery.attr( this.elem.style, this.prop );
		this.options.show = true;//标明是进行show操作
		
		this.custom(0, this.cur());
		
		//让最开始时以1px的宽或高度来显示。防止内容flash
		if ( this.prop == "width" || this.prop == "height" )
			this.elem.style[this.prop] = "1px";		
		jQuery(this.elem).show();
	},

	// 隐藏
	hide: function(){
		// 保存当前的，以被修改之后能得到初始的值
		this.options.orig[this.prop] = jQuery.attr( this.elem.style, this.prop );
		this.options.hide = true;//标识是进行hide操作
		
		this.custom(this.cur(), 0);
	},

	// 动画的每一个步骤
	step: function(gotoEnd){
		var t = now();//运行到当前的时间，因为是13ms才运行一次。
         // 强行指定结束或当前时间大于startTime+duration
		if ( gotoEnd || t > this.options.duration + this.startTime ) {
			this.now = this.end;//当前的位置为结束位置
			this.pos = this.state = 1;//当前的state,pos的比率为1.最大。
			this.update();//显示
            //标识这个属性的动画已经完成
			this.options.curAnim[ this.prop ] = true;
            //再一次判断是否完成
			var done = true;
			for ( var i in this.options.curAnim )
				if ( this.options.curAnim[i] !== true )
					done = false;

			if ( done ) {				
				if ( this.options.display != null ) {//  恢复overflow
					this.elem.style.overflow = this.options.overflow;
					// 恢复 display
					this.elem.style.display = this.options.display;
					//判断其是否恢复成功，
					if ( jQuery.css(this.elem, "display") == "none" )
						this.elem.style.display = "block";
				}

				//如果是hide的操作
				if ( this.options.hide )
					this.elem.style.display = "none";
				
					//如果元素已经show或hide,恢复其动画改变的属性
				if ( this.options.hide || this.options.show )
					for ( var p in this.options.curAnim )
						jQuery.attr(this.elem.style, p, this.options.orig[p]);
			}

			if ( done )// 运行complete的回调函数
				this.options.complete.call( this.elem );

			return false;
		} else {
			var n = t - this.startTime;//时间间隔
			this.state = n / this.options.duration;//时间间隔比率

			//根据时间间隔的比率再按一定的算法比率来计算当前的运动的位置点的比率。默认是swing的算法
			this.pos = jQuery.easing[this.options.easing || 
			(jQuery.easing.swing ? "swing" : "linear")](this.state, n, 0, 1, this.options.duration);
		    //当前的位置
			this.now = this.start + ((this.end - this.start) * this.pos);

			// 显示
			this.update();
		}

		return true;
	}

};

jQuery.extend( jQuery.fx, {
	// 动画的速度
	speeds:{
		slow: 600,
 		fast: 200,
 		// Default speed
 		_default: 400
	},
	
	// 为元素设值
	step: {
		opacity: function(fx){// 为元素CSS设opacity为fx
			jQuery.attr(fx.elem.style, "opacity", fx.now);
		},

		_default: function(fx){
			if( fx.prop in fx.elem ) // 对于元素
				fx.elem[ fx.prop ] = fx.now;
			else if( fx.elem.style )// 对于style
				fx.elem.style[ fx.prop ] = fx.now + fx.unit;
		}
	}
});
