/**
 * Created by qiaoni on 16/6/16.
 * des clearn canvas via imooc
 * grouth-canvas
 */
(function(window,undefined){
	var
		paintColor    = 'black',
		canvasWidth   = canvasHeight = Math.min(800, window.innerWidth - 20),
		lastTimestamp = 0,
		isTouched     = false,
		lastLineWidth = -1,
		maxLineWidth  = 16,
		minLineWidth  = 1,
		maxStrokeV    = 8,
		minStrokeV    = 0.1,
		lastLocation  = { x : 0 , y : 0 };
	var util = {
		/**
		 * [addClass 给dom追加class]
		 * @param {[type]} obj [dom obejct]
		 * @param {[type]} cls [class name]
		 */
		addClass:function (obj, cls){
			var
				obj_class     = obj.className,//获取 class 内容.
				blank         = (obj_class != '') ? ' ' : '';//判断获取到的 class 是否为空, 如果不为空在前面加个'空格'.
				added         = obj_class + blank + cls;//组合原来的 class 和需要添加的 class.
				obj.className = added;//替换原来的 class.
		},
		removeClass:function (obj, cls){
			var
				obj_class     = ' '+obj.className+' ';//获取class内容,并在首尾各加一个空格. ex) 'abc bcd' -> ' abc bcd '
				obj_class     = obj_class.replace(/(\s+)/gi, ' '),//将多余的空字符替换成一个空格. ex) ' abc   bcd ' -> ' abc bcd '
				removed       = obj_class.replace(' '+cls+' ', ' ');//在原来的 class 替换掉首尾加了空格的 class. ex) ' abc bcd ' -> 'abc bcd '
				removed       = removed.replace(/(^\s+)|(\s+$)/g, '');//去掉首尾空格. ex) 'bcd ' -> 'bcd'
				obj.className = removed;//替换原来的 class.
		},
		hasClass:function (obj, cls){
			var
				obj_class     = obj.className,//获取 class 内容.
				obj_class_lst = obj_class.split(/\s+/);//通过split空字符将cls转换成数组.
				x             = 0;
			for(x in obj_class_lst) {
				if(obj_class_lst[x] == cls) {//循环数组, 判断是否包含cls
					return true;
				}
			}
			return false;
		}
	};
	//context.globalCompositeOperation = 'source-atop';
	//canvas.getContext('2d').imageSmoothingEnabled = true;
	//canvas.style.width = canvasWidth * window.devicePixelRatio;
	//canvas.style.height = canvasHeight * window.devicePixelRatio;
	//context.scale(window.devicePixelRatio, window.devicePixelRatio);

	function HandWrite(canvas,clearBtn,colorBtn){
		this.canvas   = canvas;
		this.clearBtn = clearBtn;
		this.colorBtn = colorBtn;
		this.context  = canvas.getContext('2d');
		this.init();
	}

	/**
	 * 初始化,绑定事件
	 */
	HandWrite.prototype.init = function(){
		var
			_self    = this,
			canvas   = this.canvas,
			clearBtn = this.clearBtn,
			colorBtn = this.colorBtn,
			colorLen = colorBtn.length;
		// 画布清除事件
		clearBtn.addEventListener('click',function(){
			_self.clear();
		});
		// 颜色选择事件
		for(var i = 0 ; i < colorLen; i++){
			colorBtn[i].addEventListener('click',function(){
				paintColor = window.getComputedStyle(this).backgroundColor;
				for(var j = 0 ; j < colorLen ; j++){
					util.removeClass(colorBtn[j],'color_btn_selected');
				}
				util.addClass(this,'color_btn_selected')
			});
		}
		// 移动端绘制事件
		canvas.addEventListener('touchstart',function(event){
			event.preventDefault();
			var touch = event.touches[0];
			_self.beginStroke({x: touch.pageX , y: touch.pageY});
		});
		canvas.addEventListener('touchmove',function(event){
			event.preventDefault();
			if(isTouched){
				var touch = event.touches[0];
				_self.moveStroke({x: touch.pageX , y: touch.pageY});
			}
		});
		canvas.addEventListener('touchend',function(event){
			event.preventDefault();
			_self.endStroke();
		});

		// pc端绘制事件
		canvas.addEventListener('mousedown',function(event){
			event.preventDefault();
			_self.beginStroke({x: event.clientX , y: event.clientY});
		});
		canvas.addEventListener('mousemove',function(event){
			event.preventDefault();
			if(isTouched){
				_self.moveStroke({x: event.clientX , y: event.clientY});
			}
		});
		canvas.addEventListener('mouseout',function(event){
			event.preventDefault();
			_self.endStroke();
		});
		canvas.addEventListener('mouseup',function(event){
			event.preventDefault();
			_self.endStroke();
		});
	};
	/**
	 * 画布清空事件
	 */
	HandWrite.prototype.clear = function(){
		this.context.clearRect(0,0,canvasWidth,canvasHeight);
		this.drawGrid();
	};
	/**
	 * 绘制绘图区域
	 */
	HandWrite.prototype.drawGrid = function(){
		var ctx = this.context;

		this.canvas.width = canvasWidth;
		this.canvas.height = canvasHeight;

		ctx.save();

		ctx.strokeStyle = "#f60";

		//绘制外边框
		ctx.beginPath();
		ctx.moveTo( 0 , 0 );
		ctx.lineTo( canvasWidth , 0 );
		ctx.lineTo( canvasWidth , canvasHeight );
		ctx.lineTo( 0 , canvasHeight);
		ctx.closePath();

		ctx.lineWidth = 3;
		ctx.stroke();
		//绘制虚线米字格
		ctx.beginPath();

		ctx.moveTo(0,0);
		ctx.lineTo(canvasWidth,canvasHeight);

		ctx.moveTo(canvasWidth,0);
		ctx.lineTo(0,canvasHeight);

		ctx.moveTo(canvasWidth/2,0);
		ctx.lineTo(canvasWidth/2,canvasHeight);

		ctx.moveTo(0,canvasHeight/2);
		ctx.lineTo(canvasWidth,canvasHeight/2);

		ctx.lineWidth = 1;
		//绘制虚线,虚线间距是10
		ctx.setLineDash([10]);
		ctx.stroke();

		ctx.restore();
	};
	/**
	 * 开始绘制
	 */
	HandWrite.prototype.beginStroke = function(point){

		isTouched     = true;
		lastTimestamp = new Date().getTime();
		lastLocation  = this.windowToCanvas(  point.x , point.y );

	};
	/**
	 * 绘制
	 */
	HandWrite.prototype.moveStroke = function(point){
		var
			ctx             = this.context,
			currentLocation = this.windowToCanvas( point.x , point.y ),
			curTimestamp    = new Date().getTime(),
			distance        = this.calcDistance( currentLocation , lastLocation ),
			time            = curTimestamp - lastTimestamp,
			lineWidth       = this.calcLineWidth(time,distance);

		// 绘制直线
		ctx.beginPath();
		ctx.moveTo(lastLocation.x,lastLocation.y);
		ctx.lineTo(currentLocation.x,currentLocation.y);
		ctx.closePath();

		//设置直线属性
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.strokeStyle= paintColor;
		ctx.lineWidth = lineWidth;
		ctx.stroke();

		lastLocation = currentLocation;
	};
	/**
	 * 结束绘制
	 */
	HandWrite.prototype.endStroke = function(){
		isTouched = false;
	};
	/**
	 * 计算两点间的距离
	 * @param loc1 起点坐标
	 * @param loc2 终点坐标
	 * @returns {number}
	 */
	HandWrite.prototype.calcDistance = function(loc1 , loc2){
		return Math.sqrt( (loc1.x - loc2.x)*(loc1.x - loc2.x) + (loc1.y - loc2.y)*(loc1.y - loc2.y) );
	};
	/**
	 * 计算书写的粗细
	 * @param time 书写时间
	 * @param distance 书写距离
	 * @returns {*}
	 */
	HandWrite.prototype.calcLineWidth = function( time , distance ){
		var
			speed  = distance / time,//书写速度
			resultLineWidth;

		if( speed <= minStrokeV )
			resultLineWidth = maxLineWidth;
		else if ( speed >= maxStrokeV )
			resultLineWidth = minLineWidth;
		else{
			resultLineWidth = maxLineWidth - (speed-minStrokeV)/(maxStrokeV-minStrokeV)*(maxLineWidth-minLineWidth);
		}

		if( lastLineWidth == -1 )
			return resultLineWidth;

		return resultLineWidth*1/3 + lastLineWidth*2/3;
	};
	/**
	 * 画布与window坐标转换
	 * @param x window的x坐标
	 * @param y window的y坐标
	 * @returns {{x: number, y: number}}
	 */
	HandWrite.prototype.windowToCanvas = function(x,y){
		// 获取画布位置的相关信息(width,height,top,left,right,bottom)
		var position = canvas.getBoundingClientRect();
		return {
			x : x - position.left,
			y : y - position.top
		}
	};
	/**
	 * 绘制虚线
	 * 思路:
	 * 1.根据两点的坐标确定绘制的线的长度,
	 * 2.计算虚线的段数
	 * 3.循环绘制线
	 * 4.绘制的x坐标每次加上(x坐标差值/段数)*段数
	 * @param ctx 绘图上下文
	 * @param x1 起点x坐标
	 * @param y1 起点y坐标
	 * @param x2 终点x坐标
	 * @param y2 终点y坐标
	 * @param dashLength 虚线长度
	 */
	HandWrite.prototype.drawDashLine = function (ctx, x1, y1, x2, y2, dashLength){
		var
			dashLen   = dashLength === undefined ? 5 : dashLength,
			xpos      = x2 - x1, //得到横向的宽度;
			ypos      = y2 - y1, //得到纵向的高度;
			numDashes = Math.floor(Math.sqrt(xpos * xpos + ypos * ypos) / dashLen);//计算虚线段数;

		ctx.beginPath();
		for(var i=0; i < numDashes; i++){
			if(i % 2 === 0){
				//有了横向宽度和多少段，得出每一段是多长，起点 + 每段长度 * i = 要绘制的起点
				context.moveTo(x1 + (xpos/numDashes) * i, y1 + (ypos/numDashes) * i);
			}else{
				context.lineTo(x1 + (xpos/numDashes) * i, y1 + (ypos/numDashes) * i);
			}
		}
		ctx.closePath();
		ctx.stroke();
	};


	window.HandWrite = HandWrite;


})(window,undefined);
