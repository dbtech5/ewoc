// no label
function geojson_vt(ilayer, ilayerfile, ilayerobject, ifillcolor, istrokecolor, istrokewidth, ilinedash,ilabel, izIndex, maxres) {
    var replacer = function (key, value) {
        if (value.geometry) {
            var type;
            var rawType = value.type;
            var geometry = value.geometry;

            if (rawType === 1) {
                type = 'MultiPoint';
                if (geometry.length == 1) {
                    type = 'Point';
                    geometry = geometry[0];
                }
            } else if (rawType === 2) {
                type = 'MultiLineString';
                if (geometry.length == 1) {
                    type = 'LineString';
                    geometry = geometry[0];
                }
            } else if (rawType === 3) {
                type = 'Polygon';
                if (geometry.length > 1) {
                    type = 'MultiPolygon';
                    geometry = [geometry];
                }
            }
            //console.log(value.tags)
            return {
                'type': 'Feature',
                'geometry': {
                    'type': type,
                    'coordinates': geometry
                },
                'properties': value.tags
            };
        } else {
            return value;
        }
    };

    //To project the geojson tiles to the screen
    var tilePixels = new ol.proj.Projection({
        code: 'TILE_PIXELS',
        units: 'tile-pixels'
    });

    //topojson data which is converted to geojson 
    var url = ilayerfile;
    fetch(url).then(function (response) {
        return response.json();
    }).then(function (json) {
        //conversion of topojson after promise is done
        // remove #1
        console.log(json)
        console.log(ilayerobject)
        console.log(json.objects[ilayerobject])
        console.log(json.objects)
        try {
            if (json.object[ilayerobject] == undefined) {
                ilayerobject = ilayerobject.toLowerCase()
            }
        } catch (err) {
            ilayerobject = ilayerobject.toLowerCase()
        }
        var geojson = topojson.feature(json, json.objects[ilayerobject]);
        //converts geojson data into vector tiles on the fly
        // change #2 geojson -> json
        // var tileIndex = geojsonvt(geojson, {
        var tileIndex = geojsonvt(geojson, {
            maxZoom: 20,
            extent: 4096,
            debug: 1
        });

        //Process of combining openLayers and geojson-vt
        var vectorSource = new ol.source.VectorTile({
            format: new ol.format.GeoJSON(),
            // add #3 tileGrid & tilePixelRatio
            // tileGrid: ol.tilegrid.createXYZ(),
            // tilePixelRatio: 16,                
            tileLoadFunction: function (tile) {
                //Preparation of tile data
                var format = tile.getFormat();
                var tileCoord = tile.getTileCoord();
                // console.log(tileCoord)
                var data = tileIndex.getTile(tileCoord[0], tileCoord[1], -tileCoord[2] - 1);

                //Facilitates the slicing of Geojson data 
                //Preparation of Geojson data
                var features = format.readFeatures(
                    JSON.stringify({
                        type: 'FeatureCollection',
                        features: data ? data.features : []
                    }, replacer));
                //Responsible for loading tiles based on prepped data
                tile.setLoader(function () {
                    tile.setFeatures(features);
                    tile.setProjection(tilePixels);
                });
            },
            // arbitrary url, we don't use it in the tileLoadFunction
            url: 'data:'
        });

        //VectorTile Instance with geojson format and custom tileLoadFunction method
        layers[ilayer] = new ol.layer.VectorTile({
            source: vectorSource,
            //minResolution: 10,
            // display layer when map.resolution <= maxres
            maxResolution: maxres,
            Zindex: izIndex,
        });

        // Layer's Style
        if (ilayer == 'Basin') {
            layers[ilayer].setStyle([
                new ol.style.Style({
                    fill: new ol.style.Fill({ color: "rgba(0, 0, 0, 0)" }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 0, 0, 1)',
                        width: 5
                    })
                }),
                new ol.style.Style({
                    fill: new ol.style.Fill({ color: "rgba(0, 0, 0, 0)" }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(200, 0, 0, 0.8)',
                        width: 2,
                    })
                })
            ]);
        } else if (ilayer == 'Road') {
            layers[ilayer].setStyle([
                // border
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 0, 0, 1)',
                        width: 4,
                        zIndex: 0
                    })
                }),
                // line
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255, 255, 255, 1)',
                        width: 2,
                        zIndex: 1
                    })
                })
            ]);
        } else if (ilayer == 'Railway') {
            let icheck = document.getElementById('text-'+ilayer).checked
            let isize = document.getElementById('size-'+ilayer).innerHTML/10.5
            
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 1)',
                    width: 3,
                }),
                text: new ol.style.Text({
                    scale: isize,
                    font: '15px calibri, sans-serif',
                    placement: 'line',
                    offsetX: 0,
                    offsetY: -10,
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255, 255, 255, 1)',
                        width: 1.5
                    })
                })
            });
            if(icheck){
                layers[ilayer].setStyle(function (feature) {
                    style.getText().setText("" + feature.get('NAME_T'));
                    return style;
                })
            }else{
                layers[ilayer].setStyle(function (feature) {
                    return style;
                })
            }
            

        } else if (ilayer == 'Pipe_Main') {
            let icheck = document.getElementById('text-'+ilayer).checked
            let isize = document.getElementById('size-'+ilayer).innerHTML/10.5
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(219, 137, 103, 1)',
                    width: 2.5,
                }),
                text: new ol.style.Text({
                    scale: isize,
                    fill: new ol.style.Fill({
                    color: '#000000'
                    }),
                    stroke: new ol.style.Stroke({
                    color: '#FFFFFF',
                    width: 3.5
                    })
                })
            });
            if(icheck){
                layers[ilayer].setStyle(function (feature) {
                    style.getText().setText("" + feature.get(ilabel));
                    return style;
                })
            }else{
                layers[ilayer].setStyle(function (feature) {
                    return style;
                })
            }

        } else if (ilayer == 'Contour') {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(64, 64, 64, 1)',
                    width: 0.8,
                }),
                text: new ol.style.Text({
                    font: '16px calibri, sans-serif',
                    placement: 'line',
                    offsetX: 0,
                    offsetY: 0,
                    stroke: new ol.style.Stroke({
                        color: 'rgba(112, 30, 30, 1)',
                        width: 0.7
                    })
                })
            });
            layers[ilayer].setStyle(function (feature) {
                style.getText().setText("" + feature.get('TP_ELEV'));
                return style;
            })
        } else if (ilayer == 'Floodway') {
            // ลร.1 ลร.2
            let tmp_op = 1
            if (opacity <= 1 && opacity >= 0) {
                tmp_op = opacity
            }
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(64, 64, 64, ' + tmp_op + ')',
                    width: 1
                }),
                fill: new ol.style.Fill()
            });
            layers[ilayer].setStyle(function (feature) {
                var value = feature.get('Type');
                // console.log (value) 0.8
                console.log(">" + opacity)
                if (opacity == undefined) {
                    opacity = 1
                }

                var color = value == "ลร1" ? 'rgb(190, 232, 255, ' + opacity + ')' :
                    value == "ลร2" ? 'rgb(0, 179, 255, ' + opacity + ')' :
                        'rgb(255, 255, 255, 0)';
                style.getFill().setColor(color);
                return style;
            });
        } else if (ilayer == 'Isohyet') {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(64, 64, 64, 1)',
                    width: 2,
                }),
                text: new ol.style.Text({
                    font: '16px calibri, sans-serif',
                    placement: 'line',
                    offsetX: 0,
                    offsetY: 0,
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255, 255, 255, 1)',
                        width: 1.5
                    })
                })
            });
            layers[ilayer].setStyle(function (feature) {
                style.getText().setText("" + feature.get('Isohyet'));
                return style;
            })
        } else if (ilayer == 'Supply_Shortage') {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(64, 64, 64, 0.2)',
                    width: 0.5
                }),
                fill: new ol.style.Fill()
            });
            layers[ilayer].setStyle(function (feature) {
                var value = feature.get('Supply_Lev');
                // console.log (value)
                var color = value == "1" ? 'rgb(152, 230, 0, 0.8)' :
                    value == "2" ? 'rgb(115, 223, 255, 0.8)' :
                        value == "3" ? 'rgb(255, 255, 0, 0.8)' :
                            value == "4" ? 'rgb(255, 115, 223, 0.8)' :
                                value == "5" ? 'rgb(255, 85, 0, 0.8)' :
                                    'rgb(255, 255, 255, 0)';
                style.getFill().setColor(color);
                return style;
            });
        } else if (ilayer == 'Irr_Shortage') {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(64, 64, 64, 0.2)',
                    width: 0.5
                }),
                fill: new ol.style.Fill()
            });
            layers[ilayer].setStyle(function (feature) {
                var value = feature.get('Irr_Level');
                var color = value == "1" ? 'rgb(152, 230, 0, 0.8)' :
                    value == "2" ? 'rgb(255, 115, 223, 0.8)' :
                        value == "3" ? 'rgb(255, 0, 197, 0.8)' :
                            value == "4" ? 'rgb(255, 85, 0, 0.8)' :
                                value == "5" ? 'rgb(132, 0, 168, 0.8)' :
                                    'rgb(255, 255, 255, 0)';
                style.getFill().setColor(color);
                return style;
            });
        } else if (ilayer == 'Areabased') {
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(64, 64, 64, 1)',
                    width: 1
                }),
                fill: new ol.style.Fill()
            });
            layers[ilayer].setStyle(function (feature) {
                var value = feature.get('TYPE1');
                // console.log (value)
                var color = value == "พื้นที่เสี่ยงภัยแล้ง" ? 'rgb(255, 0, 0, 0.8)' :
                    value == "พื้นที่เสี่ยงภัยน้ำท่วม" ? 'rgb(25, 175, 240, 0.8)' :
                        value == "พื้นที่เสี่ยงภัยท่วมแล้ง" ? 'rgb(128, 76, 133, 0.8)' :
                            value == "น้ำเค็มรุกล้ำ" ? 'rgb(93, 255, 28, 0.8)' :
                                'rgb(255, 106, 0, 0.8)';
                style.getFill().setColor(color);
                return style;
            });

        } else {
            // style from parameters
            let icheck = false
            let isize = 12/10.5
            try{
                icheck = document.getElementById('text-'+ilayer).checked
                isize = document.getElementById('size-'+ilayer).innerHTML/10.5
            }catch(err){

            }
            
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(64, 64, 64, 1)',
                    width: 0.8,
                }),
                text: new ol.style.Text({
                    
                    scale: isize,
                    fill: new ol.style.Fill({
                    color: '#000000'
                    }),
                    stroke: new ol.style.Stroke({
                    color: '#FFFFFF',
                    width: 3.5
                    })
                })
            });
            if(icheck){
                layers[ilayer].setStyle(function (feature) {
                    style.getText().setText("" + feature.get(ilabel));
                    return style;
                })
            }else{
                layers[ilayer].setStyle(function (feature) {
                    return style;
                })
            }
        }
        addLayer(layers[ilayer]);
    });
}

