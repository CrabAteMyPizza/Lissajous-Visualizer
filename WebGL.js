//shaders
var tableShader = 
[
    '#version 300 es',
    'precision mediump float;',
    '',
    'in vec2 vecPos;',
    'out vec4 vecColor;',
    '',
    'void main() {',
    '   gl_Position = vec4(vecPos, 0.0, 1.0);',
    '   vecColor = vec4(1.0, 1.0, 1.0, 1.0);',
    '}'
].join('\n')

//basic fragment shader
var fragShader =
[
    '#version 300 es',
    'precision mediump float;',
    'in vec4 vecColor;',
    'out vec4 finColor;',
    '',
    'void main() {',
    '   finColor = vecColor;',
    '}'
].join('\n')

//Lissajous Parameter 
//circParam = (midPointX, midPointY, stepParam)
//waveParam = (amplitudeA, amplitudeB, multiplierA, multiplierB)
//miscParam = (phaseDifference, redShift, greenShift, blueShift, mode)
var lissajousVertShader = 
[
    '#version 300 es',
    'precision mediump float;',
    '#define TAU 6.28318530718',
    '',
    'in vec3 circParam;',
    'in vec4 waveParam;',
    'in vec4 miscParam;',
    'out vec4 vecColor;',
    'vec2 pos;',
    '',
    'void main() {',
    '   pos.x = (waveParam.x * sin((waveParam.z * (circParam.z * TAU)) + miscParam.x)) + circParam.x;',
    '   pos.y = (waveParam.y * sin(waveParam.w * (circParam.z * TAU))) + circParam.y;',
'       gl_Position = vec4(pos, 0.0, 1.0);',
    '   vecColor = vec4((1.0 * miscParam.y), (1.0 * miscParam.z), (1.0 * miscParam.w), 1.0);',
    '}'
].join('\n')

function initScene() {
    //Set a Square Aspect Ratios
    var lissajousTableSize = Math.trunc(((window.innerWidth * 0.5) / 10) * 10);

    //Call and set basic WebGL Context and getCanvas
    var mainCanvas = document.getElementById('mainCanvas')
    var glContext = mainCanvas.getContext('webgl2',  { preserveDrawingBuffer: true })
    if (glContext != null) {
        console.log("WebGl is Available")
    }
    else {
        console.log("WebGl is NOT Available")
    }

    //set width and height ( + 5 padding pixels) and set the maximum window height if more than certain area
    if((lissajousTableSize + 5) > window.innerHeight) {
        mainCanvas.setAttribute('height', (window.innerHeight).toString())
        mainCanvas.setAttribute('width', (window.innerHeight).toString())
        glContext.viewport(0, 0, (window.innerHeight - 5), (window.innerHeight - 5))
    }
    else {
        mainCanvas.setAttribute('height', (lissajousTableSize + 5).toString())
        mainCanvas.setAttribute('width', (lissajousTableSize + 5).toString())
        glContext.viewport(0, 0, (lissajousTableSize + 5), (lissajousTableSize + 5))
    }


    glContext.clearColor(0.0, 0.0, 0.0, 1.0)
    glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT)

    //Table Buffer Datas
    var tableBufferData = []
    for(var i = -3; i <= 2; i++) {
        tableBufferData.push(parseFloat(((0.3 * i) + 0.17).toFixed(2)), 1.0, parseFloat(((0.3 * i) + 0.17).toFixed(2)), -1.0)
    }
    for(var i = -3; i <= 2; i++) {
        tableBufferData.push(1.0, parseFloat(((0.3 * i) + 0.13).toFixed(2)), -1.0, parseFloat(((0.3 * i) + 0.13).toFixed(2)))
    }

    //Creating, compiling all shaders
    var tableShaderObj = shaderCreateandVerif(glContext, tableShader, 'vertex')
    var frShader = shaderCreateandVerif(glContext, fragShader, 'fragment')
    var lissajousShader = shaderCreateandVerif(glContext, lissajousVertShader, 'vertex')

    //Creating, compiling, linking vertex, fragment to pipeline
    var pipeline = glContext.createProgram()
    glContext.attachShader(pipeline, tableShaderObj)
    glContext.attachShader(pipeline, frShader)

    glContext.linkProgram(pipeline)
    if(!glContext.getProgramParameter(pipeline, glContext.LINK_STATUS)) {
        console.error('Error Linking Pipeline')
        return
    }

    glContext.validateProgram(pipeline)
    if(!glContext.getProgramParameter(pipeline, glContext.VALIDATE_STATUS)) {
        console.error('Error Validating Pipeline')
        return
    }

    var tableBufferObject = glContext.createBuffer()
    glContext.bindBuffer(glContext.ARRAY_BUFFER, tableBufferObject)
    glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(tableBufferData.flat()), glContext.STATIC_DRAW)

    var tableAttrib = glContext.getAttribLocation(pipeline, 'vecPos')
    glContext.vertexAttribPointer(tableAttrib, 2, glContext.FLOAT, glContext.FALSE, 0, 0)
    glContext.enableVertexAttribArray(tableAttrib)

    glContext.useProgram(pipeline)
    //glContext.drawArrays(glContext.LINES, 0, 48)

    glContext.detachShader(pipeline, tableShaderObj)
    glContext.attachShader(pipeline, lissajousShader)

    glContext.linkProgram(pipeline)
    if(!glContext.getProgramParameter(pipeline, glContext.LINK_STATUS)) {
        console.error('Error Linking Pipeline')
        return
    }

    glContext.validateProgram(pipeline)
    if(!glContext.getProgramParameter(pipeline, glContext.VALIDATE_STATUS)) {
        console.error('Error Validating Pipeline')
        return
    }
    glContext.deleteShader(tableShaderObj)

    var allParameters = populatelisajousData()
    glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(allParameters[0]), glContext.STATIC_DRAW)
    
    var posAttribCircParam = glContext.getAttribLocation(pipeline, 'circParam')
    var posAttribWaveParam = glContext.getAttribLocation(pipeline, 'waveParam')
    var posAttribMiscParam = glContext.getAttribLocation(pipeline, 'miscParam')
    glContext.vertexAttribPointer(posAttribCircParam, 3, glContext.FLOAT, glContext.FALSE, 11 * Float32Array.BYTES_PER_ELEMENT, 0)
    glContext.vertexAttribPointer(posAttribWaveParam, 4, glContext.FLOAT, glContext.FALSE, 11 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT)
    glContext.vertexAttribPointer(posAttribMiscParam, 4, glContext.FLOAT, glContext.FALSE, 11 * Float32Array.BYTES_PER_ELEMENT, 7 * Float32Array.BYTES_PER_ELEMENT)
    glContext.enableVertexAttribArray(posAttribCircParam)
    glContext.enableVertexAttribArray(posAttribWaveParam)
    glContext.enableVertexAttribArray(posAttribMiscParam)

    //Table Render Call
    renderClosure(allParameters.flat(), glContext)
}

