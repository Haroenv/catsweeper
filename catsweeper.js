(function($) {

  // CATSWEEPER CLASS DEFINITION
  // ===========================

  var Catsweeper = function(element, options) {
    this.$element = $(element);
    this.options  = $.extend({}, Catsweeper.DEFAULTS, options);

    this.catdex   = [];   //indices of placed cats
    this.counts   = {};   //neighboring cat counts
    this.$cells   = null; //1-dimensional array representation

    this.$element
      .on('click', 'a.cell', $.proxy(this.click, this))
      .on('start', $.proxy(this.start, this));

    this.render();
  }

  Catsweeper.DEFAULTS = {
    rows: 8,
    columns: 8,
    cats: 10
  };

  // rendering
  // =========

  Catsweeper.prototype.render = function() {
    var size  = this.options.rows * this.options.columns;
    var cells = (new Array(size+1)).join('<a class="cell"></a>');

    this.$element.html('<div class="catgrid">' + cells + '</div>');

    this.$cells = $('a.cell', this.$element);

    return this.resize();
  };

  Catsweeper.prototype.resize = function() {
    var width  = this.$cells[0].offsetWidth;
    var height = this.$cells[0].offsetHeight;

    this.$cells.parent()
      .width(this.options.columns * width)
      .height(this.options.rows * height);

    //force new game upon resize
    this.$element.trigger('start');

    return this;
  };

  Catsweeper.prototype.reset = function() {
    this.$element.removeClass('win fail');
    this.$cells.removeClass('seen fail cat').html('');

    return this;
  };

  // gamedata
  // ========

  Catsweeper.prototype.catify = function() {
    var rows    = this.options.rows;
    var columns = this.options.columns;
    var cats    = this.options.cats;

    var catdex  = [];

    for (var i=0, n=rows*columns; i<n; i++) {
      catdex[i] = i;
    }

    //shuffles
    for (var i=0, n=rows*columns; i<n; i++) {
      var rand = Math.floor(Math.random() * (i+1));
      var value = catdex[i];
      catdex[i] = catdex[rand];
      catdex[rand] = value;
    };

    return catdex.slice(0, Math.max(0, cats));
  };

  Catsweeper.prototype.calculate = function() {
    var rows    = this.options.rows;
    var columns = this.options.columns;

    var counts  = {};

    for (var i=0, n=this.catdex.length; i<n; i++) {
      var neighbors = getNeighbors(this.catdex[i], rows, columns);
      while (neighbors.length) {
        var neighbor = neighbors.pop();
        if (neighbor in counts) counts[neighbor]++;
        else counts[neighbor] = 1;
      }
    }

    return counts;
  };

  // gameplay
  // ========

  Catsweeper.prototype.start = function(e) {
    this.catdex = this.catify();
    this.counts = this.calculate();

    return this.reset();
  };

  Catsweeper.prototype.validate = function() {
    var rows    = this.options.rows;
    var columns = this.options.columns;

    //needs more

    if (this.$cells.not('.seen').length == this.catdex.length) {
      this.gameover(true);
    }

    return this;
  };

  Catsweeper.prototype.gameover = function(win) {
    this.$element.addClass(win ? 'win' : 'fail');

    //reveal cells
    this.$cells.not('.seen').addClass(win ? 'seen' : 'fail');

    //reveal cats
    for (var i=0, n=this.catdex.length; i<n; i++) {
      this.$cells.eq(this.catdex[i]).addClass('cat');
    }

    //new game
    this.$element.one('click', $.proxy(this.start, this));

    return this;
  };

  Catsweeper.prototype.click = function(e) {
    var $cell = $(e.target);
    var index = $cell.index();

    //important
    e.preventDefault();

    if ($cell.hasClass('seen')) {
      //do nothing

    } else if ($.inArray(index, this.catdex) == -1) {
      //no cat, reveal
      this.reveal(index, {});

      //check if won
      this.validate();

    } else {
      //stepped on a cat, game over
      this.gameover();

    }

  };

  Catsweeper.prototype.reveal = function(index, seen) {
    var rows    = this.options.rows;
    var columns = this.options.columns;

    var $cell   = this.$cells.eq(index);

    seen[index] = true;

    if (index in this.counts) {
      $cell.addClass('seen');

      //show count
      $cell.html(this.counts[index]);

    } else if (!$cell.hasClass('seen')) {
      $cell.addClass('seen');

      //expand section
      var neighbors = getNeighbors(index, rows, columns);
      while (neighbors.length) {
        var neighbor = neighbors.pop();
        if (neighbor in seen) continue;
        this.reveal(neighbor, seen);
      }

    }

  }

  // utils
  // =====

  function toIndex(x, y, columns) {
    return y * columns + x;
  }

  function toXY(index, columns) {
    return [index % columns, Math.floor(index / columns)];
  }

  function getNeighbors(index, rows, columns) {
    var xy  = toXY(index, columns);

    var min = [Math.max(0, xy[0]-1), Math.max(0, xy[1]-1)];
    var max = [Math.min(xy[0]+2, columns), Math.min(xy[1]+2, rows)];

    var neighbors = [];

    for (var y=min[1]; y<max[1]; y++) {
      for (var x=min[0]; x<max[0]; x++) {
        var neighbor = toIndex(x, y, columns);
        if (neighbor != index) neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  // CATSWEEPER PLUGIN DEFINITION
  // ============================

  $.fn.catsweep = function(options) {
    return this.each(function() {
      var $this   = $(this);
      var game    = $this.data('cat.game');

      if (!game) $this.data('cat.game', (game = new Catsweeper(this, options)));
    });
  };

}(jQuery));
