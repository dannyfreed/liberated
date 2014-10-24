/**
 * PgwSlider - Version 2.2
 *
 * Copyright 2014, Jonathan M. Piat
 * http://pgwjs.com - http://pagawa.com
 * 
 * Released under the GNU GPLv3 license - http://opensource.org/licenses/gpl-3.0
 */
;(function($){
    $.fn.pgwSlider = function(options) {

        var defaults = {
            mainClassName : 'pgwSlider',
            listPosition : 'right',
            selectionMode : 'click',
            transitionEffect : 'fading',
            autoSlide : true,
            displayList : true,
            displayControls : false,
            touchControls : true,
            verticalCentering : false,
            adaptiveHeight : false,
            maxHeight : null,
            beforeSlide : null,
            afterSlide : null,
            adaptiveDuration : 200,
            transitionDuration : 500,
            intervalDuration : 3000
        };

        if (this.length == 0) {
            return this;
        } else if(this.length > 1) {
            this.each(function() {
                $(this).pgwSlider(options);
            });
            return this;
        }

        var pgwSlider = this;
        pgwSlider.plugin = this;
        pgwSlider.data = [];
        pgwSlider.config = {};
        pgwSlider.currentSlide = 0;
        pgwSlider.slideCount = 0;
        pgwSlider.resizeEvent = null;
        pgwSlider.intervalEvent = null;
        pgwSlider.touchFirstPosition = null;
        pgwSlider.transitionInProgress = false;
        pgwSlider.window = $(window);

        // Init
        var init = function() {

            // Merge user options with the default configuration
            pgwSlider.config = $.extend({}, defaults, options);

            // Setup
            setup();

            // Activate interval
            if (pgwSlider.config.autoSlide) {
                activateInterval();
            }

            return true;
        };

        // Get element
        var getElement = function(obj) {
            var element = {};

            // Get link
            var elementLink = obj.find('a').attr('href');
            if ((typeof elementLink != 'undefined') && (elementLink != '')) {
                element.link = elementLink;
                var elementLinkTarget = obj.find('a').attr('target');
                if ((typeof elementLinkTarget != 'undefined') && (elementLinkTarget != '')) {
                    element.linkTarget = elementLinkTarget;
                }
            }

            // Get image 
            var elementThumbnail = obj.find('img').attr('src');
            if ((typeof elementThumbnail != 'undefined') && (elementThumbnail != '')) {
                element.thumbnail = elementThumbnail;
            }

            var elementImage = obj.find('img').attr('data-large-src');
            if ((typeof elementImage != 'undefined') && (elementImage != '')) {
                element.image = elementImage;
            }

            // Get title 
            var elementSpan = obj.find('span').text();
            if ((typeof elementSpan != 'undefined') && (elementSpan != '') && (elementSpan != null)) {
                element.title = elementSpan;
            } else {
                var elementTitle = obj.find('img').attr('alt');
                if ((typeof elementTitle != 'undefined') && (elementTitle != '')) {
                    element.title = elementTitle;
                }
            }

            // Get description
            var elementDescription = obj.find('img').attr('data-description');
            if ((typeof elementDescription != 'undefined') && (elementDescription != '')) {
                element.description = elementDescription;
            }

            return element;
        };

        // Update the current height
        var updateHeight = function(height, animate) {

            // Check maxHeight
            if (pgwSlider.config.maxHeight) {
                if (pgwSlider.plugin.width() > 480 && height > pgwSlider.config.maxHeight) {
                    height = pgwSlider.config.maxHeight;
                } else if (pgwSlider.plugin.width() <= 480) {
                    if (height + pgwSlider.plugin.find('.ps-list').height() > pgwSlider.config.maxHeight) {
                        height = pgwSlider.config.maxHeight - pgwSlider.plugin.find('.ps-list').height();
                    }
                }
            }

            // Prevents multiple calculations in a short time
            clearTimeout(pgwSlider.resizeEvent);
            pgwSlider.resizeEvent = setTimeout(function() {

                // Adjust right list
                var elementHeight = ((height - ((pgwSlider.slideCount - 1) * 6)) / pgwSlider.slideCount);
                var elementWidth = (100 / pgwSlider.slideCount);
                pgwSlider.plugin.find('.ps-list > li').css({ width: elementWidth + '%' });

                // Adjust main container
                if (typeof animate != 'undefined' && animate && pgwSlider.config.maxHeight == null) {

                    if (typeof pgwSlider.plugin.find('.ps-current').animate == 'function') {
                        pgwSlider.plugin.find('.ps-current').animate({
                            height: height
                        }, pgwSlider.config.adaptiveDuration, function() {
                            pgwSlider.plugin.find('.ps-list > li').animate({ height: elementHeight }, pgwSlider.config.adaptiveDuration);
                        });
                    } else {
                        pgwSlider.plugin.find('.ps-current').css('height', height);
                        pgwSlider.plugin.find('.ps-list > li').css('height', elementHeight);
                    }

                } else {
                    pgwSlider.plugin.find('.ps-current').css('height', height);
                    pgwSlider.plugin.find('.ps-list > li').css('height', elementHeight);
                }

                // Vertical alignement
                if (pgwSlider.config.verticalCentering) {

                    // List elements
                    pgwSlider.plugin.find('.ps-list > li').each(function(){
                        if ((elementHeight > 50) && ($(this).find('img').height() > elementHeight)) {
                            var imageMargin = Math.round(($(this).find('img').height() - elementHeight) / 2);
                            $(this).find('img').css('margin-top', -imageMargin);

                        } else if ($(this).find('img').height() < elementHeight) {
                            var imageMargin = Math.round((elementHeight - $(this).find('img').height()) / 2);
                            $(this).find('img').css('margin-top', imageMargin);

                        } else {
                            $(this).find('img').css('margin-top', '');
                        }
                    });

                    // Current elements
                    pgwSlider.plugin.find('.ps-current > ul > li').each(function(){
                        var isVisible = ($(this).css('display') == 'none') ? false : true;

                        if (! isVisible) {
                            $(this).show();
                        }

                        if ($(this).show().find('img').height() > height) {
                            var imageMargin = Math.round(($(this).find('img').height() - height) / 2);
                            $(this).find('img').css('margin-top', -imageMargin);

                        } else if ($(this).show().find('img').height() < height) {
                            var imageMargin = Math.round((height - $(this).find('img').height()) / 2);
                            $(this).find('img').css('margin-top', imageMargin);

                        } else {
                            $(this).find('img').css('margin-top', '');
                        }

                        if (! isVisible) {
                            $(this).hide();
                        }
                    });
                }

            }, 100);

            return true;
        };

        // Set size class
        var setSizeClass = function() {

            if (pgwSlider.plugin.width() <= 480) {
                pgwSlider.plugin.addClass('narrow').removeClass('wide');
            } else {
                pgwSlider.plugin.addClass('wide').removeClass('narrow');
            }

            return true;
        };

        // Setup
        var setup = function() {

            // Create container
            pgwSlider.plugin.removeClass(pgwSlider.config.mainClassName).addClass('ps-list');
            pgwSlider.plugin.wrap('<div class="' + pgwSlider.config.mainClassName + '"></div>');
            pgwSlider.plugin = pgwSlider.plugin.parent();
            pgwSlider.plugin.prepend('<div class="ps-current"><ul></ul><span class="ps-caption"></span></div>');
            pgwSlider.slideCount = pgwSlider.plugin.find('.ps-list > li').length;

            if (pgwSlider.slideCount == 0) {
                throw new Error('PgwSlider - No slider item has been found');
                return false;
            }

            // Add controls
            if (pgwSlider.config.displayControls && pgwSlider.slideCount > 1) {
                pgwSlider.plugin.find('.ps-current').prepend('<span class="ps-prev"><span class="ps-prevIcon"></span></span>');
                pgwSlider.plugin.find('.ps-current').append('<span class="ps-next"><span class="ps-nextIcon"></span></span>');
                pgwSlider.plugin.find('.ps-current .ps-prev').click(function() {
                    pgwSlider.previousSlide();
                });
                pgwSlider.plugin.find('.ps-current .ps-next').click(function() {
                    pgwSlider.nextSlide();
                });
            }
            
            // Disable list
            if (! pgwSlider.config.displayList) {
                pgwSlider.plugin.find('.ps-current').css('width', '100%');
                pgwSlider.plugin.find('.ps-list').hide();
            }

            // Get slider elements
            var elementId = 1;
            pgwSlider.plugin.find('.ps-list > li').each(function() {
                var element = getElement($(this));
                element.id = elementId;
                pgwSlider.data.push(element);

                $(this).addClass('elt_' + element.id);

                // Check element title
                if (element.title) {
                    if ($(this).find('span').length == 1) {
                        if ($(this).find('span').text() == '') {
                            $(this).find('span').text(element.title);
                        }
                    } else {
                        $(this).find('img').after('<span>' + element.title + '</span>');
                    }
                }

                // Set element in the current list
                var currentElement = $('<li class="elt_' + elementId + '"></li>');

                if (element.image) {
                    currentElement.html('<img src="' + element.image + '" alt="' + (element.title ? element.title : '') + '">');
                } else if (element.thumbnail) {
                    currentElement.html('<img src="' + element.thumbnail + '" alt="' + (element.title ? element.title : '') + '">');
                }

                if (element.link) {
                    currentElement.html('<a href="' + element.link + '"' + (element.linkTarget ? ' target="' + element.linkTarget + '"' : '') + '>' + currentElement.html() + '</a>');
                }

                pgwSlider.plugin.find('.ps-current > ul').append(currentElement);

                // Set selection mode
                if ((pgwSlider.config.selectionMode == 'mouseOver') && (pgwSlider.config.transitionEffect == 'fading')) {
                    $(this).css('cursor', 'default').click(function(event) {
                        event.preventDefault();
                    }).bind('mouseenter', function(event) {
                        displayElement(element.id);
                    });
                    $(this).find('a').css('cursor', 'default');
                } else {
                    $(this).css('cursor', 'pointer').click(function(event) {
                        event.preventDefault();
                        displayElement(element.id);
                    });
                }

                elementId++;
            });

            // Set list position
            if (pgwSlider.config.listPosition == 'left') {
                pgwSlider.plugin.addClass('listOnTheLeft');
            }

            // Attach slide events
            if (pgwSlider.config.autoSlide) {
                pgwSlider.plugin.on('mouseenter', function() {
                    clearInterval(pgwSlider.intervalEvent);
                    pgwSlider.intervalEvent = null;
                }).on('mouseleave', function() {
                    activateInterval();
                });
            }

            // Display the first element
            displayElement(1);

            // Set the first height
            pgwSlider.plugin.find('.ps-current > ul > li.elt_1 img').on('load', function() {
                setSizeClass();

                var maxHeight = pgwSlider.plugin.find('.ps-current > ul > li.elt_1 img').height();
                updateHeight(maxHeight);

                pgwSlider.window.resize(function() {
                    // The new class must be set before the recalculation of the height.
                    setSizeClass();

                    var maxHeight = pgwSlider.plugin.find('.ps-current > ul > li.elt_' + pgwSlider.currentSlide + ' img').height();
                    updateHeight(maxHeight, pgwSlider.config.adaptiveHeight);
                });
            });

            // Touch controls for current image
            if (pgwSlider.config.touchControls && pgwSlider.slideCount > 1) {

                pgwSlider.plugin.find('.ps-current').on('touchstart', function(e) {
                    try {
                        if (e.originalEvent.touches[0].clientX && pgwSlider.touchFirstPosition == null) {
                            pgwSlider.touchFirstPosition = e.originalEvent.touches[0].clientX;
                        }
                    } catch(e) {
                        pgwSlider.touchFirstPosition = null;
                    }
                });

                pgwSlider.plugin.find('.ps-current').on('touchmove', function(e) {
                    try {
                        if (e.originalEvent.touches[0].clientX && pgwSlider.touchFirstPosition != null) {
                            if (e.originalEvent.touches[0].clientX > (pgwSlider.touchFirstPosition + 50)) {
                                pgwSlider.touchFirstPosition = null;
                                pgwSlider.previousSlide();
                            } else if (e.originalEvent.touches[0].clientX < (pgwSlider.touchFirstPosition - 50)) {
                                pgwSlider.touchFirstPosition = null;
                                pgwSlider.nextSlide();
                            }
                        }
                    } catch(e) {
                        pgwSlider.touchFirstPosition = null;
                    }
                });

                pgwSlider.plugin.find('.ps-current').on('touchend', function(e) {
                    pgwSlider.touchFirstPosition = null;
                });
            }
            
            return true;
        };

        // Setup
        var finishElement = function(element) {
        
            // Element caption
            var elementText = '';
            if (element.title) {
                elementText += '<b>' + element.title + '</b>';
            }

            if (element.description) {
                if (elementText != '') elementText += '<br>';
                elementText += element.description;
            }

            if (elementText != '') {
                if (element.link) {
                    elementText = '<a href="' + element.link + '"' + (element.linkTarget ? ' target="' + element.linkTarget + '"' : '') + '>' + elementText + '</a>';
                }

                if (typeof pgwSlider.plugin.find('.ps-caption').fadeOut == 'function') {
                    pgwSlider.plugin.find('.ps-caption').html(elementText);
                    pgwSlider.plugin.find('.ps-caption, .ps-prev, .ps-next').fadeIn(pgwSlider.config.transitionDuration / 2);
                } else {
                    pgwSlider.plugin.find('.ps-caption').html(elementText);
                    pgwSlider.plugin.find('.ps-caption, .ps-prev, .ps-next').show();
                }
            }

            // After slide
            if (typeof pgwSlider.config.afterSlide == 'function') {
                pgwSlider.config.afterSlide(element.id);
            }

            // Set the container height
            if (pgwSlider.config.adaptiveHeight) {
                var maxHeight = pgwSlider.plugin.find('.ps-current .elt_' + element.id + ' img').height();
                updateHeight(maxHeight, true);
            }

            return true;
        }

        // Fade an element
        var fadeElement = function(element) {
            var elementContainer = pgwSlider.plugin.find('.ps-current > ul');

            // Update list items
            pgwSlider.plugin.find('.ps-list > li').css('opacity', '0.6');
            pgwSlider.plugin.find('.ps-list > li.elt_' + element.id).css('opacity', '1');

            elementContainer.find('li').not('.elt_' + pgwSlider.currentSlide).not('.elt_' + element.id).each(function(){
                if (typeof $(this).stop == 'function') {
                    $(this).stop();
                }
                $(this).css('position', '').css('z-index', 1).hide();
            });

            // Current element
            if (pgwSlider.currentSlide > 0) {
                var currentElement = elementContainer.find('.elt_' + pgwSlider.currentSlide);

                if (typeof currentElement.animate != 'function') {
                    currentElement.animate = function(css, duration, callback) {
                        currentElement.css(css);
                        if (callback) {
                            callback();
                        }
                    };
                }

                if (typeof currentElement.stop == 'function') {
                    currentElement.stop();
                }

                currentElement.css('position', 'absolute').animate({
                    opacity : 0,
                }, pgwSlider.config.transitionDuration, function() {
                    currentElement.css('position', '').css('z-index', 1).hide();
                });
            }

            // Update current id
            pgwSlider.currentSlide = element.id;

            // Next element
            var nextElement = elementContainer.find('.elt_' + element.id);

            if (typeof nextElement.animate != 'function') {
                nextElement.animate = function(css, duration, callback) {
                    nextElement.css(css);
                    if (callback) {
                        callback();
                    }
                };
            }

            if (typeof nextElement.stop == 'function') {
                nextElement.stop();
            }

            nextElement.css('position', 'absolute').show().animate({
                opacity : 1,
            }, pgwSlider.config.transitionDuration, function() {
                nextElement.css('position', '').css('z-index', 2).show();
                finishElement(element);
            });

            return true;
        }

        // Slide an element
        var slideElement = function(element, direction) {
            var elementContainer = pgwSlider.plugin.find('.ps-current > ul');

            if (typeof direction == 'undefined') {
                direction = 'left';
            }

            if (pgwSlider.currentSlide == 0) {
                elementContainer.find('.elt_1').css({
                    position : '',
                    left : '',
                    opacity : 1,
                    'z-index' : 2
                }).show();
                pgwSlider.plugin.find('.ps-list > li.elt_1').css('opacity', '1');
                finishElement(element);

            } else {

                if (pgwSlider.transitionInProgress) {
                    return false;
                }

                pgwSlider.transitionInProgress = true;

                // Get direction details
                var elementWidth = elementContainer.width();

                if (direction == 'left') {
                    var elementDest = -elementWidth;
                    var nextOrigin = elementWidth;
                } else {
                    var elementDest = elementWidth;
                    var nextOrigin = -elementWidth;
                }

                var currentElement = elementContainer.find('.elt_' + pgwSlider.currentSlide);

                if (typeof currentElement.animate != 'function') {
                    currentElement.animate = function(css, duration, callback) {
                        currentElement.css(css);
                        if (callback) {
                            callback();
                        }
                    };
                }

                currentElement.css('position', 'absolute').animate({
                    left : elementDest,
                }, pgwSlider.config.transitionDuration, function() {
                    currentElement.css('position', '').css('z-index', 1).css('left', '').css('opacity', 0).hide();
                });

                // Next element
                var nextElement = elementContainer.find('.elt_' + element.id);

                if (typeof nextElement.animate != 'function') {
                    nextElement.animate = function(css, duration, callback) {
                        nextElement.css(css);
                        if (callback) {
                            callback();
                        }
                    };
                }

                nextElement.css('position', 'absolute').css('left', nextOrigin).css('opacity', 1).show().animate({
                    left : 0,
                }, pgwSlider.config.transitionDuration, function() {
                    nextElement.css('position', '').css('left', '').css('z-index', 2).show();
                    pgwSlider.transitionInProgress = false;

                    // Display new element
                    pgwSlider.plugin.find('.ps-list > li').css('opacity', '0.6');
                    pgwSlider.plugin.find('.ps-list > li.elt_' + element.id).css('opacity', '1');

                    finishElement(element);
                });
            }

            // Update current id
            pgwSlider.currentSlide = element.id;

            return true;
        }

        // Display the current element
        var displayElement = function(elementId, apiController, direction) {

            if (elementId == pgwSlider.currentSlide) {
                return false;
            }

            var element = pgwSlider.data[elementId - 1];

            if (typeof element == 'undefined') {
                throw new Error('PgwSlider - The element ' + elementId + ' is undefined');
                return false;
            }

            if (typeof direction == 'undefined') {
                direction = 'left';
            }

            // Before slide
            if (typeof pgwSlider.config.beforeSlide == 'function') {
                pgwSlider.config.beforeSlide(elementId);
            }

            if (typeof pgwSlider.plugin.find('.ps-caption').fadeOut == 'function') {
                pgwSlider.plugin.find('.ps-caption, .ps-prev, .ps-next').fadeOut(pgwSlider.config.transitionDuration / 2);
            } else {
                pgwSlider.plugin.find('.ps-caption, .ps-prev, .ps-next').hide();
            }

            // Choose the transition effect
            if (pgwSlider.config.transitionEffect == 'sliding') {
                slideElement(element, direction);
            } else {
                fadeElement(element);
            }

            // Reset interval to avoid a half interval after an API control
            if (typeof apiController != 'undefined' && pgwSlider.config.autoSlide) {
                activateInterval();
            }

            return true;
        };

        // Activate interval
        var activateInterval = function() {
            clearInterval(pgwSlider.intervalEvent);

            if (pgwSlider.slideCount > 1 && pgwSlider.config.autoSlide) {
                pgwSlider.intervalEvent = setInterval(function() {
                    if (pgwSlider.currentSlide + 1 <= pgwSlider.slideCount) {
                        var nextItem = pgwSlider.currentSlide + 1;
                    } else {
                        var nextItem = 1;
                    }
                    displayElement(nextItem);
                }, pgwSlider.config.intervalDuration);
            }

            return true;
        };

        // Start auto slide
        pgwSlider.startSlide = function() {
            pgwSlider.config.autoSlide = true;
            activateInterval();
            return true;
        };

        // Stop auto slide
        pgwSlider.stopSlide = function() {
            pgwSlider.config.autoSlide = false;
            clearInterval(pgwSlider.intervalEvent);
            return true;
        };

        // Get current slide
        pgwSlider.getCurrentSlide = function() {
            return pgwSlider.currentSlide;
        };

        // Get slide count
        pgwSlider.getSlideCount = function() {
            return pgwSlider.slideCount;
        };

        // Display slide
        pgwSlider.displaySlide = function(itemId) {
            displayElement(itemId, true);
            return true;
        };

        // Next slide
        pgwSlider.nextSlide = function() {
            if (pgwSlider.currentSlide + 1 <= pgwSlider.slideCount) {
                var nextItem = pgwSlider.currentSlide + 1;
            } else {
                var nextItem = 1;
            }
            displayElement(nextItem, true, 'left');
            return true;
        };

        // Previous slide
        pgwSlider.previousSlide = function() {
            if (pgwSlider.currentSlide - 1 >= 1) {
                var previousItem = pgwSlider.currentSlide - 1;
            } else {
                var previousItem = pgwSlider.slideCount;
            }
            displayElement(previousItem, true, 'right');
            return true;
        };

        // Destroy slider
        pgwSlider.destroy = function(soft) {
            clearInterval(pgwSlider.intervalEvent);

            if (typeof soft != 'undefined') {
                pgwSlider.plugin.find('.ps-list > li').each(function() {
                    $(this).attr('style', '').removeClass().css('cursor', '').unbind('click').unbind('mouseenter');
                    $(this).find('a').css('cursor', '');
                    $(this).find('img').attr('style', '');
                });

                pgwSlider.plugin.find('.ps-list').addClass(pgwSlider.config.mainClassName).removeClass('ps-list');
                pgwSlider.plugin.find('.ps-current').unwrap().remove();
                pgwSlider.hide();

            } else {
                pgwSlider.parent().remove();
            }

            pgwSlider.plugin = null;
            pgwSlider.data = [];
            pgwSlider.config = {};
            pgwSlider.currentSlide = 0;
            pgwSlider.slideCount = 0;
            pgwSlider.resizeEvent = null;
            pgwSlider.intervalEvent = null;
            pgwSlider.touchFirstPosition = null;
            pgwSlider.transitionInProgress = false;
            pgwSlider.window = null;

            return true;
        };

        // Reload slider
        pgwSlider.reload = function(newOptions) {
            pgwSlider.destroy(true);

            pgwSlider = this;
            pgwSlider.plugin = this;
            pgwSlider.window = $(window);
            pgwSlider.plugin.show();

            // Merge new options with the default configuration
            pgwSlider.config = $.extend({}, defaults, newOptions);

            // Setup
            setup();

            // Activate interval
            if (pgwSlider.config.autoSlide) {
                activateInterval();
            }

            return true;
        };

        // Slider initialization
        init();

        return this;
    }
})(window.Zepto || window.jQuery);



