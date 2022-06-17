function initLayer(url, layer, options = undefined) {
    var params = {
        'LAYERS': layer,
        'TILED': true
    }
    if (options) {
        params = merge(params, options);
    }

    var newLayer = new ol.layer.Tile({
        name: layer,
        source: new ol.source.TileWMS({
            url: url,
            params: params,
            serverType: 'geoserver',
            transition: 200,
            transparent: true,
            name: layer
        })
    })
    return newLayer
}


//โหลดข้อมูลมาล่วงหน้า
var dataset = {}
fetch('https://app.rid.go.th/reservoir/api/rsvmiddles')
  .then(response => response.json())
  .then(data => {
      console.log(data['region'])
      data['region'].forEach(ls=>{
        ls['reservoir'].forEach(item=>{
            //console.log(item)
              dataset[item.cresv] = item
        })
      })
      
  });

  
fetch('https://app.rid.go.th/reservoir/api/dams')
  .then(response => response.json())
  .then(data => {
      console.log(data)
      data['regions'].forEach(ls=>{
        ls['dams'].forEach(item=>{
              dataset[item.DAM_ID] = item
        })
      }) 
});
var properties_data = {}
$.get( "./csv/properties_data.csv", function( data ) {
    console.log()
    let val_data = data.replaceAll("'",'').split('\n')
    let head_val_data = val_data[0].split(',')
    console.log(head_val_data) 
    val_data.forEach((e)=>{
        let item_val_data = e.replaceAll("'",'').split(',')
        let json_tmp = {}
        let n = 0
        head_val_data.forEach((it)=>{
            json_tmp[it] = item_val_data[n]
            n++
        })
        properties_data[item_val_data[0]] = json_tmp
    })
    console.log(properties_data)
});

function initWmtsLayer(url, layer, options = undefined) {
    var titeSize = [256, 256];
    var bboxExtent = [-180.0, -90.0, 180.0, 90.0];
    var gridsetName = 'EPSG:4326';
    var resolutions = [
        0.703125,
        0.3515625,
        0.17578125,
        0.087890625,
        0.0439453125,
        0.02197265625,
        0.010986328125,
        0.0054931640625,
        0.00274658203125,
        0.001373291015625,
        6.866455078125E-4,
        3.4332275390625E-4,
        1.71661376953125E-4,
        8.58306884765625E-5,
        4.291534423828125E-5,
        2.1457672119140625E-5,
        1.0728836059570312E-5,
        5.364418029785156E-6,
        2.682209014892578E-6,
        1.341104507446289E-6,
        6.705522537231445E-7,
        3.3527612686157227E-7
    ];

    var gridNames = [];

    for (var i = 0; i <= 21; i++) {
        gridNames[i] = gridsetName + ':' + i;
    }

    var projection = ol.proj.get('EPSG:4326');

    var matrixIds = new Array(22);

    for (var z = 0; z <= 21; ++z) {
        matrixIds[z] = gridsetName + ':' + z;
    }

    var params = {}

    if (options) {
        params = merge(params, options);
    }

    var newLayer = new ol.layer.Tile({
        source: new ol.source.WMTS({
            url: url,
            layer: layer,
            matrixSet: 'EPSG:4326',
            format: 'image/png',
            projection: projection,
            tileGrid: new ol.tilegrid.WMTS({
                resolutions: resolutions,
                matrixIds: matrixIds,
                tileSize: titeSize,
                extent: bboxExtent,
            }),
            params: params
        })
    })
    return newLayer
}

function setCenter(lat, lon, zoom = 8) {
    map.getView().animate({
        center: ol.proj.transform([parseFloat(lon), parseFloat(lat)], 'EPSG:4326', 'EPSG:3857'),
        duration: 1000,
        zoom: zoom
    });
}

function addLayer(layer, layername = undefined, zIndex = undefined) {
    if (layer) {
        if (layername) {
            layer.set('layer_name', layername)
        }

        //layer.setOpacity(0.9)

        if (zIndex)
            layer.setZIndex(zIndex)

        map.addLayer(layer)
    }
}

function removeLayer(layer) {
    // viewLayers()
    // console.log('remove layer : ', layer)
    
    if (layer){
        del_active([layer])
        map.removeLayer(layer);
    }
        
}

// function removeLayerWithName(layerName) {
//     map.getLayers().forEach(function (layer) {
//         if (layer.get('name') != undefined & layer.get('name') === layerName) {
//             map.removeLayer(layer);
//         }
//     });
// }

// function viewLayers() {
//     map.getLayers().forEach(function (layer) {
//         console.log('layer name : ' + layer.get('name'), layer)
//     });
// }

// function bindInputs(layerid, layer) {
//     var visibilityInput = $(layerid + ' input.visible');
//     visibilityInput.on('change', function () {
//         layer.setVisible(this.checked);
//     });
//     visibilityInput.prop('checked', layer.getVisible());

//     var opacityInput = $(layerid + ' input.opacity');
//     opacityInput.on('input change', function () {
//         layer.setOpacity(parseFloat(this.value));
//     });
//     opacityInput.val(String(layer.getOpacity()));
// }

function toggleLayerWithCheckbox(checked, layer, layerName = undefined) {
    if (checked && layer) {
        addLayer(layer, layerName);
    } else {
        removeLayer(layer);
    }
}

function toggleFeatureLayerWithCheckbox(checked, layerName) {
    if (checked) {
        addFeatureLayer(layerName)
    } else {
        removeFeatureLayer(layerName)
    }
}

