/*
        I believe VectorScrolling can be smaller and easier to use.

        Chose to make a document.vstools object for reducing overhead of repeated functions.
        watch: objects that should be taken into consideration when scrolling
        wcroll: event to fire when a scroll event happens
        loop: runs repeatedly when the play() method is called. pause() is obvious
    */
   document.vstools = {
    watch: [],
    paused: true,
    scroll: function(evt) {
        /* 
            confirmed: this.watch = this object
            Now. The hard part, What to seek to. There are 4 values we need to know.
            Where is the top when we start, where is the top when we finish?
            [0, 1, .5, .5]
        */
        for(var i = 0, n, a, b; i < document.vstools.watch.length; i++){
            n = document.vstools.watch[i].element.offset().top - $(window).scrollTop();
            a = ($(window).height() * document.vstools.watch[i].as[1]) - (document.vstools.watch[i].element.height() * document.vstools.watch[i].as[0]);
            b = ($(window).height() * document.vstools.watch[i].as[3]) - (document.vstools.watch[i].element.height() * document.vstools.watch[i].as[2]);
            document.vstools.watch[i].perc = document.vstools.utils.map(n, a, b, 0, 1);
        }
    },
    loop: function(bool){
        // going directly there.
        for(var i = 0; i < document.vstools.watch.length; i++){
            document.vstools.watch[i].stepPerc += (document.vstools.watch[i].perc - document.vstools.watch[i].stepPerc) / document.vstools.watch[i].sluggishness;
            document.vstools.watch[i].tl.seek(document.vstools.watch[i].tl.totalDuration() * document.vstools.watch[i].stepPerc, false) 
        }

        if(!document.vstools.paused) {
            requestAnimationFrame(document.vstools.loop);
        }
    },
    pause: function(){
        document.vstools.paused = true;
    },
    play: function() {
        this.paused = false;
        document.vstools.loop();
    },
    utils: {
        normalize: function($value, $min, $max) {
            return ($value - $min) / ($max - $min);
        },
        interpolate: function($normValue, $min, $max) {
            return $min + ($max - $min) * $normValue;
        },
        map: function($value, $min1, $max1, $min2, $max2) {
            
            var interp = this.interpolate(this.normalize($value, $min1, $max1), $min2, $max2);
            if(interp < $min2) {
                interp = $min2;
            }
            if(interp > $max2) {
                interp = $max2;
            }

            return interp;
        }
    }
};

//setup resize event
window.addEventListener('resize', document.vstools.scroll, {passive: true});
document.addEventListener('scroll', document.vstools.scroll, {passive: true});

$.fn.vs = function(options) {


    /*
        Every new instance of vs() gets it's own TimelineLite object

        default functionality is as the element comes onto the screen
        from the bottom of the screen, until it gets to centered in the viewport
        use decimal percentage from the start.

        specify a position as 0 to start;
    */
   return this.each(function() {

        var scrollvector = {
            element: $(this),
            tl: new TimelineLite({
                paused: true
            }),
            as: options.as || [0, 1, 0, 0],
            perc: 0,
            stepPerc: 0,
            sluggishness: options.sluggishness || 1 
        }

        /*
            loop through the options passed
            if TimelineLite has a property that matches,
            build the timeline with it.
            ** Substitute the current element, as well as an arbitrary duration.
        */
        for(var key in options) {
            if(typeof scrollvector.tl[key] === 'function') {
                scrollvector.tl[key](scrollvector.element, 10, options[key]);
            }
        }

        /*
            Now we need to package up and start watching
        */
        document.vstools.watch.push(scrollvector);
        document.vstools.scroll();
        document.vstools.play();
    });
};