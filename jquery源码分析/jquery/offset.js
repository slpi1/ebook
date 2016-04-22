// The Offset Method
// Originally By Brandon Aaron, part of the Dimension Plugin
// http://jquery.com/plugins/project/dimensions
//元素相对于文档的起始位置的offset
jQuery.fn.offset = function() {
	var left = 0, top = 0, elem = this[0], results;

	if ( elem ) with ( jQuery.browser ) {
		var parent       = elem.parentNode,
		    offsetChild  = elem,
		    offsetParent = elem.offsetParent,
		    doc          = elem.ownerDocument,
		    safari2      = safari && parseInt(version) < 522 && !/adobeair/i.test(userAgent),
		    css          = jQuery.curCSS,
		    fixed        = css(elem, "position") == "fixed";

		    //在IE中有的元素可以通过getBoundingClientRect来获得元素相对于client的rect.
		if ( !(mozilla && elem == document.body) && elem.getBoundingClientRect ) {//IE
			//http://msdn.microsoft.com/en-us/library/ms536433.aspx
			var box = elem.getBoundingClientRect();
			// 加上document的scroll的部分尺寸到left,top中。
			add(box.left + Math.max(doc.documentElement.scrollLeft, doc.body.scrollLeft),
				box.top  + Math.max(doc.documentElement.scrollTop,  doc.body.scrollTop));
            //IE中会自动加上2px的border,这里是去掉document的边框大小。
			//http://msdn.microsoft.com/en-us/library/ms533564(VS.85).aspx
			//The difference between the offsetLeft and clientLeft properties is the border of the object
			add( -doc.documentElement.clientLeft, -doc.documentElement.clientTop );
		
		} else {//通过遍历当前元素offsetParents来计算其在文档中的位置（相对于文档的起始位置）
			
			add( elem.offsetLeft, elem.offsetTop );//初始化元素left,top			
			//很多浏览器的offsetParent是直接指向body的。不过有的是指向最近的可视的父节点。
			while ( offsetParent ) {				
				add( offsetParent.offsetLeft, offsetParent.offsetTop );//加上父节点的偏移
				// Mozilla系列offsetLet或offsetTop不包含offsetParent的边框。要加上
				//但在在table中又会自动加上。
				if ( mozilla && !/^t(able|d|h)$/i.test(offsetParent.tagName) || safari && !safari2 )
					border( offsetParent );//增加offsetParent的border

				// 对于CSS设定为fixed相对于client的定位，加上document.scroll.
				if ( !fixed && css(offsetParent, "position") == "fixed" )
					fixed = true;

				 //改变子节点变量offsetChild，再改变offsetParent变量的指向。
				offsetChild  = /^body$/i.test(offsetParent.tagName) ? offsetChild : offsetParent;				
				offsetParent = offsetParent.offsetParent;
			}

			// 减去处理每一层不显示的scroll的部分。
			// 因为一个元素的size(CSS中指定的）是scroll之前的。
			// 如果scroll，offsetLet或offsetTop会包含这部分被卷起的。			
			while ( parent && parent.tagName && !/^body|html$/i.test(parent.tagName) ) {
				// 如果parent的display的属性不为inline|table，减去它的scroll.				
				if ( !/^inline|table.*$/i.test(css(parent, "display")) )
					// 减去 parent scroll offsets
					add( -parent.scrollLeft, -parent.scrollTop );
				// 如果overflow != "visible.在Mozilla 中就不会加上border.s
				if ( mozilla && css(parent, "overflow") != "visible" )
					border( parent );				
				parent = parent.parentNode;
			}
			
			//Safari <= 2，在CSS中position为fiexed或者body的position==absolute，
			//会重复加上body offset。Mozilla在Position！=absolute的时候也会重复加上
			if ( (safari2 && (fixed || css(offsetChild, "position") == "absolute")) ||
				(mozilla && css(offsetChild, "position") != "absolute") )
					add( -doc.body.offsetLeft, -doc.body.offsetTop );
					
			//fixed 加上document scroll。因为fixed是scroll的时候也是相对于client不变。所以要加上
			if ( fixed )
				add(Math.max(doc.documentElement.scrollLeft, doc.body.scrollLeft),
					Math.max(doc.documentElement.scrollTop,  doc.body.scrollTop));
		}
		
		results = { top: top, left: left };
	}

	function border(elem) {
		add( jQuery.curCSS(elem, "borderLeftWidth", true), jQuery.curCSS(elem, "borderTopWidth", true) );
	}

	function add(l, t) {
		left += parseInt(l, 10) || 0;
		top += parseInt(t, 10) || 0;
	}

	return results;
};


jQuery.fn.extend({
	position: function() {
		var left = 0, top = 0, results;

		if ( this[0] ) {
			// Get *real* offsetParent
			var offsetParent = this.offsetParent(),

			// Get correct offsets
			offset       = this.offset(),
			parentOffset = /^body|html$/i.test(offsetParent[0].tagName) ? { top: 0, left: 0 } : offsetParent.offset();

			// Subtract element margins
			// note: when an element has margin: auto the offsetLeft and marginLeft 
			// are the same in Safari causing offset.left to incorrectly be 0
			offset.top  -= num( this, 'marginTop' );
			offset.left -= num( this, 'marginLeft' );

			// Add offsetParent borders
			parentOffset.top  += num( offsetParent, 'borderTopWidth' );
			parentOffset.left += num( offsetParent, 'borderLeftWidth' );

			// Subtract the two offsets
			results = {
				top:  offset.top  - parentOffset.top,
				left: offset.left - parentOffset.left
			};
		}

		return results;
	},

	//找到this[0]中元素第一个能根据CSS中的top,left能设定位置的父辈节点。
	offsetParent: function() {
		var offsetParent = this[0].offsetParent || document.body;
		while ( offsetParent && (!/^body|html$/i.test(offsetParent.tagName) && jQuery.css(offsetParent, 'position') == 'static') )
			offsetParent = offsetParent.offsetParent;
		return jQuery(offsetParent);
	}
});


// Create scrollLeft and scrollTop methods
jQuery.each( ['Left', 'Top'], function(i, name) {
	var method = 'scroll' + name;
	
	jQuery.fn[ method ] = function(val) {
		if (!this[0]) return;

		return val != undefined ?

			// Set the scroll offset
			this.each(function() {
				this == window || this == document ?
					window.scrollTo(
						!i ? val : jQuery(window).scrollLeft(),
						 i ? val : jQuery(window).scrollTop()
					) :
					this[ method ] = val;
			}) :

			// Return the scroll offset
			this[0] == window || this[0] == document ?
				self[ i ? 'pageYOffset' : 'pageXOffset' ] ||
					jQuery.boxModel && document.documentElement[ method ] ||
					document.body[ method ] :
				this[0][ method ];
	};
});
