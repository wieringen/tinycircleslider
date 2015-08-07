;(function(factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    }
    else if (typeof exports === 'object') {
        module.exports = factory(require("jquery"));
    }
    else {
        factory(jQuery);
    }
}
(function($) {
    var pluginName = "tinycircleslider"
    ,   defaults   = {
            interval: false
        ,   intervalTime: 3500
        ,   dotsSnap: false
        ,   dotsHide: true
        ,   radius: 140
        ,   start: 0
        }
    ;

    function Plugin($container, options) {
        /**
         * The options of the carousel extend with the defaults.
         *
         * @property options
         * @type Object
         * @default defaults
         */
        this.options = $.extend({}, defaults, options);

        /**
         * @property _defaults
         * @type Object
         * @private
         * @default defaults
         */
        this._defaults = defaults;

        /**
         * @property _name
         * @type String
         * @private
         * @final
         * @default 'tinycircleslider'
         */
        this._name = pluginName;

        var self = this
        ,   $viewport = $container.find(".viewport")
        ,   $overview = $container.find(".overview")
        ,   $slides = $overview.children()
        ,   $thumb = $container.find(".thumb")
        ,   $dots = $container.find(".dot")
        ,   $links = $slides.find("a")

        ,   containerSize = {
                width: $container.outerWidth(true)
            ,   height: $container.outerHeight(true)
            }
        ,   slideSize = {
                width: $slides.first().outerWidth(true)
            ,   height: $slides.first().outerHeight(true)
            }
        ,   thumbSize = {
                width: $thumb.outerWidth(true)
            ,   height: $thumb.outerHeight(true)
            }
        ,   dotSize = {
                width: $dots.outerWidth()
            ,   height: $dots.outerHeight()
            }

        ,   intervalTimer = null
        ,   animationTimer = null
        ,   touchEvents = 'ontouchstart' in window
        ,   isTouchEvent = false
        ,   hasRequestAnimationFrame = 'requestAnimationFrame' in window
        ;

        /**
         * When dotsSnap is enabled every slide has a corresponding dot.
         *
         * @property dots
         * @type Array
         * @default []
         */
        this.dots = [];

        /**
         * The index of the current slide.
         *
         * @property slideCurrent
         * @type Number
         * @default 0
         */
        this.slideCurrent = 0;

        /**
         * The current angle in degrees
         *
         * @property angleCurrent
         * @type Number
         * @default 0
         */
        this.angleCurrent = 0;

        /**
         * The number of slides the slider is currently aware of.
         *
         * @property slidesTotal
         * @type Number
         * @default 0
         */
        this.slidesTotal = $slides.length;

        /**
         * If the interval is running the value will be true.
         *
         * @property intervalActive
         * @type Boolean
         * @default false
         */
        this.intervalActive = false;

        /**
         * @method _initialize
         * @private
         */
        function _initialize() {
            _setDots();

            $overview
                .append($slides.first().clone())
                .css("width", slideSize.width * ($slides.length + 1));

            _setEvents();

            _setCSS(0);
            self.move(self.options.start, self.options.interval);

            return self;
        }

        /**
         * @method _setEvents
         * @private
         */
        function _setEvents() {
            if (touchEvents) {
                $container[0].ontouchstart = _startDrag;
                $container[0].ontouchmove = _drag;
                $container[0].ontouchend = _endDrag;
            }

            $thumb.bind("mousedown", _startDrag);

            var snapHandler = function (event) {
                event.preventDefault();
                event.stopImmediatePropagation();

                self.stop();
                self.move($(this).attr("data-slide-index"));

                return false;
            };

            if (touchEvents) {
                $container.delegate(".dot", "touchstart", snapHandler);
            }
            $container.delegate(".dot", "mousedown", snapHandler);
        }

        /**
         * @method _setTimer
         * @private
         */
        function _setTimer(slideFirst) {
            intervalTimer = setTimeout(function() {
                self.move(self.slideCurrent + 1, true);
            }, (slideFirst ? 50 : self.options.intervalTime));
        }

        /**
         * @method _toRadians
         * @private
         * @param {Number} [degrees]
         */
        function _toRadians(degrees) {
            return degrees * (Math.PI / 180);
        }

        /**
         * @method _toDegrees
         * @private
         * @param {Number} [radians]
         */
        function _toDegrees(radians) {
            return radians * 180 / Math.PI;
        }

        /**
         * @method _setDots
         * @private
         */
        function _setDots() {
            var docFragment = document.createDocumentFragment();

            $dots.remove();

            $slides.each(function(index, slide) {
                var $dotClone = null
                ,   angle = parseInt($(slide).attr("data-degrees"), 10) || (index * 360 / self.slidesTotal)
                ,   position = {
                        top: -Math.cos(_toRadians(angle)) * self.options.radius + containerSize.height / 2 - dotSize.height / 2
                    ,   left: Math.sin(_toRadians(angle)) * self.options.radius + containerSize.width / 2 - dotSize.width / 2
                    }
                ;

                if($dots.length > 0) {
                    $dotClone = $dots.clone();
                    $dotClone
                        .addClass($(slide).attr("data-classname"))
                        .css(position);

                    docFragment.appendChild($dotClone[0]);
                }

                self.dots.push({
                    "angle": angle
                ,   "slide": slide
                ,   "dot": $dotClone
                });
            });

            self.dots.sort(function(dotA, dotB) {
                return dotA.angle - dotB.angle;
            });

            $.each(self.dots, function(index, dot) {
                if($(dot.dot).length > 0){
                    $(dot.dot)
                        .addClass("dot-" + (index + 1))
                        .attr('data-slide-index', index)
                        .html("<span>" + (index + 1) + "</span>");
                }
            });

            $container.append(docFragment);

            $dots = $container.find(".dot");
        }

        /**
         * If the interval is stopped start it.
         *
         * @method start
         * @chainable
         */
        this.start = function(first) {
            if(self.options.interval) {
                self.intervalActive = true;

                _setTimer(first);
            }
            return self;
        };

        /**
         * If the interval is running stop it.
         *
         * @method stop
         * @chainable
         */
        this.stop = function() {
            self.intervalActive = false;

            clearTimeout(intervalTimer);

            return self;
        };

        /**
         * @method _findShortestPath
         * @private
         * @param {Number} [angleA]
         * @param {Number} [angleB]
         */
        function _findShortestPath(angleA, angleB) {
            var angleCW, angleCCW, angleShortest;

            if(angleA > angleB) {
                angleCW = angleA - angleB;
                angleCCW = -(angleB + 360 - angleA);
            }
            else {
                angleCW = angleA + 360 - angleB;
                angleCCW = -(angleB - angleA);
            }

            angleShortest = angleCW < Math.abs(angleCCW) ? angleCW : angleCCW;

            return [angleShortest, angleCCW, angleCW];
        }

        /**
         * @method _findClosestSlide
         * @private
         * @param {Number} [angle]
         */
        function _findClosestSlide(angle) {
            var closestDotAngleToAngleCCW = 9999
            ,   closestDotAngleToAngleCW = 9999
            ,   closestDotAngleToAngle = 9999
            ,   closestSlideCCW = 0
            ,   closestSlideCW = 0
            ,   closestSlide = 0
            ;

            $.each(self.dots, function(index, dot) {
                var delta = _findShortestPath(dot.angle, angle);

                if(Math.abs(delta[0]) < Math.abs(closestDotAngleToAngle)) {
                    closestDotAngleToAngle = delta[0];
                    closestSlide = index;
                }

                if(Math.abs(delta[1]) < Math.abs(closestDotAngleToAngleCCW)) {
                    closestDotAngleToAngleCCW = delta[1];
                    closestSlideCCW = index;
                }

                if(Math.abs(delta[2]) < Math.abs(closestDotAngleToAngleCW)) {
                    closestDotAngleToAngleCW = delta[2];
                    closestSlideCW = index;
                }
            });

            return  [
                        [ closestSlide, closestSlideCCW, closestSlideCW ]
                    ,   [ closestDotAngleToAngle, closestDotAngleToAngleCCW, closestDotAngleToAngleCW ]
                    ];
        }

        /**
         * Move to a specific slide.
         *
         * @method move
         * @chainable
         * @param {Number} [index] The slide to move to.
         */
        this.move = function(index) {
            var slideIndex = Math.max(0, isNaN(index) ? self.slideCurrent : index);

            if(slideIndex >= self.slidesTotal) {
                slideIndex = 0;
            }

            var angleDestination = self.dots[slideIndex] && self.dots[slideIndex].angle
            ,   angleDelta = _findShortestPath(angleDestination, self.angleCurrent)[0]
            ,   angleStep = angleDelta > 0 ? -2 : 2
            ;

            self.slideCurrent = slideIndex;
            _stepMove(angleStep, angleDelta, 50);

            self.start();

            return self;
        };

        /**
         * @method _sanitizeAngle
         * @private
         * @param {Number} [degrees]
         */
        function _sanitizeAngle(degrees) {
            return (degrees < 0) ? 360 + (degrees % -360) : degrees % 360;
        }

        /**
         * @method _stepMove
         * @private
         * @param {Number} [angleStep]
         * @param {Number} [angleDelta]
         * @param {Boolean} [stepInterval]
         */
        function _stepMove(angleStep, angleDelta, stepInterval) {
            var angleStepNew = angleStep
            ,   endAnimation = false
            ;

            if(Math.abs(angleStep) > Math.abs(angleDelta)) {
                angleStepNew = -angleDelta;
                endAnimation = true;
            } else if(hasRequestAnimationFrame) {
                requestAnimationFrame(function() {
                    _stepMove(angleStepNew, angleDelta + angleStep);
                });
            } else {
                animationTimer = setTimeout(function() {
                    _stepMove(angleStepNew, angleDelta + angleStep, stepInterval * 0.9);
                }, stepInterval);
            }

            self.angleCurrent = _sanitizeAngle(self.angleCurrent - angleStepNew);

            _setCSS(self.angleCurrent, endAnimation);
        }

        /**
         * @method _page
         * @private
         * @param {Object} [event]
         */
        function _page(event) {
            return {
                x: isTouchEvent ? event.targetTouches[0].pageX : (event.pageX || event.clientX),
                y: isTouchEvent ? event.targetTouches[0].pageY : (event.pageY || event.clientY)
            };
        }

        /**
         * @method _drag
         * @private
         * @param {Object} [event]
         */
        function _drag(event) {
            var containerOffset = $container.offset()
            ,   thumbPositionNew = {
                    left: _page(event).x - containerOffset.left - (containerSize.width / 2)
                ,   top: _page(event).y - containerOffset.top - (containerSize.height / 2)
            }
            ;

            self.angleCurrent = _sanitizeAngle(
                _toDegrees(
                    Math.atan2(thumbPositionNew.left, -thumbPositionNew.top)
                )
            );

            if (!hasRequestAnimationFrame) {
                _setCSS(self.angleCurrent);
            }

            return false;
        }

       /**
         * @method _setCSS
         * @private
         * @param {Number} [angle]
         * @param {Function} [fireCallback]
         */
        function _setCSS(angle, fireCallback) {
            closestSlidesAndAngles = _findClosestSlide(angle);
            closestSlides = closestSlidesAndAngles[0];
            closestAngles = closestSlidesAndAngles[1];

            $overview.css("left", -(closestSlides[1] * slideSize.width + Math.abs(closestAngles[1]) * slideSize.width / (Math.abs(closestAngles[1]) + Math.abs(closestAngles[2]))));
            $thumb.css({
                top: -Math.cos(_toRadians(angle)) * self.options.radius + (containerSize.height / 2 - thumbSize.height / 2)
            ,   left: Math.sin(_toRadians(angle)) * self.options.radius + (containerSize.width / 2 - thumbSize.width / 2)
            });

            if(fireCallback) {
                /**
                 * The move event will trigger when the carousel slides to a new slide.
                 *
                 * @event move
                 */
                $container.trigger("move", [$slides[self.slideCurrent], self.slideCurrent]);
            }
        }

        /**
         * @method _endDrag
         * @private
         * @param {Object} [event]
         */
        function _endDrag(event) {
            if($(event.target).hasClass("dot")) {
                return false;
            }
            self.dragging = false;
            event.preventDefault();

            $(document).unbind("mousemove mouseup");
            $thumb.unbind("mouseup");

            if(self.options.dotsHide) {
                $dots.stop(true, true).fadeOut("slow");
            }

            if(self.options.dotsSnap) {
                self.move(_findClosestSlide(self.angleCurrent)[0][0]);
            }
        }

        function _dragAnimationLoop() {
            if(self.dragging) {
                _setCSS(self.angleCurrent);
                requestAnimationFrame(function() {
                    _dragAnimationLoop();
                });
            }
        }

        /**
         * @method _startDrag
         * @private
         * @param {Object} [event]
         */
        function _startDrag(event) {
            event.preventDefault();
            isTouchEvent = event.type == 'touchstart';
            self.dragging = true;

            if($(event.target).hasClass("dot")) {
                return false;
            }

            self.stop();

            $(document).mousemove(_drag);
            $(document).mouseup(_endDrag);
            $thumb.mouseup(_endDrag);

            if(self.options.dotsHide) {
                $dots.stop(true, true).fadeIn("slow");
            }

            if(hasRequestAnimationFrame) {
                _dragAnimationLoop();
            }
        }

        return _initialize();
    }

    /**
    * @class tinycircleslider
    * @constructor
    * @param {Object} options
        @param {Boolean} [options.dotsSnap=false] Shows dots when user starts dragging and snap to them.
        @param {Boolean} [options.dotsHide=true] Fades out the dots when user stops dragging.
        @param {Number}  [options.radius=140] Used to determine the size of the circleslider.
        @param {Boolean} [options.interval=false] Move to another block on intervals.
        @param {Number}  [options.intervalTime=intervalTime] Interval time in milliseconds.
        @param {Number}  [options.start=0] The slide to start with.
    */
    $.fn[pluginName] = function(options) {
        return this.each(function() {
            if(!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin($(this), options));
            }
        });
    };
}));