//Now use it


$(document).ready(function() {
    $('.pgwSlider').pgwSlider();
});





//jimmied script to do featured articles. replaced with |where filter
// $('#hot-off-press a').each(function () {
//     if($(this).data('featured') == 'Yes'){
//         $(this).addClass('featured');
//     }
//     else {
//         $(this).addClass('not-featured');
//     }
 
// });



$('.iframe iframe').attr('height','340');
$('.iframe iframe').attr('width','100%');
$('.iframe iframe').css('margin-top:0');
$('.iframe iframe').css('margin-bottom:0');


//INSTAFEED.JS

// Generated by CoffeeScript 1.3.3
(function(){var e,t;e=function(){function e(e,t){var n,r;this.options={target:"instafeed",get:"popular",resolution:"thumbnail",sortBy:"none",links:!0,mock:!1,useHttp:!1};if(typeof e=="object")for(n in e)r=e[n],this.options[n]=r;this.context=t!=null?t:this,this.unique=this._genKey()}return e.prototype.hasNext=function(){return typeof this.context.nextUrl=="string"&&this.context.nextUrl.length>0},e.prototype.next=function(){return this.hasNext()?this.run(this.context.nextUrl):!1},e.prototype.run=function(t){var n,r,i;if(typeof this.options.clientId!="string"&&typeof this.options.accessToken!="string")throw new Error("Missing clientId or accessToken.");if(typeof this.options.accessToken!="string"&&typeof this.options.clientId!="string")throw new Error("Missing clientId or accessToken.");return this.options.before!=null&&typeof this.options.before=="function"&&this.options.before.call(this),typeof document!="undefined"&&document!==null&&(i=document.createElement("script"),i.id="instafeed-fetcher",i.src=t||this._buildUrl(),n=document.getElementsByTagName("head"),n[0].appendChild(i),r="instafeedCache"+this.unique,window[r]=new e(this.options,this),window[r].unique=this.unique),!0},e.prototype.parse=function(e){var t,n,r,i,s,o,u,a,f,l,c,h,p,d,v,m,g,y,b,w,E,S;if(typeof e!="object"){if(this.options.error!=null&&typeof this.options.error=="function")return this.options.error.call(this,"Invalid JSON data"),!1;throw new Error("Invalid JSON response")}if(e.meta.code!==200){if(this.options.error!=null&&typeof this.options.error=="function")return this.options.error.call(this,e.meta.error_message),!1;throw new Error("Error from Instagram: "+e.meta.error_message)}if(e.data.length===0){if(this.options.error!=null&&typeof this.options.error=="function")return this.options.error.call(this,"No images were returned from Instagram"),!1;throw new Error("No images were returned from Instagram")}this.options.success!=null&&typeof this.options.success=="function"&&this.options.success.call(this,e),this.context.nextUrl="",e.pagination!=null&&(this.context.nextUrl=e.pagination.next_url);if(this.options.sortBy!=="none"){this.options.sortBy==="random"?d=["","random"]:d=this.options.sortBy.split("-"),p=d[0]==="least"?!0:!1;switch(d[1]){case"random":e.data.sort(function(){return.5-Math.random()});break;case"recent":e.data=this._sortBy(e.data,"created_time",p);break;case"liked":e.data=this._sortBy(e.data,"likes.count",p);break;case"commented":e.data=this._sortBy(e.data,"comments.count",p);break;default:throw new Error("Invalid option for sortBy: '"+this.options.sortBy+"'.")}}if(typeof document!="undefined"&&document!==null&&this.options.mock===!1){a=e.data,this.options.limit!=null&&a.length>this.options.limit&&(a=a.slice(0,this.options.limit+1||9e9)),n=document.createDocumentFragment(),this.options.filter!=null&&typeof this.options.filter=="function"&&(a=this._filter(a,this.options.filter));if(this.options.template!=null&&typeof this.options.template=="string"){i="",o="",l="",v=document.createElement("div");for(m=0,b=a.length;m<b;m++)s=a[m],u=s.images[this.options.resolution].url,this.options.useHttp||(u=u.replace("http://","//")),o=this._makeTemplate(this.options.template,{model:s,id:s.id,link:s.link,image:u,caption:this._getObjectProperty(s,"caption.text"),likes:s.likes.count,comments:s.comments.count,location:this._getObjectProperty(s,"location.name")}),i+=o;v.innerHTML=i,S=[].slice.call(v.childNodes);for(g=0,w=S.length;g<w;g++)h=S[g],n.appendChild(h)}else for(y=0,E=a.length;y<E;y++)s=a[y],f=document.createElement("img"),u=s.images[this.options.resolution].url,this.options.useHttp||(u=u.replace("http://","//")),f.src=u,this.options.links===!0?(t=document.createElement("a"),t.href=s.link,t.appendChild(f),n.appendChild(t)):n.appendChild(f);document.getElementById(this.options.target).appendChild(n),r=document.getElementsByTagName("head")[0],r.removeChild(document.getElementById("instafeed-fetcher")),c="instafeedCache"+this.unique,window[c]=void 0;try{delete window[c]}catch(x){}}return this.options.after!=null&&typeof this.options.after=="function"&&this.options.after.call(this),!0},e.prototype._buildUrl=function(){var e,t,n;e="https://api.instagram.com/v1";switch(this.options.get){case"popular":t="media/popular";break;case"tagged":if(typeof this.options.tagName!="string")throw new Error("No tag name specified. Use the 'tagName' option.");t="tags/"+this.options.tagName+"/media/recent";break;case"location":if(typeof this.options.locationId!="number")throw new Error("No location specified. Use the 'locationId' option.");t="locations/"+this.options.locationId+"/media/recent";break;case"user":if(typeof this.options.userId!="number")throw new Error("No user specified. Use the 'userId' option.");if(typeof this.options.accessToken!="string")throw new Error("No access token. Use the 'accessToken' option.");t="users/"+this.options.userId+"/media/recent";break;default:throw new Error("Invalid option for get: '"+this.options.get+"'.")}return n=""+e+"/"+t,this.options.accessToken!=null?n+="?access_token="+this.options.accessToken:n+="?client_id="+this.options.clientId,this.options.limit!=null&&(n+="&count="+this.options.limit),n+="&callback=instafeedCache"+this.unique+".parse",n},e.prototype._genKey=function(){var e;return e=function(){return((1+Math.random())*65536|0).toString(16).substring(1)},""+e()+e()+e()+e()},e.prototype._makeTemplate=function(e,t){var n,r,i,s,o;r=/(?:\{{2})([\w\[\]\.]+)(?:\}{2})/,n=e;while(r.test(n))i=n.match(r)[1],s=(o=this._getObjectProperty(t,i))!=null?o:"",n=n.replace(r,""+s);return n},e.prototype._getObjectProperty=function(e,t){var n,r;t=t.replace(/\[(\w+)\]/g,".$1"),r=t.split(".");while(r.length){n=r.shift();if(!(e!=null&&n in e))return null;e=e[n]}return e},e.prototype._sortBy=function(e,t,n){var r;return r=function(e,r){var i,s;return i=this._getObjectProperty(e,t),s=this._getObjectProperty(r,t),n?i>s?1:-1:i<s?1:-1},e.sort(r.bind(this)),e},e.prototype._filter=function(e,t){var n,r,i,s,o;n=[],i=function(e){if(t(e))return n.push(e)};for(s=0,o=e.length;s<o;s++)r=e[s],i(r);return n},e}(),t=typeof exports!="undefined"&&exports!==null?exports:window,t.Instafeed=e}).call(this);

