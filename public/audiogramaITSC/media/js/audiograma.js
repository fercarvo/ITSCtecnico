var urlParams = new URLSearchParams(window.location.search);
var AD = urlParams.getAll('ad') || [];
var AI = urlParams.getAll('ai') || [];
var OI = urlParams.getAll('oi') || [];
var OD = urlParams.getAll('od') || [];

var default_size = urlParams.get('size');
var height = urlParams.get('height');

var resizeId;
window.onload = function (evt) { size(evt) };
window.onresize = function (e) { 
    clearTimeout(resizeId);
    resizeId = setTimeout(()=> window.location.reload(), 500); 
}

function size (e) {
    
    var width_window = default_size ? default_size : (window.innerWidth || document.body.clientWidth);
    var height_window = default_size ? default_size : (window.innerHeight || document.body.clientHeight);

    var ideal_size = height ? height : 600;
    var final_size = width_window <= height_window ? width_window : height_window;
    var reducer = final_size < ideal_size ? (final_size/ideal_size) : 1.0;
    

    console.log(final_size, reducer)

    for(i = 0; i < 8; i++){
        document.getElementById("ad"+i).innerHTML = AD[i]==undefined||AD[i]==0?"":AD[i];
        document.getElementById("od"+i).innerHTML = OD[i]==undefined||OD[i]==0?"":OD[i];
        document.getElementById("ai"+i).innerHTML = AI[i]==undefined||AI[i]==0?"":AI[i];
        document.getElementById("oi"+i).innerHTML = OI[i]==undefined||OI[i]==0?"":OI[i];
    }	

    $('#idmagico').audiogram({
        cvHeight : ideal_size,
        cvWidth : ideal_size
    })

    document.body.style.transform = `scale(${reducer})`
}