// function: topojson_label
// แสดงสัญลักษณ์แบบเดียว + แสดง label
// จังหวัด อำเภอ ตำบล เทศบาล ป่าไม้ พื้นที่ชุ่มน้ำ
// parameter 10 ตัว
function topojson_label(ilayer, ilayerfile, ifont, itextfillcolor, itextstrokecolor, itextstrokewidth, ifillcolor, istrokecolor, istrokewidth, ilinedash, ilabel, displayText=true,iscale = 12, maxres) {
    console.log(ilayer)
    let display = document.getElementById('text-'+ilayer).checked
    let scale = document.getElementById('size-'+ilayer).innerHTML/10.5
    console.log(displayText,iscale)
    var labelStyle = new ol.style.Style({
        text: new ol.style.Text({
            font: ifont,
            overflow: true,
            scale : scale,
            fill: new ol.style.Fill({
                color: itextfillcolor,
            }),
            stroke: new ol.style.Stroke({
                color: itextstrokecolor,
                width: itextstrokewidth
            })
        })
    });

    var arrlinedash = JSON.parse("[" + ilinedash + "]");
    var layerStyle = new ol.style.Style({
        fill: new ol.style.Fill({
            color: ifillcolor
        }),
        stroke: new ol.style.Stroke({
            color: istrokecolor,
            width: istrokewidth,
            // lineDash: [10, 0, 10]
            lineDash: arrlinedash
        })
    });
    var style = [layerStyle, labelStyle];

    layers[ilayer] = new ol.layer.Vector({
        source: new ol.source.Vector({
            url: ilayerfile,
            format: new ol.format.TopoJSON(),
        }),
        //minResolution: 10,
        // display layer when map.resolution <= maxres
        maxResolution: maxres,

        style: function (feature) {
            var geometry = feature.getGeometry();
            
            if (geometry.getType() == 'MultiPolygon') {
                // Only render label for the widest polygon of a multipolygon
                var polygons = geometry.getPolygons();
                var widest = 0;
                for (var i = 0, ii = polygons.length; i < ii; ++i) {
                    var polygon = polygons[i];
                    var width = ol.extent.getWidth(polygon.getExtent());
                    if (width > widest) {
                        widest = width;
                        geometry = polygon;
                    }
                }
            }
            // Check if default label position fits in the view and move it inside if necessary
            geometry = geometry.getInteriorPoint();
            var size = map.getSize();
            var extent = map.getView().calculateExtent([size[0] - 12, size[1] - 12]);
            var textAlign = 'center';
            var coordinates = geometry.getCoordinates();
            if (!geometry.intersectsExtent(extent)) {
                geometry = new ol.geom.Point(ol.geom.Polygon.fromExtent(extent).getClosestPoint(coordinates));
                // Align text if at either side
                var x = geometry.getCoordinates()[0];
                if (x > coordinates[0]) {
                    textAlign = 'left';
                }
                if (x < coordinates[0]) {
                    textAlign = 'right';
                }
            }

            labelStyle.setGeometry(geometry);
            
            if(display){
                labelStyle.getText().setText(feature.get(ilabel));
                labelStyle.getText().setTextAlign(textAlign);
            }
            return style;
        },
        declutter: true,
        renderBuffer: 1  // If left at default value labels will appear when countries not visible
    });
    addLayer(layers[ilayer])
};