//USE IT

    // var feed = new Instafeed({
    //     get: 'tagged',
    //     tagName: 'griz',
    //     clientId: 'a98f746562ce4f1a91bc37f02035a1da',
    //     limit: '1'
    // });
    // feed.run();

//aside
    var userFeed = new Instafeed({
        get: 'user',
        userId: 16269550,
        accessToken: '16269550.467ede5.f420519e75b746ce863133bbefe2e3ba',
        limit: '1',
        resolution: 'standard_resolution',
        template: '<a target=_blank" href="{{link}}"><img class="img-responsive" src="{{image}}" /></a>'
    });
    userFeed.run();
//Need to give access to your instagram account....see here:  https://instagram.com/oauth/authorize/?client_id=467ede5a6b9b48ae8e03f4e2582aeeb3&redirect_uri=http://instafeedjs.com&response_type=token

//griz
    var userFeed = new Instafeed({
        target: 'griz-feed',
        get: 'user',
        userId: 16269550,
        accessToken: '16269550.467ede5.f420519e75b746ce863133bbefe2e3ba',
        limit: '10',
        resolution: 'standard_resolution',
        template: '<a target=_blank" href="{{link}}"><img style="width:100px; height:100px; display:inline-block" src="{{image}}" /></a>'
    });
    userFeed.run();


