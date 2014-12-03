;(function (factory)
{
    if (typeof define === 'function' && define.amd)
    {
        define(jQuery || ['jquery'], factory);
    }
    else if (typeof exports === 'object')
    {
        factory(jQuery || require('jquery'));
    }
    else
    {
        factory(jQuery);
    }
}
(function ($)
{
    //check the transition support
    $.support.transforms3d = (function() {
        var div = document.createElement('div').style;
        return ('webkitPerspective' in div || 'MozPerspective' in div || 'OPerspective' in div || 'MsPerspective' in div || 'perspective' in div);
    })();

    $.support.transforms = (function() {
        var div = document.createElement('div').style;
        return ('transform' in div || 'WebkitTransform' in div || 'MozTransform' in div || 'msTransform' in div || 'MsTransform' in div || 'OTransform' in div);
    })();

    var pluginName = "tinycircleslider"
    ,   defaults   =
        {
            interval        : false // move to another block on intervals.
        ,   intervalTime    : 3500  // time between intervals.
        ,   dots            : true  // automatic placement of dots or use predefined location on slide.
        ,   dotsSnap        : false // shows dots when user starts dragging and snap to them.
        ,   dotsHide        : true  // fades out the dots when user stops dragging.
        ,   radius          : 140   // Used to determine the size of the circleslider
        ,   useCSSTransform : true  // use css trasform to move cursor and slides
        }
    ;

    function Plugin($container, options)
    {
        this.options   = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name     = pluginName;

        var self            = this
        ,   $viewport       = $container.find(".viewport")
        ,   $overview       = $container.find(".overview")
        ,   $slides         = $overview.children()
        ,   $thumb          = $container.find(".thumb")
        ,   $dots           = $container.find(".dot")
        ,   $links          = $slides.find("a")

        ,   dots            = []

        ,   containerSize =
            {
                width  : $container.outerWidth(true)
            ,   height : $container.outerHeight(true)
            }
        ,   slideSize =
            {
                width  : $slides.first().outerWidth(true)
            ,   height : $slides.first().outerHeight(true)
            }
        ,   thumbSize =
            {
                width  : $thumb.outerWidth(true)
            ,   height : $thumb.outerHeight(true)
            }
        ,   dotSize =
            {
                width  : $dots.outerWidth()
            ,   height : $dots.outerHeight()
            }

        ,   intervalTimer   = null
        ,   animationTimer  = null
        ,   animationStep   = 0
        ,   touchEvents     = "ontouchstart" in document.documentElement
        ,   isTouchEvent    = false
        ;

        this.slideCurrent = 0;
        this.angleCurrent = 10;


        function initialize()
        {
            if(self.options.dotsSnap)
            {
                setDots();
            }

            $overview.append($slides.first().clone());

            $overview.css("width", slideSize.width * ($slides.length + 1));
            $thumb.css({
                "top"  :"0px",
                "left" :"0px"
            });

            setEvents();

            self.move(0, self.options.interval);

            return self;
        }

        function setEvents()
        {
            var eventType = touchEvents ? "touchstart" : "mousedown";

            if(touchEvents)
            {
                $container[0].ontouchstart = startDrag;
                $container[0].ontouchmove  = drag;
                $container[0].ontouchend   = endDrag;
            }
            else
            {
                $thumb.bind(eventType, startDrag);
            }

            if(self.options.dotsSnap)
            {
                $container.delegate(".dot", eventType, function(event)
                {
                    event.preventDefault();
                    event.stopImmediatePropagation();

                    clearTimeout(intervalTimer);

                    if(0 === animationStep)
                    {
                        self.move($(this).text() - 1);
                    }

                    self.start();

                    return false;
                });
            }
        }

        function setTimer(slideFirst)
        {
            intervalTimer = setTimeout(function()
            {
                self.move(($slides[(self.slideCurrent + 1)] !== undefined ? (self.slideCurrent + 1) : 0), true);
            }, (slideFirst ? 50 : self.options.intervalTime));
        }

        function toRadians(degrees)
        {
            return degrees * (Math.PI / 180);
        }

        function toDegrees(radians)
        {
            return radians * 180 / Math.PI;
        }

        function translate(pos){
            if(self.options.useCSSTransform) {
                if($.support.transforms3d) {
                    return {
                        '-webkit-transform'   : 'translate3d(' + (pos.x) + 'px, ' + (pos.y) + 'px, 0px)',
                        '-moz-transform'      : 'translate3d(' + (pos.x) + 'px, ' + (pos.y) + 'px, 0px)',
                        '-o-transform'        : 'translate3d(' + (pos.x) + 'px, ' + (pos.y) + 'px, 0px)',
                        '-ms-transform'       : 'translate3d(' + (pos.x) + 'px, ' + (pos.y) + 'px, 0px)',
                        'transform'           : 'translate3d(' + (pos.x) + 'px, ' + (pos.y) + 'px, 0px)'
                    };
                } else {
                    if($.support.transforms) {
                        return {
                            '-webkit-transform' : 'translate(' + (pos.x) + 'px, ' + (pos.y) + 'px, 0px)',
                            '-moz-transform'    : 'translate(' + (pos.x) + 'px, ' + (pos.y) + 'px, 0px)',
                            '-o-transform'      : 'translate(' + (pos.x) + 'px, ' + (pos.y) + 'px, 0px)',
                            '-ms-transform'     : 'translate(' + (pos.x) + 'px, ' + (pos.y) + 'px, 0px)',
                            'transform'         : 'translate(' + (pos.x) + 'px, ' + (pos.y) + 'px, 0px)'
                        };
                    }
                }
            }
            return {
                'left': pos.x,
                'top' : pos.y
            };
        }

        function setDots()
        {
            var docFragment = document.createDocumentFragment();

            $dots.remove();
            $slides = $slides.remove();

            $slides.each(function(index, slide)
            {
                var $dotClone = $dots.clone()
                ,   angle     = self.options.dots ? (index * 360 / $slides.length) : parseInt($(slide).attr("data-degrees"), 10)
                ,   position  =
                    {
                        'left'  : -Math.cos(toRadians(angle)) * self.options.radius + containerSize.height / 2 - dotSize.height / 2
                    ,   'top'  :  Math.sin(toRadians(angle)) * self.options.radius + containerSize.width  / 2 - dotSize.width  / 2
                    }
                ;
                $dotClone.addClass($(slide).attr("data-classname"));

                $dotClone.css(position);

                dots.push({
                    "angle" : angle
                ,   "slide" : slide
                ,   "dot"   : $dotClone
                });

                docFragment.appendChild($dotClone[0]);
            });

            dots.sort(function(dotA, dotB)
            {
                return dotA.angle - dotB.angle;
            });

            $.each(dots, function(index, dot)
            {
                $(dot.dot).addClass("dot-" + (index + 1));
                $(dot.dot).html("<span>" + (index + 1) + "</span>");

                $overview.append(dot.slide);
            });

            $container.append(docFragment);

            $dots = $container.find(".dot");
        }

        this.start = function(first)
        {
            if(self.options.interval)
            {
                setTimer( first );
            }
            return self;
        };

        this.stop = function()
        {
            clearTimeout(intervalTimer);

            return self;
        };

        function findShortestPath(angleA, angleB)
        {
            var angleCW, angleCCW, angleShortest;

            if(angleA > angleB)
            {
                angleCW  = angleA - angleB;
                angleCCW = -(angleB + 360 - angleA);
            }
            else
            {
                angleCW  = angleA + 360 - angleB;
                angleCCW = -(angleB - angleA);
            }

            angleShortest = angleCW < Math.abs(angleCCW) ? angleCW : angleCCW;

            return [angleShortest, angleCCW, angleCW];
        }

        function findClosestSlide(angle)
        {
            var closestDotAngleToAngleCCW = 9999
            ,   closestDotAngleToAngleCW  = 9999
            ,   closestDotAngleToAngle    = 9999
            ,   closestSlideCCW           = 0
            ,   closestSlideCW            = 0
            ,   closestSlide              = 0
            ;

            $.each(dots, function(index, dot)
            {
                var delta = findShortestPath(dot.angle, angle);

                if(Math.abs(delta[0]) < Math.abs(closestDotAngleToAngle))
                {
                    closestDotAngleToAngle = delta[0];
                    closestSlide           = index;
                }

                if(Math.abs(delta[1]) < Math.abs(closestDotAngleToAngleCCW))
                {
                    closestDotAngleToAngleCCW = delta[1];
                    closestSlideCCW           = index;
                }

                if(Math.abs(delta[2]) < Math.abs(closestDotAngleToAngleCW))
                {
                    closestDotAngleToAngleCW = delta[2];
                    closestSlideCW           = index;
                }
            });

            return  [
                        [ closestSlide, closestSlideCCW, closestSlideCW ]
                    ,   [ closestDotAngleToAngle, closestDotAngleToAngleCCW, closestDotAngleToAngleCW ]
                    ];
        }

        this.move = function(slideIndex, interval)
        {
            var angleDestination = dots[slideIndex] && dots[slideIndex].angle || 0
            ,   angleDelta       = findShortestPath(angleDestination, self.angleCurrent)[0]
            ,   framerate        = Math.ceil(Math.abs(angleDelta) / 10)
            ,   angleStep        = (angleDelta / framerate) || 0
            ;

            self.slideCurrent = slideIndex;

            stepMove(angleStep, angleDestination, framerate, interval);

            return self;
        };

        function sanitizeAngle(degrees)
        {
            return (degrees < 0) ? 360 + (degrees % -360) : degrees % 360;
        }

        function stepMove(angleStep, angleDestination, framerate, interval)
        {
            animationStep += 1;

            var angle = sanitizeAngle(Math.round(animationStep * angleStep + self.angleCurrent));

            if(animationStep === framerate && interval)
            {
                self.start();
            }

            setCSS(angle, animationStep === framerate);

            if(animationStep < framerate)
            {
                animationTimer = setTimeout(function()
                {
                    stepMove(angleStep, angleDestination, framerate, interval);
                }, 50);
            }
            else
            {
                animationStep = 0;
                self.angleCurrent = angleDestination;
            }
        }

        function page(event)
        {
            return {
                x: isTouchEvent ? event.targetTouches[0].pageX : (event.pageX || event.clientX),
                y: isTouchEvent ? event.targetTouches[0].pageY : (event.pageY || event.clientY)
            };
        }

        function drag(event)
        {
            var containerOffset  = $container.offset()
            ,   thumbPositionNew =
                {
                    left : page(event).x - containerOffset.left - (containerSize.width / 2)
                ,   top  : page(event).y - containerOffset.top  - (containerSize.height / 2)
                }
            ;

            self.angleCurrent = sanitizeAngle(toDegrees(Math.atan2(thumbPositionNew.left, -thumbPositionNew.top)));

            setCSS(self.angleCurrent);

            return false;
        }

        function setCSS(angle, fireCallback)
        {
            if(self.options.dots)
            {
                $overview.css(translate({
                    'x': -(angle / 360 * slideSize.width * $slides.length),
                    'y': 0
                }));
            }
            else
            {
                closestSlidesAndAngles = findClosestSlide(angle);
                closestSlides = closestSlidesAndAngles[0];
                closestAngles = closestSlidesAndAngles[1];

                $overview.css(translate({
                    'x': -(closestSlides[1] * slideSize.width + Math.abs(closestAngles[1]) * slideSize.width / (Math.abs(closestAngles[1]) + Math.abs(closestAngles[2]))),
                    'y': 0
                }));
            }

            $thumb.css(translate({
                'x' :  Math.sin(toRadians(angle)) * self.options.radius + (containerSize.width / 2 - thumbSize.width / 2)
            ,   'y' :  -Math.cos(toRadians(angle)) * self.options.radius + (containerSize.height / 2 - thumbSize.height / 2)
            }));

            if(fireCallback)
            {
                $container.trigger("move", [$slides[self.slideCurrent], self.slideCurrent]);
            }
        }

        function endDrag(event)
        {
            if($(event.target).hasClass("dot"))
            {
                return false;
            }
            event.preventDefault();

            clearTimeout(animationTimer);

            if(!touchEvents)
            {
                $(document).unbind("mousemove mouseup");
                $thumb.unbind("mouseup");
            }

            if(self.options.dotsSnap)
            {
                if(self.options.dotsHide)
                {
                    $dots.stop(true, true).fadeOut("slow");
                }

                self.move(findClosestSlide(self.angleCurrent)[0][0]);
            }

            self.start();
        }

        function startDrag(event)
        {
            event.preventDefault();
            isTouchEvent = event.type == 'touchstart';
            if($(event.target).hasClass("dot"))
            {
                return false;
            }

            clearTimeout(intervalTimer);

            if(!touchEvents)
            {
                $(document).mousemove(drag);
                $(document).mouseup(endDrag);
                $thumb.mouseup(endDrag);
            }

            if(self.options.dotsSnap && self.options.dotsHide)
            {
                $dots.stop(true, true).fadeIn("slow");
            }
        }

        return initialize();
    }

    $.fn[pluginName] = function(options)
    {
        return this.each(function()
        {
            if(!$.data(this, "plugin_" + pluginName))
            {
                $.data(this, "plugin_" + pluginName, new Plugin($(this), options));
            }
        });
    };
}));