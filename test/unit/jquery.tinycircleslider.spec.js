describe('A single Tinycircleslider', function() {
    before(function () {
        document.head.innerHTML = __html__['test/fixtures/tinycircleslider-css.html'];
    });

    beforeEach(function () {
        document.body.innerHTML = __html__['test/fixtures/tinycircleslider.html'];
    });

    afterEach(function () {
        document.body.innerHTML = '';
    });

    it('should have a chainable constructor', function() {
        $('#rotatescroll').tinycircleslider().addClass('testing');

        expect($('#rotatescroll').hasClass('testing')).to.equal(true);
    });

    it('should have a accessible instance', function() {
        var instance = $('#rotatescroll').tinycircleslider().data('plugin_tinycircleslider');

        expect(instance).to.be.a('object');
        expect(instance._name).to.equal('tinycircleslider');
    });

    it('should have a chainable stop method', function() {
        var instance = $('#rotatescroll').tinycircleslider().data('plugin_tinycircleslider');

        expect(instance.stop()._name).to.equal('tinycircleslider');
    });

    it('should stop automatic sliding when stop method is called.', function() {
        var instance = $('#rotatescroll').tinycircleslider({ interval : true }).data('plugin_tinycircleslider');

        expect(instance.stop().intervalActive).to.equal(false);
    });

    it('should have a chainable start method', function() {
        var instance = $('#rotatescroll').tinycircleslider().data('plugin_tinycircleslider');

        expect(instance.start()._name).to.equal('tinycircleslider');
    });

    it('should not start automatic sliding when start method is called and interval is not allowed.', function() {
        var instance = $('#rotatescroll').tinycircleslider().data('plugin_tinycircleslider');

        expect(instance.start().intervalActive).to.equal(false);
    });

    it('should start automatic sliding when start method is called and interval is allowed.', function() {
        var instance = $('#rotatescroll').tinycircleslider({ interval : true }).data('plugin_tinycircleslider');

        instance.stop();

        expect(instance.start().intervalActive).to.equal(true);
    });

    it('should have a chainable move method', function() {
        var instance = $('#rotatescroll').tinycircleslider().data('plugin_tinycircleslider');

        expect(instance.move()._name).to.equal('tinycircleslider');
    });

    it('should move to first slide if given index is less then 1', function() {
        var instance = $('#rotatescroll').tinycircleslider().data('plugin_tinycircleslider');

        instance.move(-1);

        expect(instance.slideCurrent).to.equal(0);
    });

    it('should move to the first slide if given index is more then slidesTotal', function() {
        var instance = $('#rotatescroll').tinycircleslider().data('plugin_tinycircleslider');

        instance.move(100);

        expect(instance.slideCurrent).to.equal(0);
    });

    it('should stay in place if move method is called without arguments', function() {
        var instance = $('#rotatescroll').tinycircleslider().data('plugin_tinycircleslider')
        ,   currentSlide = instance.slideCurrent
        ;

        instance.move();

        expect(instance.slideCurrent).to.equal(currentSlide);
    });
});