// function: point_label
// geojson + Label on clickl
// หมู่บ้าน สถานีคมนาคม บ่อบาดาล โครงการพัฒนาแหล่งน้ำ สถานีสูบน้ำ สถานีวัดน้ำฝน สถานีวัดน้ำท่า สิ่งกีดขวางทางน้ำ โรงงาน
// parameter 4 ตัว
function point_label(ilayer, ilayerfile, iconfile, markerName, iconscale,ilabel) {

    //var layerPoint = ilayer+'Point';
    //layerPoint = {}; 
    
    console.log('text-'+ilayer)
    let icheck = document.getElementById('text-'+ilayer).checked
    let isize = document.getElementById('size-'+ilayer).innerHTML/10.5
    $.getJSON(ilayerfile, function (result) {
        var iconFeatures = []
        $.each(result['features'], function (i, data) {
            //VillagePoint[data.properties.Village_Name_T] = data
            
            var iconGeometry = ol.proj.fromLonLat([data.geometry.coordinates[0], data.geometry.coordinates[1]])
            //console.log(new ol.geom.Point(iconGeometry).flatCoordinates)
            var iconFeature = new ol.Feature({
                geometry: new ol.geom.Point(iconGeometry),
                iconGeometry,
                name: markerName,
                data: data
            });
            var iconStyle = null
            if(ilabel && icheck){
                iconStyle = new ol.style.Style({
                    image: new ol.style.Icon(({
                        anchor: [0.5, 1],
                        opacity: 0.8,
                        src: iconfile,
                        // mapsize/imagesize
                        scale: iconscale
                    })),
                    text: new ol.style.Text({
                        text: data.properties[ilabel],
                        scale: isize,
                        fill: new ol.style.Fill({
                          color: '#000000'
                        }),
                        stroke: new ol.style.Stroke({
                          color: '#FFFFFF',
                          width: 3.5
                        })
                      })
                });
            }else{
                iconStyle = new ol.style.Style({
                    image: new ol.style.Icon(({
                        anchor: [0.5, 1],
                        opacity: 0.8,
                        src: iconfile,
                        // mapsize/imagesize
                        scale: iconscale
                    }))
                });
            }

            iconFeature.setStyle(iconStyle)
            iconFeatures.push(iconFeature)
        })

        var vectorSource = new ol.source.Vector({
            features: iconFeatures
        })

        layers[ilayer] = new ol.layer.Vector({
            source: vectorSource
        })

        addLayer(layers[ilayer])
        layers[ilayer].setZIndex(99);
    });
};