function toggleInfoWithCheckbox(checked, checkbox) {
    var info = $(checkbox).parent().parent().find('.filter_info')
    if (checked) {
        info.show()
    } else {
        info.hide()
    }
}
var click_dialog = false
var corX = 0,corY = 0;

//-----------------------------
var layer_active = []

var name_json = {
    'Basin_Name_T':'ลุ่มน้ำมูล',
    'SubBasin_Name_T':'ลุ่มน้ำสาขา',
    'District':'อำเภอ',
    'MBASIN_E,MBASIN_T':'ลุ่มน้ำประธาน 22 ลุ่มน้ำ',
    'Pump_PWA':'สถานีสูบน้ำ กปภ.',
    'Province':'จังหวัด',
    'Reservoir_Main':'พื้นที่น้ำหลาก',
    'pump6':'สถานีสูบน้ำ กปภ.',
    'TAM_NAM_T,AMPHOE_T,PROV_NAM_T':'ตำบล',
    'Local_Admin_Name_T':'เทศบาล',
    'River_Name':'กิโลเมตรลำน้ำ',
    'res_name':'อ่างเก็บน้ำ',
    'Rain_Station':'สถานีน้ำฝน',
    'IRR_Name_T':'อ่างเก็บน้ำ (หลัก)',
    'Reservoir_Reserv':'อ่างเก็บน้ำ (รอง)',
    'Pump_Main':'สถานีสูบน้ำ (หลัก)',
    'station_th':'สถานีตรวจอากาศ',
    'Rain_Station_Code':'สถานีวัดน้ำฝน',
    'Railway':'ทางรถไฟ',
    'Pipe_Main':'ท่อส่งน้ำ East Water',
    'Pipe_Klongluang':'ท่อคลองหลวง',
    'Hydro_Station_Code':'สถานีวัดน้ำท่า',
    'SubDistrict':'ตำบล',
    'Factory_Name':'โรงงาน',
    'Customer':'ลูกค้า',
}

let default_checkbox = {
    'SubDistrict':true,
    'Pipe_Main':true,
    'Pipe_Klongluang':true,
}

var layer_option = []
var set_layer_option = {}
function choose_active(text){
    var list_layer = document.getElementsByClassName('property-item')
    for(let i=0;i<list_layer.length;i++){
        list_layer[i].style.display = "none"
    }
    if($('.none-layer').text()){
        $('.none-layer').remove()
    }
    let text_format = ""
    text.forEach(item=>{
        text_format += "'" + item + "',"
    })
    console.log(layer_option.includes(text),text)
    if(!layer_option.includes(text[0])){
        layer_option.push(text[0])
        $('.group-property').append(`
        <div class="property-item property-${text}">
            <input type="checkbox" id="text-${text}" onchange="refresh_layer('${text}')" ${(default_checkbox[text]?'':'checked')}>
            <p>แสดงข้อความ</p>
            <br>
            <div class="control_font_size">
                <button onclick="size_text('${text}',-1,'${text}')"><i class="fa fa-minus"></i></button>
                <p id="size-${text}">12</p>
                <button onclick="size_text('${text}',1,'${text}')"><i class="fa fa-plus"></i></button>
            </div>
        </div>
        `)
    }
    
    $('#container-layer').prepend(`
        <div class="element-layer" onclick="active_layer([${text_format.substring(0,text_format.length-1)}])">${(name_json[text])?name_json[text]:text}<div>
    `)
    let element_in_layer = document.getElementsByClassName('property-'+text[0])
    console.log('property-'+text[0])
    for(let i=0;i<element_in_layer.length;i++){
        element_in_layer[i].style.display = "block"
    }
    console.log(text)
    layer_active.push(text)
    
}

function del_active(text){
    let i = 0
    let copy_layer = []
    console.log(text)
    $('#container-layer').empty()
    while(i<layer_active.length){
        let temp_lit = []
        let n = 0
        while(n<layer_active[i].length){
            if(layer_active[i][n] == text[n]){
                temp_lit.push(text[n])
            }
            n++
        }
        if(temp_lit.length == layer_active[i].length){

        }else{
            copy_layer.push(layer_active[i])
            let text_format = ""
            layer_active[i].forEach(item=>{
                text_format += "'" + item + "',"
            })
            $('#container-layer').prepend(`
                <div class="element-layer" onclick="active_layer([${text_format.substring(0,text_format.length-1)}])">${name_json[layer_active[i]]}<div>
            `)
        }
        i++
    }
    layer_active = copy_layer
}


// element in layer group


function active_layer(name){
    let i = 0
    let copy_layer = []
    $('#container-layer').empty()
    while(i<layer_active.length){
        let temp_lit = []
        let n = 0
        while(n<layer_active[i].length){
            if(layer_active[i][n] == name[n]){
                temp_lit.push(name[n])
            }
            n++
        }
        if(temp_lit.length == layer_active[i].length){
            
        }else{
            copy_layer.push(layer_active[i])
            let text_format = ""
            layer_active[i].forEach(item=>{
                text_format += "'" + item + "',"
            })
            $('#container-layer').prepend(`
                <div class="element-layer" onclick="active_layer([${text_format.substring(0,text_format.length-1)}])">${name_json[layer_active[i]]}<div>
            `)
        }
        i++
    }
    
    console.log(layer_active)
    layer_active = copy_layer
    console.log(layer_active)
    console.log(name)
    layer_active.push(name)
    let text_format = ""
    layer_active[layer_active.length-1].forEach(item=>{
        text_format += "'" + item + "',"
    })
    console.log(text_format)
    $('#container-layer').prepend(`
        <div class="element-layer" onclick="active_layer(['${text_format.substring(0,text_format.length-1)}])">${name_json[layer_active[layer_active.length-1]]}<div>
    `)
    $('.'+name).click()
    setTimeout(()=>{
        $('.'+name).click()
    },100)
    var list_layer = document.getElementsByClassName('property-item')
    for(let i=0;i<list_layer.length;i++){
        list_layer[i].style.display = "none"
    }
    
    let element_in_layer = document.getElementsByClassName('property-'+name[0])
    console.log('property-'+name[0])
    for(let i=0;i<element_in_layer.length;i++){
        element_in_layer[i].style.display = "block"
    }
    
    //choose_active(name)
}

