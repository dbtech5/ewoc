
var storage_data = {}
var data_filter_start = ''
var data_filter_end = ''

function load_csv_totable(){
    $.get( "./csv/file_json/"+$('#val_data').val()+".json", function( data ) {
        storage_data = data
    });
}

$('#val_data').val('อ่างเก็บน้ำคลองใหญ่')//หนองปลาไหล
load_csv_totable()
function filter_start(e){
    data_filter_start = e.value
    console.log(e.value)
}

function filter_end(e){
    data_filter_end = e.value
    console.log(e.value)
}
var year_list = []
var data_list = []
var vol_list = []
var inflow_list = []
var outflow_list = []

function plot_data_list(year){
    
    let n = 0
    let data_val = Object.values(storage_data)
    let key_label = []
    let new_vol_list = [[],[],[],[],[],[],[],[]]
    let inflow = []
    let outflow = []
    let key = []
    let key_label_empty = []
    let max = []
    let min = []
    let wl = []
    let k = 1
    let format = {
        'Jan':'ม.ค',
        'Feb':'ก.พ',
        'Mar':'มี.ค',
        'Apr':'เม.ย',
        'May':'พ.ค',
        'Jun':'มิ.ย',
        'Jul':'ก.ค',
        'Aug':'ส.ค',
        'Sep':'ก.ย',
        'Oct':'ต.ค',
        'Nov':'พ.ย',
        'Dec':'ธ.ค',
    }
    let tmp_key = null
    let sw_mx = 0
    
    Object.keys(storage_data).forEach(head=>{
        tmp_key = Object.keys(data_val[n])
        console.log(tmp_key)
        let tmp_data = Object.values(data_val[n])
        key_label_empty.push(' ')
        let m = head.split(' ')[1]
        
        if(key.includes(m)){
            k++
            if(k>-1){
                k = 0
                key_label.push('')
            }
            
        }else{
            key.push(m)
            //ลดจำนวนข้อมูลแต่แสดง label ครบ
            key_label.push(format[m])  
        }
        //
        inflow.push(tmp_data[8])
        outflow.push(tmp_data[9])
        new_vol_list[0].push(data_val[n][tmp_key[0]])
        new_vol_list[1].push(data_val[n][tmp_key[1]])
        new_vol_list[2].push(data_val[n][tmp_key[2]])
        new_vol_list[3].push(data_val[n][tmp_key[3]])
        new_vol_list[4].push(data_val[n][tmp_key[4]])
        new_vol_list[5].push(data_val[n]['upper_rc'])
        new_vol_list[6].push(data_val[n]['lower_rc'])
        new_vol_list[7].push(data_val[n]['mrc_rc'])
        
        if(sw_mx > 2){
            max.push(tmp_data[5])
            min.push(tmp_data[7])
            wl.push(tmp_data[6])
            sw_mx = 0    
        }else{
            max.push([0])
            min.push([0])
            wl.push([0])
        }
        sw_mx += 1
        
        
        n++
    })
    for(let i=5;i<=7;i++){
        let set_point = []
        let tmp_lit = new_vol_list[i]
        tmp_lit.forEach(im=>{
            if(im!=undefined)
                set_point.push(im)
        })
        d = 0
        n_d = 0
        console.log(new_vol_list[i])
        new_vol_list[i] = []
        sum_val = 0
        tmp_lit.forEach(im=>{
            d++
            console.log(sum_val)
            if(d==1 && im != undefined){
                console.log(1,im)
                sum_val = im
                new_vol_list[i].push(im)
            }else if(d == 31){
                sum_val += ((set_point[n_d+1]-set_point[n_d])/30)
                new_vol_list[i].push(sum_val.toFixed(2))
                
                d = 0
                n_d += 1
            }else{
                console.log(((set_point[n_d+1]-set_point[n_d])/30))
                sum_val += ((set_point[n_d+1]-set_point[n_d])/30)
                new_vol_list[i].push(sum_val.toFixed(2))
            }
        })
    }
    
    new Chart("myChart", {
        type: "line",
        data: {
            labels: key_label_empty,
            datasets:[
                { 
                    label: parseInt(tmp_key[0])+543,
                    data: new_vol_list[0],
                    borderColor: "rgba(99,160,215,1)",
                    radius: 1,
                    fill: false
                },
                { 
                    label: parseInt(tmp_key[1])+543,
                    data: new_vol_list[1],
                    borderColor: 'rgba(237,125,49,1)',
                    radius: 1,
                    fill: true
                },
                { 
                    label: parseInt(tmp_key[2])+543,
                    data: new_vol_list[2],
                    borderColor: 'rgba(126,68,169,1)',
                    radius: 1,
                    fill: false
                },
                { 
                    label: parseInt(tmp_key[3])+543,
                    data: new_vol_list[3],
                    borderColor: 'rgba(255,202,40,1)',
                    radius: 1,
                    fill: false
                },
                { 
                    label: parseInt(tmp_key[4])+543,
                    data: new_vol_list[4],
                    borderColor: "rgba(84,130,53,1)",
                    radius: 1,
                    fill: false
                },
                { 
                    label: 'Upper RC',
                    data: new_vol_list[5],
                    borderColor: "rgba(0,255,0,1)",
                    radius: 0.5,
                    fill: false
                },
                { 
                    label: 'Midle RC',
                    data: new_vol_list[7],
                    borderColor: "rgba(0,0,255,1)",
                    radius: 0.5,
                    fill: false
                },
                { 
                    label: 'Lower RC',
                    data: new_vol_list[6],
                    borderColor: "rgba(255,0,0,1)",
                    radius: 0.5,
                    fill: false
                },
                { 
                    label: 'เก็บกักสูงสุด '+max[3],
                    data: max,
                    borderColor: "gray",
                    radius: 1,
                    fill: false
                },
                { 
                    label: 'เก็บกักต่ำสุด '+min[3],
                    data: min,
                    borderColor: "gray",
                    radius: 1,
                    fill: false
                },
                { 
                    label: 'เก็บกักปกติ '+wl[3],
                    data: wl,
                    borderColor: "gray",
                    radius: 1,
                    fill: false
                },
            ]
        },
        options: {
          legend: {display: true},
          scales: {
                yAxes: [{
                    display: true,
                    scaleLabel: {
                    display: true,
                    labelString: 'ปริมาณน้ำ, ล้าน ลบ.ม.'
                    },
                    ticks: {
                        beginAtZero: true,
                        steps: 0,
                    },
                    gridLines: {
                        color: "rgba(0, 0, 0, 0)",
                    }
                }],
                xAxes: [{
                    gridLines: {
                        color: "rgba(0, 0, 0, 0)",
                    }   
                }]
            }
        }
      });
      new Chart("myChart2", {
          type: "line",
          data: {
            labels: key_label_empty,
            datasets: [{ 
              label: 'inflow',
              data: inflow,
              borderColor: "red",
              radius: 1,
              fill: false
            }]
          },
          options: {
            legend: {
                display: true,
                position:'top',
            },
            scales: {
                yAxes: [{
                    display: true,
                    scaleLabel: {
                      display: true,
                      labelString: 'ปริมาณน้ำ, ล้าน ลบ.ม.'
                    },
                    ticks: {
                        beginAtZero: true,
                        steps: 0.0,
                        stepValue: 5.0,
                        max: 25.0
                    }
                }],
                xAxes: [{
                    gridLines: {
                        color: "rgba(0, 0, 0, 0)",
                    }   
                }]
            }
          }
        });
        //console.log(new_inflow_list)
        
        new Chart("myChart3", {
            type: "line",
            data: {
              labels: key_label,
              datasets: [{ 
                label: 'outflow',
                data: outflow,
                borderColor: "green",
                radius: 1,
                fill: false
              }]
            },
            options: {
                legend: {
                    display: true,
                    position: 'top',
                },
                scales: {
                yAxes: [ {
                    display: true,
                    scaleLabel: {
                      display: true,
                      labelString: 'ปริมาณน้ำ, ล้าน ลบ.ม.'
                    },
                    ticks: {
                        beginAtZero: true,
                        steps: 0.0,
                        stepValue: 5.0,
                        max: 25.0
                    }
                }],
                xAxes: [{
                    gridLines: {
                      color: "rgba(0, 0, 0, 0)",
                    }   
                }]
              }
            }
          });
          //console.log(new_inflow_list)
          
}