// -----------------------------------------------------------------------
// Switch Layer Group

// ขอบเขตลุ่มน้ำ
$('#Basin_group').change(function () {
    var info = $(this).parent().parent().find('.filter_info')
    if (this.checked) {
        $(info).show()
    } else {
        $(info).hide()
        // removeSubLayer('basic_checkbox')
        $('.basin_checkbox').prop('checked', false)
        $('.basin_checkbox').trigger("change")
    }
});

// การปกครอง
$('#Admin_group').change(function () {
    var info = $(this).parent().parent().find('.filter_info')
    if (this.checked) {
        $(info).show()
    } else {
        $(info).hide()
        $('.admin_checkbox').prop('checked', false)
        $('.admin_checkbox').trigger("change")
    }
});

// แหล่งน้ำ
$('#River_group').change(function () {
    var info = $(this).parent().parent().find('.filter_info')
    if (this.checked) {
        $(info).show()
    } else {
        $(info).hide()
        $('.river_checkbox').prop('checked', false)
        $('.river_checkbox').trigger("change")
    }
});

// เส้นทางคมนาคม
$('#Trans_group').change(function () {
    var info = $(this).parent().parent().find('.filter_info')
    if (this.checked) {
        $(info).show()
    } else {
        $(info).hide()
        $('.trans_checkbox').prop('checked', false)
        $('.trans_checkbox').trigger("change")
    }
});