// ----------------------------
// show popup info

document.getElementsByClassName('dialog_temp_fa')[0].addEventListener('click',()=>{
    document.getElementById("dialog_temp").style.display = "none"
})


/*
var properties_data = {
'rsv357':['อ่างดอกกราย','ดอกกราย','ระยอง','main','m','rid','101.220512','12.887343','277.85','82','71.4','3','53.3','52.6','40','156.63'],
'100504':['อ่างหนองปลาไหล','หนองปลาไหล','ระยอง','main','l','rid','101.283671','12.931205','401.33','205.85','163.75','13.5','46.7','45','33.3','187'],
'rsv359':['อ่างคลองใหญ่','คลองใหญ่','ระยอง','main','m','rid','101.325935','12.964004','220.45','58.5','40.1','3','47.72','46','40','49.2'],
'100505':['อ่างประแสร์','ประแสร์','ระยอง','main','l','rid','101.566703','12.979399','580.58','322','248','20','36.57','35','24','294'],
'100503':['อ่างบางพระ','บางพระ','ชลบุรี','main','l','rid','100.962142','13.210864','60.12','127','117','12.06','30.6','30','20','47'],
'rsv346':['อ่างหนองค้อ','หนองค้อ','ชลบุรี','main','m','rid','101.034451','13.131877','123.24','23.4','21.4','1','66.5','65','57.5','19'],
'rsv491':['อ่างคลองหลวง','รัชชโลทร','คลองหลวง','รัชชโลทร','ชลบุรี','main','m','rid','101.352853','13.389863','479.12','140.16','98','2.95','37.16','35.5','28','133.52'],
'100502':['อ่างคลองสียัด','คลองสียัด','ฉะเชิงเทรา','main','l','rid','101.652335','13.440328','976.55','450','420','30','65.45','65.1','51.5','286'],
'rsv345':['อ่างมาบประชัน','มาบประชัน','ชลบุรี','other','m','rid','100.958225','12.935901','37.36','17.2','16.6','0.76','45.7','45','36','14'],
'rsv344':['อ่างห้วยชากนอก','ห้วยซากนอก','ชลบุรี','other','m','rid','100.936043','12.880603','15.26','7.9','7.03','0.4','23.6','23','15.6','7.33'],
'rsv347':['อ่างห้วยขุนจิต','ห้วยขุนจิต','ชลบุรี','other','m','rid','101.007873','13.010451','14.8','5.8','4.8','0.25','65.88','65','57','4.2'],
'rsv349':['อ่างห้วยสะพาน','ห้วยสะพาน','ชลบุรี','other','m','rid','101.035089','13.074853','13.25','4.85','3.84','0.3','74.94','74','67','5.88'],
'rsv343':['อ่างหนองกลางดง','หนองกลางดง','ชลบุรี','other','m','rid','101.016301','13.040398','20.01','8.7','7.65','0.3','62','61.2','51','7.7'],
'rsv358':['อ่างคลองระโอก','คลองระโอก','ระยอง','other','m','rid','101.757686','12.862605','42.27','24','19.65','0.49','34.5','33.5','23','15.47'],
'rsv336':['อ่างคลองระบม','คลองระบม','ฉะเชิงเทรา','other','m','rid','101.640353','13.696832','169.49','59','40','7.8','40.5','39','34','54'],
'rsv352':['อ่างห้วยตู้','1','ห้วยตู้','1','ชลบุรี','other','m','rid','100.946451','12.754966','6.38','2','1.5','0.09','37.3','36.5','32','5.86'],
'rsv337':['อ่างลาดกระทิง','ลาดกระทิง','ฉะเชิงเทรา','other','m','rid','101.434451','13.570078','22.47','5.5','4.2','0.2','59.8','59','54.5','61.91'],
'rsvnon1':['อ่างละลาก','ละลาก','ฉะเชิงเทรา','other','m','rid','101.816021','13.368297','12.18','','3.4','0.3','51','50','41','none'],
'rsvnon2':['อ่างคลองบางไผ่','คลองบางไผ่','ชลบุรี','other','m','rid','101.022419','12.776551','87','12.78','9.15','3','53.3','51.3','','25.04'],
'rsvnon3':['อ่างแหลมเขา','แหลมเขา','ฉะเชิงเทรา','other','m','rid','101.474767','13.720374','3.42','none','none','none','none','none','none','none'],
'rsvnon4':['อ่างห้วยน้ำโจน','ห้วยน้ำโจน','ฉะเชิงเทรา','other','m','rid','101.538159','13.74878','2.77','1.97','1.6','0.17','34','33.5','29.5','1.86'],
}
*/
var parttern_label = {
    '01':'มกราคม',
    '02':'กุมภาพันธ์',
    '03':'มีนาคม',
    '04':'เมษายน',
    '05':'พฤกษาคม',
    '06':'มิถุนายน',
    '07':'กรกฎาคม',
    '08':'สิงหาคม',
    '09':'กันยายน',
    '10':'ตุลาคม',
    '11':'พฤศจิกายน',
    '12':'ธันวาคม',
}

