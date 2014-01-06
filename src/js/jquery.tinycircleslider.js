;(function (factory)
{
    if (typeof define === 'function' && define.amd)
    {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object')
    {
        // Node/CommonJS
        factory(require('jquery'));
    } else
    {
        // Browser globals
        factory(jQuery);
    }
}(function ($)
{
    $.tiny = $.tiny || {};

    $.tiny.circleslider = {
            interval       : false // move to another block on intervals.
        ,   intervaltime   : 3500  // time between intervals.
        ,   intervalrandom : true  // move to a random block or move from block to the next clockwise.
        ,   placedots      : true  // automatic placement of dots or use predefined location on slide.
        ,   snaptodots     : false // shows dots when user starts dragging and snap to them.
        ,   hidedots       : true  // fades out the dots when user stops dragging.
        ,   radius         : 140   // Used to determine the size of the circleslider
        ,   lightbox       : false // when you have links with a lightbox attached this most be true for normal links to work correctly this must be false.
        ,   callback       : null  // function that executes after every move
    };

    $.fn.tinycircleslider = function( params )
    {
        var options = $.extend({}, $.tiny.circleslider, params);

        this.each(function()
        {
            $( this ).data( "tcs", new Slider( $( this ), options ) );
        });

        return $.extend( this, {
            gotoSlide: function( slideIndex, interval )
            {
                return this.each(function ()
                {
                    $( this ).data( "tcs" ).gotoSlide( slideIndex, interval );
                });
            }
        ,   stopInterval: function()
            {
                return this.each(function ()
                {
                    $( this ).data( "tcs" ).stopInterval();
                });
            }
        ,   startInterval: function()
            {
                return this.each(function ()
                {
                    $( this ).data( "tcs" ).startInterval();
                });
            }
        });
    };

    function Slider( $container, options )
    {

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

        ,   intervalTimer     = null
        ,   animationTimer    = null
        ,   animationStep     = 0
        ,   slideIndexCurrent = 0
        ,   angleCurrent      = 0

        ,   angleOld      = 10
        ,   iCounter      = 0
        ,   iCurrent      = 0
        ;

        function initialize()
        {
            if(options.snaptodots)
            {
                setDots();
            }

            $overview.append($slides.first().clone());

            $overview.css("width", slideSize.width * ($slides.length + 1));

            setEvents();

            self.gotoSlide(0, options.interval);
        }

        function setEvents()
        {
            $thumb.mousedown(start);

            if(options.snaptodots)
            {
                $container.delegate(".dot", "click", function()
                {
                    clearTimeout(intervalTimer);

                    if(0 === animationStep)
                    {
                        self.gotoSlide($(this).text() - 1);
                    }

                    self.startInterval();
                });
            }
        }

        function setTimer( bFirst )
        {
            intervalTimer = setTimeout(function()
            {
                self.gotoSlide( ($slides[(iCurrent + 1)] !== undefined ? (iCurrent + 1) : 0), true);
            }, ( bFirst ? 50 : options.intervaltime ) );
        }

        function toRadians(degrees)
        {
            return degrees * (Math.PI / 180);
        }

        function toDegrees(radians)
        {
            return radians * 180 / Math.PI;
        }

        function setDots()
        {
            var docFragment = document.createDocumentFragment();

            $dots.remove();
            $slides = $slides.remove();

            $slides.each(function(index, slide)
            {
                var $dotClone = $dots.clone()
                ,   angle     = options.placedots ? (index * 360 / $slides.length) : parseInt($(slide).attr("data-degrees"), 10)
                ,   position  =
                    {
                        top  : -Math.cos(toRadians(angle)) * options.radius + containerSize.height / 2 - dotSize.height / 2
                    ,   left :  Math.sin(toRadians(angle)) * options.radius + containerSize.width  / 2 - dotSize.width  / 2
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

        this.startInterval = function(first)
        {
            if(options.interval)
            {
                setTimer( first );
            }
        };

        this.stopInterval = function()
        {
            clearTimeout(intervalTimer);
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

        this.gotoSlide = function(slideIndex, interval)
        {
            var angleDestination = dots[slideIndex] && dots[slideIndex].angle || 0
            ,   angleDelta       = findShortestPath(angleDestination, angleOld)[0]
            ,   framerate        = Math.ceil(Math.abs(angleDelta) / 10)
            ,   angleStep        = (angleDelta / framerate) || 0
            ;

            iCurrent = slideIndex;

            stepMove(angleStep, angleDestination, framerate, interval);
        };

        function sanitizeAngle( angle )
        {
            return angle + ( ( angle > 360 ) ? -360 : ( angle < 0 ) ? 360 : 0 );
        }

        function stepMove( angleStep, angleDestination, framerate, interval )
        {
            iCounter += 1;

            var angle = sanitizeAngle( Math.round( iCounter * angleStep + angleOld ) );

            if( iCounter === framerate && interval )
            {
                self.startInterval();
            }

            setCSS( angle, iCounter === framerate );

            if( iCounter < framerate )
            {
                animationTimer = setTimeout( function()
                {
                    stepMove(angleStep, angleDestination, framerate, interval);
                }, 50 );
            }
            else
            {
                iCounter = 0;
                angleOld = angleDestination;
            }
        }

        function drag( event )
        {
            var containerOffset  = $container.offset()
            ,   thumbPositionNew =
                {
                    left : event.pageX - containerOffset.left - (containerSize.width / 2)
                ,   top  : event.pageY - containerOffset.top  - (containerSize.height / 2)
                }
            ;

            angleOld = sanitizeAngle(toDegrees(Math.atan2(thumbPositionNew.left, -thumbPositionNew.top)));

            setCSS(angleOld);

            return false;
        }

        function setCSS(angle, bFireCallback)
        {
            if(options.placedots)
            {
                $overview.css("left", -(angle / 360 * slideSize.width * $slides.length));
            }
            else
            {
                closestSlidesAndAngles = findClosestSlide(angle);
                closestSlides = closestSlidesAndAngles[0];
                closestAngles = closestSlidesAndAngles[1];

                $overview.css("left", -(closestSlides[1] * slideSize.width + Math.abs(closestAngles[1]) * slideSize.width / (Math.abs(closestAngles[1]) + Math.abs(closestAngles[2]))));
            }

            $thumb.css({
                top  : -Math.cos(toRadians(angle)) * options.radius + (containerSize.height / 2 - thumbSize.height / 2)
            ,   left :  Math.sin(toRadians(angle)) * options.radius + (containerSize.width / 2 - thumbSize.width / 2)
            });

            if( typeof options.callback === "function" && bFireCallback )
            {
                options.callback.call( root, $slides[iCurrent], iCurrent );
            }
        }

        function end(oEvent)
        {
            $(document).unbind("mousemove mouseup");
            $thumb.unbind("mouseup");

            clearTimeout(animationTimer);

            if(options.snaptodots)
            {
                if(options.hidedots)
                {
                    $dots.stop(true, true).fadeOut("slow");
                }

                self.gotoSlide(findClosestSlide(angleOld)[0][0]);
            }

            self.startInterval();

            return false;
        }

        function start(oEvent)
        {
            clearTimeout(intervalTimer);

            $(document).mousemove(drag);
            $(document).mouseup(end);
            $thumb.mouseup(end);

            if(options.snaptodots && options.hidedots)
            {
                $dots.stop(true, true).fadeIn("slow");
            }

            return false;
        }

        initialize();
    }
}));