function renderClosure(allParameters, glContext, allParameters2) {
    let renderStep = allParameters[2] * -1
    let render = renderFactory(allParameters, glContext, renderStep, allParameters2)
    window.requestAnimationFrame(render)
}

function renderFactory(allParameters, glContext, renderStep) {
    let elapsed = null
    let startTime = null;let t = false;
    let phaseLeader = Array.from(allParameters)
    let phaseCheck = 1.0

    return function renderCallback(timeStamp) {

        if(startTime == null) {
            startTime = timeStamp
        }
        elapsed = timeStamp - startTime

        lissajousDataChange(allParameters, renderStep, 1)

        if((allParameters[13] >= phaseCheck) && (t == false)) {
            t = true
            phaseCheck = phaseCheck + 1.0
            allParameters[10] = 0.0 + (renderStep * 2.0)
            allParameters[21] = allParameters[10]

            console.log(elapsed)
        }

        glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(allParameters), glContext.STATIC_DRAW)
        glContext.drawArrays(glContext.LINES, 0, 50)

        if(elapsed > 8100) {
            lissajousDataChange(phaseLeader, renderStep, 0)
            glContext.bufferData(glContext.ARRAY_BUFFER, new Float32Array(phaseLeader), glContext.STATIC_DRAW)
            glContext.drawArrays(glContext.LINES, 0, 50)
        }
        setTimeout(() => window.requestAnimationFrame(renderCallback), 1)
    }
}

function shaderCreateandVerif(glContext, shaderSource, shaderType) {
    let tempShade = null
    if(shaderType == 'vertex') {
        tempShade = glContext.createShader(glContext.VERTEX_SHADER)
    }
    else if(shaderType == 'fragment') {
        tempShade = glContext.createShader(glContext.FRAGMENT_SHADER)
    }

    glContext.shaderSource(tempShade, shaderSource)
    glContext.compileShader(tempShade)
    if(!glContext.getShaderParameter(tempShade, glContext.COMPILE_STATUS)) {
        console.error('Error Compiling Shader', glContext.getShaderInfoLog(tempShade))
        return
    }

    return tempShade
}

//Lissajous Parameter 
//circParam = (midPointX, midPointY, stepParam)
//waveParam = (amplitudeA, amplitudeB, multiplierA, multiplierB)
//miscParam = (phaseDifference, redShift, greenShift, blueShift)
function populatelisajousData() {
    let template = [-0.581, 0.579, -0.002, 0.125, 0.125, 5.0, 6.0, 1.57079632679, 0.0, 0.0, 0.0, -0.581, 0.579, 0.0, 0.125, 0.125, 5.0, 6.0, 1.57079632679, 0.0, 0.0, 0.0]
    let holder = []
    for(let i = 0; i < 5; i++) {
        for(let j = 0; j < 5; j++) {
            let cpy = Array.from(template)
            cpy[0] = cpy[0] + (i * 0.3)
            cpy[1] = cpy[1] + (j * -0.3)
            cpy[11] =  cpy[11] + (i * 0.3)
            cpy[12] = cpy[12] + (j * -0.3)
            cpy[5] = i + 1
            cpy[6] = j + 1
            cpy[16] = i + 1
            cpy[17] = j + 1
            holder.push(cpy)
        }
    }

    return holder
}

function lissajousDataChange(allParameters, renderStep, mode) {
    for(let i = 0; i < 50; i++) {
        //Radian step change
        allParameters[2 + (11 * i)] = allParameters[2 + (11 * i)] + renderStep
        //Color gradient change
        if(mode == 1) {
            allParameters[10 + (11 * i)] = allParameters[10 + (11 * i)] + (renderStep * 2.0)
        }
    }
}