function displayFeatureInfo(pixel, coordinate) {
    var features = []
    //var container = document.getElementById('popup')
    map.forEachFeatureAtPixel(pixel, function (feature, layer) {
        features.push(feature)
    })
    
    //console.log('displayFeatureInfo', features)
    if (features.length > 0) {
        var info = []
        var not = false
        for (var i = 0, ii = features.length; i < ii; ++i) {
            //info.push(features[i].get('name'))
            if(not == false){
                document.getElementById("text-dialog").innerHTML = ''
                var f = features[0]
                setTimeout(()=>{
                    click_dialog = true
                    if(document.getElementById("text-dialog").innerHTML != "กรุณาเลือกข้อมูลใหม่" && document.getElementById("text-dialog").innerHTML != ""){
                        document.getElementById("dialog_temp").style.display = "block"
                    }
                    
                    document.getElementById("dialog_temp").style.top = (corY-78)+"px"
                    document.getElementById("dialog_temp").style.left = (corX-26)+"px"
                },0)
                
                let tmp = "";
                console.log(layer_active)
                console.log(f.values_)
                
                document.getElementById('dialog_table').style.display = 'none'
                if(layer_active[layer_active.length-1].length == 1){
                    console.log(f.values_)
                    //console.log(Object.keys(f.values_.data.properties),Object.keys(f.values_.data.properties).includes('cresv'),Object.keys(f.values_.data.properties).includes('DAM_ID'))
                    try{
                        if(Object.keys(f.values_.data.properties).includes('cresv') || Object.keys(f.values_.data.properties).includes('dam_id')){
                            console.log(f.values_.data.properties.dam_id,dataset[f.values_.data.properties.dam_id])
                            tmp = dataset[f.values_.data.properties.dam_id]
                            console.log(tmp['cresv'],tmp['DAM_ID'],tmp)
                            let text_show = ''
                            let f_date = (tmp['cresv']?tmp['date']:tmp['DMD_Date']).split('-')
                            let date_text = ''
                            console.log(properties_data[(tmp['cresv']?tmp['cresv']:tmp['DAM_ID'])])
                            date_text = ((f_date[2].substring(0,1)  == '0')?f_date[2].substring(1):f_date[2])+" "+ parttern_label[f_date[1]] +" "+ (parseInt(f_date[0])+543)
                            text_show += '<b style="font-weight:bold;color:#000;">'+properties_data[(tmp['cresv']?tmp['cresv']:tmp['DAM_ID'])]['name2'].replace('อ่าง','อ่างเก็บน้ำ') +'</b><br>'
                            text_show += 'จังหวัด '+properties_data[(tmp['cresv']?tmp['cresv']:tmp['DAM_ID'])]['province'] +'<br>'
                            text_show += 'ความจุกักเก็บ ' + properties_data[(tmp['cresv']?tmp['cresv']:tmp['DAM_ID'])]['maxvol'] +' ล้าน ลบ.ม. <br>'
                            text_show += 'ข้อมูลวันที่ ' +  date_text +'<br>'
                            text_show += 'ปริมาณน้ำในอ่าง ' + tmp[tmp['cresv']?'qdisc_curr':'DMD_QUse'] +' ล้าน ลบ.ม. <br>'
                            text_show += 'ปริมาณน้ำที่ใช้การ ' + (tmp['cresv']?tmp['water_workable']:tmp['v_QUsage']) +' ล้าน ลบ.ม. <br>'
                            text_show += 'ปริมาณน้ำไหลเข้า ' + tmp[tmp['cresv']?'q_info':'DMD_Inflow'] +' ล้าน ลบ.ม. <br>'
                            text_show += 'ปริมาณน้ำระบาย ' + tmp[tmp['cresv']?'q_outfo':'DMD_Outflow'] +' ล้าน ลบ.ม. <br>'
                            
                            document.getElementById("text-dialog").innerHTML = text_show
                            document.getElementById('dialog_table').style.display = 'block'
                            $('#dialog_table').empty()
                            $('#dialog_table').append('<table><tr id="tb_data"></tr><tr id="td_data"></tr></table>')
                            Object.keys(tmp).forEach(element => {
                                $('#tb_data').append('<th>'+element+'</th>')
                            });
                            Object.values(tmp).forEach(element => {
                                $('#td_data').append('<th>'+element+'</th>')
                            });
                        }else if(layer_active[layer_active.length-1] == "res_id"){
                            console.log(f.values_.data.properties.res_id,dataset[f.values_.data.properties.res_id])
                            tmp = dataset[f.values_.data.properties.res_id]['cap_resv']
                            document.getElementById("text-dialog").innerHTML = tmp['cap_resv']
                        }else if(f.values_[layer_active[layer_active.length-1]] == undefined){
                            tmp = "กรุณาเลือกข้อมูลใหม่"
                            console.log(tmp)
                            not = true
                            let txt_format = ''
                            let json_data_feature = f.values_
                            jQuery.each(json_data_feature, function(i, val) {
                                console.log(i)
                                if(val && !['x','y','no','type','owner','size'].includes(i)){
                                    txt_format += i+":"+val+"<br>"
                                }
                            });
                            document.getElementById("text-dialog").innerHTML = txt_format
                            document.getElementById("dialog_temp").style.display = "none"
                        }else{
                            tmp = f.values_[layer_active[layer_active.length-1]]
                            document.getElementById("text-dialog").innerHTML = tmp
                            document.getElementById("dialog_temp").style.display = "none"
                        }
                    }catch(err){
                        console.log(f.values_)
                        let text_show = ''
                        Object.keys(f.values_).forEach((item)=>{
                            if(item != "geometry")
                                text_show += item +":"+ f.values_[item]+"<br>"
                        })
                        document.getElementById("text-dialog").innerHTML = text_show
                        document.getElementById('dialog_table').style.display = 'block'
                    }
                }else{
                    layer_active[layer_active.length-1].forEach(data=>{
                        tmp += f.values_[data]+"<br>"
                    })
                    document.getElementById("text-dialog").innerHTML = tmp
                }
                
                    
                
                var name = f.get('name')
                //console.log(popups, name)
                //alert (name)
                var geometry = f.getGeometry();
                var coord = geometry.getCoordinates();
                console.log(layer_active[layer_active.length-1],coord,f.get('data'))
                //var content = '<p>'+f.get('name')+'</p>';
                // popup.show(coord, content);
                try{
                    popups[name].content.innerHTML = getTemplateForMarker(name, f.get('data'));
                    popups[name].popup.setPosition(coord);
                }catch(err){

                }
                
            }
        }
    }
}

