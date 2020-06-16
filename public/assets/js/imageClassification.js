document.onreadystatechange = function () {

    if (document.readyState != "complete")
        return;  

    $("#file-input").change(function() {
        uploadImage(this);
    });

    $("#processImage").click(function() {
        processImage();
    });   
}

function uploadImage(input) {

    $('#loadingText').css('display', 'none');    
    $('#loading').css('display', 'none');
    $('#loadingDiv').css('display', 'none');        
    $('#predictionResult').text("");    

    if (input == null || input.files == null || input.files.length == 0)
        return;

    var fileType = input.files[0].type;
    var fileSize = input.files[0].size;

    if (!fileType.includes("image")) {        
        $('#errorMsgFileInput').text("El archivo elegido no es una imagen.");
        $('#errorMsgFileInput').css('display', 'block');
        $('#previewHolder').attr('height', '0px');
        $('#previewHolder').attr('width', '0px');
        $('#previewHolder').attr('src', null);
        $('#previewHolder').css('border', 'none');
        return;
    }

    if (fileSize >= 3145728) {
        $('#errorMsgFileInput').text("El archivo seleccionado no puede pesar mas de 3 MB.");
        $('#errorMsgFileInput').css('display', 'block');
        $('#previewHolder').attr('height', '0px');
        $('#previewHolder').attr('width', '0px');
        $('#previewHolder').attr('src', null);
        $('#previewHolder').css('border', 'none');
        return;
    }    

    var reader = new FileReader();
    reader.readAsDataURL(input.files[0]);
    reader.onload = function(e) {

        var image = new Image();
        image.src = e.target.result;

        image.onload = function () {
            var height = this.height;
            var width = this.width;
            $('#previewHolder').attr('height', height+"px");
            $('#previewHolder').attr('width', width+"px");
            $('#previewHolder').attr('src', this.src);
            $('#previewHolder').css('border', 'solid');
            $('#errorMsgFileInput').text("");
            $('#errorMsgFileInput').css('display', 'none');
        }        
    }
}

function processImage() {  
    
    var dataUrl = $("#previewHolder").attr('src');
    dataUrlArray = dataUrl.split(',');
    var base64Img = dataUrlArray[1];    
    var predictImgUrl = "/predict"; 

    var body = {};
    body.image = base64Img;           
    
    $('#loadingText').css('display', 'inline-block');    
    $('#loading').css('display', 'inline-block'); 
    $('#loadingDiv').css('display', 'inline-flex');        
    $('#loadingText').text("Procesando...");
    $('#predictionResult').text("");

    $.ajax({
        url: predictImgUrl,
        data: JSON.stringify(body),
        cache: false,
        contentType: "application/json",
        processData: false, 
        dataType: "json",
        async: true,
        type: "POST",
        method: 'POST',       
        success: function(result){

            if (result.predictedValue == null)
                return;
            
            var predictedValue = Math.round(result.predictedValue);

            $('#loadingText').css('display', 'none');    
            $('#loading').css('display', 'none');     
            $('#loadingDiv').css('display', 'none');     
            
            if (predictedValue == 0) {                        
                $('#predictionResult').text("La imagen es un GATO!");                        
            }
            if (predictedValue == 1) {                        
                $('#predictionResult').text("La imagen es un PERRO!");                       
            }           
        },
        error: function (error) {
            $('#loadingText').text("Hubo un error al intentar procesar la imagen, por favor pruebe nuevamente.");
            $('#loading').css('display', 'none');    
        }
    });
}