function makeTable(){
    $('#group_make_table').empty()
    
    let n = 0
    let tmp = Object.values(storage_data)

    year_list = []
    data_list = []
    vol_list = []
    inflow_list = []
    outflow_list = []

    $('#group_make_table').append("<table id='tableT' ><tr id='rowT'></tr><tbody id='bodyT'></tbody></table>")
    $('#rowT').append("<th>วันที่</th><th>ปริมาตรน้ำ<br>ล้าน ลบ.ม</th><th>น้ำไหลเข้าอ่าง<br>ล้าน ลบ.ม</th><th>น้ำระบาย<br>ล้าน ลบ.ม</th><th>กักเก็บสูงสุด<br>ล้าน ลบ.ม</th><th>กักเก็บต่ำสุด<br>ล้าน ลบ.ม</th>")
    if(true){
        let parttern_label = {
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
        let data_val = Object.values(storage_data)
        let n = 0
        let format = {
            'Jan':'ม.ค',
            'Feb':'ก.พ',
            'Mar':'มี.ค',
            'Apr':'เม.ย',
            'May':'พ.ค',
            'Jun':'มิ.ย',
            'Jul':'ก.ค',
            'Aug':'ส.ค',
            'Sep':'ก.ย',
            'Oct':'ต.ค',
            'Nov':'พ.ย',
            'Dec':'ธ.ค',
        }
        Object.keys(storage_data).forEach(head => {
            let data_filter = Object.values(data_val[n])
            let da_t = head.split(' ')
            $('#bodyT').append(`
                <tr>
                    <td>${(da_t[0]+" "+format[da_t[1]])}</td>
                    <td>${data_filter[(parseInt($('#year_select').val()))?parseInt($('#year_select').val()):4]}</td>
                    <td>${data_filter[8]}</td>
                    <td>${data_filter[9]}</td>
                    <td>${data_filter[5]}</td>
                    <td>${data_filter[7]}</td>
                </tr>`)
            n++
        })
        
    }
    /*
    $("#range_start").empty()
    $("#range_start").empty()
    let loop = Array.from(new Set(year_list)) 
    loop.forEach(item=>{
        $("#range_start").append('<option>'+item+'</option>')
        $("#range_end").append('<option>'+item+'</option>')
    })*/
    plot_data_list($("#range_start").val())

    
}

function chnage_plot(){
    plot_data_list([$("#range_start").val()])
}

setTimeout(()=>{
    $('#btn_feed').click()
},100)