document.addEventListener('mousemove',(e)=>{
    if(click_dialog == false){
        document.getElementById("dialog_temp").style.top = (e.clientY-63)+"px"
        document.getElementById("dialog_temp").style.left = (e.clientX+3)+"px"
    }
    corX = e.clientX
    corY = e.clientY
})

document.addEventListener('click',()=>{
    document.getElementById("dialog_temp").style.display = "none"
    click_dialog = false
})
function removefeatureInfo(markerName) {
    //popups[markerName].popup.hide()
    popups[markerName].popup.setPosition(undefined)
}

function getTemplateForMarker(markerType, data) {
    if (markerType == 'Village') {
        var str = data.properties.v_name_t + '<br />' +
            data.properties.tambon + '<br />' +
            data.properties.district + '<br />' +
            data.properties.province
        return str
    } else if (markerType == 'dams') {
        var str = data.properties.DAM_ID
        return str
    } else if (markerType == 'Trans_Station') {
        var str = data.properties.TFac_PT_Name_T
        return str
    } else if (markerType == 'River_Distance') {
        var str = 'กม.ที่ ' + data.properties.River_Distance + '<br />' +
            'แม่น้ำ ' + data.properties.River_Name
        return str
    } else if (markerType == 'Reservoir') {
        var str = data.properties.res_name + '<br />' +
            'จ.' + data.properties.province + '<br />' + 
            'ความจุ ' + data.properties.vol_mcm + ' ล้าน ลบ.ม.'
        return str
    } else if (markerType == 'Irr_Project') {
        var str = data.properties.Irr_Project_Name_T
        return str
    } else if (markerType == 'Irr_Pump') {
        var str = 'สถานี: ' + data.properties.IRR_Name_T + '<br />' +
            'รหัส: ' + data.properties.IRR_PUMP_ID + '<br />' +
            data.properties.Tambon_Name_T + '<br />' +
            data.properties.District_Name_T + '<br />' +
            data.properties.Province_Name_T
        return str
    } else if (markerType == 'Well') {
        var str = 'สถานที่เจาะ: ' + data.properties.Well_Site + '<br />' +
            'รหัส: ' + data.properties.Well_ID + '<br />' +
            'ตำบล: ' + data.properties.SubDistrict + '<br />' +
            'อำเภอ: ' + data.properties.District + '<br />' +
            'จังหวัด: ' + data.properties.Province
        return str
    } else if (markerType == 'Weather_Station') {
        var str = 'สถานี: ' + data.properties.station_th
        return str  
    } else if (markerType == 'Rain_Station') {
        var str = 'สถานีวัดน้ำฝน: ' + data.properties.Rain_Station_Code
        return str
    } else if (markerType == 'Level_Station') {
        var str = 'สถานีวัดน้ำท่า: ' + data.properties.Hydro_Station_Code
        return str
    } else if (markerType == 'Bridge') {
        var str = data.properties.Name
        return str
    } else if (markerType == 'Diversion_Dam') {
        var str = data.properties.Name
        return str
    } else if (markerType == 'Weir') {
        var str = data.properties.Name
        return str
    } else if (markerType == 'Regulator') {
        var str = data.properties.Name
        return str
    } else if (markerType == 'Levee') {
        var str = data.properties.Name
        return str
    } else if (markerType == 'Polder') {
        var str = data.properties.Name
        return str
    } else if (markerType == 'Culvert') {
        var str = data.properties.Name
        return str
    } else if (markerType == 'Factory') {
        var str = 'โรงงาน: ' + data.properties.Factory_Name
        return str
    } else if (markerType == 'Wetland') {
        var str = data.properties.Name_Full
        return str

    } else if (markerType == 'Cross_Section') {
        const imgPath = './survey/xs/';
        // var imgName1 = data.properties.Cross_Section;
        // var imgName2 = data.properties.Node_Descr;
        var imgName1 = data.properties.Xsection_No + "-1.jpg";
        var imgName2 = data.properties.Xsection_No + "-2.jpg";
        //var imgWidth = data.properties.Node_Km;
        
        // ใช้รูปตัวอย่าง
        // var imgName1 = 'XS-sample-1.jpg';
        // var imgName2 = 'XS-sample-2.jpg';
        var imgWidth = '40vw';
        
        // check file exists
        var checkfile = imgPath + imgName1
        var http = new XMLHttpRequest();
        http.open('HEAD', checkfile, false);
        http.send();
        // alert (http.status)

        if (http.status == 404) {
            return (imgName1 === "") ? undefined : imgNamexxx;
        }

        var str = '<h4> รูปตัดน้ำที่ ' + imgName1.replace(/\.[^/.]+$/, "") + '</h4>';
        str += '<div id="imgXSBox"><img src="' + imgPath + imgName1 + '" style="width:' + imgWidth + '" /></div>';
        str += '<text id="imgXSname" style="cursor: pointer;" onclick="InsertXSImg(\'' + imgPath + '\',\'' + imgName1 + '\',\'' + imgName2 + '\',\'' + imgWidth + '\')"> แสดงรูปที่ 2 ▷▶ </text>';
        console.log(str);
        return str;

    } else if (markerType == 'MapControl') {
        const imgPath = './survey/mapct/';
        var imgName1 = data.properties.mapct + "-1.jpg";
        var imgName2 = data.properties.mapct + "-2.jpg";
        
        // ใช้รูปตัวอย่าง
        // var imgName1 = 'GPS-sample-1.jpg';
        // var imgName2 = 'GPS-sample-2.jpg';
        // Portrait 25vw, Landscape 40vw
        var imgWidth = "25vw";      

        // check file exists
        var checkfile = imgPath + imgName1
        var http = new XMLHttpRequest();
        http.open('HEAD', checkfile, false);
        http.send();
        // alert (http.status)

        if (http.status == 404) {
            return (imgName1 === "") ? undefined : imgNamexxx;
        }

        var str = '<h4> หมุดหลักฐานที่ ' + imgName1.replace(/\.[^/.]+$/, "") + '</h4>';
        str += '<div id="imgMapControlBox"><img src="' + imgPath + imgName1 + '" style="width:' + imgWidth + '" /></div>';
        str += '<text id="imgMapControlname" style="cursor: pointer;" onclick="InsertMapControlImg(\'' + imgPath + '\',\'' + imgName1 + '\',\'' + imgName2 + '\',\'' + imgWidth + '\')"> แสดงรูปที่ 2 ▷▶ </text>';
        console.log(str);
        return str;

    } else if (markerType == 'Waterdepth') {
        const imgPath = './survey/waterdepth/';
        var imgName1 = data.properties.no + ".jpg";
        
        // ใช้รูปตัวอย่าง
        // var imgName1 = 'waterdepth-1.jpg';
        // Portrait 25vw, Landscape 40vw
        var imgWidth = "25vw";      

        // check file exists
        var checkfile = imgPath + imgName1
        var http = new XMLHttpRequest();
        http.open('HEAD', checkfile, false);
        http.send();
        // alert (http.status)

        if (http.status == 404) {
            return (imgName1 === "") ? undefined : imgNamexxx;
        }

        var str = '<div><img src="' + imgPath + imgName1 + '" style="width:' + imgWidth + '" /></div>';
        return str;

    } else if (markerType == 'Floodmark') {
        const imgPath = './survey/floodmark/';
        var imgName1 = data.properties.no + ".jpg";
        
        // ใช้รูปตัวอย่าง
        // var imgName1 = 'floodmark-1.jpg';
        // Portrait 25vw, Landscape 40vw
        var imgWidth = "25vw";      

        // check file exists
        var checkfile = imgPath + imgName1
        var http = new XMLHttpRequest();
        http.open('HEAD', checkfile, false);
        http.send();
        // alert (http.status)

        if (http.status == 404) {
            return (imgName1 === "") ? undefined : imgNamexxx;
        }

        var str = '<div><img src="' + imgPath + imgName1 + '" style="width:' + imgWidth + '" /></div>';
        return str;

    }   

}