// Water Source
$('#Watersource_group').change(function () {
    var info = $(this).parent().parent().find('.filter_info')
    if (this.checked) {
        $(info).show()
    } else {
        $(info).hide()
        $('.watersource_checkbox').prop('checked', false)
        $('.watersource_checkbox').trigger("change")
    }
});


// Pipe
$('#Pipe_group').change(function () {
    var info = $(this).parent().parent().find('.filter_info')
    if (this.checked) {
        $(info).show()
    } else {
        $(info).hide()
        $('.pipe_checkbox').prop('checked', false)
        $('.pipe_checkbox').trigger("change")
    }
});

// Pump
$('#Pump_group').change(function () {
    var info = $(this).parent().parent().find('.filter_info')
    if (this.checked) {
        $(info).show()
    } else {
        $(info).hide()
        $('.pump_checkbox').prop('checked', false)
        $('.pump_checkbox').trigger("change")
    }
});

// Customer
$('#Customer_group').change(function () {
    var info = $(this).parent().parent().find('.filter_info')
    if (this.checked) {
        $(info).show()
    } else {
        $(info).hide()
        $('.customer_checkbox').prop('checked', false)
        $('.customer_checkbox').trigger("change")
    }
});

// Watersupply
$('#Watersupply_group').change(function () {
    var info = $(this).parent().parent().find('.filter_info')
    if (this.checked) {
        $(info).show()
    } else {
        $(info).hide()
        $('.watersupply_checkbox').prop('checked', false)
        $('.watersupply_checkbox').trigger("change")
    }
});


// โครงการพัฒนาแหล่งน้ำ
$('#WaterDev_group').change(function () {
    var info = $(this).parent().parent().find('.filter_info')
    if (this.checked) {
        info.show()
    } else {
        info.hide()
        // first markerName is not defined
        try {
            $('.waterdev_checkbox').prop('checked', false)
            $('.waterdev_checkbox').trigger("change")
        } catch (e) {
            var makername;
        }
        removeLayer(layers['Irr_Area']);
    }
})

// สถานีตรวจวัด
$('#Station_group').change(function () {
    var info = $(this).parent().parent().find('.filter_info')
    if (this.checked) {
        info.show()
    } else {
        info.hide()
        // index.html point layers on top cause markerName is not defined
        try {
            $('.station_checkbox').prop('checked', false)
            $('.station_checkbox').trigger("change")
        } catch (e) {
            var makername;
        }
        removeLayer(layers['Isohyet']);
    }
})

// สิ่งกีดขวางทางน้ำ
$('#Obstruction_group').change(function () {
    var info = $(this).parent().parent().find('.filter_info')
    if (this.checked) {
        info.show()
    } else {
        info.hide()
        $('.obstruction_checkbox').prop('checked', false)
        $('.obstruction_all_checkbox').prop('checked', false)
        $('.obstruction_checkbox').trigger("change")
    }
})

