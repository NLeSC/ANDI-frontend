'use strict';
// test data goes here
/**
 * @ngdoc function
 * @name andiApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the andiApp
 */
/*
  @name andiApp.controller:plotController
  @description : put third tab chart event
*/
//app.controller('plotController', function ($scope, ocpuService) {
app.controller('plotController', function ($scope, ocpuService) {
  var plotCtrl = this;

  $scope.errorMessage = null;

  var patients;

  var color = d3.scale.category10();

  var add_legend = function (element, patients, pos){
    var legendSpace = 20;
    element.append('text')
      .attr('x', pos)
      .attr('y', 0)
      .attr('class', 'legend legend-title')
      .text('Click to (de)select:');

    patients.forEach(function (p, i) {
        element.append('text')
          .attr('x', pos)
          .attr('y', (i+1) * (legendSpace))
          .attr('class', 'legend legend-p' + p.key.replace(/\s+/g, ''))
          .style('fill', color(p.key))
          .on('click', function () {
            var active = this.active !== true;
            var newOpacity = active ? 0 : 0.5;
            d3.select('#tag' + p.key.replace(/\s+/g, ''))
              .transition().duration(100)
              .style('opacity', newOpacity);
              this.active = active;
            d3.selectAll('.circle' + p.key.replace(/\s+/g, ''))
              .transition().duration(100)
              .style('opacity', newOpacity);
              d3.selectAll('.legend-p' + p.key.replace(/\s+/g, '')).forEach(function (e){
                e.active = active;
              });
              if(active){
                d3.selectAll('.legend-p' + p.key.replace(/\s+/g, '')).style('fill', '#ddd');
              } else {
                d3.selectAll('.legend-p' + p.key.replace(/\s+/g, '')).style('fill', color(p.key));
              }
          })
          .text('patient: ' + p.key);
    });
  }

  plotCtrl.render = function () {
    var patientObj = $scope.$parent.submitData;
    ocpuService.normcomp(patientObj).then(function (data) {
      console.log(data);
      $scope.errorMessage = null;

      if('error' in data.data){
        console.log('error in plotCtrl: '+data.data.error);
        $scope.errorMessage = data.data.error;
      } else {
        patients = d3.nest()
          .key(function (p) { return p.id; })
          .entries(data.data.data);
        plotCtrl.plot(data.data.data);
        plotCtrl.plotEllipses(data.data.ellipse, data.data.tests);
      }

    });
    /*
    d3_queue.queue(2)
        .defer(d3.json, "static/app/data/normcomp2.json")
        .defer(d3.json, "static/app/data/ellipsepoints2.json")
        .await(function (error, normcomp, ellipses_points) {
            if (error) throw error;

            patients = d3.nest()
              .key(function (p) { return p.id; })
              .entries(normcomp);

            var tests = ["AVLT-total_1_to_5", "AVLT-delayed_recall_1_to_5", "AVLT-recognition_1_to_5"];

            plotCtrl.plot(normcomp);
            plotCtrl.plotEllipses(ellipses_points, tests);
        });*/
  };

  plotCtrl.plot = function (normcompData) {
    var margin = {
      top: 80,
      right: 180,
      bottom: 80,
      left: 80
    };
    var width = 700 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    normcompData = normcompData.map(function (p) {
      p.id = String(p.id);
      return p;
    });

    // tooltip
    var div = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    // scales
    var scalePadding = 0.5;
    var minScore = d3.min([d3.min(normcompData, function (d) {
      return d.inneredge;
    }),
      d3.min(normcompData, function (d) {
        return d.univariateT;
      })
    ]);
    minScore = minScore - scalePadding;
    var maxScore = d3.max([d3.max(normcompData, function (d) {
      return d.outeredge;
    }),
      d3.max(normcompData, function (d) {
        return d.univariateT;
      })
    ]);
    maxScore = maxScore + scalePadding;

    // for x need to translate test name to number
    var tests = normcompData.map(function (t) {
      return t.plotname;
    });
    tests = _.union(tests);

    var xScale = d3.scale.ordinal()
      .domain(tests)
      .rangePoints([0, width]);

    var yScale = d3.scale.linear()
      .domain([minScore, maxScore])
      .range([height, 0]);

    // define plot
    var linesGraph = d3.select('#lines-graph')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('transform',
      'translate(' + margin.left + ',' + margin.top + ')');

  var xAxis = d3.scale.ordinal().rangePoints([0, width], 1),
    y = {},
    dragging = {};

  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient('left');

  xAxis.domain(tests);
  tests.forEach(function(element){
    y[element] = yScale;
  });

  var backgroundLines, foregroundLines;
  var backgroundCircles, foreGroundCircles;
  var marginLines, upperMargin, lowerMargin;
  var line = d3.svg.line();
  var legendSpace = 20;

  // legend
  add_legend(linesGraph, patients, width + margin.right / 2);

    // add grey lines for context
    backgroundLines = linesGraph.append('g')
        .attr('class', 'background-lines')
        .selectAll('path')
        .data(patients)
      .enter().append('path')
        .attr('class', 'patient-line')
        .attr('d', path)
        .style('stroke', '#ddd')
        .style('fill', 'none');

    // add colored lines (connect patient tests)
    foregroundLines = linesGraph.append('g')
        .attr('class', 'foreground-lines')
        .selectAll('path')
        .data(patients)
      .enter().append('path')
        .attr('class', 'patient-line')
        .attr('d', path)
        .attr('id', function(p){ return 'tag' + p.key.replace(/\s+/g, ''); })
        .style('stroke', function(p){ return color(p.key); })
        .style('fill', 'none');

    // Add unselected (grey) dots and lines to graph
    backgroundCircles = linesGraph.append('g')
      .attr('class', 'background-circles')
      .selectAll('circle.background')
      .data(normcompData)
      .enter()
      .append('circle')
      .attr('cx', function (d) {
        return xAxis(d.plotname);
      })
      .attr('cy', function (d) {
        return yScale(d.univariateT);
      })
      .attr('r', 4)
      .attr('class', 'background-circle')
      .style('fill', '#ddd');

    // add 'scatterplot' elements
    foreGroundCircles = linesGraph.append('g')
      .attr('class', 'foreground-circles')
      .selectAll('circle.foreground')
      .data(normcompData)
      .enter()
      .append('circle')
      .attr('cx', function (d) {
        return xAxis(d.plotname);
      })
      .attr('cy', function (d) {
        return yScale(d.univariateT);
      })
      .attr('r', 4)
      .style('fill', function (d) {
        return color(d.id);
      })
      .attr('class', function (d) {
          return 'circle'+d.id+' foreground-circle';
      })
      .on('mouseover', function (d) {
        div.transition()
          .duration(200)
          .style('opacity', 0.8);
        div.html("<span style='color:" + color(d.id) + "'>" + 'patient: ' + d.id + '<br/>' + d.shortestname + '<br/>' + d.univariateT + '</span')
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px');
      })
      .on('mouseout', function () {
        div.transition()
          .duration(500)
          .style('opacity', 0);
      });

      // add upper and lower margins
      marginLines = linesGraph.append('g')
        .attr('class', 'margin-lines')
        .selectAll('path')
        .data([patients[0]])
        .enter();
      upperMargin = marginLines.append('path')
        .attr('class', 'margin-line')
        .attr('d', pathUpperMargin);
      lowerMargin = marginLines.append('path')
        .attr('class', 'margin-line')
        .attr('d', pathLowerMargin);

    var g = linesGraph.selectAll(".dimension")
        .data(tests)
      .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + xAxis(d) + ")"; })
        .call(d3.behavior.drag()
          .origin(function(d) { return {x: xAxis(d)}; })
          .on("dragstart", function(d) {
            dragging[d] = xAxis(d);
            backgroundLines.attr("visibility", "hidden");
            backgroundCircles.attr("visibility", "hidden");
          })
          .on("drag", function(d) {
            dragging[d] = Math.min(width, Math.max(0, d3.event.x));

            // update lines
            foregroundLines.attr("d", path);
            tests.sort(function(a, b) { return position(a) - position(b); });
            xAxis.domain(tests);

            // update circles
            foreGroundCircles.attr('cx', circlex);

            // update margin lines
            upperMargin.attr('d', pathUpperMargin);
            lowerMargin.attr('d', pathLowerMargin);

            g.attr("transform", function(d) { return "translate(" + position(d) + ")"; });
          })
          .on("dragend", function(d) {
            delete dragging[d];
            transition(d3.select(this)).attr("transform", "translate(" + xAxis(d) + ")");
            transition(foregroundLines).attr("d", path);
            transition(foreGroundCircles).attr('cx', circlex);
            upperMargin.attr('d', pathUpperMargin);
            lowerMargin.attr('d', pathLowerMargin);
            backgroundLines
                .attr("d", path)
              .transition()
                .delay(500)
                .duration(0)
                .attr("visibility", null);
            backgroundCircles
                .attr('cx', function (d) {
                  return position(d.plotname);
                })
              .transition()
                .delay(500)
                .duration(0)
                .attr("visibility", null);
        }));

    // add invisible, dragable y axis for each test
    g.append('g')
        .attr('class', 'axis hide-axis')
        .each(function(d) { d3.select(this).call(yAxis.scale(y[d])); })
      .append('text')
        .style("text-anchor", "middle")
        .text(function(d) { return d; })
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(45)')
        .on("mouseover", function (d) {
            d3.select(this)
              .transition()
              .style('font-size', 16)
        })
          .on("mouseout", function (d) {
            d3.select(this)
              .transition()
              .style('font-size', 11)
        });

    // add visible, undragable y axis
    linesGraph.append('g')
      .attr('class', 'axis')
      //.attr('transform', 'translate(10,0)')
      .call(yAxis);

  function position(d) {
    var v = dragging[d];
    return v == null ? xAxis(d) : v;
  }

  function transition(g) {
    return g.transition().duration(500);
  }

  // Returns the path for a given data point.
  function path(d) {
    // d = patient from patients
    // {id = 'id',
    //  values = []}
    return line(tests.map(function(p) {
      // p = plotname from patient data (one of the data points from the values array)
      var dataPoint = _.filter(d.values, ['plotname', p])[0];
      return [position(p), y[p](dataPoint.univariateT)];
    }));
  }

  // Returns the path for the upper margin
  function pathUpperMargin(d) {
    return line(tests.map(function(p) {
      // p = plotname from patient data (one of the data points from the values array)
      var dataPoint = _.filter(d.values, ['plotname', p])[0];
      return [position(p), y[p](dataPoint.outeredge)];
    }));
  }

  // Returns the path for the lower margin
  function pathLowerMargin(d) {
    return line(tests.map(function(p) {
      // p = plotname from patient data (one of the data points from the values array)
      var dataPoint = _.filter(d.values, ['plotname', p])[0];
      return [position(p), y[p](dataPoint.inneredge)];
    }));
  }

  // Returns the path for the mean line
  function pathMean(d) {
    return line(tests.map(function(p) {
      return [position(p), y[p](0.0)];
    }));
  }

  function circlex(d){
    return position(d.plotname);
  }

    // add mean line
    marginLines.append('path')
      .attr('class', 'mean-line')
      .attr('d', pathMean);

    // tables

    // columns
    var uniVarCols = [
      'id', 'plotname', 'univariatedifferences', 'univariateT',
      'univariatedf', 'univariatep'
    ];
    var uniVarColNames = [
      'patient', 'test variable', 'difference', 't-value',
      'degrees of freedom', 'p-value'
    ];

    var multiVarCols = [
      'id', 'multivariatedifference', 'multivariateT',
      'multivariatedf', 'multivariatep'
    ];
    var multiVarColNames = [
      'patient', 'sum of differences', 'multivariate statistic',
      'degrees of freedom', 'p-value'
    ];

    var dtUniVarCols = uniVarColNames.map(function (column) {
      return {
        'title': column
      };
    });

    var dtUniVarData = normcompData.map(function (p) {
      var subp = _.pick(p, uniVarCols);
      var values = [];
      for (var key in subp) {
        values.push(subp[key]);
      }
      return values;
    });

    var dtMultiVarCols = multiVarColNames.map(function (column) {
      return {
        'title': column
      };
    });

    // for multivariate only one row per patient
    var dtMultiVarData = patients.map(function (p) {
      var values = [];
      p.values.forEach(function(element) {
        var subp = _.pick(element, multiVarCols);
        for (var key in subp) {
          values.push(subp[key]);
        }
      });



      return values;
    });

    // add tables
    $('#uni-var-table').dataTable({
      bFilter: false,
      data: dtUniVarData,
      columns: dtUniVarCols,
      fnRowCallback: function (nRow, aData, iDisplayIndex, iDisplayIndesFull) {
        $(nRow).css('color', color(aData[0]));
      }
    });

    $('#multi-var-table').dataTable({
      bFilter: false,
      data: dtMultiVarData,
      columns: dtMultiVarCols,
      fnRowCallback: function (nRow, aData, iDisplayIndex, iDisplayIndesFull) {
        $(nRow).css('color', color(aData[0]));
      }
    });
  };

  plotCtrl.plotEllipses = function (points, tests) {
    var width = 700,
        height = 500,
        size = 30,
        padding = 5;

    var x = d3.scale.linear()
        .range([padding / 2, size - padding / 2])
        .domain([-3, 3]);

    var y = d3.scale.linear()
        .range([size - padding / 2, padding / 2])
        .domain([-3, 3]);

    var dim = d3.scale.linear()
        .range([0, size - padding])
        .domain([0, 6]);

    var scale = d3.scale.linear()
        .range([0, size - padding])
        .domain([0, 10]);

    var q = d3_queue.queue(1)
        .defer(d3.csv, "static/app/data/ellipseparams.csv")
        .await(function (error, ellipses) {
            if (error) throw error;
            facets(ellipses, points, tests);
        });

        function facets(ellipses, points, tests) {
            ellipses.forEach(function (d) {
                d.test1 = String(d.test1);
                d.test2 = String(d.test2);
                d.cx = +d.cx;
                d.cy = +d.cy;
                d.rx = +d.rx;
                d.ry = +d.ry;
                d.angle = +d.angle;
            });

            var svg = d3.select('#ellipses-graph').append("svg")
                .attr("width", width)
                .attr("height", height)
                .append('g')
                .attr("transform", "translate(" + 4 * size + "," + padding / 2 + ")");

            var h = (tests.length + 0.5) * size;

            // add empty strings to list of tests to shift the origin of the graph
            var yDomain = tests.slice(0);
            yDomain.push('');

            var xDomain = tests.slice(0);
            xDomain.splice(0, 0, '');

            var xOuter = d3.scale.ordinal()
              .domain(xDomain)
              .rangePoints([0, h]);
            var yOuter = d3.scale.ordinal()
              .domain(yDomain)
              .rangePoints([0, h]);

            var xAxis = d3.svg.axis()
              .scale(xOuter)
              .orient("bottom");

            var yAxis = d3.svg.axis()
              .scale(yOuter)
              .orient("left");

            add_legend(svg, patients, width/2);

            console.log(ellipses);
            var sEllipses = ellipses.filter(function (e) {
              var keep = false;
              tests.forEach(function (test){
                if(test === e.test1) {
                  keep = true;
                }
              });
              return keep;

              });

            console.log(sEllipses);

            var div = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0);

            svg.selectAll('ellipse')
              .data(sEllipses)
              .enter()
              .append("ellipse")
              .attr("rx", function (d) { return dim(d.rx); })
              .attr("ry", function (d) { return dim(d.ry); })
              //.attr('cx', dim(0))
              //.attr('cy', dim(0))
              .attr("transform", function (d) {
                  var angle = -(90 - d.angle);
                  return "translate(" + xOuter(d.test2) + "," + yOuter(d.test1) + ") rotate(" + angle + ")";
              })
              .style("fill", "green")
              .style("opacity", 0.3)
              .on('mouseover', function (d) {
                div.transition()
                  .duration(200)
                  .style('opacity', 0.8);
                div.html('<span>' + d.test1 + '</br>vs.</br>' + d.test2 + '</span>')
                  .style('left', (d3.event.pageX) + 'px')
                  .style('top', (d3.event.pageY - 28) + 'px');
              })
              .on('mouseout', function () {
                div.transition()
                  .duration(500)
                  .style('opacity', 0);
              });

            // Plot grey circles (for context)
            var backgroundCircles = svg.selectAll("circle.ellipse-data-background")
                .data(points)
                .enter().append("circle")
                .attr('cx', function (d) {
                  return x(d.x);
                })
                .attr('cy', function (d) {
                  return y(d.y);
                })
                .attr('r', 4)
                .attr("transform", function (d) {
                    var translate = (xOuter(d.test2) - size/2 + "," + (yOuter(d.test1) - size/2));
                    return "translate(" + translate + ")";
                })
                .attr('class', 'ellipse-data-background')
                .style("fill", '#ddd');

            // Plot colored circles
            var foregroundCircles = svg.selectAll("circle.ellipse-data-foreground")
                .data(points)
                .enter().append("circle")
                .attr('cx', function (d) {
                  return x(d.x);
                })
                .attr('cy', function (d) {
                  return y(d.y);
                })
                .attr('r', 4)
                .attr("transform", function (d) {
                    var translate = (xOuter(d.test2) - size/2 + "," + (yOuter(d.test1) - size/2));
                    return "translate(" + translate + ")";
                })
                .attr('class', function (d) {
                    return 'circle'+d.id+ ' ellipse-data-foreground';
                })
                .style("fill", function(p){ return color(p.id); })
                .style("opacity", 0.5);

            svg.append("g")            // Add the X Axis
                .attr("class", "x axis")
                .attr("transform", "translate(0," + h + ")")
                .call(xAxis)
                .selectAll("text")
                  .style("text-anchor", "end")
                  .attr("dx", "-.8em")
                  .attr("dy", ".15em")
                  .attr("transform", "rotate(-65)");

            svg.append("g")         // Add the Y Axis
                .attr("class", "y axis")
                .call(yAxis);
          }

    };

  plotCtrl.render();
});