// Insert XS Image
var imgInBox = "img1";
var imgXSname;
function InsertXSImg(imgPath, imgName1, imgName2, imgwidth) {
    imgName1file = imgPath + imgName1;
    imgName2file = imgPath + imgName2;
    if (imgInBox == "img1") {
        imgNo = "◀◁ แสดงรูปที่ 1";
        imgfile = imgName2file;
        imgInBox = "img2";
    } else {
        imgInBox = "img1";
        imgNo = "แสดงรูปที่ 2 ▷▶";
        imgfile = imgName1file;
    }
    document.getElementById("imgXSBox").innerHTML = '<img src="' + imgfile + '" style="width:' + imgwidth + '" />';
    document.getElementById("imgXSname").innerHTML = imgNo;
}

// Insert MapControl Image
var imgInBox = "img1";
var imgMapControlname;
function InsertMapControlImg(imgPath, imgName1, imgName2, imgwidth) {
    imgName1file = imgPath + imgName1;
    imgName2file = imgPath + imgName2;
    if (imgInBox == "img1") {
        imgNo = "◀◁ แสดงรูปที่ 1";
        imgfile = imgName2file;
        imgInBox = "img2";
    } else {
        imgInBox = "img1";
        imgNo = "แสดงรูปที่ 2 ▷▶";
        imgfile = imgName1file;
    }
    document.getElementById("imgMapControlBox").innerHTML = '<img src="' + imgfile + '" style="width:' + imgwidth + '" />';
    document.getElementById("imgMapControlname").innerHTML = imgNo;
}


// เก็บไว้ดูตัวอย่าง