// อุตสาหกรรม
$('#Industrial_group').change(function () {
    var info = $(this).parent().parent().find('.filter_info')
    if (this.checked) {
        info.show()
    } else {
        info.hide()
        $('.industrial_checkbox').prop('checked', false)
        $('.industrial_checkbox').trigger("change")

        // index.html point layers on top cause markerName is not defined
        // try {
        //     $('.industrial_checkbox').prop('checked', false)
        //     $('.industrial_checkbox').trigger("change")
        // } catch (e) {
        //     var makername;
        // }
        // removeLayer(layers['Industrial']);
    }
})

// ผลสำรวจ
$('#Survey_group').change(function () {
    var info = $(this).parent().parent().find('.filter_info')
    if (this.checked) {
        info.show()
    } else {
        info.hide()
        $('.survey_checkbox').prop('checked', false)
        $('.survey_checkbox').trigger("change")
    }
})

// Landuse
$('#Landuse').change(function () {
    var info = $(this).parent().parent().find('.filter_info')
    if (this.checked) {
        info.show()
    } else {
        info.hide()
        removeLayer(layers['Landuse'])
        $('#lu_province').val('')
        $('#lu_province').trigger('change')
    }

    //toggleFeatureLayerWithCheckbox(this.checked, 'Landuse')
})

//-------------------------------------------------------------------------------
// show legend
// ไม่ต้องแล้ว

// landslide-switch
// $(".landslide-switch").change(function () {
//     var layerPrefix = 'landslide:'
//     var layerName = $(this).attr('layer')
//     var layer = layerPrefix + layerName

//     toggleLayerWithCheckbox(this.checked, layers[layer])
//     toggleInfoWithCheckbox(this.checked, this)

// });


// floodrisk-switch
// $(".floodrisk-switch").change(function () {
//     var layerPrefix = 'floodrisk:'
//     var layerName = $(this).attr('layer')
//     var layer = layerPrefix + layerName

//     toggleLayerWithCheckbox(this.checked, layers[layer])
//     toggleInfoWithCheckbox(this.checked, this)

// });

// drought-switch
// $(".drought-switch").change(function () {
//     var layerPrefix = 'drougth:'
//     var layerName = $(this).attr('layer')
//     var layer = layerPrefix + layerName

//     toggleLayerWithCheckbox(this.checked, layers[layer])
//     toggleInfoWithCheckbox(this.checked, this)
// });

// rainprediction-switch
// $(".rainprediction-switch").change(function () {
//     var layerPrefix = 'RainPrediction:'
//     var layerName = $(this).attr('layer')
//     var layer = layerPrefix + layerName

//     toggleLayerWithCheckbox(this.checked, layers[layer])
//     toggleInfoWithCheckbox(this.checked, this)
// });

// function: line_label (not use)
// ทางรถไฟ Isohyet Contour
// parameter 12 ตัว
// function line_label(ilayer, ilayerfile, ifont, itextfillcolor, itextstrokecolor, itextstrokewidth, istrokecolor, istrokewidth, ilinedash, ioffsetX, ioffsetY, ilabel) {
//     var arrlinedash = JSON.parse("[" + ilinedash + "]");
//     var linestyle = new ol.style.Style({
//         stroke: new ol.style.Stroke({
//             color: istrokecolor,
//             width: istrokewidth,
//             lineDash: arrlinedash
//         }),
//         text: new ol.style.Text({
//             font: ifont,
//             placement: 'line',
//             offsetX: ioffsetX,
//             offsetY: ioffsetY,
//             fill: new ol.style.Fill({
//                 color: itextfillcolor,
//             }),
//             stroke: new ol.style.Stroke({
//                 color: itextstrokecolor,
//                 width: itextstrokewidth
//             })
//         })
//     });


//     layers[ilayer] = new ol.layer.Vector({
//         source: new ol.source.Vector({
//             url: ilayerfile,
//             format: new ol.format.TopoJSON()
//         }),
//         style: function (feature) {
//             linestyle.getText().setText("" + feature.get(ilabel));
//             return linestyle;
//         }
//     });


// addLayer(layers[ilayer])
// }