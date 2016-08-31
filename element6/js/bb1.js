d3.csv("csv/BrakeByte1Events_04_11_13.csv", function (error, data) {
    //console.log(data);

    function bb1() {
        var barPadding = 25;
        var items = data;
        var color = d3.scale.ordinal();
        var encoded;
        var firstTransition = true;


  var thisdiv=d3.select("#BrakeByte1Events");
    addentries(items, thisdiv);

   
        items.forEach(function (d) {

            formatStartEndTimes(d);

            var binary = (+d.Value).toString(2);

            function byteString(n) {
                //  if (n < 0 || n > 255 || n % 1 !== 0) {
                //      throw new Error(n + " does not fit in a byte");
                //}
                return ("000000000" + n.toString(2)).substr(-8)
            }

            var newd = byteString(binary);
            //d.thisisiatest = byteString(binary);
            //console.log(d.thisisiatest);
            
           // console.log(newd);

            var status;

            var traction = newd[6] + newd[7];


            if (traction == "00") {
                status = "unavailable"
            } else if (traction == "01") {
                status = "off"
            } else if (traction == "10") {
                status = "on"
            } else if (traction == "11") {
                status = "engaged"
            } else {
                status = "NA"
            }


            d.FL = newd[0];
            d.FR = newd[1];
            d.RL = newd[2];
            d.RR = newd[3];
            d.avail = newd[4];
            d.TCS = status;

            //        encoded = (["FL", "FR", "RL", "RR", "avail", "TCS"]);
            //
            //        color.domain(encoded);
            //
            //
            //

        }); // end for loop



        var color = d3.scale.ordinal()
            .range(['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00', '#ff8c00', '#ff8c00', '#ff8c00']);


        items.sort(function (a, b) {
            return a.StartTime - b.StartTime;
        });
        
         items = items.filter(function(d) {return d.RxDevice =="10"});
       // console.log(items);

        //nest by vehicle to cull
        items = d3.nest().key(function (d) {
            return d.RxDevice;
        }).entries(items);
          
        
       // console.log(items);

        // use only data values from one vehilce
        // items = items[0];

       vehicle = items[0].values;
        //vehicle = items.filter(function(d) {return d.RxDevice =="10"})
       // console.log(vehicle);

        //colors not used right now- just fore keying


        encoded = (["FL", "FR", "RL", "RR", "avail", "TCS"]);

        color.domain(encoded);


        var rows = color.domain().map(function (name) {
            return {
                name: name,
                value: vehicle
            };
        })


        rows.forEach(function (d) {
            var row = d;
            rows.sort(function (a, b) {
                return a.StartTime - b.StartTime;
            });
        });
        
         // console.log(rows);

        var timeBegin = d3.min(vehicle, function (d) {
            return d.StartTime;
        });

        
       // console.log(timeBegin);
        var timeEnd = d3.max(vehicle, function (d) {
            return d.StartTime;
        });
        // console.log(timeEnd);

        var width = $("#bb1field").width();
        var height = 280;

        var m = [20, 15, 30, 15], //top right bottom left
            w = width - m[1] - m[3],
            h = height - m[0] - m[2];

        //for brush
        var m2 = [0, 5, 0, 5], //top right bottom left
            w2 = width - m2[1] - m2[3],
            //height of brush is height of bottom margin,so uses m not m2
           // h2 = m[2];
        h2 = 20;

        var x = d3.time.scale()
            .range([0, w])
            .domain([timeBegin, timeEnd]);

        var x2 = d3.time.scale()
            .range([0, w2])
            .domain([timeBegin, timeEnd]);

        // defined early for laying out charts
        var y = d3.scale.ordinal()
            .range([0, h])
            .domain(color.domain());

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickSize((h / color.domain().length) - barPadding)
			.ticks(7)

        //for brush
        var xAxis2 = d3.svg.axis()
            .scale(x2)
            .orient("bottom")
            .tickSize(h2);

        var bb1brush = d3.svg.brush()
            .x(x2)
            .on("brush", bb1_brush);

        //initial definitions of things that will get resized
        var bb1svg = d3.select("#bb1field")
            .append("svg")
            .attr("class", "chart");

        var bb1chart = bb1svg.append("g")
            .attr("class", "bb1chart");

        var eventrows = bb1chart
            .selectAll("#BrakeByte1Events .minilanes")
            .data(rows)
            .enter().append('g')
            .attr('class', function (d) {
                return ("minilanes" + " " + d.name)
            })
            .attr('title', function (d) {
                return d.name
            });

        var bgrect = eventrows.append("rect")
            .attr("class", "bgrect");

        var labels = eventrows.append("text")
            .text(function (d) {
                return d.name;
            })
            .attr("dy", -5);

        var mainxaxis = eventrows.append("g")
            .attr("class", "x axis");

        var bb1context = bb1svg.append("g")
            .attr("class", "context");

        //moved content x to append after/on actual d3brush called

        //decide if these are useful
        var showStart = d3.select("#BrakeByte1Events .showStart")
            .append("div")
            .attr("class", "updatedField")
            .html(timeBegin);

        var showEnd = d3.select("#BrakeByte1Events .showEnd")
            .append("div")
            .attr("class", "updatedField")
            .html(timeEnd);

        //original sparkline sized charts

        // var newwidth = $("#bb1field").width();
        var newwidth = width;
        var newheight = height;

        var charts = [];
        
        var arc = d3.svg.arc()
                    .outerRadius(h2 / 2)
                    .startAngle(0)
                    .endAngle(function (d, i) {
                        return i ? -Math.PI : Math.PI;
                    });

                var brusharcs;
                var brushrects;

        // parts that need redraw
        var renderingbits = function (width, height) {
                // var m = [20, 0, 30, 20], //top right bottom left
                w = width - m[1] - m[3],
                    h = height - m[0] - m[2];

                //for brush
                // var m2 = [30, 0, 0, 3], //top right bottom left
               // w2 = width - m2[1] - m2[3],



                x.range([0, w]);
                x2.range([0, w]);

                mainxaxis.call(xAxis);


                bb1svg.transition()
                    .duration(900)
                    .ease("quad-out")
                    .attr("width", w + m[1] + m[3])
                    .attr("height", h + m[0] + m[2]);

                bb1chart.attr("transform", "translate(" + m[3] + "," + (m[0]) + ")")

                //need to change and put indiv clip on each chart

                eventrows.attr("transform", function (d, i) {
                    return "translate(" + 0 + "," + (h / rows.length) * i + ")";
                });

                bgrect.transition()
                    .duration(900)
                    .ease("quad-out")
                    .attr("width", w)
                    .attr("height", ((h / color.domain().length) - barPadding));

                xAxis.orient("bottom")
                    .tickSize((h / color.domain().length) - barPadding);

                eventrows.selectAll("defs").remove();

                eventrows.append("defs")
                    .append("clipPath")
                    .attr("id", function (d, i) {
                        return "bb1clip" + i
                    })
                    .append("rect")
                    .attr("width", w)
                    .attr("height", (h / color.domain().length) - barPadding);

                eventrows.each(function (d, i) {
                    var chart = {}


                    d3.select(this).selectAll(".rectsg").remove();

                    var sparkSVG = d3.select(this).append('g')
                        .attr("class", "rectsg").attr("id", function (d) {
                            return d.name
                        });


                    var thisname = d.name;
                    var thisdata = d.value;

                    //  console.log(d.value.Value);
                    //console.log(d.value.FL);

                    var newmap = thisdata.map(function (d) {
                        return {
                            StartTime: d.StartTime,
                            Endtime: d.Endtime,
                            val: d[thisname]
                        }
                    });

                    var nozeros = newmap.filter(function (d) {
                        return d.val != "0"
                    })


                    //make map with just column needed for each area chart


                    sparkSVG.attr("clip-path", function (d) {
                        return "url(#bb1clip" + i + ")"
                    });


                    sparkSVG.selectAll("rect")
                        .data(nozeros)
                        .enter()
                        .append("rect")
                        .attr("class", "timelinerect")
                        .attr("x", function (d) {
                            return x(d.StartTime)
                        })
                        .attr("width", function (d) {
                            if (x(d.Endtime) - x(d.StartTime) > 0 && x(d.Endtime) - x(d.StartTime) < 1) {
                                return "1px";
                            } else {
                                return x(d.Endtime) - x(d.StartTime);

                            }
                        })
                        .attr("height", (h / encoded.length) - barPadding)
                        .attr("fill", function (d) {
                            if (d.val == 0) {
                                return "none"
                            }
                        })
                        .attr("class", function (d) {

                            var pn = d3.select(this.parentNode).attr("id");

                            if (pn == "TCS") {
                                return "timelinerect" + " " + d.val
                            } else {
                                return "timelinerect"
                            }
                        })

                    charts.push(chart);
                }); //end "each" section

                //Remove the old context x-axis
                if(bb1context.selectAll(".x.axis")[0].length > 0) {
                    bb1context.selectAll(".x.axis").remove()
                }

                bb1context.append("g")
                    .attr("class", "x brush")
                    .call(bb1brush)
                    .selectAll("rect")
                    .attr("y", (h - h2))
                    .attr("height", h2);

                //for brush
                bb1context.attr("transform", "translate(" + m[3] + "," + (m[2] + 10) + ")");

              
                function drawBrush() {
                    
                     

                    // define our brush full extent
                    bb1brush.extent([timeBegin, timeEnd]);

                    // now draw the brush to match our extent
                    // use transition to slow it down so we can see what is happening
                    // remove transition so just d3.select(".brush") to just draw
//                    bb1brush(d3.select("#BrakeByte1Events .brush").transition());

                    // now fire the brushstart, brushmove, and brushend events
                    // remove transition so just d3.select(".brush") to just draw
                    if (firstTransition){
                        bb1brush(d3.select("#BrakeByte1Events .brush").transition().ease("quad-out").delay(2000).duration(2000));
                        firstTransition = false;
                    }
                    else bb1brush(d3.select("#BrakeByte1Events .brush").transition().ease("quad-out").duration(900));
                }

                drawBrush();

            
             ////replace hard to use handles with big arcs        
                        var handleoffset = d3.selectAll("#bb1field .context .resize.e rect").attr("y");

                        d3.selectAll("#bb1field .context .resize rect").attr("opacity", 0);

                        d3.selectAll("#bb1field .context .resize path").remove();

                        brusharcs = bb1context.selectAll("#bb1field .resize").append("path").attr("class", "brusharc").attr("transform", "translate(0," + (h - h2 / 2) + ")").attr("d", arc);


                        brushrects = bb1context.selectAll("#bb1field .resize").append("rect").attr("class", "brushrect").attr("width", 1.5).attr("height", h2 + 10).attr("y", (handleoffset - 5));

//get rid of this - broken -redraws axis on top of big chart
  var bb1contextxaxis = bb1context.append("g")
                    .attr("class", "x axis").attr("transform", "translate(" + m2[3] + "," + (h - h2) + ")")
                    .call(xAxis2);

                //try starting with 'full' brush
        }

        renderingbits(newwidth, newheight);

        function bb1_brush(width, height) {


            x.domain(bb1brush.empty() ? x2.domain() : bb1brush.extent());

            bb1chart.selectAll("#BrakeByte1Events .x.axis").call(xAxis);


            bb1chart.selectAll("#BrakeByte1Events .timelinerect")
                .attr("x", function (d) {
                    return x(d.StartTime)
                })
                .attr("width", function (d) {
                    if (x(d.Endtime) - x(d.StartTime) > 0 && x(d.Endtime) - x(d.StartTime) < 1) {
                        return 1;
                    } else {
                        return x(d.Endtime) - x(d.StartTime);

                    }
                })
                .attr("height", (h / encoded.length) - barPadding)
                // .attr("fill", function(d){if(d.val ==0){return "none"}})


        } // end bb1brush;

        bb1_brush(newwidth, newheight);

    $("#BrakeByte1Events .expandToggle").click(function () {
        var parentColumn = $(this).parents(".column");
        var parentFileBox = $(this).parents(".filebox");
        var newwidth, newheight;       
        
        d3.select("#bb1field .x.brush").remove();
        if(parentColumn.hasClass("expanded")) {
            newwidth = width;
            newheight = 280;
            w = newwidth - m[1] - m[3];
            h = newheight - m[0] - m[2];
				 xAxis.ticks(7)  


            renderingbits(newwidth, newheight);
            bb1_brush(newwidth, newheight);
            bb1brush.extent([timeBegin, timeEnd]); 
		
            window.setTimeout(function () {
                parentColumn.toggleClass("expanded");
                window.setTimeout(function () {
                    $('.column').not(parentColumn).toggleClass("shrunk");
                    $('.filebox').not(parentFileBox).toggleClass("shrunk");  
                }, 550);
            }, 950);         
        } 
        else {
            parentColumn.toggleClass("expanded");
            $('.column').not(parentColumn).toggleClass("shrunk");
            $('.filebox').not(parentFileBox).toggleClass("shrunk"); 

            window.setTimeout(function () {
                newwidth = $("#bb1field").width();
                newheight = 450;
                w = newwidth - m[1] - m[3];
                h = newheight - m[0] - m[2];
				 xAxis.ticks(10) 
                renderingbits(newwidth, newheight);
                bb1_brush(newwidth, newheight);
                bb1brush.extent([timeBegin, timeEnd]);
            }, 550);          
        }
    });//end expand

    } //end bb1funct
    bb1();
}); //endcsv