// function getBallImg(aqi, type) {
//     //console.log(aqi)
//     var img = undefined
//     if (type == 'aqi') {
//         if (aqi >= 0 && aqi <= 25) {
//             img = '0'
//         } else if (aqi > 25 && aqi <= 50) {
//             img = '1'
//         } else if (aqi > 50 && aqi <= 100) {
//             img = '2'
//         } else if (aqi > 100 && aqi <= 200) {
//             img = '3'
//         } else if (aqi > 200) {
//             img = '4'
//         }
//     } else if (type == 'pm25') {
//         if (aqi >= 0 && aqi <= 25) {
//             img = '0'
//         } else if (aqi > 25 && aqi <= 37) {
//             img = '1'
//         } else if (aqi > 37 && aqi <= 50) {
//             img = '2'
//         } else if (aqi > 50 && aqi <= 90) {
//             img = '3'
//         } else if (aqi > 90) {
//             img = '4'
//         }
//     } else if (type == 'pm10') {
//         if (aqi >= 0 && aqi <= 50) {
//             img = '0'
//         } else if (aqi > 50 && aqi <= 80) {
//             img = '1'
//         } else if (aqi > 80 && aqi <= 120) {
//             img = '2'
//         } else if (aqi > 120 && aqi <= 180) {
//             img = '3'
//         } else if (aqi > 180) {
//             img = '4'
//         }
//     }
//     return img
// }

// function showWildFireWithRange() {
//     var startDate = moment($('#wildfire_daterange_start').val(), "DD-MM-YYYY").format('YYYYMMDD')
//     var endDate = moment($('#wildfire_daterange_end').val(), "DD-MM-YYYY").format('YYYYMMDD')
//     var modis = $('#wildfire_sat_modis').prop('checked')
//     var viirs = $('#wildfire_sat_viirs').prop('checked')
//     var layerFilters = []

//     removeLayer(layers['wildfire_range'])
//     //console.log('showWildFireWithRange', startDate, endDate, moment($('#wildfire_daterange_start').val(), "MM-DD-YYYY") , $('#wildfire_daterange_start').val())
//     if (modis) {
//         // sats.push('Aqua')
//         // sats.push('Terra')
//         layerFilters.push('wildfire:modis')
//     }

//     if (viirs) {
//         //sats.push('Terra')
//         layerFilters.push('wildfire:viirs')
//     }

//     if (layerFilters.length == 0) {
//         return
//     }

//     layers['wildfire_range'] = initLayer(geoserverURL, layerFilters.join(','), {
//         CQL_FILTER: " th_date >= '" + startDate + "' AND th_date <= '" + endDate + "'; th_date >= '" + startDate + "' AND th_date <= '" + endDate + "'  "
//     }) // AND satellite IN ('" + sats.join("','") + "') 
//     addLayer(layers['wildfire_range'], 'wildfire_range')
// }

// function addFeatureLayer(layer) {
//     if (showFeatureLayers.indexOf(layer) < 0) {
//         showFeatureLayers.push(layer)
//     }
// }

// function removeFeatureLayer(layer) {
//     var index = showFeatureLayers.indexOf(layer)
//     if (index > -1) {
//         showFeatureLayers.splice(index, 1)
//     }
// }

// function updateFeatureInfo(data, layerName) {
//     if (Array.isArray(data.features) && data.features.length > 0) {
//         for (var i = 0; i < data.features.length; i++) {
//             $('#' + layerName + '-info').append('<li>' + formatFeatureInfo(data.features[i].properties, layerName, data) + '</li>')
//         }
//     }
// }

// function forestInfoFormat(data) {
//     var res = []
//     if (data.NPRK_NAME) {
//         res.push('อุทยานแห่งชาติ ' + data.NPRK_NAME)
//     }

//     if (data.FP_NAME) {
//         res.push('วนอุทยาน ' + data.FP_NAME)
//     }

//     if (data.WLDS_NAME) {
//         res.push('เขตรักษาพันธ์ุสัตว์ป่า ' + data.WLDS_NAME)
//     }

//     if (data.NHA_NAME) {
//         res.push('เขตห้ามล่าสัตว์ ' + data.NHA_NAME)
//     }

//     if (data.NRF_NAME) {
//         res.push('ป่าสงวนแห่งชาติ ' + data.NRF_NAME)
//     }

//     if (data.MGF) {
//         res.push('ป่าชายเลน ' + data.MGF)
//     }

//     return res.join(',')
// }

// function formatFeatureInfo(data, layerName, featureObject) {
//     //console.log(layerName, layerName.search(/drought/g))
//     if (layerName == 'maize' || layerName == 'rice' || layerName == 'sugarcane' || layerName == 'cassava') {
//         return 'ต.' + data.t_name + ' อ.' + data.a_name + ' จ.' + data.p_name + '<br> วันที่ปลูก ' + data.start_name + '<br>  วันที่เก็บเกี่ยว ' + data.harv_name + '<br> พื้นที่ ' + numeral(data.area_rai).format('0,2') + 'ไร่ <br> ผลผลิต ' + numeral(data.yield_ton).format('0,2') + ' ตัน '
//     } else if (layerName == 'palm' || layerName == 'rubber') {
//         return data.genus_th + ' , ประเภท ' + data.lulc_th
//     } else if (layerName == 'flood_01') {
//         return 'ต.' + data.TB_TN + ' อ.' + data.AP_TN + ' จ.' + data.PV_TN + '<br>' + 'พื้นที่น้ำท่วม ' + numeral(data.flood_area).format('0,2') + ' ไร่'
//     } else if (layerName == 'forest') {
//         var html = 'วันที่ตรวจพบ : ' + data.UPDATE + '<br>'
//         html += 'พื้นที่ : ' + data.TB_TN + data.AP_TN + data.PV_TN + '<br>'
//         html += 'เขตป่าตามกฏหมาย :' + forestInfoFormat(data)
//         return html
//     } else if (layerName == 'wildfire_range') {
//         var str = 'ดาวเทียม :' + data.satellite + ' <br>  lat ' + data.latitude + ', long ' + data.longitude + '<br>'
//         str += 'วันที่ ' + data.th_date.replace('Z', '') + '<br>'
//         str += 'ต.' + data.tb_tn + ' อ.' + data.ap_tn + ' จ.' + data.pv_tn + '<br>';
//         str += data.lu_name
//         return str
//     } else if (layerName == 'wildfire_01') {
//         //console.log('wildfire_01', data)
//         var str = data.TB_TN + ' ' + data.AP_TN + ' ' + data.PV_TN;
//         if (data.rai && data.LU_NAME) str += '<br> ' + data.LU_NAME + ', พื้นที่ ' + numeral(data.rai).format('0,2') + ' ไร่'

