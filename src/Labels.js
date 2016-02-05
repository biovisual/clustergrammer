
function Labels(params){

  function normal_name(d){
    var inst_name = d.name.replace(/_/g, ' ').split('#')[0];
    if (inst_name.length > params.labels.max_label_char){
      inst_name = inst_name.substring(0,params.labels.max_label_char)+'..';
    }
    return inst_name;
  }

  // make row labels
  function make_rows(params, row_nodes, reorder, text_delay){

    var row_nodes_names = params.network_data.row_nodes_names;

    // row container holds all row text and row visualizations (triangles rects)
    if ( d3.select(params.viz.vis_svg + ' .row_container').empty() ){
      var row_container = d3.select(params.viz.viz_svg)
        .append('g')
        .attr('class','row_container')
        .attr('transform', 'translate(' + params.norm_label.margin.left + ',' +
        params.viz.clust.margin.top + ')');
    } else {
      var row_container = d3.select(params.viz.viz_svg)
        .select('.row_container')
        .attr('transform', 'translate(' + params.norm_label.margin.left + ',' +
        params.viz.clust.margin.top + ')');
    }

    if (d3.select(params.root+' .row_white_background').empty()){
      row_container
        .append('rect')
        .classed('row_white_background',true)
        .classed('white_bars',true)
        .attr('fill', params.viz.background_color)
        .attr('width', params.norm_label.background.row)
        .attr('height', 30*params.viz.clust.dim.height + 'px')
    }

    // container to hold text row labels 
    row_container
      .append('g')
      .attr('class','row_label_container')
      .attr('transform', 'translate(' + params.norm_label.width.row + ',0)')
      .append('g')
      .attr('class', 'row_label_zoom_container');

    var row_labels = d3.select(params.root+' .row_label_zoom_container')
      .selectAll('g')
      .data(row_nodes, function(d){return d.name;})
      .enter()
      .append('g')
      .attr('class', 'row_label_text')
      .attr('transform', function(d) {
        var inst_index = _.indexOf(row_nodes_names, d.name);
        return 'translate(0,' + params.matrix.y_scale(inst_index) + ')';
      });

    d3.select(params.root+' .row_label_zoom_container')
      .selectAll('.row_label_text')
      .on('dblclick', function(d) {
        console.log('double clicking row')
        reorder.row_reorder.call(this);
        if (params.tile_click_hlight){
          add_row_click_hlight(this,d.ini);
        }
      });

    if (params.labels.show_label_tooltips){

      // d3-tooltip
      var tip = d3.tip()
        .attr('class', 'd3-tip')
        .direction('e')
        .offset([0, 10])
        .html(function(d) {
          var inst_name = d.name.replace(/_/g, ' ').split('#')[0];
          return "<span>" + inst_name + "</span>";
        });

      d3.select(params.viz.viz_wrapper)
        .select(params.root+' .row_container')
        .call(tip);
        
      row_labels
        .on('mouseover', function(d) {
          d3.select(this)
            .select('text')
            .classed('active',true);
          tip.show(d);
        })
        .on('mouseout', function mouseout(d) {
          d3.select(this)
            .select('text')
            .classed('active',false);
          tip.hide(d);
        });
    } else{
      row_labels
        .on('mouseover', function(d) {
          d3.select(this)
            .select('text')
            .classed('active',true);
        })
        .on('mouseout', function mouseout(d) {
          d3.select(this)
            .select('text')
            .classed('active',false);
        });
    }

    // append rectangle behind text
    row_labels
      .insert('rect')
      .style('opacity', 0);

    // append row label text
    row_labels
      .append('text')
      .attr('y', params.matrix.rect_height * 0.5 + params.labels.default_fs_row*0.35 )
      .attr('text-anchor', 'end')
      .style('font-size', params.labels.default_fs_row + 'px')
      .text(function(d){ return normal_name(d);})
      .attr('pointer-events','none')
      .style('opacity',0)
      .transition().delay(text_delay).duration(text_delay)
      .style('opacity',1);

    // change the size of the highlighting rects
    row_labels
      .each(function() {
        var bbox = d3.select(this)
            .select('text')[0][0]
          .getBBox();
        d3.select(this)
          .select('rect')
          .attr('x', bbox.x )
          .attr('y', 0)
          .attr('width', bbox.width )
          .attr('height', params.matrix.y_scale.rangeBand())
          .style('fill', function() {
          var inst_hl = 'yellow';
          return inst_hl;
          })
          .style('opacity', function(d) {
          var inst_opacity = 0;
          // highlight target genes
          if (d.target === 1) {
            inst_opacity = 1;
          }
          return inst_opacity;
          });
      });

    // label the widest row and col labels
    params.bounding_width_max = {};
    params.bounding_width_max.row = 0;

    d3.selectAll('.row_label_text').each(function() {
      var tmp_width = d3.select(this).select('text').node().getBBox().width;
      if (tmp_width > params.bounding_width_max.row) {
        params.bounding_width_max.row = tmp_width;
      }
    });

    // row visualizations - classification triangles and colorbar rects 
    var row_viz_container = row_container
      .append('g')
      .attr('class','row_viz_container')
      .attr('transform', 'translate(' + params.norm_label.width.row + ',0)')
      .append('g')
      .attr('class', 'row_zoom_container');

    // white background for triangle
    if (d3.select(params.root+' .row_zoom_container').select('.white_bars').empty()){
          row_viz_container
            .append('rect')
            .attr('class','white_bars')
            .attr('fill', params.viz.background_color)
            .attr('width', params.class_room.row + 'px')
            .attr('height', function() {
              var inst_height = params.viz.clust.dim.height;
              return inst_height;
            });
    } else {
      row_viz_container
        .select('class','white_bars')
        .attr('fill', params.viz.background_color)
        .attr('width', params.class_room.row + 'px')
        .attr('height', function() {
          var inst_height = params.viz.clust.dim.height;
          return inst_height;
        });
    }

    // groups that hold classification triangle and colorbar rect  
    var row_viz_group = d3.select(params.root+' .row_zoom_container')
      .selectAll('g')
      .data(row_nodes, function(d){return d.name;})
      .enter()
      .append('g')
      .attr('class', 'row_viz_group')
      .attr('transform', function(d) {
        var inst_index = _.indexOf(row_nodes_names, d.name);
        return 'translate(0, ' + params.matrix.y_scale(inst_index) + ')';
      });

    // add triangles
    row_viz_group
      .append('path')
      .attr('d', function(d) {
        var origin_x = params.class_room.symbol_width - 1;
        var origin_y = 0;
        var mid_x = 1;
        var mid_y = params.matrix.y_scale.rangeBand() / 2;
        var final_x = params.class_room.symbol_width - 1;
        var final_y = params.matrix.y_scale.rangeBand();
        var output_string = 'M ' + origin_x + ',' + origin_y + ' L ' +
          mid_x + ',' + mid_y + ', L ' + final_x + ',' + final_y + ' Z';
        return output_string;
      })
      .attr('fill', function(d) {
        // initailize color
        var inst_color = '#eee';
        if (params.labels.show_categories) {
          inst_color = params.labels.class_colors.row[d.cl];
        }
        return inst_color;
      })
      .style('opacity',0)
      .transition().delay(text_delay).duration(text_delay)
      .style('opacity',1);


      if (Utils.has( params.network_data.row_nodes[0], 'value')) {

        row_labels
          .append('rect')
          .attr('class', 'row_bars')
          .attr('width', function(d) {
            var inst_value = 0;
            inst_value = params.labels.bar_scale_row( Math.abs(d.value) );
            return inst_value;
          })
          .attr('x', function(d) {
            var inst_value = 0;
            inst_value = -params.labels.bar_scale_row( Math.abs(d.value) );
            return inst_value;
          })
          .attr('height', params.matrix.y_scale.rangeBand() )
          .attr('fill', function(d) {
            return d.value > 0 ? params.matrix.bar_colors[0] : params.matrix.bar_colors[1];
          })
          .attr('opacity', 0.4);

        }

      // add row callback function
      d3.selectAll('.row_label_text')
        .on('click',function(d){
          if (typeof params.click_label == 'function'){
            params.click_label(d.name, 'row');
            add_row_click_hlight(this, d.ini);
          } else {
            if (params.tile_click_hlight){
              add_row_click_hlight(this,d.ini);
            }
          }

        })


      function add_row_click_hlight(clicked_row, id_clicked_row){

        if (id_clicked_row != params.click_hlight_row){

          var rel_width_hlight = 6;
          var opacity_hlight = 0.85;
          var hlight_width  = rel_width_hlight*params.viz.border_width;
          var hlight_height = rel_width_hlight*params.viz.border_width/params.viz.zoom_switch;

          d3.selectAll('.click_hlight')
            .remove();

          // // highlight selected row
          // d3.selectAll('.row_label_text')
          //   .select('rect')
          // d3.select(this)
          //   .select('rect')
          //   .style('opacity', 1);

          d3.select(clicked_row)
            .append('rect')
            .classed('click_hlight',true)
            .classed('row_top_hlight',true)
            .attr('width',params.viz.svg_dim.width)
            .attr('height',hlight_height)
            .attr('fill',params.matrix.hlight_color)
            .attr('opacity',opacity_hlight);

          d3.select(clicked_row)
            .append('rect')
            .classed('click_hlight',true)
            .classed('row_bottom_hlight',true)
            .attr('width',params.viz.svg_dim.width)
            .attr('height',hlight_height)
            .attr('fill',params.matrix.hlight_color)
            .attr('opacity',opacity_hlight)
            .attr('transform', function(){
              var tmp_translate_y = params.matrix.y_scale.rangeBand() - hlight_height;
              return 'translate(0,'+tmp_translate_y+')';
            });
        } else{
          d3.selectAll('.click_hlight')
          .remove();
          params.click_hlight_row = -666;
        }

      }

      // row label text will not spillover initially since
      // the font-size is set up to not allow spillover
      // it can spillover during zooming and must be constrained 

      // return row_viz_group so that the dendrogram can be made
      return row_viz_group;
  }

  // make col labels
  function make_cols(params, col_nodes, reorder, text_delay){

    var col_nodes_names = params.network_data.col_nodes_names;

    // offset click group column label
    var x_offset_click = params.matrix.x_scale.rangeBand() / 2 + params.viz.border_width;
    // reduce width of rotated rects
    var reduce_rect_width = params.matrix.x_scale.rangeBand() * 0.36;


    // make container to pre-position zoomable elements
    if (d3.select(params.root+' .col_container').empty()){

      var container_all_col = d3.select(params.viz.viz_svg)
        .append('g')
        .attr('class','col_container')
        .attr('transform', 'translate(' + params.viz.clust.margin.left + ',' +
        params.norm_label.margin.top + ')');

      // white background rect for col labels
      container_all_col
        .append('rect')
        .attr('fill', params.viz.background_color) //!! prog_colors
        .attr('width', 30 * params.viz.clust.dim.width + 'px')
        .attr('height', params.norm_label.background.col)
        .attr('class', 'white_bars');

      // col labels
      container_all_col
        .append('g')
        .attr('class','col_label_outer_container')
        // position the outer col label group
        .attr('transform', 'translate(0,' + params.norm_label.width.col + ')')
        .append('g')
        .attr('class', 'col_zoom_container');

    } else {
      
      var container_all_col = d3.select(params.root+' .col_container')
        .attr('transform', 'translate(' + params.viz.clust.margin.left + ',' +
        params.norm_label.margin.top + ')');
          
      // white background rect for col labels
      container_all_col
        .select('.white_bars')
        .attr('fill', params.viz.background_color) //!! prog_colors
        .attr('width', 30 * params.viz.clust.dim.width + 'px')
        .attr('height', params.norm_label.background.col);

      // col labels
      container_all_col.select(params.root+' .col_label_outer_container')

    }


    // add main column label group
    var col_label_obj = d3.select(params.root+' .col_zoom_container')
      .selectAll('.col_label_text')
      .data(col_nodes, function(d){return d.name;})
      .enter()
      .append('g')
      .attr('class', 'col_label_text')
      .attr('transform', function(d) {
        var inst_index = _.indexOf(col_nodes_names, d.name);
        return 'translate(' + params.matrix.x_scale(inst_index) + ') rotate(-90)';
      })

    // append group for individual column label
    var col_label_click = col_label_obj
      // append new group for rect and label (not white lines)
      .append('g')
      .attr('class', 'col_label_click')
      // rotate column labels
      .attr('transform', 'translate(' + params.matrix.x_scale.rangeBand() / 2 + ',' + x_offset_click + ') rotate(45)')
      .on('mouseover', function(d) {
        d3.select(this).select('text')
          .classed('active',true);
      })
      .on('mouseout', function(d) {
        d3.select(this).select('text')
          .classed('active',false);
      });



    // append column value bars
    if (Utils.has( params.network_data.col_nodes[0], 'value')) {

      d3.selectAll('col_bars').remove();

      col_label_click
        .append('rect')
        .attr('class', 'col_bars')
        .attr('width', function(d) {
          var inst_value = 0;
          if (d.value > 0){
            inst_value = params.labels.bar_scale_col(d.value);
          }
          return inst_value;
        })
        // rotate labels - reduce width if rotating
        .attr('height', params.matrix.x_scale.rangeBand() * 0.66)
        .style('fill', function(d) {
          return d.value > 0 ? params.matrix.bar_colors[0] : params.matrix.bar_colors[1];
        })
        .attr('opacity', 0.4);

    }

    // add column label
    col_label_click
      .append('text')
      .attr('x', 0)
      // manually tuned
      .attr('y', params.matrix.x_scale.rangeBand() * 0.64)
      .attr('dx', params.viz.border_width)
      .attr('text-anchor', 'start')
      .attr('full_name', function(d) {
        return d.name;
      })
      // original font size
      .style('font-size', params.labels.default_fs_col + 'px')
      .text(function(d){ return normal_name(d);})
      // .attr('pointer-events','none')
      .style('opacity',0)
      .transition().delay(text_delay).duration(text_delay)
      .style('opacity',1);

    if (params.labels.show_label_tooltips){

      // d3-tooltip
      var tip = d3.tip()
        .attr('class', 'd3-tip')
        .direction('s')
        .offset([20, 0])
        .html(function(d) {
          var inst_name = d.name.replace(/_/g, ' ').split('#')[0];

          if (params.show_categories){
            inst_name = inst_name + ': ' + String(d.cl);
          }

          return "<span>" + inst_name + "</span>";
        });

      d3.select(params.viz.viz_wrapper)
        .select('svg')
        .select(params.root+' .col_container')
        .call(tip);
        
      col_label_obj
        // .select('text')
        .on('mouseover',tip.show)
        .on('mouseout',tip.hide);

    }

    // bounding font size 
    /////////////////////////////

    params.bounding_width_max.col = 0;
    d3.selectAll('.col_label_click').each(function() {
      var tmp_width = d3.select(this).select('text').node().getBBox().width;
      if (tmp_width > params.bounding_width_max.col) {
        // increase the apparent width of the column label since its rotated
        // this will give more room for text
        params.bounding_width_max.col = tmp_width;
      }
    });

    // check if widest row or col are wider than the allowed label width
    ////////////////////////////////////////////////////////////////////////
    params.ini_scale_font = {};
    params.ini_scale_font.row = 1;
    params.ini_scale_font.col = 1;

    if (params.bounding_width_max.row > params.norm_label.width.row) {

      // calc reduction in font size
      params.ini_scale_font.row = params.norm_label.width.row / params.bounding_width_max.row;
      // redefine bounding_width_max.row
      params.bounding_width_max.row = params.ini_scale_font.row * params.bounding_width_max.row;

      // redefine default fs !! increase to make more readable 
      params.labels.default_fs_row = params.labels.default_fs_row * params.ini_scale_font.row;

      // reduce font size
      d3.selectAll('.row_label_text').each(function() {
      d3.select(this).select('text')
        .style('font-size', params.labels.default_fs_row + 'px');
      });
    }

    // debugger;

    if (params.bounding_width_max.col > params.norm_label.width.col) {

      // calc reduction in font size 
      params.ini_scale_font.col = params.norm_label.width.col / params.bounding_width_max.col;
      // redefine bounding_width_max.col
      params.bounding_width_max.col = params.ini_scale_font.col * params.bounding_width_max.col;
      // redefine default fs, !! increase to make more readable 
      params.labels.default_fs_col = params.labels.default_fs_col * params.ini_scale_font.col;

      // reduce font size
      d3.selectAll('.col_label_click').each(function() {
      d3.select(this).select('text')
        .style('font-size', params.labels.default_fs_col + 'px');
      });
    }

    // constrain text after zooming
    if (params.labels.row_keep < 1){
      d3.selectAll('.row_label_text' ).each(function() { trim_text(this, 'row'); });
    }
    if (params.labels.col_keep < 1){
      d3.selectAll('.col_label_click').each(function() { trim_text(this, 'col'); });
    }


    // append rectangle behind text
    col_label_click
      .insert('rect')
      .attr('class','.highlight_rect')
      .attr('x', 0) 
      .attr('y', 0)
      .attr('width', 10*params.matrix.rect_height)
      .attr('height', 0.67*params.matrix.rect_width)
      .style('opacity', 0);

    // // only run this if there are col categories 
    // if (params.labels.show_categories){
    //   // change the size of the highlighting rects
    //   col_label_click
    //     .each(function(d) {
    //       var bbox = d3.select(this)
    //         .select('text')[0][0]
    //         .getBBox();

    //       d3.select(this)
    //         .select('rect')
    //         .attr('width', bbox.width * 1.1)
    //         .attr('height', 0.67*params.matrix.rect_width)
    //         .style('fill', function(d){
    //           var inst_color = 'white';
    //           inst_color = params.labels.class_colors.col[d.cl];
    //           return inst_color 
    //         })
    //         .style('opacity', 0.30);
    //     });
    // }

    // add triangle under rotated labels
    col_label_click
      .append('path')
      .style('stroke-width', 0)
      .attr('d', function() {
        // x and y are flipped since its rotated
        var origin_y = -params.viz.border_width;
        var start_x = 0;
        var final_x = params.matrix.x_scale.rangeBand() - reduce_rect_width;
        var start_y = -(params.matrix.x_scale.rangeBand() - reduce_rect_width +
        params.viz.border_width);
        var final_y = -params.viz.border_width;
        var output_string = 'M ' + origin_y + ',0 L ' + start_y + ',' +
          start_x + ', L ' + final_y + ',' + final_x + ' Z';
        return output_string;
      })
      .attr('fill', function(d) {
        var inst_color = '#eee';
        if (params.labels.show_categories) {
          inst_color = params.labels.class_colors.col[d.cl];
        }
      return inst_color;
      })
      .style('opacity',0)
      .transition().delay(text_delay).duration(text_delay)
      .style('opacity',1);


    // add col callback function
    d3.selectAll('.col_label_text')
      .on('click',function(d){

        if (typeof params.click_label == 'function'){
          params.click_label(d.name, 'col');
          add_col_click_hlight(this, d.ini);
        } else {

          if (params.tile_click_hlight){
            add_col_click_hlight(this, d.ini);
          }

        }

      })
      .on('dblclick', function(d) {
        console.log('double clicking col')
        reorder.col_reorder.call(this);
        if (params.tile_click_hlight){
          add_col_click_hlight(this,d.ini);
        }
      });


    function add_col_click_hlight(clicked_col, id_clicked_col){

      if (id_clicked_col != params.click_hlight_col){

        params.click_hlight_col = id_clicked_col;

        var rel_width_hlight = 6;
        var opacity_hlight = 0.85;
        var hlight_width  = rel_width_hlight*params.viz.border_width;
        var hlight_height = rel_width_hlight*params.viz.border_width/params.viz.zoom_switch;

        d3.selectAll('.click_hlight')
          .remove();

        // // highlight selected column
        // ///////////////////////////////
        // // unhilight and unbold all columns (already unbolded earlier)
        // d3.selectAll('.col_label_text')
        //   .select('rect')
        //   .style('opacity', 0);
        // // highlight column name
        // d3.select(clicked_col)
        //   .select('rect')
        //   .style('opacity', 1);

        d3.select(clicked_col)
          .append('rect')
          .classed('click_hlight',true)
          .classed('col_top_hlight',true)
          .attr('width',params.viz.clust.dim.height)
          .attr('height',hlight_width)
          .attr('fill',params.matrix.hlight_color)
          .attr('opacity',opacity_hlight)
          .attr('transform',function(){
            var tmp_translate_y = 0;
            var tmp_translate_x = -(params.viz.clust.dim.height+
              params.class_room.col+params.viz.uni_margin);
            return 'translate('+tmp_translate_x+','+tmp_translate_y+')';
          });

        d3.select(clicked_col)
          .append('rect')
          .classed('click_hlight',true)
          .classed('col_bottom_hlight',true)
          .attr('width',params.viz.clust.dim.height)
          .attr('height',hlight_width)
          .attr('fill',params.matrix.hlight_color)
          .attr('opacity',opacity_hlight)
          .attr('transform', function(){
            // reverse x and y since rotated
            var tmp_translate_y = params.matrix.x_scale.rangeBand() - hlight_width;
            var tmp_translate_x = -(params.viz.clust.dim.height + 
              params.class_room.col+params.viz.uni_margin);
            return 'translate('+tmp_translate_x+','+tmp_translate_y+')';
          });
      } else {
        d3.selectAll('.click_hlight')
        .remove();
        params.click_hlight_col = -666;
      }

    }

    return container_all_col;

  }

  return {
    make_rows: make_rows,
    make_cols: make_cols
  };

}