//         return str
//     } else if (layerName.search(/drought/g) == 0) {
//         if (layerName.search(/ndvi/g) >= 0) {

//             var str = data.TB_TN + ' ' + data.AP_TN + ' ' + data.PV_TN;
//             var str = '<br>NDVI :' + numeral(data.MEAN).format('0.00') + ' <br>';
//             if (data.MEAN > -1 && data.MEAN <= 1) {
//                 if (data.MEAN < 0) {
//                     str += 'พืชพรรณไม่ค่อยมีความสมบูรณ์'
//                 } else if (data.MEAN >= 0 && data.MEAN <= 0.25) {
//                     str += 'พืชพรรณมีความสมบูรณ์น้อย'
//                 } else if (data.MEAN >= 0.25 && data.MEAN <= 0.5) {
//                     str += 'พืชพรรณมีความสมบูรณ์ปานกลาง'
//                 } else if (data.MEAN > 0.5) {
//                     str += 'พืชพรรณมีความสมบูรณ์มาก'
//                 }

//             }

//             return str
//         } else if (layerName.search(/lst/g) >= 0) {
//             var str = ''
//             if (data.LST > 0)
//                 str += 'อุณหภูมิ ' + numeral(data.LST).format('0.00') + ' องศาเซลเซียส';

//             str += '<br>' + data.TB_TN + ' ' + data.AP_TN + ' ' + data.PV_TN;
//             return str

//         } else if (layerName.search(/dri/g) >= 0) {

//             var str = numeral(data.MEAN).format('0.00') + ' %   <br>'
//             if (data.MEAN >= 0 && data.MEAN <= 25) {
//                 str += 'พื้นที่ไม่มีความเสี่ยงต่อภาวะความแห้งแล้ง'
//             } else if (data.MEAN >= 26 && data.MEAN <= 50) {
//                 str += 'พื้นที่มีความเสี่ยงต่อภาวะความแห้งแล้งน้อย'
//             } else if (data.MEAN >= 51 && data.MEAN <= 75) {
//                 str += 'พื้นที่มีความเสี่ยงต่อภาวะความแห้งแล้งปานกลาง'
//             } else if (data.MEAN >= 76) {
//                 str += 'พื้นที่มีความเสี่ยงต่อภาวะความแห้งแล้งมาก'
//             }

//             str += '<br>' + data.TB_TN + ' ' + data.AP_TN + ' ' + data.PV_TN;
//             return str
//         }
//     } else if (layerName.search(/sea/g) == 0) {
//         return numeral(data.GRAY_INDEX).format('0.00')
//     } else if (layerName == 'shoreline') {
//         return data.TAM_NAME + ' ' + data.AMP_NAME + ' ' + data.PRV_NAME + '<br>';
//     } else if (layerName == 'erosion') {
//         var type = "พื้นที่กัดเซาะ"
//         if (featureObject.features[0].id.search(/Accretion/g) == 0) {
//             type = "พื้นที่ทับถม"
//         }
//         return type + ', ' + data.TAM_NAME + ' ' + data.AMP_NAME + ' ' + data.PRV_NAME + ' พื้นที่ ' + numeral(data.Area_rai).format('0,2') + ' ไร่';
//     } else if (layerName == 'speed_direction') {
//         return 'ความเร็ว ' + data.velocity + ' , ทิศทาง ' + data.direction

//     }
// }

// function getFeatureGroup(layername) {
//     if (layername == 'rice' || layername == 'maize' || layername == 'cassava' || layername == 'sugarcane' || layername == 'palm' || layername == 'rubber') {
//         return 'ecoplant'
//     } else if (layername == 'flood_01') {
//         return 'flood'
//     } else if (layername == 'forest') {
//         return 'forest'
//     } else if (layername == 'wildfire_01' || layername == 'wildfire_range') {
//         return 'wildfire'
//     } else if (layername.search("drought") == 0) {
//         return 'drought'
//     } else if (layername.search("sea") == 0 || layername.search("shoreline") >= 0 || layername.search("erosion") == 0 || layername == 'speed_direction') {
//         return 'sea'
//     }
//     return undefined
// }

// function loadLatestLineData(site, section) {
//     var url = wmsUrl['map.sea']['linedata'] + '/' + site + '/' + section;

//     $.getJSON(url, function(list) {
//         if (section == 'wind') {
//             plotLineWindChart(site, 'chartline', list)
//         } else {
//             plotLineWaveChart(site, 'chartline', list)
//         }

//         $('#chartline-content').show()
//         $('#chartrose-content').hide()
//     })
// }