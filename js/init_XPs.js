/*global
THREE:false,
window:false,
TWEEN:false,
alert:false,
requestAnimationFrame:false,
XMLHttpRequest:false,
AudioContext:false,
Uint8Array:false*/


function active_info() {
  $(".grid_transition").toggleClass("access-info");
  $(".grid_info").toggleClass("access-info3");
  $(".clos-info").toggleClass("access-info2");
}

function remove_info() {
  $(".grid_transition").removeClass("access-info");
}

function close_info() {
  $(".grid_transition").removeClass("access-info");
  $(".clos-info").removeClass("access-info2");
}



function bouton_validate(v) {
  $('body').append(
    '<svg id="bouton_validate"><circle cx="50%" cy="50%" r="48%" stroke="black" stroke-width="2%" fill="white" />\
    <rect x="35%" y="47%" fill="#000000" width="6%" height="6%"/>\
    <rect x="41%" y="53%" fill="#000000" width="6%" height="6%"/>\
    <rect x="47%" y="47%" fill="#000000" width="6%" height="6%"/>\
    <rect x="53%" y="41%" fill="#000000" width="6%" height="6%"/>\
    <rect x="59%" y="35%" fill="#000000" width="6%" height="6%"/></svg>'
  );
  if (window.innerWidth < window.innerHeight) {
    $('#bouton_validate').css({
      'width': '20%'
    });
    $('#bouton_validate').css({
      'height': $('#bouton_validate').width() + 'px'
    });
  } else {
    $('#bouton_validate').css({
      'height': '10%'
    });
    $('#bouton_validate').css({
      'width': $('#bouton_validate').height() + 'px'
    });
  }
  if (v) {
    $('#bouton_validate').hide();
  }
}



/**************************************************

                  Shaders

*********************************************/



THREE.partShader = {


  vertexShader: [

    "uniform float size;",
    "uniform vec3 ca1;",
    "uniform vec3 ca2;",


    "uniform float eff_col;",
    "uniform float eff_size;",

    "attribute float age;",
    "varying vec3 vColor1;",
    "varying vec3 vColor2;",
    "varying float effCol;",
    "varying float alpha;",
    "varying float vAge;",

    "float getSize(){",
    "float s = size;",
    "s += age*eff_size;",
    "return s;",
    "}",


    "void main() {",

    "vColor1 = ca1;",
    "vColor2 = ca2;",
    "alpha = 1.0-age;",
    "effCol = eff_col;",
    "vAge= age;",

    "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
    "gl_PointSize = getSize();",
    //gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );
    "gl_Position = projectionMatrix * mvPosition;",
    "}",

  ].join("\n"),

  fragmentShader: [

    "uniform vec3 color;",
    "uniform sampler2D texture;",
    "varying vec3 vColor1;",
    "varying vec3 vColor2;",
    "varying float alpha;",
    "varying float effCol;",
    "varying float vAge;",


    "vec3 getColor(){",
    "return vColor1*(1.0-(vAge*effCol)/100.0)+vColor2*((vAge*effCol)/100.0);",

    "}",

    "void main() {",
    "float al =alpha;",

    "vec4 color = vec4( color * getColor(), al ) * texture2D( texture, gl_PointCoord );",

    "gl_FragColor = color;",
    "}",

  ].join("\n")
};

THREE.FresnelShader = {

  uniforms: {

    "mRefractionRatio": {
      type: "f",
      value: 0.5
    },
    "mFresnelBias": {
      type: "f",
      value: 0.1
    },
    "mFresnelPower": {
      type: "f",
      value: 2.0
    },
    "mFresnelScale": {
      type: "f",
      value: 1.0
    },
    "tCube": {
      type: "t",
      value: null
    }

  },

  vertexShader: [

    "uniform float mRefractionRatio;",
    "uniform float mFresnelBias;",
    "uniform float mFresnelScale;",
    "uniform float mFresnelPower;",

    "varying vec3 vReflect;",
    "varying vec3 vRefract[3];",
    "varying float vReflectionFactor;",

    "void main() {",

    "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
    "vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",

    "vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );",

    "vec3 I = worldPosition.xyz - cameraPosition;",

    "vReflect = reflect( I, worldNormal );",
    "vRefract[0] = refract( normalize( I ), worldNormal, mRefractionRatio );",
    "vRefract[1] = refract( normalize( I ), worldNormal, mRefractionRatio * 0.99 );",
    "vRefract[2] = refract( normalize( I ), worldNormal, mRefractionRatio * 0.98 );",
    "vReflectionFactor = mFresnelBias + mFresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), mFresnelPower );",

    "gl_Position = projectionMatrix * mvPosition;",

    "}"

  ].join("\n"),

  fragmentShader: [

    "uniform samplerCube tCube;",

    "varying vec3 vReflect;",
    "varying vec3 vRefract[3];",
    "varying float vReflectionFactor;",

    "void main() {",

    "vec4 reflectedColor = textureCube( tCube, vec3( -vReflect.x, vReflect.yz ) );",
    "vec4 refractedColor = vec4( 1.0 );",

    "refractedColor.r = textureCube( tCube, vec3( -vRefract[0].x, vRefract[0].yz ) ).r;",
    "refractedColor.g = textureCube( tCube, vec3( -vRefract[1].x, vRefract[1].yz ) ).g;",
    "refractedColor.b = textureCube( tCube, vec3( -vRefract[2].x, vRefract[2].yz ) ).b;",

    "gl_FragColor = mix( refractedColor, reflectedColor, clamp( vReflectionFactor, 0.0, 1.0 ) );",

    "}"

  ].join("\n")
};

THREE.JeanShader = {
  vertexShader: [

    "attribute vec4 tangent;",
    "uniform int def;",
    "uniform sampler2D displaceMap;",
    "uniform sampler2D displaceMap2;",
    "uniform vec2 rot;",
    "uniform vec2 plotpos;",
    "uniform vec2 uvScale;",
    "uniform vec3 lightPosition;",
    "uniform float scale;",
    "varying vec2 vUv;",
    "varying mat3 tbn;",
    "varying vec3 vLightVector;",
    "varying vec3 maN;",
    "varying float d;",
    "float rand(vec2 co) {",
    "return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);",
    "}",

    "void main() {",



    "vUv = uvScale * uv+rot;",


    "highp vec2 calc = uv - plotpos;",


    "vec2 mUv = uv + rot * 0.25;",

    "d = length(calc);",
    "float noise = 0.0;",
    "if ((d < 0.1)) {",

    "noise = -15.0 * (0.1 - d);",
    "}",
    "if (def==1){",
    "noise += 0.1*cos(mUv.x*50.0+4.0*mUv.x)-0.1*sin(mUv.x*25.0+20.0*mUv.y)+0.05*sin(mUv.x*8.0+15.0*mUv.y)+0.02*rand(vec2(0.5,mUv.y));",
    "}",



    "vec3 vNormal = normalize(normalMatrix * normal);",
    "vec3 vTangent = normalize(normalMatrix * tangent.xyz);",
    "vec3 vBinormal = normalize(cross(vNormal, vTangent) * tangent.w);",
    "tbn = mat3(vTangent, vBinormal, vNormal);",
    "maN = vNormal * (1.0 + noise * scale * 0.8);",

    "vec4 lightVector = viewMatrix * vec4(lightPosition, 1.0);",
    "vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);",
    "vLightVector = normalize(lightVector.xyz - modelViewPosition.xyz);",



    "vec3 newVertexPos = position + normal * (noise * scale);",

    " gl_Position = projectionMatrix * modelViewMatrix * vec4(newVertexPos, 1.0);",
    "}"



  ].join("\n"),



  fragmentShader: [
    "uniform sampler2D textureMap;",
    "uniform sampler2D normalMap;",
    "varying float d;",
    "varying vec2 vUv;",
    "varying mat3 tbn;",
    "varying vec3 vLightVector;",
    "varying vec3 maN;",
    "void main() {",

    "vec3 normalCoordinate = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;",


    "vec3 normal = normalize(tbn * normalCoordinate.rgb);",


    "float intensity = (max(0.07, dot(normal, vLightVector))+max(0.1, dot(maN, vLightVector)))/2.0;",
    "if (d<0.1){",
    "intensity *=(1.0-(d*2.0-0.2));",
    "}",

    "vec4 lighting = vec4(intensity, intensity, intensity, 1.0);",


    "gl_FragColor = texture2D(textureMap, vUv) * lighting;",
    " }"

  ].join("\n")
};

THREE.WaterShader = {



  vertexShader: [
    "precision mediump float; ",
    "uniform vec2 dec;",
    "uniform float wave2;",
    "uniform float intensity;",
    "varying vec3 normalInterp;",
    "varying vec3 vertPos;",
    "varying vec2 vUv;",
    "varying float creu;",

    "void main(){",
    "vUv = uv-dec*0.2;",
    "vec2 ndec = uv+dec*0.2;",

    "float l =length(uv-0.5);",

    "float noise = ((intensity/10.0)*max(l,0.1))*sin((l+wave2/1000.0)*80.0)+intensity*(0.5-abs(uv.x-0.5)+0.5-abs(uv.y-0.5))*sin(ndec.x*8.0*intensity/4.0)*sin(ndec.y*7.0);",
    "vec3 newVertexPos = position ;",
    "newVertexPos.y+=(noise );",
    "creu = 1.0;",



    "gl_Position = projectionMatrix * modelViewMatrix * vec4(newVertexPos, 1.0);",
    "vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);",
    "vertPos = vec3(vertPos4) / vertPos4.w;",
    "normalInterp = vec3(normalMatrix * normal);",
    "}"
  ].join('\n'),

  fragmentShader: [
    "precision mediump float; ",

    "varying vec3 normalInterp;",
    "varying float creu;",
    "varying vec3 vertPos;",
    "varying vec2 vUv;",
    "uniform int mode;",
    "uniform sampler2D normText;",
    "uniform vec2 dec;",
    "uniform samplerCube envMap;",
    "const vec3 lightPos = vec3(100.0,-100.0,0.0);",
    "const vec3 ambientColor = vec3(0.63, 0.71, 0.69);//161 180 175",
    "const vec3 diffuseColor = vec3(0.6, 0.67, 0.65);//153 172 167",
    "const vec3 specColor = vec3(0.94, 1.0, 0.99);//215 244 226",

    "float noiseScale = 0.0001;",


    "vec3 getNoise(in vec2 uv)",
    "{",
    "vec2 uv0 = uv / (103.0 * noiseScale) + vec2(dec.x / 17.0, dec.y / 29.0);",
    "vec2 uv1 = uv / (107.0 * noiseScale) - vec2(dec.x / -19.0, dec.y / 31.0);",
    "vec2 uv2 = uv / (vec2(8907.0, 9803.0) * noiseScale) + vec2(dec.x / 101.0, dec.y /   97.0);",
    "vec2 uv3 = uv / (vec2(1091.0, 1027.0) * noiseScale) - vec2(dec.x / 109.0, dec.y / -113.0);",
    "vec4 noise = texture2D(normText, uv0) +",
    "texture2D(normText, uv1) +",
    "texture2D(normText, uv2) +",
    "texture2D(normText, uv3);",
    "return noise.xyz * 0.5 - 1.0;",
    "}",

    "void main() {",

    "vec3 normal = normalize(normalInterp*getNoise(vUv));//;",
    "vec3 lightDir = normalize(lightPos - vertPos);",

    "float lambertian = max(dot(lightDir,normal), 0.0);",
    "float specular = 0.0;",
    "vec3 viewDir = normalize(-vertPos);",
    "vec3 reflectDir = reflect(-lightDir, normal);",
    "if(lambertian > 0.0) {",



    "vec3 halfDir = normalize(lightDir + viewDir);",
    "float specAngle = max(dot(halfDir, normal), 0.0);",
    "specular = pow(specAngle, 16.0);",


    "}",

    " gl_FragColor = vec4(ambientColor+",
    "lambertian * creu* diffuseColor +",
    "specular * (1.0-creu)*specColor, 0.7);",
    "}"



  ].join('\n')
};

THREE.SatinShader = {



  vertexShader: [
    "precision highp float;",
    "varying vec4 V_eye;",
    "varying vec4 L_eye;",
    "varying vec4 N_eye;",
    "uniform sampler2D normalMap;",
    "varying vec4 pos;",

    "uniform float morphTargetInfluences[5];",

    "attribute vec4 tangent;",

    "varying vec3 vertPos;",
    "varying vec2 vUv;",

    "uniform vec4 _Color;",
    "uniform vec4 _SpecColor;",
    "uniform float _AlphaX;",
    "uniform float _AlphaY;",


    "uniform vec3 _WorldSpaceCameraPos;",

    "uniform mat4 _World2Object; // inverse model matrix",
    "uniform vec4 _WorldSpaceLightPos0;",

    "uniform vec4 _LightColor0;",




    "varying vec3 varyingNormalDirection;",

    "varying vec3 varyingTangentDirection;",



    "void main() {",
    "vUv = uv * 12.0;",

    "vec3 morphedNormal = vec3(0.0);",
    "morphedNormal += (morphNormal0 - normal) * morphTargetInfluences[0];",
    "morphedNormal += (morphNormal1 - normal) * morphTargetInfluences[1];",
    "morphedNormal += (morphNormal2 - normal) * morphTargetInfluences[2];",
    "morphedNormal += (morphNormal3 - normal) * morphTargetInfluences[3];",
    "morphedNormal += normal;",



    "vec3 morphed = vec3(0.0, 0.0, 0.0);",
    "morphed += (morphTarget0 - position) * morphTargetInfluences[0];",
    "morphed += (morphTarget1 - position) * morphTargetInfluences[1];",
    "morphed += (morphTarget2 - position) * morphTargetInfluences[2];",
    "morphed += (morphTarget3 - position) * morphTargetInfluences[3];",
    "morphed += position;",

    "N_eye = normalize(vec4(morphedNormal, 1.0));",
    "L_eye = vec4(5.0, 7.0, 10.0, 1.0);",
    "V_eye = (modelViewMatrix * vec4(morphed, 1.0));;",

    " vec3 t = vec3(morphedNormal.z, morphedNormal.x, morphedNormal.y);",


    "mat4 modelMatrixInverse = _World2Object; // unity_Scale.w ",


    "pos = modelMatrix * vec4(morphed, 0.0);",
    "varyingNormalDirection = normalize(vec3(",
    "vec4(morphedNormal, 0.0) * modelMatrixInverse));",

    "varyingTangentDirection = normalize(vec3(modelViewMatrix * vec4(vec3(t), 0.0)));",


    "gl_Position = projectionMatrix * modelViewMatrix * vec4(morphed, 1.0); //modelViwMatrix????",


    "}"

  ].join('\n'),

  fragmentShader: [
    "precision highp float;",
    "vec4 Ca = vec4(0.3, 0.3, 0.3, 1.0);",
    "vec4 Cd = vec4(0.6, 0.6, 0.4, 1.0);",
    "vec4 Cs = vec4(1.0, 1.0, 1.0, 1.0);",

    "varying vec4 V_eye;",
    "varying vec4 L_eye;",
    "varying vec4 N_eye;",
    "varying vec4 pos;",


    "uniform sampler2D normalMap;",

    "const float backscatter = 0.25;",
    "const float edginess = 4.0;",
    "const float sheen = 0.1;",

    "const float _AlphaX = 0.3;",
    "const float _AlphaY = 1.1;",

    " const vec4 _WorldSpaceLightPos0 = vec4(2.0, 2.5, 9.5, 1.0);",
    "const vec4 _Color = vec4(0.91, 0.9, 0.88, 1.0);",
    "const vec4 _LightColor0 = vec4(1, 1, 0.7, 1.0);",
    "const vec4 _SpecColor = vec4(0.98, 0.98, 1, 1.0);",
    " const vec4 ambient = vec4(0.82, 0.8, 0.76, 1.0);",

    " const vec4 _WorldSpaceLightPos1 = vec4(5.0, 4., 5., 1.0);",

    " const vec4 _LightColor1 = vec4(0.82, 0.8, 0.75, 1.0);",

    "varying vec3 varyingNormalDirection;",
    "varying vec2 vUv;",
    "varying vec3 varyingTangentDirection;",
    "varying vec4 _WorldSpaceCameraPos;",

    " vec4 pass1() {",
    "vec3 normalDirection = normalize(varyingNormalDirection + vec3(texture2D(normalMap, vUv).x, texture2D(normalMap, vUv).y, texture2D(normalMap, vUv).z));",
    "vec3 tangentDirection = normalize(varyingTangentDirection);",

    "vec3 viewDirection =",
    "normalize(cameraPosition - vec3(pos));",
    "vec3 lightDirection;",
    "float attenuation;",

    "if (0.0 == _WorldSpaceLightPos0.w) // directional light?",
    "{",
    "attenuation = 1.0; // no attenuation",
    "lightDirection = normalize(vec3(_WorldSpaceLightPos0));",
    " } else // point or spot light",
    " {",
    "vec3 vertexToLightSource =",
    " vec3(_WorldSpaceLightPos0 - pos);",
    "float distance = length(vertexToLightSource);",
    "attenuation = 0.8 / distance; // linear attenuation ",
    "lightDirection = normalize(vertexToLightSource);",
    "}",

    "vec3 halfwayVector =",
    "normalize(lightDirection + viewDirection);",
    "vec3 binormalDirection =",
    "cross(normalDirection, tangentDirection);",
    "float dotLN = dot(lightDirection, normalDirection);",
    "// compute this dot product only once",

    "vec3 ambientLighting =",
    "ambient.rgb * vec3(_Color); ///// !!!!!!!!!!!!!!!!!!!!!!!!!!!! modif",

    "vec3 diffuseReflection = attenuation * vec3(_LightColor0) * vec3(_Color) * max(0.0, dotLN);",

    "vec3 specularReflection;",
    "if (dotLN < 0.0) // light source on the wrong side?",
    " {",
    "specularReflection = vec3(0.0, 0.0, 0.0);",
    " // no specular reflection",
    "} else // light source on the right side",
    "{",
    "float dotHN = dot(halfwayVector, normalDirection);",
    "float dotVN = dot(viewDirection, normalDirection);",
    "float dotHTAlphaX =",
    " dot(halfwayVector, tangentDirection) / _AlphaX;",
    "float dotHBAlphaY =",
    "dot(halfwayVector, binormalDirection) / _AlphaY;",

    "specularReflection = attenuation * vec3(_SpecColor) * sqrt(max(0.0, dotLN / dotVN)) * exp(-2.0 * (dotHTAlphaX * dotHTAlphaX + dotHBAlphaY * dotHBAlphaY) / (1.0 + dotHN));",
    "}",

    "return vec4(ambientLighting + diffuseReflection + specularReflection, 1.0);",

    "}",


    "vec4 pass2() {",
    "vec3 normalDirection = normalize(varyingNormalDirection + vec3(texture2D(normalMap, vUv).x, texture2D(normalMap, vUv).y, texture2D(normalMap, vUv).z));",
    "vec3 tangentDirection = normalize(varyingTangentDirection);",

    "vec3 viewDirection =",
    "normalize(cameraPosition - vec3(pos));",
    "vec3 lightDirection;",
    "float attenuation;",

    "if (0.0 == _WorldSpaceLightPos1.w) // directional light?",
    "{",
    "attenuation = 1.0; // no attenuation",
    "lightDirection = normalize(vec3(_WorldSpaceLightPos1));",
    " } else // point or spot light",
    "{",
    "vec3 vertexToLightSource =",
    "vec3(_WorldSpaceLightPos1 - pos);",
    "float distance = length(vertexToLightSource);",
    "attenuation = 0.7 / distance; // linear attenuation ",
    "lightDirection = normalize(vertexToLightSource);",
    "}",

    "vec3 halfwayVector =",
    "normalize(lightDirection + viewDirection);",
    "vec3 binormalDirection =",
    "cross(normalDirection, tangentDirection);",
    "float dotLN = dot(lightDirection, normalDirection);",


    "vec3 diffuseReflection = attenuation * vec3(_LightColor1) * vec3(_Color) * max(0.0, dotLN);",

    "vec3 specularReflection;",
    "if (dotLN < 0.0) // light source on the wrong side?",
    "{",
    "specularReflection = vec3(0.0, 0.0, 0.0);",

    "} else // light source on the right side",
    "{",
    "float dotHN = dot(halfwayVector, normalDirection);",
    "float dotVN = dot(viewDirection, normalDirection);",
    "float dotHTAlphaX =",
    " dot(halfwayVector, tangentDirection) / _AlphaX;",
    "float dotHBAlphaY =",
    "dot(halfwayVector, binormalDirection) / _AlphaY;",

    "specularReflection = attenuation * vec3(_SpecColor) * sqrt(max(0.0, dotLN / dotVN)) * exp(-2.0 * (dotHTAlphaX * dotHTAlphaX + dotHBAlphaY * dotHBAlphaY) / (1.0 + dotHN));",
    "}",

    "return vec4(diffuseReflection + specularReflection, 1.0);",
    "}",



    "void main(void) {",

    "vec4 a = pass1();",
    "vec4 b = pass2();",
    "gl_FragColor = a + b;",
    "}"
  ].join('\n')
};

//************************************ ancien shader pour la peau de pèche qui rend plus comme du velour qu'on retourne
// je le laisse ici car je trouve l'effet bcp mieux, ne ressemble pas à une pèche mais un mielleur rendu
// il faut lui fournir une texture autre que celle de la pèche...
THREE.PecheShader = {



  vertexShader: [
    "attribute vec3 tangent;",
    "varying vec3 lightVec;",
    "varying vec3 halfVec;",
    "varying vec3 eyeVec;",

    "varying vec2 vUv;",
    "varying vec2 vUv2;",
    "varying vec2 dvUv;",
    "uniform vec3 LightPos;",

    "void main()",
    "{",

    "vUv = uv*4.0+0.2;",
    "vUv2 = uv*6.0+0.2;",
    "dvUv = uv;",
    //vec3 test= normal;
    // Building the matrix Eye Space -> Tangent Space
    "vec3 n = normalize (normalMatrix * normal);",
    "vec3 t = normalize (normalMatrix * tangent);",
    "vec3 b = cross (n, t);",

    "vec3 vertexPosition = vec3(modelViewMatrix *  vec4(position,1.0));",
    "vec3 lightDir = normalize(LightPos - vertexPosition);",


    // transform light and half angle vectors by tangent basis
    "vec3 v;",
    "v.x = dot (lightDir, t);",
    "v.y = dot (lightDir, b);",
    "v.z = dot (lightDir, n);",
    "lightVec = normalize (v);",


    "v.x = dot (vertexPosition, t);",
    "v.y = dot (vertexPosition, b);",
    "v.z = dot (vertexPosition, n);",
    "eyeVec = normalize (v);",


    "vertexPosition = normalize(vertexPosition);",

    /* Normalize the halfVector to pass it to the fragment shader */

    // No need to divide by two, the result is normalized anyway.
    // vec3 halfVector = normalize((vertexPosition + lightDir) / 2.0); 
    "vec3 halfVector = normalize(vertexPosition + lightDir);",
    "v.x = dot (halfVector, t);",
    "v.y = dot (halfVector, b);",
    "v.z = dot (halfVector, n);",

    // No need to normalize, t,b,n and halfVector are normal vectors.
    //normalize (v);
    "halfVec = v ; ",


    "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",

    "}"


  ].join('\n'),

  fragmentShader: [
    " uniform sampler2D Text1;",
    "uniform sampler2D normalMap1;",
    "uniform sampler2D Spec1;",
    "uniform sampler2D normalMap2;",
    "uniform sampler2D doigt;",

    "uniform sampler2D Spec2;",
    "uniform vec4 AmbientColor;",
    "uniform vec4 LightColor;",
    // New bumpmapping
    "varying vec3 lightVec;",
    "varying vec3 halfVec;",
    "varying vec3 eyeVec;",
    "varying vec2 vUv;",
    "varying vec2 vUv2;",
    "varying vec2 dvUv;",

    "void main()",
    "{ ",

    // lookup normal from normal map, move from [0,1] to  [-1, 1] range, normalize
    " vec3 normal = 2.0 * (texture2D (normalMap1, vUv).bgr*(texture2D (doigt, dvUv).b) + texture2D (normalMap2, vUv2).bgr*(1.0-texture2D (doigt, dvUv).b)) - 1.0;",
    "normal = normalize (normal);",

    // compute diffuse lighting
    "float lamberFactor= max (dot (lightVec, normal), 0.0) ;",
    "vec4 diffuseMaterial = vec4(0.0);",
    "vec4 diffuseLight  = vec4(0.0);",

    // compute specular lighting
    "vec4 specularMaterial ;",
    "vec4 specularLight ;",
    "float shininess ;",

    // compute ambient
    "vec4 ambientLight = AmbientColor; ",

    "if (lamberFactor > 0.0)",
    " {",
    " diffuseMaterial = texture2D (Text1, vUv);",

    " diffuseLight  = LightColor;",

    // In doom3, specular value comes from a texture 
    "specularMaterial =  texture2D(Spec1,vUv)*(texture2D (doigt, dvUv).b)+texture2D (Spec1, vUv2)*(1.0-texture2D (doigt, dvUv).b)  ;",
    " specularLight = vec4(1.0);",
    "shininess = pow (max (dot (halfVec, normal), 0.0), 2.0) /1.8 ;",

    " gl_FragColor =  diffuseMaterial * diffuseLight * lamberFactor ;",
    "gl_FragColor += specularMaterial * specularLight * shininess ;        ",

    "}",

    "gl_FragColor += ambientLight;",
    "}"

  ].join('\n')
};

THREE.PecheShader2 = {



  vertexShader: [
    "attribute vec3 tangent;",
    "varying vec3 lightVec;",
    "varying vec3 halfVec;",
    "varying vec3 eyeVec;",

    "varying vec2 vUv;",
    "varying vec2 vUv2;",
    "varying vec2 dvUv;",
    "varying vec2 cvUv;",
    "uniform vec3 LightPos;",

    "void main()",
    "{",

    "vUv = uv*4.0+0.2;",
    "vUv2 = uv*6.0+0.2;",
    "dvUv = uv;",

    //vec3 test= normal;
    // Building the matrix Eye Space -> Tangent Space
    "vec3 n = normalize (normalMatrix * normal);",
    "vec3 t = normalize (normalMatrix * tangent);",
    "vec3 b = cross (n, t);",

    "vec3 vertexPosition = vec3(modelViewMatrix *  vec4(position,1.0));",
    "vec3 lightDir = normalize(LightPos - vertexPosition);",
    "cvUv = vec2(vertexPosition.x,vertexPosition.y)/9.2+vec2(0.5,0.5);",

    // transform light and half angle vectors by tangent basis
    "vec3 v;",
    "v.x = dot (lightDir, t);",
    "v.y = dot (lightDir, b);",
    "v.z = dot (lightDir, n);",
    "lightVec = normalize (v);",


    "v.x = dot (vertexPosition, t);",
    "v.y = dot (vertexPosition, b);",
    "v.z = dot (vertexPosition, n);",
    "eyeVec = normalize (v);",


    "vertexPosition = normalize(vertexPosition);",

    /* Normalize the halfVector to pass it to the fragment shader */

    // No need to divide by two, the result is normalized anyway.
    // vec3 halfVector = normalize((vertexPosition + lightDir) / 2.0); 
    "vec3 halfVector = normalize(vertexPosition + lightDir);",
    "v.x = dot (halfVector, t);",
    "v.y = dot (halfVector, b);",
    "v.z = dot (halfVector, n);",

    // No need to normalize, t,b,n and halfVector are normal vectors.
    //normalize (v);
    "halfVec = v ; ",


    "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",

    "}"


  ].join('\n'),

  fragmentShader: [
    " uniform sampler2D Text1;",
    " uniform sampler2D Text2;",
    "uniform sampler2D normalMap1;",
    "uniform sampler2D Spec1;",
    "uniform sampler2D normalMap2;",
    "uniform sampler2D doigt;",

    "uniform sampler2D Spec2;",
    "uniform vec4 AmbientColor;",
    "uniform vec4 LightColor;",
    // New bumpmapping
    "varying vec3 lightVec;",
    "varying vec3 halfVec;",
    "varying vec3 eyeVec;",
    "varying vec2 vUv;",
    "varying vec2 vUv2;",
    "varying vec2 dvUv;",
    "varying vec2 cvUv;",
    "void main()",
    "{ ",

    // lookup normal from normal map, move from [0,1] to  [-1, 1] range, normalize
    " vec3 normal = 2.0 * (texture2D (normalMap1, vUv).bgr*(texture2D (doigt, dvUv).b) + texture2D (normalMap2, vUv2).bgr*(1.0-texture2D (doigt, dvUv).b)) - 1.0;",
    "normal = normalize (normal);",

    // compute diffuse lighting
    "float lamberFactor= max (dot (lightVec, normal), 0.0) ;",
    "vec4 diffuseMaterial = vec4(0.0);",
    "vec4 diffuseLight  = vec4(0.0);",

    // compute specular lighting
    "vec4 specularMaterial ;",
    "vec4 specularLight ;",
    "float shininess ;",

    // compute ambient
    "vec4 ambientLight = AmbientColor; ",


    " diffuseMaterial = texture2D (Text1, cvUv)*(texture2D (doigt, dvUv).b) + texture2D (Text2, cvUv)*(1.0-texture2D (doigt, dvUv).b);",



    " gl_FragColor =  diffuseMaterial  ;",
    // "gl_FragColor += specularMaterial * specularLight * shininess ;        ",



    //  "gl_FragColor += ambientLight;",
    "}"

  ].join('\n')
};

THREE.BouleShader = {




  vertexShader: [
    "varying vec3 vertex_pos;",
    "varying vec3 vnorm;",

    "void main(){",
    "vnorm = normalMatrix*normal;",
    "vertex_pos = vec4(projectionMatrix * modelViewMatrix * vec4(position, 1.0)).xyz;",


    "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",

    "}"
  ].join('\n'),

  fragmentShader: [

    "varying vec3 vertex_pos;",
    "varying vec3 vnorm;",
    "const vec3 lightColor = vec3(0.89,0.88,0.84);",
    "const vec3 color = vec3 (0.87,0.84,0.8);",
    "const vec3 ambient = vec3(0.61,0.59,0.57);",
    "const vec3 pos = vec3(0.0,0.0,18.5);",
    "void main(){",
    "float lightAdd = 0.0;",
    "float dist = distance(pos,vertex_pos);",
    "float radius = 70.0;",

    "float att = clamp(1.0 - dist*dist*dist*dist/(radius*radius), 0.0, 1.0); ",
    "att *= att;",

    //  vec3 surf2light = normalize(pos - vertex_pos);
    // vec3 norm = normalize(vnorm);
    //  float dcont=max(0.0,dot(norm,surf2light));
    "lightAdd += att;",

    "gl_FragColor = vec4(ambient+lightColor*lightAdd ,1.0);",
    "}"

  ].join('\n')
};

THREE.CercleShader = {




  vertexShader: [
    "varying vec2 vUv;",
    "uniform vec2 decal;",
    "void main(){",

    "vUv = uv/2.0+decal/2.0;",


    "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",

    "}"
  ].join('\n'),

  fragmentShader: [

    "varying vec2 vUv;",
    "uniform sampler2D tex;",
    "void main(){",


    "gl_FragColor = texture2D(tex,vUv);",
    "}"

  ].join('\n')
};


/****************************************************************************************

                          INTRO

****************************************************************************************/

// un reste de la prière intro, celle avec les rochers qui s'accumulent
// supprimable sans causer de problème je le laisse pour la future intro

var _Intro = function (callback) {


  // this.scene = new THREE.Scene();
  this.complete = callback;
  this.done = false;
  this.pause = false;
  //scene.fog = new THREE.FogExp2( 0xededed, 0.05 );

  // this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  // this.camera.position.z = 15;

  //  this.light = new THREE.DirectionalLight(0xffffff, 1);


  // this.light.position.set(100, 100, 50);
  // this.scene.add(this.light);


  // this.ambient = new THREE.AmbientLight(0xA0A0A0);
  // this.scene.add(this.ambient);

  /* this.renderer = new THREE.WebGLRenderer({
    alpha: true,
    canvas: $('#intro').get(0)
  });*/
  // this.renderer.setClearColor(0x000000, 0);
  // this.renderer.setSize(window.innerWidth, window.innerHeight);

  // this.texture = THREE.ImageUtils.loadTexture("images/texture_gemme.jpg");
  // this.texture.wrapS = THREE.RepeatWrapping;
  // this.texture.wrapT = THREE.RepeatWrapping;
  // this.texture.repeat.set(4, 4);




  // this.mat = new THREE.MeshPhongMaterial({
  //   color: new THREE.Color('rgb(200,200,200)'), //new THREE.Color('rgb(50,5,30)'), //rgb(119,70,88)
  //  emissive: new THREE.Color('rgb(26,25,25)'),
  //  specular: 0xA0A0A0,
  //  shininess: 40,
  //  metal: true,
  // map: this.texture,

  // normalScale: new THREE.Vector2(0.8, 0.8),
  //  wrapRGB: new THREE.Vector3(0.575, 0.5, 0.5),
  //  wrapAround: true,
  //  shading: THREE.FlatShading
  // });
  // this.obj = new THREE.Object3D();
  // this.gemmes = [];

  // var c;
  // var mass, geometry, gemme;
  // for (c = 0; c < 100; c++) {
  //   mass = Math.random() * 1.8;
  //   geometry = new THREE.IcosahedronGeometry(mass, 0);
  //   gemme = new THREE.Mesh(geometry, this.mat);

  //   gemme.position.x = Math.random() * 25 - 12.5;
  //   gemme.position.y = Math.random() * 25 - 12.5;
  //   gemme.position.z = Math.random() * 25 - 12.5;

  //   //les sortir du champ de vision;
  //   gemme.position.setLength(gemme.position.length() * 15);


  //   gemme.velocity = 0.8;

  //   gemme.rotation.x = Math.random() * 25 - 12.5;
  //   gemme.rotation.y = Math.random() * 25 - 12.5;
  //   gemme.rotation.z = Math.random() * 25 - 12.5;

  //   gemme.mass = mass;

  //   this.gemmes.push(gemme);
  //   this.obj.add(gemme);
  // }

  // for (c = 0; c < 85; c++) {
  //   mass = Math.random() / 2;
  //   geometry = new THREE.IcosahedronGeometry(mass, 0);
  //   gemme = new THREE.Mesh(geometry, this.mat);

  //   gemme.position.x = Math.random() * 5 - 2.5;
  //   gemme.position.y = Math.random() * 5 - 2.5;
  //   gemme.position.z = Math.random() * 5 - 2.5;

  //   //les sortir du champ de vision;
  //   gemme.position.setLength(gemme.position.length() * 15);


  //   gemme.velocity = gemme.position.length();

  //   gemme.rotation.x = Math.random() * 25 - 12.5;
  //   gemme.rotation.y = Math.random() * 25 - 12.5;
  //   gemme.rotation.z = Math.random() * 25 - 12.5;

  //   gemme.mass = mass;

  //   //gemmes.push(gemme);
  //   this.obj.add(gemme);
  // }



  // this.scene.add(this.obj);
  // this.lum = 47;
  // this.time = 0;
  // this.rotVit = 0.08;
  // this.accumule = true;

  $('#preTitre').delay(5000).fadeOut(3000, function () {
    $('#preTitre').remove();
    // console.log('efface');
  });

  setTimeout(function () {
    $('#message').fadeOut(1000);

  }, 5000);
};

_Intro.prototype = {


  decrease_brightness: function (r, g, b, percent) {

    //var m = max(r,g,b);
    r = Math.floor(r * percent / 100);
    g = Math.floor(g * percent / 100);
    b = Math.floor(b * percent / 100);

    return 'rgb(' + r + ',' + g + ',' + b + ')';

  },



  update: function () {
    /*  if (this.accumule) {
      var actif = this.gemmes.length;
      var c;
      for (c in this.gemmes) {
        if (this.gemmes.hasOwnProperty(c)) {


          if (this.gemmes[c].position.length() > this.gemmes[c].mass * 1.2) {
            this.gemmes[c].rotation.x += (1 - this.gemmes[c].mass) / 100;
            this.gemmes[c].rotation.y += (1 - this.gemmes[c].mass) / 100;
            this.gemmes[c].rotation.z += (1 - this.gemmes[c].mass) / 100;

            if (this.gemmes[c].position.length() < this.gemmes[c].mass * 2) {
              this.gemmes[c].velocity *= 0.8;
              if (this.gemmes[c].velocity < 0.01) {
                this.gemmes[c].velocity = 0.01;
              }
            }
            this.gemmes[c].position.setLength(this.gemmes[c].position.length() - this.gemmes[c].velocity);



          } else {

            actif--;

          }


          this.rotVit = 0.002 + (actif / 100) / 40;


        }
      }
      this.accumule = (actif > 10);
      this.obj.rotation.y -= this.rotVit;

    } else {




      this.time++;

      this.obj.rotation.y -= 0.002;
      if (this.time > 100) {

        $('#texte').css({
          'color': 'white'
        });




        if (this.lum > 0) {
          this.mat.shininess = this.lum;
          //mat.color= new THREE.Color(decrease_brightness(255,255,255,lum));
          this.lum--;
        }

        this.mat.metal = false;
        if (this.camera.fov > 12) {

          //mat.shininess =0.2;

          this.camera.fov -= 2;
          this.camera.updateProjectionMatrix();


        } else {
          $('#texte').remove();
          if (!this.done) {
            this.complete();
            this.done = true;
          }
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
    */
    if (!this.done) {
      this.complete();
      this.done = true;
    }
  }
};



/****************************************************************************************

                         XP SON

****************************************************************************************/

function XP_son(renderer) {
  'use strict';
  this.choix = -1;
  this.renderer = $(renderer);
  this.ctx = null;
  this.ori = 0;
  this.audioContext = null;
  this.audioBuffer = null;
  this.sourceNode = null;
  this.pause = false;
  this.firstLoad = true;
  this.orientationStart = 0;
  this.scene = new THREE.Scene();
  this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  this.renderer3D = null;
  this.texture = THREE.ImageUtils.loadTexture("images/dot.png");
  this.rond = THREE.ImageUtils.loadTexture("images/cercle_couleurs.png");
  this.rond.minFilter = THREE.LinearFilter;
  this.radartex = THREE.ImageUtils.loadTexture("images/radar.png");
  this.radar = 0;
  this.boule = new THREE.PointCloud(new THREE.SphereGeometry(32, 32, 32), new THREE.PointCloudMaterial({
    color: "#000000",
    map: this.texture,
    transparent: true,
    size: 0.2
  }));
  this.auto = false;
  this.boule.position.z = -20;
  this.sounds = [];
  this.sounds.push({});
  this.sounds.push({});
  this.sounds.push({});
  this.sounds.push({});
  this.sounds.push({});
  this.sounds.push({});
  this.sounds[0].url = 'sons/son1.mp3';
  this.sounds[1].url = 'sons/son2.mp3';
  this.sounds[2].url = 'sons/son3.mp3';
  this.sounds[3].url = 'sons/son4.mp3';
  this.sounds[4].url = 'sons/son5.mp3';
  this.sounds[5].url = 'sons/son6.mp3';
  this.sounds[0].play = false;
  this.sounds[1].play = false;
  this.sounds[2].play = false;
  this.sounds[3].play = false;
  this.sounds[4].play = false;
  this.sounds[5].play = false;
  this.sounds[0].already = false;
  this.sounds[1].already = false;
  this.sounds[2].already = false;
  this.sounds[3].already = false;
  this.sounds[4].already = false;
  this.sounds[5].already = false;
  this.soundLoaded = this.sounds.length;
  this.analyser = null;
  this.jsNode = null;
  this.idPlayed = 0;

  this.dirOrg = null;

  this.convert = new THREE.Matrix4();

  this.euler = new THREE.Euler();

  this.down = false;
  this.mouse = {
    x: 0,
    y: 0
  };
}

XP_son.prototype = {
  size_away: function () {
    var h = 2 * this.camera.position.z * Math.tan(this.camera.fov / 2 * (Math.PI / 180));
    var w = h * window.innerWidth / window.innerHeight;
    return {
      width: w,
      height: h
    };
  },

  deformeBoule: function (array) {



    var length = array.length;
    var verticesL = this.boule.geometry.vertices.length;
    // get all the frequency amplitudes
    var i;
    var arId;
    for (i = 0; i < verticesL; i++) {
      arId = Math.round(i * (length / 2) / verticesL);
      this.boule.geometry.vertices[i].setLength(12 + array[arId] / 50);
    }
    this.boule.geometry.verticesNeedUpdate = true;
  },

  setupAudioNodes: function () {
    // create a buffer source node
    this.sourceNode = this.audioContext.createBufferSource();
    // and connect to destination
    this.sourceNode.connect(this.audioContext.destination);

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.3;
    this.analyser.fftSize = 512;

    // setup a javascript node
    this.jsNode = this.audioContext.createScriptProcessor(1024, 1, 1);
    var obj = this;
    this.jsNode.onaudioprocess = function () {

      // get the average for the first channel
      var array = new Uint8Array(obj.analyser.frequencyBinCount);
      obj.analyser.getByteFrequencyData(array);
      obj.deformeBoule(array);


    };
    // connect to destination, else it isn't called
    this.jsNode.connect(this.audioContext.destination);
  },

  syncStream: function (node) { // should be done by api itself. and hopefully will.

    var buf8 = new Uint8Array(node.buf);
    buf8.indexOf = Array.prototype.indexOf;
    var i = node.sync,
      b = buf8;
    while (true) {
      node.retry++;
      i = b.indexOf(0xFF, i);
      if (i === -1 || (b[i + 1] & 0xE0 === 0xE0)) break;
      i++;
    }
    if (i != -1) {
      var tmp = node.buf.slice(i); //carefull there it returns copy
      delete(node.buf);
      node.buf = null;
      node.buf = tmp;
      node.sync = i;
      return true;
    }
    return false;
  },

  decode: function (node) {
    var obj = this;
    try {
      this.audioContext.decodeAudioData(node.buf,
        function (decoded) {
          node.Gain = obj.audioContext.createGain();
          node.Gain.gain.value = 0;
          node.source = obj.audioContext.createBufferSource();
          node.source.connect(node.Gain);
          node.Gain.connect(obj.analyser);
          node.Gain.connect(obj.audioContext.destination);
          node.source.buffer = decoded;
          node.source.loop = true;

          obj.soundLoaded--;
          if (obj.soundLoaded === 0) {
            obj.initsuite();
          }
        },
        function () { // only on error attempt to sync on frame boundary
          if (syncStream(node)) decode(node);
        });
    } catch (e) {
      alert('decode exception', e.message);
    }
  },



  loadSound: function (sound) {
    var request = new XMLHttpRequest();
    var obj = this;
    request.open('GET', sound.url, true);
    request.responseType = 'arraybuffer';

    // When loaded decode the data
    request.onload = function () {

      // decode the data
      sound.buf = request.response;
      sound.sync = 0;
      sound.retry = 0;
      obj.decode(sound);

    }
    request.send();

  },


  playSound: function (sound) {
    if (!sound.already) {
      sound.source.start(0);
      sound.already = true;
    } else {
      sound.Gain.gain.value = 1;
    }
    sound.play = true;
    // console.log(sound.Gain.gain.value);
  },
  stopSound: function (sound) {
    sound.Gain.gain.value = 0;
    sound.play = false;
    //  console.log(sound.Gain.gain.value);
  },

  // log if an error occurs
  onError: function (e) {
    console.log(e);
  },

  animate: function () {

  },


  init: function (readyCallback) {

    $('body').css({
      'background': 'url(images/background.jpg) no-repeat',
      'background-size': 'cover'
    });
    $('#transition').show();
    $('#transition').html($('#resSon').html());
    $('body').prepend('<div id="radar_son"></div>');
    $('body').prepend('<canvas id="renderer"></canvas>');
    $('body').prepend('<div id="rond_son"></div>');



    this.renderer = $('#renderer');
    this.renderer3D = new THREE.WebGLRenderer({
      canvas: this.renderer.get(0),
      alpha: true,
      antialias: true
    });
    this.renderer3D.setClearColor(0x000000, 0);
    this.renderer3D.setSize(window.innerWidth, window.innerHeight);

    // check if the default naming is enabled, if not use the chrome one.
    this.ready = readyCallback;
    if (!window.AudioContext) {
      if (!window.webkitAudioContext) {
        alert('no audiocontext found');
      }
      window.AudioContext = window.webkitAudioContext;
    }

    this.audioContext = new AudioContext();
    //initialise l'XP (les éléments du DOM, etc.)
    var obj = this;




    // load the sound
    this.setupAudioNodes();
    var c;
    for (c = 0; c < this.sounds.length; c++) {
      this.loadSound(this.sounds[c]);
    }
  },

  initsuite: function () {


    var obj = this;
    this.camera.position.z = 50;
    this.scene.add(this.camera);


    var vFOV = this.camera.fov * Math.PI / 180; // convert vertical fov to radians
    var height = 10 * Math.tan(vFOV / 2) * 50; // visible height

    var spL = 180 / height * 100;

    $('#rond_son').css({
      'height': spL + '%'
    });
    $('#rond_son').css({
      'width': $('#rond_son').height() + 'px'
    });

    spL = Math.max(window.innerHeight, window.innerWidth)

    $('#radar_son').css({
      'height': spL + 'px'
    });
    $('#radar_son').css({
      'width': $('#radar_son').height() + 'px'
    });



    var ambient = new THREE.AmbientLight(0xF0F0F0);
    this.scene.add(ambient);
    this.scene.add(this.boule);

    var taille = this.size_away();
    var t = (taille.width > taille.height) ? taille.height : taille.width;
    t = t * 80 / 100;




    window.addEventListener('deviceorientation', function (event) {
      event.preventDefault();
      if (obj.pause) {
        return
      }
      var x = event.alpha; // En degré sur l'interval [-180,180].
      var y = event.gamma; // En degré sur l'interval [-180,180].
      var z = event.beta; // En degré sur l'interval [-180,180].

      if (obj.firstLoad) {
        obj.orientationStart = x;
        obj.firstLoad = false;
      }

      /* version qui marche
      if (obj.radar != null) {
        if ((y < -10) || (y > 10)) {
          obj.radar -= (y) / 8;

        }
      }*/
      if (!obj.auto) {
        obj.ori = x;
        obj.radar = -(x - obj.orientationStart);
      }


    });
    $('#transition .transition_box').append($('#clickbut').html());
  },

  start: function () {
    this.auto = true;
    var obj = this;
    bouton_validate(false);
    $('#transition').hide();
    $('#transition').html('');
    this.sounds[0].Gain.gain.value = 1;
    for (c = 0; c < this.sounds.length; c++) {

      this.playSound(this.sounds[c]);

    }
    $('#bouton_validate').tap(function () {
      obj.validate();
    });

    $('#radar_son').tapstart(function (e, d) {
      if (e.pageX) {
        var x = e.pageX;
        var y = e.pageY;
      } else {
        var x = e.originalEvent.touches[0].pageX;
        var y = e.originalEvent.touches[0].pageY;
      }
      obj.down = true;
      obj.changeAngle(x - $('body').width() / 2, y - $('body').height() / 2);
    });

    $('#radar_son').tapmove(function (e, d) {
      e.preventDefault();
      if (!obj.down) {
        return
      }
      if (e.pageX) {
        var x = e.pageX;
        var y = e.pageY;
      } else {
        var x = e.originalEvent.touches[0].pageX;
        var y = e.originalEvent.touches[0].pageY;
      }

      obj.changeAngle(x - $('body').width() / 2, y - $('body').height() / 2);
    });

    $('#radar_son').tapend(function (e, d) {
      obj.down = false;
    });
  },
  changeAngle: function (x, y) {
    var v = new THREE.Vector3(x, y, 0);
    v.normalize();
    var dec = 0;

    if (x < 0) {
      dec = -Math.PI;
    }

    var a = Math.PI / 2 - Math.sign(x) * v.angleTo(new THREE.Vector3(0, 1, 0));

    if (x == 0) {
      a = 0;
    }
    this.auto = false;
    this.orientationStart = this.ori - a * 180 / Math.PI;
    this.radar = -a * 180 / Math.PI;


  },
  update: function () {
    this.boule.rotation.z += 0.005;
    this.boule.rotation.x += 0.01;
    this.boule.rotation.y += 0.008;


    $('#radar_son').css({
      'transform': 'translate(-50%,-50%) rotateZ(-' + this.radar + 'deg)'
    })

    if (this.auto) {
      this.radar += 0.8;
    }

    if (this.radar >= 360) {
      this.radar -= 360;
      this.auto = false
    }
    if (this.radar < 0) {
      this.radar += 360;
    }


    var ag = this.radar;
    ag = Math.round(ag / (360 / 6)) % 6;
    this.choix = ag;
    if (ag !== this.idPlayed) {

      var c;
      for (c = 0; c < this.sounds.length; c++) {
        if (this.sounds[c].play) {
          this.stopSound(this.sounds[c]);
        }
      }
      if (ag < this.sounds.length) {
        this.playSound(this.sounds[ag]);

      }
      this.idPlayed = ag;
    }

    //this.controls.update();
    this.renderer3D.render(this.scene, this.camera);
  },


  validate: function () {
    $('#validate').html('');
    $('#validate').show();

    $('#validate').append($('#valYN').html());
    $('#bouton_validate').hide();
    this.pause = true;
  },
  no: function () {
    //nothing
    this.pause = false;
    $('#bouton_validate').show();
  },
  destroy: function () {
    window.removeEventListener('deviceorientation', function (event) {
      event.preventDefault();
      if (obj.pause) {
        return
      }
      var x = event.alpha; // En degré sur l'interval [-180,180].
      var y = event.gamma; // En degré sur l'interval [-180,180].
      var z = event.beta; // En degré sur l'interval [-180,180].

      if (obj.firstLoad) {
        obj.orientationStart = x;
        obj.firstLoad = false;
      }

      /* version qui marche
      if (obj.radar != null) {
        if ((y < -10) || (y > 10)) {
          obj.radar -= (y) / 8;

        }
      }*/
      if (!obj.auto) {
        obj.ori = x;
        obj.radar = -(x - obj.orientationStart);
      }


    });
    Choix.change('son', this.choix);

    this.scene.remove(this.boule);
    this.boule.geometry.dispose();

    this.texture.dispose();
    this.rond.dispose();
    this.radartex.dispose();

    this.scene = null;
    this.camera = null;
    for (c = 0; c < this.sounds.length; c++) {

      this.sounds[c].source.stop(0);

    }
    $('#renderer').remove();
    $('#validate').html('');
    $('#validate').css({
      'background': 'none'
    });
    $('#validate').hide();
    $('#rond_son').remove();
    $('#radar_son').remove();
    $('#renderer').remove();
    $('#bouton_validate').remove();
    delete this;
  }
}


/****************************************************************************************

                          XP_LIEU

****************************************************************************************/


var XP_lieux = function (renderer, readyCallback) {
  this.size = 20;
  this.space = 1.1;

  this.ready = readyCallback;
  this.renderer = $(renderer);
  this.ctx = null;

  this.startX = 0;
  this.startY = 0;

  this.X = 0;
  this.Y = 0;
  this.automax = 100;
  this.auto = 0;
  this.pause = false;
  this.taille = null;
  this.scene = new THREE.Scene();
  this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  this.renderer3D = null;
  this.vel = {
    x: 0,
    y: 0
  };
  this.cercles = [];
  this.cerclesId = [];

  this.lieux = [
    THREE.ImageUtils.loadTexture("images/Aeroport00.jpg"),
    THREE.ImageUtils.loadTexture("images/Bibliotheque00.jpg"),
    THREE.ImageUtils.loadTexture("images/CampagneNeige00.jpg"),
    THREE.ImageUtils.loadTexture("images/Ciel00.jpg"),
    THREE.ImageUtils.loadTexture("images/Foret00.jpg"),
    THREE.ImageUtils.loadTexture("images/HongKong00.jpg"),
    THREE.ImageUtils.loadTexture("images/Musee00.jpg"),
    THREE.ImageUtils.loadTexture("images/Salon00.jpg")

  ];
  var c;
  for (c = 0; c < this.lieux.length; c++) {
    this.lieux[c].minFilter = THREE.NearestFilter;
  }

  this.choixId = -1;
  this.lum = 7;
  this.lumX = 0;
  this.action = false;

  this.lieuxAsset = [
    "images/Aeroport",
    "images/Bibliotheque",
    "images/CampagneNeige",
    "images/Ciel",
    "images/Foret",
    "images/HongKong",
    "images/Musee",
    "images/Salon"
  ];
}


XP_lieux.prototype = {
  size_away: function () {
    var h = 2 * this.camera.position.z * Math.tan(this.camera.fov / 2 * (Math.PI / 180));
    var w = h * window.innerWidth / window.innerHeight;
    return {
      width: w,
      height: h
    };
  },
  start: function () {
    $('#transition').html();
    $('#transition').hide();
    //   console.log('XP_lieux_start');
    this.vel.x = 0.5;
    this.vel.y = 0.5;
    this.auto = this.automax;
  },



  create_cercles: function (obj, x, y, s, dy, id) {
    obj.lieux[id].repeat.x = 760 / 1264;
    var shader = THREE.CercleShader;
    cercle = {
      x: x,
      y: y,

      mesh: new THREE.Mesh(new THREE.CircleGeometry(s / 2, 64), new THREE.ShaderMaterial({
        uniforms: {
          tex: {
            type: 't',
            value: obj.lieux[id]
          },
          decal: {
            type: 'v2',
            value: new THREE.Vector2(Math.random(), Math.random())
          }
        },
        vertexShader: THREE.CercleShader.vertexShader,
        fragmentShader: THREE.CercleShader.fragmentShader

      }))
    };
    cercle.mesh.XpVal = id;
    cercle.mesh.position.x = x;
    cercle.mesh.position.y = y;
    obj.scene.add(cercle.mesh);
    return cercle;
  },

  cercle_wall: function (nb) {
    var c, d;
    var x, y;
    var sq = Math.round(Math.sqrt(nb)) * 2;
    var count = 1;
    var sizex = this.taille.width / (sq / 2);
    var sizey = this.taille.height / (sq / 2);

    var ids = [
      [0, 1, 2],
      [4, 5, 6],
      [0, 3, 7],
      [6, 4, 5]
    ]

    this.size = (sizex > sizey) ? sizey : sizex;

    var spacex = sizex - this.size;
    var spacey = sizey - this.size;


    for (c = 0; c < sq; c++) {
      for (d = 0; d < sq; d++) {
        x = (c - sq / 2) + (d % 2) / 2;
        y = (d - sq / 2);

        this.cercles.push(new this.create_cercles(this, x * (this.size + spacex), y * (this.size + spacey), this.size, 0, ids[d % 4][c % 3]));
      }
    }

  },
  reduce_cercle: function () {
    var c, d;
    var sx, sy, sin;
    var decx, decy = 0;
    for (c in this.cercles) {

      this.cercles[c].x += this.vel.x;
      this.cercles[c].y += this.vel.y;

      if ((this.vel.x > 0) && (this.cercles[c].x > this.taille.width)) {
        this.cercles[c].x = -this.taille.width + (this.cercles[c].x - this.taille.width);
      }

      if ((this.vel.x < 0) && (this.cercles[c].x < -this.taille.width)) {
        this.cercles[c].x = this.taille.width - (Math.abs(this.cercles[c].x) - this.taille.width);
      }

      if ((this.vel.y > 0) && (this.cercles[c].y > this.taille.height)) {
        this.cercles[c].y = -this.taille.height + (this.cercles[c].y - this.taille.height);
      }

      if ((this.vel.y < 0) && (this.cercles[c].y < -this.taille.height)) {
        this.cercles[c].y = this.taille.height - (Math.abs(this.cercles[c].y) - this.taille.height);
      }
      sx = this.cercles[c].x / (this.taille.width / 2.5);
      sy = this.cercles[c].y / (this.taille.height / 2.5);



      if (
        (this.cercles[c].x > -this.taille.width / 1.5) &&
        (this.cercles[c].x < this.taille.width / 1.5) &&
        (this.cercles[c].y > -this.taille.height / 1.5) &&
        (this.cercles[c].y < this.taille.height / 1.5)
      ) {
        sin = Math.cos(sx) * Math.cos(sy);
      } else {
        sin = 0.0001;

      }

      decx = this.cercles[c].x / (this.taille.width / 4);
      decy = this.cercles[c].y / (this.taille.height / 4);
      this.cercles[c].mesh.scale.set(sin, sin, sin);
      if (sin === 0.0001) {
        sin = 0;
      }

      this.cercles[c].mesh.position.set(this.cercles[c].x - this.size * (1 - sin) * decx / 4, this.cercles[c].y - this.size * (1 - sin) * decy / 4, 0);
    }
  },

  init: function (readyCallback) {
    //initialise l'XP (les éléments du DOM, etc.)
    $('#transition').show();
    $('#transition').html($('#reslieu').html());
    $('body').prepend('<canvas id="renderer"></canvas>');

    $('#jour').css({
      'display': 'block'
    });
    $('#nuit').css({
      'display': 'block'
    });
    this.renderer = $('#renderer');
    this.renderer3D = new THREE.WebGLRenderer({
      canvas: this.renderer.get(0),
      alpha: true
    });
    this.renderer3D.setClearColor('#efefef', 1);
    this.renderer3D.setSize(window.innerWidth * 1.5, window.innerHeight * 1.5);

    this.renderer.css({
      'width': window.innerWidth + 'px',
      'height': window.innerHeight + 'px'
    });

    this.camera.position.z = 50;
    this.scene.add(this.camera);

    var light = new THREE.DirectionalLight(0xffffff, 0.2);
    light.position.set(0, 10, 5);
    this.scene.add(light);

    var ambient = new THREE.AmbientLight(0xF0F0F0);
    this.scene.add(ambient);


    // check if the default naming is enabled, if not use the chrome one.
    this.ready = readyCallback;
    //efface le canvas
    this.taille = this.size_away();

    this.cercle_wall(10);
    var obj = this;
    $('#renderer').tapstart(function (e, d) {
      e.preventDefault();
      obj.action = true;
      obj.startX = d.position.x;
      obj.startY = d.position.y;

    })
    $('#jour_nuit').tapstart(function (e, d) {
      e.preventDefault();
      obj.action = true;
      obj.lumX = d.position.x;
      var x = (1 - (d.offset.x / $('#jour_nuit').width()))
      $('#jnSlider').css({
        'left': 'calc(' + (100 * (1 - x)) + '% - 3px)'
      });

      $('#xp_lieux_assombri').css({
        'opacity': x

      })
    })

    $('#renderer').tapmove(function (e, d) {
      e.preventDefault();

      if (obj.action) {
        var c;
        for (c in obj.cercles) {
          obj.vel.x = (d.position.x - obj.startX) / (obj.size / 1.5);
          obj.vel.y = -(d.position.y - obj.startY) / (obj.size / 1.5);
        }


        obj.startX = d.position.x;
        obj.startY = d.position.y;




      }
    })

    /*   $('#jour').tap(function () {
      obj.lum = 0;
      $('#xp_lieux_assombri').css({
        'opacity': obj.lum

      })
    })
    $('#nuit').tap(function () {
      obj.lum = 1;
      $('#xp_lieux_assombri').css({
        'opacity': obj.lum

      })
    })*/

    $('#jour_nuit').tapmove(function (e, d) {
      e.preventDefault();
      var x = 0;
      if (obj.action) {
        x = (1 - (d.offset.x / $('#jour_nuit').width()));

        if (e.target.id == 'jour') {
          x = (1 - ((d.offset.x + $('#jour').offset().left) / $('#jour_nuit').width()));
          //   console.log(x);
        }
        obj.lum = x;

        if (obj.lum < 0) {
          obj.lum = 0
        }
        if (obj.lum > 1) {
          obj.lum = 1
        }
        $('#jnSlider').css({
          'left': 'calc(' + (100 * (1 - obj.lum)) + '% - 3px)'
        });
        //var t = (obj.lum<10)? '0'+obj.lum : obj.lum;
        $('#xp_lieux_assombri').css({
          'opacity': obj.lum

        })
      }
    })

    $('#renderer').tapend(function (e, d) {
      e.preventDefault();
      obj.action = false;
      obj.startX = d.position.x;
      obj.startY = d.position.y;


    })

    $('#jour_nuit').tapend(function (e, d) {
      e.preventDefault();
      obj.action = false;



    })

    $('#xp_lieux_assombri').tap(function () {
      if (obj.pause) {
        obj.validate();
      }
    })

    $('#renderer').tap(function (e, d) {

      var mouse = {
        x: 0,
        y: 0
      };
      e.preventDefault();
      mouse.x = (d[0].offset.x / window.innerWidth) * 2 - 1;
      mouse.y = -(d[0].offset.y / window.innerHeight) * 2 + 1;
      var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(obj.camera);

      var raycaster = new THREE.Raycaster(obj.camera.position, vector.sub(obj.camera.position).normalize());
      var intersects = raycaster.intersectObjects(obj.scene.children);


      if (intersects.length > 0) {
        obj.choixId = intersects[0].object.XpVal;
        obj.choix(intersects[0].object.XpVal);

      }
    });
    //    this.ready(); //appelle le callback pour prevenir que l'xp est prète.
    $('#transition .transition_box').append($('#clickbut').html());

  },


  update: function () {
    if (!this.pause) {
      this.auto = 0;
      if (this.auto > 0) {
        this.auto--;
      }
      this.reduce_cercle();
      if (this.auto == 0) {
        this.vel.x *= 0.91;
        this.vel.y *= 0.91;

        if (Math.abs(this.vel.x) < 0.1) {
          this.vel.x = 0
        }
        if (Math.abs(this.vel.y) < 0.1) {
          this.vel.y = 0
        }
      } else {
        if (this.auto < this.automax * 50 / 100) {
          this.vel.x -= 0.05;
        }
        if (this.auto < this.automax * 40 / 100) {
          this.vel.y -= 0.05;
        }

      }

      this.renderer3D.render(this.scene, this.camera);
    }
  },


  choix: function (id) {
    this.pause = true;
    var obj = this;
    $('#xp_lieux_lumiere').css({
      'background-image': 'url(' + this.lieuxAsset[id] + '00.jpg)',
      'display': 'block'
    })
    $('#xp_lieux_assombri').css({
      'background-image': 'url(' + this.lieuxAsset[id] + '14.jpg)',
      'display': 'block'
    })
    $('#jnQuit').show();
    $('#jnQuit').tap(function () {
      obj.pause = false;
      $('#xp_lieux_lumiere').css({
        'display': 'none'
      });
    })

  },



  validate: function () {

    $('#jour_nuit').hide();
    $('#jnQuit').css({
      'display': 'none'
    });
    // $('#nuit').hide();
    $('#validate').append($('#valYN').html());
    $('#validate').show();

  },

  no: function () {
    $('#xp_lieux_lumiere').hide();
    $('#jour_nuit').show();
    //   $('#nuit').show();
    $('#bouton_validate').hide();
    this.pause = false;
  },
  destroy: function () {
    Choix.change('lieu', this.choixId,this.lum);

    var c;
    for (c in this.lieux) {
      this.lieux[c].dispose();
    }
    for (c in this.cercles) {
      this.scene.remove(this.cercles[c].mesh);
      this.cercles[c].mesh.material.dispose();
      this.cercles[c].mesh.geometry.dispose();
    }

    this.scene = null;
    $('#renderer').remove();
    $('#validate').html('');
    $('#validate').css({
      'background': 'none'
    });
    $('#validate').hide();
    $('#xp_lieux_lumiere').remove();
    $('#bouton_validate').remove();
    delete this;
  }
}



/****************************************************************************************

                          XP_COULEUR

****************************************************************************************/



function XP_couleur(renderer, readyCallback) {
  'use strict';
  this.ready = readyCallback;
  this.renderer = $(renderer);
  this.choix = '#000000';
  this.ctx = null;
  this.pause = false;
  this.color2 = '#ba2f30';
  this.color1 = '#f0c8b6';
  this.color4 = '#f4d1a9';
  this.color3 = '#92e6d7';
  this.color6 = '#5bbca7';
  this.color5 = '#8a20d3';
  this.colors = [];
  this.tapDown = false;
  this.scene = new THREE.Scene();
  this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  this.renderer3D = null;
  this.controls = null;
  this.busy = 0;
  this.tapX = 0;
  this.tapY = 0;
  this.raycast = [];
  this.tordu = false;
  this.angle = 0;
  this.etape = 100000;
  this.etapecol = -4;
  this.taille = null;
  this.size = 0;
  this.colored = false;
  this.assombrissement = 0;
}

XP_couleur.prototype = {
  rotateAroundWorldAxis: function (object, axis, radians) {
    var rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);


    rotWorldMatrix.multiply(object.matrix); // pre-multiply

    object.matrix = rotWorldMatrix;


    object.rotation.setFromRotationMatrix(object.matrix);
  },
  size_away: function () {
    var h = 2 * this.camera.position.z * Math.tan(this.camera.fov / 2 * (Math.PI / 180));
    var w = h * window.innerWidth / window.innerHeight;
    return {
      width: w,
      height: h
    };
  },
  gradient: function (col1, col2, n, max) {

    var col1 = new THREE.Color(col1);
    var col2 = new THREE.Color(col2);
    col1.lerp(col2, n / max);
    return col1.getStyle();
  },

  change_face_color: function (id) {
    if (this.colored) {
      return
    }
    if (this.etape < 0) {
      this.etape = 6;
    }
    var face_en_face = 0; //this.etape%4;
    var indexDegrade_en_face = (this.etape % 3) * 4;

    var color = [
      new THREE.Color(1, 0, 0),
      new THREE.Color(0, 1, 0),
      new THREE.Color(0, 0, 1)
    ];
    var c, geom, diag = Math.sqrt((this.taille.width / this.size + 1) * (this.taille.width / this.size + 1) + (this.taille.height / this.size + 1) * (this.taille.height / this.size + 1)),
      c,
      d, e = 0,
      nb = Math.floor(this.taille.height / this.size) + 1;

    c = Math.floor(id / nb);
    d = id % nb;
    geom = this.pyr[id].Mesh.geometry;

    //bg
    this.colors[0] = new THREE.Color(this.gradient(this.color1, this.color2, Math.sqrt(c * c + d * d), diag));
    //bd
    this.colors[1] = new THREE.Color(this.gradient(this.color1, this.color2, Math.sqrt((c + 1) * (c + 1) + (d) * (d)), diag));
    //hd
    this.colors[2] = new THREE.Color(this.gradient(this.color1, this.color2, Math.sqrt((c + 1) * (c + 1) + (d + 1) * (d + 1)), diag));
    //hg
    this.colors[3] = new THREE.Color(this.gradient(this.color1, this.color2, Math.sqrt((c) * (c) + (d + 1) * (d + 1)), diag));

    this.colors[4] = new THREE.Color(this.gradient(this.color3, this.color4, Math.sqrt(c * c + d * d), diag));
    this.colors[5] = new THREE.Color(this.gradient(this.color3, this.color4, Math.sqrt((c + 1) * (c + 1) + (d) * (d)), diag));
    this.colors[6] = new THREE.Color(this.gradient(this.color3, this.color4, Math.sqrt((c + 1) * (c + 1) + (d + 1) * (d + 1)), diag));
    this.colors[7] = new THREE.Color(this.gradient(this.color3, this.color4, Math.sqrt((c) * (c) + (d + 1) * (d + 1)), diag));

    this.colors[8] = new THREE.Color(this.gradient(this.color5, this.color6, Math.sqrt(c * c + d * d), diag));
    this.colors[9] = new THREE.Color(this.gradient(this.color5, this.color6, Math.sqrt((c + 1) * (c + 1) + (d) * (d)), diag));
    this.colors[10] = new THREE.Color(this.gradient(this.color5, this.color6, Math.sqrt((c + 1) * (c + 1) + (d + 1) * (d + 1)), diag));
    this.colors[11] = new THREE.Color(this.gradient(this.color5, this.color6, Math.sqrt((c) * (c) + (d + 1) * (d + 1)), diag));


    var sombre1 = this.colors[(indexDegrade_en_face) % 12].clone();
    sombre1.addScalar((this.assombrissement - 1) / 5);
    var sombre2 = this.colors[(indexDegrade_en_face + 1) % 12].clone();
    sombre2.addScalar((this.assombrissement - 1) / 5);
    var sombre3 = this.colors[(indexDegrade_en_face + 2) % 12].clone();
    sombre3.addScalar((this.assombrissement - 1) / 5);
    var sombre4 = this.colors[(indexDegrade_en_face + 3) % 12].clone();
    sombre4.addScalar((this.assombrissement - 1) / 5);

    var clair1 = this.colors[(indexDegrade_en_face) % 12].clone();
    clair1.addScalar((this.assombrissement + 1) / 5);
    var clair2 = this.colors[(indexDegrade_en_face + 1) % 12].clone();
    clair2.addScalar((this.assombrissement + 1) / 5);
    var clair3 = this.colors[(indexDegrade_en_face + 2) % 12].clone();
    clair3.addScalar((this.assombrissement + 1) / 5);
    var clair4 = this.colors[(indexDegrade_en_face + 3) % 12].clone();
    clair4.addScalar((this.assombrissement + 1) / 5);

    this.colors[0].addScalar(this.assombrissement / 5);
    this.colors[1].addScalar(this.assombrissement / 5);
    this.colors[2].addScalar(this.assombrissement / 5);
    this.colors[3].addScalar(this.assombrissement / 5);
    this.colors[4].addScalar(this.assombrissement / 5);
    this.colors[5].addScalar(this.assombrissement / 5);
    this.colors[6].addScalar(this.assombrissement / 5);
    this.colors[7].addScalar(this.assombrissement / 5);
    this.colors[8].addScalar(this.assombrissement / 5);
    this.colors[9].addScalar(this.assombrissement / 5);
    this.colors[10].addScalar(this.assombrissement / 5);
    this.colors[11].addScalar(this.assombrissement / 5);



    geom.faces[0].vertexColors[0] = this.colors[(indexDegrade_en_face) % 12];
    geom.faces[0].vertexColors[1] = this.colors[(indexDegrade_en_face + 1) % 12];
    geom.faces[0].vertexColors[2] = this.colors[(indexDegrade_en_face + 2) % 12];

    geom.faces[1].vertexColors[0] = this.colors[(indexDegrade_en_face + 2) % 12];
    geom.faces[1].vertexColors[1] = this.colors[(indexDegrade_en_face + 3) % 12];
    geom.faces[1].vertexColors[2] = this.colors[(indexDegrade_en_face) % 12];

    geom.faces[2].vertexColors[0] = this.colors[(indexDegrade_en_face + 4) % 12]; //4
    geom.faces[2].vertexColors[1] = this.colors[(indexDegrade_en_face + 5) % 12]; //3
    geom.faces[2].vertexColors[2] = this.colors[(indexDegrade_en_face + 6) % 12]; //2

    geom.faces[3].vertexColors[0] = this.colors[(indexDegrade_en_face + 6) % 12];
    geom.faces[3].vertexColors[1] = this.colors[(indexDegrade_en_face + 7) % 12];
    geom.faces[3].vertexColors[2] = this.colors[(indexDegrade_en_face + 4) % 12];

    geom.faces[4].vertexColors[0] = this.colors[(indexDegrade_en_face + 8) % 12];
    geom.faces[4].vertexColors[1] = this.colors[(indexDegrade_en_face + 9) % 12];
    geom.faces[4].vertexColors[2] = this.colors[(indexDegrade_en_face + 10) % 12];

    geom.faces[5].vertexColors[0] = this.colors[(indexDegrade_en_face + 10) % 12];
    geom.faces[5].vertexColors[1] = this.colors[(indexDegrade_en_face + 11) % 12];
    geom.faces[5].vertexColors[2] = this.colors[(indexDegrade_en_face + 8) % 12];

    geom.faces[6].vertexColors[0] = this.colors[(indexDegrade_en_face + 8) % 12];
    geom.faces[6].vertexColors[1] = this.colors[(indexDegrade_en_face + 9) % 12];
    geom.faces[6].vertexColors[2] = this.colors[(indexDegrade_en_face + 10) % 12];

    geom.faces[7].vertexColors[0] = this.colors[(indexDegrade_en_face + 10) % 12];
    geom.faces[7].vertexColors[1] = this.colors[(indexDegrade_en_face + 11) % 12];
    geom.faces[7].vertexColors[2] = this.colors[(indexDegrade_en_face + 8) % 12];




    geom.faces[8].vertexColors[0] = sombre1;
    geom.faces[8].vertexColors[1] = sombre2;
    geom.faces[8].vertexColors[2] = sombre3;

    geom.faces[9].vertexColors[0] = sombre3;
    geom.faces[9].vertexColors[1] = sombre4;
    geom.faces[9].vertexColors[2] = sombre1;

    geom.faces[10].vertexColors[0] = clair1;
    geom.faces[10].vertexColors[1] = clair2;
    geom.faces[10].vertexColors[2] = clair3;

    geom.faces[11].vertexColors[0] = clair3;
    geom.faces[11].vertexColors[1] = clair4;
    geom.faces[11].vertexColors[2] = clair1;

    geom.colorsNeedUpdate = true;



    //this.colored = true;
  },

  cube_face_color: function (size, colors, obj) {
    var a = size / 2;

    var geom = new THREE.Geometry();

    // var b = (Math.sqrt(3) / 2 * size) / 3;
    //plan 1
    geom.vertices.push(new THREE.Vector3(-a, -a, a)); //0
    geom.vertices.push(new THREE.Vector3(a, -a, a)); //1
    geom.vertices.push(new THREE.Vector3(a, a, a)); //2
    geom.vertices.push(new THREE.Vector3(-a, a, a)); //3
    geom.vertices.push(new THREE.Vector3(-a, a, -a)); //4
    geom.vertices.push(new THREE.Vector3(a, a, -a)); //5
    geom.vertices.push(new THREE.Vector3(a, -a, -a)); //6
    geom.vertices.push(new THREE.Vector3(-a, -a, -a)); //7

    geom.faces.push(new THREE.Face3(0, 1, 2)); //02
    geom.faces.push(new THREE.Face3(2, 3, 0)); //1

    geom.faces.push(new THREE.Face3(3, 2, 5)); //02
    geom.faces.push(new THREE.Face3(5, 4, 3)); //1

    geom.faces.push(new THREE.Face3(4, 5, 6)); //02
    geom.faces.push(new THREE.Face3(6, 7, 4)); //1

    geom.faces.push(new THREE.Face3(7, 6, 1)); //02
    geom.faces.push(new THREE.Face3(1, 0, 7)); //1

    geom.faces.push(new THREE.Face3(7, 0, 3)); //02
    geom.faces.push(new THREE.Face3(3, 4, 7)); //1

    geom.faces.push(new THREE.Face3(1, 6, 5)); //02
    geom.faces.push(new THREE.Face3(5, 2, 1)); //1



    var face_en_face = obj.etape % 4;
    var indexDegrade_en_face = (obj.etape % 3) * 4;



    geom.faces[(face_en_face * 2) % 8].vertexColors[0] = new THREE.Color(obj.colors[(indexDegrade_en_face + 0) % 12]); //4
    geom.faces[(face_en_face * 2) % 8].vertexColors[1] = new THREE.Color(obj.colors[(indexDegrade_en_face + 1) % 12]); //3
    geom.faces[(face_en_face * 2) % 8].vertexColors[2] = new THREE.Color(obj.colors[(indexDegrade_en_face + 2) % 12]); //2

    geom.faces[(face_en_face * 2 + 1) % 8].vertexColors[0] = new THREE.Color(obj.colors[(indexDegrade_en_face + 2) % 12]);
    geom.faces[(face_en_face * 2 + 1) % 8].vertexColors[1] = new THREE.Color(obj.colors[(indexDegrade_en_face + 3) % 12]);
    geom.faces[(face_en_face * 2 + 1) % 8].vertexColors[2] = new THREE.Color(obj.colors[(indexDegrade_en_face + 0) % 12]);

    geom.faces[(face_en_face * 2 + 2) % 8].vertexColors[0] = new THREE.Color(obj.colors[(indexDegrade_en_face + 4) % 12]); //4
    geom.faces[(face_en_face * 2 + 2) % 8].vertexColors[1] = new THREE.Color(obj.colors[(indexDegrade_en_face + 5) % 12]); //3
    geom.faces[(face_en_face * 2 + 2) % 8].vertexColors[2] = new THREE.Color(obj.colors[(indexDegrade_en_face + 6) % 12]); //2

    geom.faces[(face_en_face * 2 + 3) % 8].vertexColors[0] = new THREE.Color(obj.colors[(indexDegrade_en_face + 6) % 12]);
    geom.faces[(face_en_face * 2 + 3) % 8].vertexColors[1] = new THREE.Color(obj.colors[(indexDegrade_en_face + 7) % 12]);
    geom.faces[(face_en_face * 2 + 3) % 8].vertexColors[2] = new THREE.Color(obj.colors[(indexDegrade_en_face + 4) % 12]);

    geom.faces[(face_en_face * 2 + 4) % 8].vertexColors[0] = new THREE.Color(obj.colors[(indexDegrade_en_face + 8) % 12]);
    geom.faces[(face_en_face * 2 + 4) % 8].vertexColors[1] = new THREE.Color(obj.colors[(indexDegrade_en_face + 9) % 12]);
    geom.faces[(face_en_face * 2 + 4) % 8].vertexColors[2] = new THREE.Color(obj.colors[(indexDegrade_en_face + 10) % 12]);

    geom.faces[(face_en_face * 2 + 5) % 8].vertexColors[0] = new THREE.Color(obj.colors[(indexDegrade_en_face + 10) % 12]);
    geom.faces[(face_en_face * 2 + 5) % 8].vertexColors[1] = new THREE.Color(obj.colors[(indexDegrade_en_face + 11) % 12]);
    geom.faces[(face_en_face * 2 + 5) % 8].vertexColors[2] = new THREE.Color(obj.colors[(indexDegrade_en_face + 8) % 12]);

    geom.faces[(face_en_face * 2 + 6) % 8].vertexColors[0] = new THREE.Color(obj.colors[(indexDegrade_en_face + 8) % 12]);
    geom.faces[(face_en_face * 2 + 6) % 8].vertexColors[1] = new THREE.Color(obj.colors[(indexDegrade_en_face + 9) % 12]);
    geom.faces[(face_en_face * 2 + 6) % 8].vertexColors[2] = new THREE.Color(obj.colors[(indexDegrade_en_face + 10) % 12]);

    geom.faces[(face_en_face * 2 + 7) % 8].vertexColors[0] = new THREE.Color(obj.colors[(indexDegrade_en_face + 10) % 12]);
    geom.faces[(face_en_face * 2 + 7) % 8].vertexColors[1] = new THREE.Color(obj.colors[(indexDegrade_en_face + 11) % 12]);
    geom.faces[(face_en_face * 2 + 7) % 8].vertexColors[2] = new THREE.Color(obj.colors[(indexDegrade_en_face + 8) % 12]);

    geom.computeFaceNormals();

    return geom;
  },


  squarePyramide: function (size, colors) {

    var a = size / 2;
    var b = (Math.sqrt(3) / 2 * size) / 3;

    var geom = new THREE.Geometry();

    //plan 1
    geom.vertices.push(new THREE.Vector3(-a, a, b)); //0
    geom.vertices.push(new THREE.Vector3(a, a, b)); //1
    geom.vertices.push(new THREE.Vector3(a, -a, b)); //2
    geom.vertices.push(new THREE.Vector3(-a, -a, b)); //3

    geom.faces.push(new THREE.Face3(1, 3, 2)); //02
    geom.faces.push(new THREE.Face3(0, 3, 1)); //1


    //plan2
    geom.vertices.push(new THREE.Vector3(-a, a, b)); //4
    geom.vertices.push(new THREE.Vector3(a, a, b)); //5
    geom.vertices.push(new THREE.Vector3(a, 0, -2 * b)); //6
    geom.vertices.push(new THREE.Vector3(-a, 0, -2 * b)); //7

    geom.faces.push(new THREE.Face3(4, 5, 6)); //2
    geom.faces.push(new THREE.Face3(4, 6, 7)); //3

    //plan3
    geom.vertices.push(new THREE.Vector3(-a, -a, b)); //8
    geom.vertices.push(new THREE.Vector3(a, -a, b)); //9
    geom.vertices.push(new THREE.Vector3(a, 0, -2 * b)); //10
    geom.vertices.push(new THREE.Vector3(-a, 0, -2 * b)); //11

    geom.faces.push(new THREE.Face3(10, 9, 11)); //4
    geom.faces.push(new THREE.Face3(11, 9, 8)); //5

    //les côté (seleument le centre)
    geom.vertices.push(new THREE.Vector3(-a, 0, 0)); //12
    geom.vertices.push(new THREE.Vector3(a, 0, 0)); //13

    geom.faces.push(new THREE.Face3(0, 12, 3)); //6
    geom.faces.push(new THREE.Face3(7, 12, 4)); //7
    geom.faces.push(new THREE.Face3(8, 12, 11)); //8

    geom.faces.push(new THREE.Face3(2, 13, 1)); //9
    geom.faces.push(new THREE.Face3(5, 13, 6)); //10
    geom.faces.push(new THREE.Face3(10, 13, 9)); //11

    geom.faces[0].vertexColors.push(new THREE.Color(colors[1]));
    geom.faces[0].vertexColors.push(new THREE.Color(colors[3]));
    geom.faces[0].vertexColors.push(new THREE.Color(colors[2]));

    geom.faces[1].vertexColors.push(new THREE.Color(colors[0]));
    geom.faces[1].vertexColors.push(new THREE.Color(colors[3]));
    geom.faces[1].vertexColors.push(new THREE.Color(colors[1]));

    geom.faces[2].vertexColors.push(new THREE.Color(colors[7])); //4
    geom.faces[2].vertexColors.push(new THREE.Color(colors[6])); //3
    geom.faces[2].vertexColors.push(new THREE.Color(colors[5])); //2

    geom.faces[3].vertexColors.push(new THREE.Color(colors[7]));
    geom.faces[3].vertexColors.push(new THREE.Color(colors[5]));
    geom.faces[3].vertexColors.push(new THREE.Color(colors[4]));

    geom.faces[4].vertexColors.push(new THREE.Color(colors[10]));
    geom.faces[4].vertexColors.push(new THREE.Color(colors[9]));
    geom.faces[4].vertexColors.push(new THREE.Color(colors[11]));

    geom.faces[5].vertexColors.push(new THREE.Color(colors[11]));
    geom.faces[5].vertexColors.push(new THREE.Color(colors[9]));
    geom.faces[5].vertexColors.push(new THREE.Color(colors[8]));

    geom.faces[6].vertexColors.push(new THREE.Color(colors[0]));
    geom.faces[6].vertexColors.push(new THREE.Color(0x000000));
    geom.faces[6].vertexColors.push(new THREE.Color(colors[3]));

    geom.faces[7].vertexColors.push(new THREE.Color(colors[4]));
    geom.faces[7].vertexColors.push(new THREE.Color(0x000000));
    geom.faces[7].vertexColors.push(new THREE.Color(colors[7]));

    geom.faces[8].vertexColors.push(new THREE.Color(colors[4]));
    geom.faces[8].vertexColors.push(new THREE.Color(0x000000));
    geom.faces[8].vertexColors.push(new THREE.Color(colors[7]));

    geom.faces[9].vertexColors.push(new THREE.Color(colors[2]));
    geom.faces[9].vertexColors.push(new THREE.Color(0x000000));
    geom.faces[9].vertexColors.push(new THREE.Color(colors[1]));

    geom.faces[10].vertexColors.push(new THREE.Color(colors[6]));
    geom.faces[10].vertexColors.push(new THREE.Color(0x000000));
    geom.faces[10].vertexColors.push(new THREE.Color(colors[5]));

    geom.faces[11].vertexColors.push(new THREE.Color(colors[6]));
    geom.faces[11].vertexColors.push(new THREE.Color(0x000000));
    geom.faces[11].vertexColors.push(new THREE.Color(colors[5]));

    geom.computeFaceNormals();

    return geom;
  },

  cube: function (size, colors, obj, id) {

    this.object = new THREE.Object3D();
    this.Mesh = new THREE.Mesh(new obj.cube_face_color(size, colors, obj), new THREE.MeshPhongMaterial({
      vertexColors: THREE.VertexColors
    }));
    this.object.add(this.Mesh);
    var ob = this;
    this.rX = 0;
    this.rY = 0;
    this.id = id;
    this.oldRx = 0;
    this.oldRy = 0;

    this.tweenA = new TWEEN.Tween(this.Mesh.rotation)
      .to({
        x: "+1.5707963267948966"
      }, Math.random() * 10000).
    onUpdate(function () {


    })
      .easing(TWEEN.Easing.Quadratic.Out).onComplete(function () {
        obj.change_face_color(ob.id);
        ob.Mesh.rotation.x = 0;
        obj.busy--;
      });
    this.tweenB = new TWEEN.Tween(this.Mesh.rotation)
      .to({
        y: "+1.5707963267948966"
      }, Math.random() * 10000).
    onUpdate(function () {


    })
      .easing(TWEEN.Easing.Quadratic.Out).onComplete(function () {
        obj.change_face_color(ob.id);
        ob.Mesh.rotation.y = 0;
        obj.busy--;
      });

    return this;
  },

  animate: function (sens) {
    this.busy = this.pyr.length;
    this.colored = false;

    var c;
    if (sens === 0) {
      this.etape--;

    }
    if (sens === 1) {
      this.etape++;

    }

    for (c = 0; c < this.pyr.length; c++) {
      // console.log(this.pyr[c].rX);
      if (sens === 0) {

        this.angle += 1.5707963267948966;
        this.pyr[c].tweenA.to({
          x: "-1.5707963267948966"
        }, Math.random() * 1000 + 500);
        this.pyr[c].tweenA.start();
      }
      if (sens === 1) {
        this.angle -= 1.5707963267948966;

        this.pyr[c].tweenA.to({
          x: "+1.5707963267948966"
        }, Math.random() * 1000 + 500);
        this.pyr[c].tweenA.start();
      }


      if (sens === 2) {


        this.pyr[c].tweenB.to({
          y: "-1.5707963267948966"
        }, Math.random() * 1000 + 500);
        this.pyr[c].tweenB.start();
      }
      if (sens === 3) {

        this.pyr[c].tweenB.to({
          y: "+1.5707963267948966"
        }, Math.random() * 1000 + 500);
        this.pyr[c].tweenB.start();
      }
    }

  },
  elastic: function (id) {
    var obj = this;
    this.busy = this.pyr.length;
    var rot = {
      x: obj.pyr[id].object.rotation.x
    };
    var ob = this.pyr[id];

    this.pyr[id].elastic = new TWEEN.Tween(rot)
      .to({
        x: 0
      }, 800)
      .easing(TWEEN.Easing.Bounce.Out)
      .onUpdate(function () {

        ob.object.rotation.x = this.x;
      })
      .onComplete(function () {
        obj.busy--;
      });
    this.pyr[id].elastic.start();
  },

  create_wall: function (size) {
    this.taille = this.size_away();
    this.size = size;
    var tab = [],
      count = 0,
      colors = [],
      diag = Math.sqrt((this.taille.width / size + 1) * (this.taille.width / size + 1) + (this.taille.height / size + 1) * (this.taille.height / size + 1)),
      c,
      d, e = 0;
    //  console.log(this.taille.width);
    // console.log('size', size);
    for (c = 0; c < Math.floor(this.taille.width / size) + 2; c++) {
      for (d = 0; d < Math.floor(this.taille.height / size) + 1; d++) {
        //hd : 1
        this.colors[0] = this.gradient(this.color1, this.color2, Math.sqrt(c * c + d * d), diag);
        //bd
        this.colors[1] = this.gradient(this.color1, this.color2, Math.sqrt((c) * (c) + (d) * (d)), diag);
        //hd
        this.colors[2] = this.gradient(this.color1, this.color2, Math.sqrt((c) * (c) + (d) * (d + 1)), diag);
        //hg
        this.colors[3] = this.gradient(this.color1, this.color2, Math.sqrt((c) * (c) + (d + 1) * (d + 1)), diag);

        this.colors[4] = this.gradient(this.color3, this.color4, Math.sqrt(c * c + d * d), diag);
        this.colors[5] = this.gradient(this.color3, this.color4, Math.sqrt((c + 1) * (c + 1) + (d) * (d)), diag);
        this.colors[6] = this.gradient(this.color3, this.color4, Math.sqrt((c + 1) * (c + 1) + (d + 1) * (d + 1)), diag);
        this.colors[7] = this.gradient(this.color3, this.color4, Math.sqrt((c) * (c) + (d + 1) * (d + 1)), diag);

        this.colors[8] = this.gradient(this.color5, this.color6, Math.sqrt(c * c + d * d), diag);
        this.colors[9] = this.gradient(this.color5, this.color6, Math.sqrt((c) * (c) + (d + 1) * (d + 1)), diag);
        this.colors[10] = this.gradient(this.color5, this.color6, Math.sqrt((c + 1) * (c + 1) + (d + 1) * (d + 1)), diag);
        this.colors[11] = this.gradient(this.color5, this.color6, Math.sqrt((c + 1) * (c + 1) + (d) * (d)), diag);

        tab.push(new this.cube(size, this.colors, this, count));
        tab[count].object.position.x = (c - (this.taille.width / 2) / size) * size;
        tab[count].object.position.y = (d - (this.taille.height / 2) / size) * (size - 0.1);

        this.scene.add(tab[count].object);
        this.raycast.push(tab[count].Mesh);
        count++;
      }
    }

    return tab;
  },

  init: function () {
    //initialise l'XP (les éléments du DOM, etc.)
    $('#transition').show();
    $('#transition').html($('#resCol').html());
    $('body').prepend('<canvas id="renderer"></canvas>');
    $('body').css({
      'transition': 'all 0.5s linear'
    });



    this.renderer3D = new THREE.WebGLRenderer({
      canvas: $('#renderer').get(0),
      alpha: true
    });
    this.renderer3D.setClearColor(0x000000, 0);
    this.renderer3D.setSize(window.innerWidth, window.innerHeight);
    var obj = this;
    this.camera.position.z = 15;
    this.scene.add(this.camera);

    var light = new THREE.DirectionalLight(0xffffff, 0.2);
    light.position.set(0, 10, 5);
    this.scene.add(light);

    var ambient = new THREE.AmbientLight(0xF0F0F0);
    this.scene.add(ambient);

    $('#renderer').tap(function (e, d) {
      var mouse = {
        x: 0,
        y: 0
      };
      e.preventDefault();
      mouse.x = (d[0].offset.x / window.innerWidth) * 2 - 1;
      mouse.y = -(d[0].offset.y / window.innerHeight) * 2 + 1;
      var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(obj.camera);

      var raycaster = new THREE.Raycaster(obj.camera.position, vector.sub(obj.camera.position).normalize());
      var intersects = raycaster.intersectObjects(obj.raycast);


      if (intersects.length > 0) {
        //    console.log(intersects[0]);
        var f = intersects[0].face;
        var r = Math.round(255 * (f.vertexColors[0].r + f.vertexColors[1].r + f.vertexColors[2].r) / 3);
        var g = Math.round(255 * (f.vertexColors[0].g + f.vertexColors[1].g + f.vertexColors[2].g) / 3);
        var b = Math.round(255 * (f.vertexColors[0].b + f.vertexColors[1].b + f.vertexColors[2].b) / 3);
        obj.validate(r, g, b);

      }
    });

    $('#renderer').tapstart(function (e, d) {
      e.preventDefault();
    });
    $('#renderer').tapmove(function (e, d) {
      e.preventDefault();
    });

    $('#renderer').swipeleft(function (e, d) {
      e.preventDefault();
      if ((obj.busy === 0) && (obj.assombrissement < 1)) {
        obj.assombrissement++;
        obj.animate(2);

      }
    });



    $('#renderer').swiperight(function (e) {
      e.preventDefault();
      if ((obj.busy === 0) && (obj.assombrissement > -1)) {
        obj.assombrissement--;
        obj.animate(3);
      }
    });
    $('#renderer').swipedown(function (e) {
      e.preventDefault();
      this.tordu = false;
      this.tapDown = false;
      if (obj.busy === 0) {

        obj.animate(1);
      }
    });

    $('#renderer').swipeup(function (e) {
      e.preventDefault();
      this.tordu = false;
      this.tapDown = false;

      if (obj.busy === 0) {
        obj.animate(0);
      }
    });


    this.pyr = this.create_wall(4);
    var c;
    for (c in this.pyr) {
      this.change_face_color(c);
    }
    $('#transition .transition_box').append($('#clickbut').html());
  },


  update: function () {
    if (this.busy < 0) {
      this.busy = 0;
    }

    if (this.etape === 0) {
      $('body').css({
        'background': 'linear-gradient(45deg,  ' + this.color1 + ' 0%,' + this.color2 + ' 100%)'
      })
    }
    if (this.etape === 1) {
      $('body').css({
        'background': 'linear-gradient(45deg,  ' + this.color3 + ' 0%,' + this.color4 + ' 100%)'
      })
    }
    if (this.etape === 2) {
      $('body').css({
        'background': 'linear-gradient(45deg,  ' + this.color5 + ' 0%,' + this.color6 + ' 100%)'
      })
    }
    if (this.busy > 0) {
      TWEEN.update();
    } else {


    }

    this.renderer3D.render(this.scene, this.camera);
  },



  validate: function (r, g, b) {
    this.choix = 'rgb(' + r + ',' + g + ',' + b + ')';
    $('#validate').html('');
    $('#validate').css({
      'background': 'rgb(' + r + ',' + g + ',' + b + ')',
      'display': 'block'
    });
    $('#validate').append($('#valYN').html());

  },
  no: function () {
    //nothng
  },
  start: function () {
    $('#transition').html('');
    $('#transition').hide();
    this.animate(1);
  },

  destroy: function () {
    var a, b;
    this.etape = this.etape % 3;
    if (this.etape === 0) {
      a = this.color1;
      b = this.color6;
    }
    if (this.etape === 1) {
      a = this.color4;
      b = this.color2;
    }
    if (this.etape === 2) {
      a = this.color5;
      b = this.color3;
    }
    //  console.log(this.etape);
    Choix.change('couleur', this.choix, a, b);
    this.scene = null;
    this.camera = null;
    $('#renderer').remove();
    $('#validate').html('');
    $('#validate').css({
      'background': 'none'
    });
    $('#validate').hide();
    delete this;
  }
}



/****************************************************************************************

                          XP_GOUT

****************************************************************************************/


function XP_gout(renderer) {
  'use strict';
  this.pos = [];

  this.id = ['#Sweety', '#Sour', '#Salty', '#Bitter'];
  this.slides = -1;
  this.pos.push({
    x: 0,
    max: 6
  });
  this.pos.push({
    x: 0,
    max: 5
  });
  this.pos.push({
    x: 0,
    max: 5
  });
  this.pos.push({
    x: 0,
    max: 6
  });

  this.hold = null;
}

XP_gout.prototype = {
  swipe_left: function () {
    var obj = this;
    if (this.pos[this.slides].x === this.pos[this.slides].max) {

      this.pos[this.slides].x = -1;
      //  console.log(this.pos[this.slides].x);
      $(this.id[this.slides] + ' .diapo').css({
        'transition': 'none',
        'transform': 'translateX(-' + (this.pos[this.slides].x * 100) + '%)'
      });


      setTimeout(function () {
        $(obj.id[obj.slides] + ' .diapo').css('transition', 'all 0.6s ease-in-out');
        obj.pos[obj.slides].x++;
        $(obj.id[obj.slides] + ' .diapo').css({
          'transform': 'translateX(-' + (obj.pos[obj.slides].x * 100) + '%)'
        });
      }, 20);

    }
    this.pos[this.slides].x++;
    $(this.id[this.slides] + ' .diapo').css({
      'transform': 'translateX(-' + (this.pos[this.slides].x * 100) + '%)'
    });
  },
  swipe_right: function () {
    var obj = this;
    if (this.pos[this.slides].x === 0) {
      this.pos[this.slides].x = this.pos[this.slides].max + 1;
      $(this.id[this.slides] + ' .diapo').css({
        'transition': 'none',
        'transform': 'translateX(-' + (this.pos[this.slides].x * 100) + '%)'
      });

      setTimeout(function () {
        $(obj.id[obj.slides] + ' .diapo').css('transition', 'all 0.6s ease-in-out');
        obj.pos[obj.slides].x--;


        $(obj.id[obj.slides] + ' .diapo').css({
          'transform': 'translateX(-' + (obj.pos[obj.slides].x * 100) + '%)'
        });
      }, 20);

    }
    this.pos[this.slides].x--;



    $(this.id[this.slides] + ' .diapo').css({
      'transform': 'translateX(-' + (this.pos[this.slides].x * 100) + '%)'
    });

  },
  init: function (readyCallback) {
    var obj = this;

    $('#transition').show();
    $('#transition').html($('#resGout').html());
    $('body').prepend('<div id="renderer"></div>');
    $('#renderer').html($('#XP_gout').html());
    $('.diapo').hide();
    $('#renderer ul').hide();
    $('.diapo').css('width', window.innerWidth + 'px');
    var c;
    for (c = 1; c < 7; c++) {
      $('#Sweety .d' + c).css({
        'background-image': 'url(images/Sweety-0' + c + '.jpg)'
      });
      $('#Sour .d' + c).css({
        'background-image': 'url(images/Sour-0' + c + '.jpg)'
      });
      $('#Salty .d' + c).css({
        'background-image': 'url(images/Salty-0' + (c + 1) + '.jpg)'
      });
      $('#Bitter .d' + c).css({
        'background-image': 'url(images/Bitter-0' + c + '.jpg)'
      });
    }


    $('#link_sweety').taphold(function (e) {
      e.preventDefault();
      e.stopPropagation();
      obj.slides = 0;

      $('#link_sweety').addClass('actif');
      $('#link_sours').removeClass('actif');
      $('#link_salty').removeClass('actif');
      $('#link_bitter').removeClass('actif');

      $('#Sweety').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Sour').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Salty').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Bitter').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');

      obj.hold = setInterval(function () {
        obj.swipe_left()
      }, 1000);

    });

    $('#link_sweety').tapend(function () {

      clearInterval(obj.hold);
    });

    $('#link_sweety').tap(function (e) {
      e.preventDefault();
      e.stopPropagation();
      $('#link_sweety').addClass('actif');
      $('#link_sours').removeClass('actif');
      $('#link_salty').removeClass('actif');
      $('#link_bitter').removeClass('actif');

      obj.slides = 0;

      $('#Sweety').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Sour').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Salty').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Bitter').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');

    })

    $('#link_sours').taphold(function (e) {
      e.preventDefault();
      e.stopPropagation();
      obj.slides = 1;

      $('#link_sweety').removeClass('actif');
      $('#link_sours').addClass('actif');
      $('#link_salty').removeClass('actif');
      $('#link_bitter').removeClass('actif');

      $('#Sweety').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Sour').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Salty').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Bitter').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');

      obj.hold = setInterval(function () {
        obj.swipe_left()
      }, 1000);

    });

    $('#link_sours').tapend(function () {

      clearInterval(obj.hold);
    });



    $('#link_sours').tap(function (e) {
      e.preventDefault();
      e.stopPropagation();
      $('#link_sweety').removeClass('actif');
      $('#link_sours').addClass('actif');
      $('#link_salty').removeClass('actif');
      $('#link_bitter').removeClass('actif');

      obj.slides = 1;

      $('#Sweety').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Sour').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Salty').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Bitter').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');

    })

    $('#link_salty').taphold(function (e) {
      e.preventDefault();
      e.stopPropagation();
      obj.slides = 2;

      $('#link_sweety').removeClass('actif');
      $('#link_sours').removeClass('actif');
      $('#link_salty').addClass('actif');
      $('#link_bitter').removeClass('actif');

      $('#Sweety').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Sour').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Salty').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Bitter').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');

      obj.hold = setInterval(function () {
        obj.swipe_left()
      }, 1000);

    });

    $('#link_salty').tapend(function () {

      clearInterval(obj.hold);
    });



    $('#link_salty').tap(function (e) {
      e.preventDefault();
      e.stopPropagation();
      $('#link_sweety').removeClass('actif');
      $('#link_sours').removeClass('actif');
      $('#link_salty').addClass('actif');
      $('#link_bitter').removeClass('actif');

      obj.slides = 2;

      $('#Sweety').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Sour').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Salty').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Bitter').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');

    })

    $('#link_bitter').taphold(function (e) {
      e.preventDefault();
      e.stopPropagation();
      obj.slides = 3;

      $('#link_sweety').removeClass('actif');
      $('#link_sours').removeClass('actif');
      $('#link_salty').removeClass('actif');
      $('#link_bitter').addClass('actif');

      $('#Sweety').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Sour').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Salty').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Bitter').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');

      obj.hold = setInterval(function () {
        obj.swipe_left()
      }, 1000);

    });

    $('#link_bitter').tapend(function () {

      clearInterval(obj.hold);
    });

    $('#link_bitter').tap(function (e) {
      e.preventDefault();
      e.stopPropagation();
      $('#link_sweety').removeClass('actif');
      $('#link_sours').removeClass('actif');
      $('#link_salty').removeClass('actif');
      $('#link_bitter').addClass('actif');

      obj.slides = 3;

      $('#Sweety').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Sour').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Salty').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Bitter').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');

    })
    $('#renderer').tapmove(function (e) {
      e.preventDefault();
    })

    $('#renderer').tap(function () {
      obj.validate();
    })

    $('#renderer').swipeleft(function (e, d) {
      e.preventDefault();

      obj.swipe_left();

    })

    $('#renderer').swiperight(function (e, d) {
      obj.swipe_right();
    })


    $('#renderer').swipeup(function (e, d) {
      var name = [
        '#link_sweety', '#link_sours', '#link_salty', '#link_bitter'
      ];
      obj.slides++;

      if (obj.slides > 3) {
        obj.slides = 0;
      }


      $('#link_sweety').removeClass('actif');
      $('#link_sours').removeClass('actif');
      $('#link_salty').removeClass('actif');
      $('#link_bitter').removeClass('actif');

      $(name[obj.slides]).addClass('actif');

      $('#Sweety').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Sour').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Salty').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Bitter').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');

    })

    $('#renderer').swipedown(function (e, d) {
      var name = [
        '#link_sweety', '#link_sours', '#link_salty', '#link_bitter'
      ];
      obj.slides--;

      if (obj.slides < 0) {
        obj.slides = 3;
      }


      $('#link_sweety').removeClass('actif');
      $('#link_sours').removeClass('actif');
      $('#link_salty').removeClass('actif');
      $('#link_bitter').removeClass('actif');

      $(name[obj.slides]).addClass('actif');

      $('#Sweety').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Sour').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Salty').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Bitter').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');

    })

    $('#transition .transition_box').append($('#clickbut').html());
  },
  start: function () {
    var obj = this;
    $('#transition').hide();
    $('.diapo').show();
    $('#renderer ul').show();

    var name = [
      '#link_sweety', '#link_sours', '#link_salty', '#link_bitter'
    ];
    this.slides++;

    if (this.slides > 3) {
      this.slides = 0;
    }


    $('#link_sweety').removeClass('actif');
    $('#link_sours').removeClass('actif');
    $('#link_salty').removeClass('actif');
    $('#link_bitter').removeClass('actif');

    $(name[this.slides]).addClass('actif');

    $('#Sweety').css('transform', 'translateY(' + (-(1 + this.slides) * 100) + '%)');
    $('#Sour').css('transform', 'translateY(' + (-(1 + this.slides) * 100) + '%)');
    $('#Salty').css('transform', 'translateY(' + (-(1 + this.slides) * 100) + '%)');
    $('#Bitter').css('transform', 'translateY(' + (-(1 + this.slides) * 100) + '%)');

    this.inter = setInterval(function () {
      obj.slides++;
      console.log('inter');
      if (obj.slides > 3) {
        obj.slides = 0;
        $('#link_sweety').removeClass('actif');
        $('#link_sours').removeClass('actif');
        $('#link_salty').removeClass('actif');
        $('#link_bitter').removeClass('actif');

        $(name[obj.slides]).addClass('actif');

        $('#Sweety').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
        $('#Sour').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
        $('#Salty').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
        $('#Bitter').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
        clearInterval(obj.inter);
        return false;
      }
      $('#link_sweety').removeClass('actif');
      $('#link_sours').removeClass('actif');
      $('#link_salty').removeClass('actif');
      $('#link_bitter').removeClass('actif');

      $(name[obj.slides]).addClass('actif');

      $('#Sweety').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Sour').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Salty').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
      $('#Bitter').css('transform', 'translateY(' + (-(1 + obj.slides) * 100) + '%)');
    }, 1000);

  },
  update: function () {

  },


  validate: function () {
    $('#validate').html('');
    $('#validate').show();

    $('#validate').append($('#valYN').html());

  },
  no: function () {
    //nothing
  },
  destroy: function () {
    Choix.change('gout', this.slides);
    $('#renderer').remove();
    $('#validate').html('');
    $('#validate').css({
      'background': 'none'
    });
    $('#validate').hide();
    delete this;
  }
}


/****************************************************************************************

                          XP_GENRE

****************************************************************************************/


function XP_sexe(renderer) {
  'use strict';

  this.ctx = null;
  this.bufferCanvas = null;
  this.loc = [];
  this.gender = '';
  this.x = 0;
  this.y = 0;
  this.auto = false;
  this.time = 0;
}

XP_sexe.prototype = {
  change: function () {
    var centerX = this.ctx.canvas.width * 0.42;
    var centerY = this.ctx.canvas.height * 0.45;
    var radius = this.ctx.canvas.width * .39;
    var epaiss = this.ctx.canvas.width * 0.05;
    this.time = 0;
    this.bufferCanvas.strokeStyle = "#fdd3ab";
    this.bufferCanvas.lineWidth = epaiss + 3;
    if (this.gender == 'Woman') {
      this.bufferCanvas.moveTo(this.bufferCanvas.canvas.width * 0.697, this.bufferCanvas.canvas.height * .215);
      this.bufferCanvas.lineTo(this.bufferCanvas.canvas.width, 0);
      this.bufferCanvas.stroke();

      this.bufferCanvas.moveTo(this.bufferCanvas.canvas.width * 0.7, epaiss / 2);
      this.bufferCanvas.lineTo(this.bufferCanvas.canvas.width, epaiss / 2);
      this.bufferCanvas.stroke();

      this.bufferCanvas.moveTo(this.bufferCanvas.canvas.width - epaiss / 2, 0);
      this.bufferCanvas.lineTo(this.bufferCanvas.canvas.width - epaiss / 2, this.bufferCanvas.canvas.height * .21);
      this.bufferCanvas.closePath();
      this.bufferCanvas.stroke();

    } else {
      $('body').css({
        'background': 'url(images/genre_mask3.png) repeat-x',
        'background-size': 'auto 100%'
      })
      this.bufferCanvas.moveTo(centerX, centerY + radius + radius * 0.08);
      this.bufferCanvas.lineTo(centerX, this.bufferCanvas.canvas.height);
      this.bufferCanvas.stroke();

      this.bufferCanvas.moveTo(centerX + this.bufferCanvas.canvas.width * 0.16, this.bufferCanvas.canvas.height - (this.bufferCanvas.canvas.height - (centerY + radius)) / 2);
      this.bufferCanvas.lineTo(centerX - this.bufferCanvas.canvas.width * 0.16, this.bufferCanvas.canvas.height - (this.bufferCanvas.canvas.height - (centerY + radius)) / 2);
      this.bufferCanvas.stroke();

    }


  },

  autoDraw: function () {

    var centerX = this.ctx.canvas.width * 0.42;
    var centerY = this.ctx.canvas.height * 0.45;
    var radius = this.ctx.canvas.width * .39;
    var epaiss = this.ctx.canvas.width * 0.05;
    if (this.time < 100) { //le cercle
      this.bufferCanvas.beginPath();
      this.bufferCanvas.arc(centerX, centerY, radius, 0, 2.1 * Math.PI * (this.time / 100), false);
      //this.bufferCanvas.fillStyle = 'green';
      //this.bufferCanvas.fill();
      this.bufferCanvas.lineWidth = epaiss;
      this.bufferCanvas.strokeStyle = '#FFFFFF';
      this.bufferCanvas.stroke();
    }
    if (this.gender == 'Man') {
      if ((this.time > 100) && (this.time < 120)) {


        this.bufferCanvas.moveTo(this.bufferCanvas.canvas.width * 0.67, this.bufferCanvas.canvas.height * .23);
        this.bufferCanvas.lineTo(this.bufferCanvas.canvas.width * 0.67 + (this.bufferCanvas.canvas.width - this.bufferCanvas.canvas.width * 0.67) * ((this.time - 100) / 18),
          this.bufferCanvas.canvas.height * .23 - this.bufferCanvas.canvas.height * .23 * ((this.time - 100) / 18));
        this.bufferCanvas.stroke();
      }
      if ((this.time > 120) && (this.time < 130)) {


        this.bufferCanvas.moveTo(this.bufferCanvas.canvas.width * 0.7, epaiss / 2);
        this.bufferCanvas.lineTo(this.bufferCanvas.canvas.width * 0.7 + (this.bufferCanvas.canvas.width - this.bufferCanvas.canvas.width * 0.7) * ((this.time - 120) / 8), epaiss / 2);
        this.bufferCanvas.stroke();
      }

      if ((this.time > 130) && (this.time < 140)) {


        this.bufferCanvas.moveTo(this.bufferCanvas.canvas.width - epaiss / 2, 0);
        this.bufferCanvas.lineTo(this.bufferCanvas.canvas.width - epaiss / 2, this.bufferCanvas.canvas.height * .21 * ((this.time - 130) / 8));
        this.bufferCanvas.closePath();
        this.bufferCanvas.stroke();
      }
    }

    if (this.gender == 'Woman') {
      if ((this.time > 100) && (this.time < 120)) {


        this.bufferCanvas.moveTo(centerX, centerY + radius);
        this.bufferCanvas.lineTo(centerX, centerY + radius + (this.bufferCanvas.canvas.height - centerY + radius) * ((this.time - 100) / 18));
        this.bufferCanvas.stroke();
      }
      if ((this.time > 120) && (this.time < 140)) {


        this.bufferCanvas.moveTo(centerX - this.bufferCanvas.canvas.width * 0.16, this.bufferCanvas.canvas.height - (this.bufferCanvas.canvas.height - (centerY + radius)) / 2);
        this.bufferCanvas.lineTo(centerX - this.bufferCanvas.canvas.width * 0.16 + (2 * this.bufferCanvas.canvas.width * 0.16) * ((this.time - 120) / 18), this.bufferCanvas.canvas.height - (this.bufferCanvas.canvas.height - (centerY + radius)) / 2);
        this.bufferCanvas.stroke();
      }


    }
    this.bufferCanvas.closePath();
    this.draw_genre();
  },
  draw_genre: function () {
    var centerX = this.ctx.canvas.width * 0.42;
    var centerY = this.ctx.canvas.height * 0.45;
    var radius = this.ctx.canvas.width * .39;
    var epaiss = this.ctx.canvas.width * 0.05;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    //this.ctx.fillStyle = 'green';
    //this.ctx.fill();
    this.ctx.lineWidth = epaiss;
    this.ctx.strokeStyle = this.ctx.createPattern(this.bufferCanvas.canvas, "repeat");;
    this.ctx.stroke();


    //femme
    this.ctx.moveTo(centerX, centerY + radius);
    this.ctx.lineTo(centerX, this.ctx.canvas.height);
    this.ctx.stroke();

    this.ctx.moveTo(centerX + this.ctx.canvas.width * 0.16, this.ctx.canvas.height - (this.ctx.canvas.height - (centerY + radius)) / 2);
    this.ctx.lineTo(centerX - this.ctx.canvas.width * 0.16, this.ctx.canvas.height - (this.ctx.canvas.height - (centerY + radius)) / 2);
    this.ctx.stroke();

    //homme
    this.ctx.moveTo(this.ctx.canvas.width * 0.67, this.ctx.canvas.height * .23);
    this.ctx.lineTo(this.ctx.canvas.width, 0);
    this.ctx.stroke();

    this.ctx.moveTo(this.ctx.canvas.width * 0.7, epaiss / 2);
    this.ctx.lineTo(this.ctx.canvas.width, epaiss / 2);
    this.ctx.stroke();

    this.ctx.moveTo(this.ctx.canvas.width - epaiss / 2, 0);
    this.ctx.lineTo(this.ctx.canvas.width - epaiss / 2, this.ctx.canvas.height * .21);
    this.ctx.closePath();
    this.ctx.stroke();


  },

  init: function (readyCallback) {
    var obj = this;

    $('#transition').show();
    $('#transition').html($('#resSexe').html());
    $('body').prepend('<div id="renderer"></div>');
    $('#renderer').html($('#Sexe').html());

    $('body').css({
      'background': 'url(images/genre_mask.png) repeat-x',
      'background-size': 'auto 100%'
    })

    this.ctx = $('#drawing').get(0).getContext('2d');
    this.bufferCanvas = $('#buffer').get(0).getContext('2d');
    var prop = 1.3428;

    if (window.innerWidth > window.innerHeight) {
      this.ctx.canvas.height = window.innerHeight * 80 / 100;
      this.ctx.canvas.width = this.ctx.canvas.height / prop;
      $('#drawing').css({
        'width': this.ctx.canvas.width + 'px',
        'height': this.ctx.canvas.height + 'px',
        'top': '10%',
        'left': ((window.innerWidth - this.ctx.canvas.width) / 2 - (this.ctx.canvas.width * 0.42 - this.ctx.canvas.width / 2)) + 'px',
      });
    } else {
      this.ctx.canvas.width = window.innerWidth * 80 / 100;
      this.ctx.canvas.height = this.ctx.canvas.width * prop;
      $('#drawing').css({
        'width': this.ctx.canvas.width + 'px',
        'height': this.ctx.canvas.height + 'px',
        'top': (window.innerHeight - this.ctx.canvas.height) / 2 + 'px',
        'left': ((window.innerWidth - this.ctx.canvas.width) / 2 - (this.ctx.canvas.width * 0.42 - this.ctx.canvas.width / 2)) + 'px',
      });
    }






    this.bufferCanvas.canvas.width = this.ctx.canvas.width;
    this.bufferCanvas.canvas.height = this.ctx.canvas.height;

    this.bufferCanvas.fillStyle = "#fdd3ab";
    this.bufferCanvas.fillRect(0, 0, window.innerWidth, window.innerHeight);

    this.draw_genre();

    $('#drawing').tapstart(function (e, d) {
      e.preventDefault();

      obj.down = true;
      obj.x = d.offset.x;
      obj.y = d.offset.y;
      obj.bufferCanvas.beginPath();
      obj.bufferCanvas.arc(d.offset.x, d.offset.y, 25, 0, 2 * Math.PI, false);
      obj.bufferCanvas.fillStyle = 'white';
      obj.bufferCanvas.fill();
      obj.bufferCanvas.closePath();
      obj.draw_genre();
    });
    $('#drawing').tapend(function (e, d) {
      e.preventDefault();

      obj.down = false;
    });
    $('#drawing').tap(function () {
      obj.validate();
    })

    $('#drawing').tapmove(function (e, d) {

      e.preventDefault();
      if (obj.down) {
        //   console.log(d.offset.x);
        obj.x = d.offset.x;
        obj.y = d.offset.y;
        obj.loc.push(d.offset.y);
        obj.bufferCanvas.beginPath();
        obj.bufferCanvas.arc(d.offset.x, d.offset.y, 25, 0, 2 * Math.PI, false);
        obj.bufferCanvas.fillStyle = 'white';
        obj.bufferCanvas.fill();
        obj.bufferCanvas.closePath();
        obj.draw_genre();
      }
    });

    $('#gender').tap(function () {
      obj.validate();
    })

    $('#transition .transition_box').append($('#clickbut').html());
  },
  start: function () {
    $('#transition').hide();
    $('.diapo').show();
    $('#renderer ul').show();
  },
  update: function () {

    $('#gender').html(this.gender);


    if ((this.x > 3 * this.ctx.canvas.width / 4) && (this.x < this.ctx.canvas.width) && (this.y < this.ctx.canvas.height / 4) && (this.y > 0) && (this.down)) {
      if (this.gender != 'Man') {
        this.gender = 'Man';
        $('body').css({
          'background': 'url(images/genre_mask3.png) repeat-x',
          'background-size': 'auto 100%'
        })
        this.change();
      }

      this.time++;
      // this.autoDraw();
    }

    if ((this.x > 1 * this.ctx.canvas.width / 4) && (this.x < 2 * this.ctx.canvas.width / 4) && (this.y > 3 * this.ctx.canvas.height / 4) && (this.y < this.ctx.canvas.height) && (this.down)) {
      if (this.gender != 'Woman') {
        this.gender = 'Woman';
        $('body').css({
          'background': 'url(images/genre_mask2.png) repeat-x',
          'background-size': 'auto 100%'
        })
        this.change();
      }

      this.time++;
      //this.autoDraw();
    }

  },



  validate: function () {


    $('#validate').html('');
    $('#validate').show();

    $('#validate').append($('#valYN').html());
    $('#nb').html('');

  },
  no: function () {
    // this.bufferCanvas.fillStyle = "#fdd3ab";
    // this.bufferCanvas.fillRect(0, 0, window.innerWidth, window.innerHeight);
    this.loc = [];
  },
  destroy: function () {
    Choix.change('genre', this.gender);
    $('#renderer').remove();
    $('#validate').html('');
    $('#validate').css({
      'background': 'none'
    });
    $('#validate').hide();
    delete this;
  }
}


function a() {
  console.log("%c" + String.fromCharCode(32, 32, 32, 32, 169, 32, 66, 101, 110, 106, 97, 109, 105, 110, 32, 68, 117, 109, 111, 110, 116, 32, 32, 98, 110, 106, 109, 103, 114, 97, 112, 104, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109, 32), 'padding-bottom:25px; width:50%; font-size:25px; background: white; color: black;background-repeat:no-repeat;background-image: url("data:image/jpg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QMvaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpBMTU3OUU2QzEwM0YxMUU1OTU2Qzg4REQ2MkVCMjY1OCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpBMTU3OUU2RDEwM0YxMUU1OTU2Qzg4REQ2MkVCMjY1OCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkExNTc5RTZBMTAzRjExRTU5NTZDODhERDYyRUIyNjU4IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkExNTc5RTZCMTAzRjExRTU5NTZDODhERDYyRUIyNjU4Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+/+4ADkFkb2JlAGTAAAAAAf/bAIQABgQEBAUEBgUFBgkGBQYJCwgGBggLDAoKCwoKDBAMDAwMDAwQDA4PEA8ODBMTFBQTExwbGxscHx8fHx8fHx8fHwEHBwcNDA0YEBAYGhURFRofHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8f/8AAEQgAMgAyAwERAAIRAQMRAf/EAI4AAAMBAAMBAAAAAAAAAAAAAAAGBwUCAwgEAQADAQEBAQAAAAAAAAAAAAAABAUDAgEGEAACAgEDAwMCBAUFAAAAAAABAgMEBQARBiESBzEiE0EUUXEjFWGBkaEyQlIkFggRAAIBAgQDBgcBAQAAAAAAAAECABEDITESBEETBfBRYZGxInGBodHh8TJCov/aAAwDAQACEQMRAD8A9U6IRP5l5R49xa7Fjp0nvZOVfk+ypp8kip/ufqAN9jt9dObfYvdGoUC95it/dpbNDifCYGf884THpEaWMtXXb2y9/bAkcuwZoWZu7d039wUED8dMWulM2ZA+swu9RVcgTOvjv/oDj+QuJVylKbFfIe1LDMs0Pd9AzKAy7+g9uvb3SXUVU6p5a6mjGjDTGTj3ljg+fyhxdC8RdJKxRTRvF8hX1CFwAT09PXS17YXba6iMIxa3tt20g4xv0nGoaIRG8n+Sl4fWrV6ldbmZvk/a12J7FVSAXft9x9xCqo9Tp7ZbLnEkmiiJ7vdcoUGLGR392tWeRWb2erJXyORdIpshVlL/AA2IdmjglhDP2qxjCMAd/wA9iNWeWAgCGoHA8R31krWS5LChPEekTHuXZa1evZduyNfkjhbboXJ7n/NmB66bUqSaRVgwArOlxujbAnZdyB6gEhd/6ka6LgEA8ZyEJBI4RiyUs0sdFYJlnzUNhbMDxFe6vBHGpPyyLsq/qjv2J9oB32321igpWv8ANKfGbua0p/XpPTvHuTYPPVDNishBfEWyztXcMFbb6j1G/wBNfLXbL2z7gRPord1XGBrNXWU0kL88wX8dy/BchWP5aqIsad2/Z80Epl+Mkf496np+Wr3SiGtsnH7yN1IFbivwiTWbFRCxl8atu9BSdbL1BUdTE6ktB95aDNF2ROe72Dd9vpp1tRorUFfHzoO1IopUAstTTw9TPhscQ5F8uUtWKP209CsMhlxKVQqkpZu9VG4JkKs3aNdLetilD/RoJy1q4a1/yKzSq+Ncg2VwMF2eOH98py3q0qqzmJII/mCOCVBY7j09NZvu0ozAVKGnnNF2zVAJoHFYYSjxl+C38y9iymTjsVa9tZI1eqpkkMiABf1HVgo7v4/QjXtxn5oWg00PxnNtU5Raprh8I0+GEsWuftbxzPLRq0DDlbpQxLNKzAxArsOo+m/Xpv8AXSvUaCzRsy2AjWwqbtRlTGX3Xz8tSL+b+VZO5la/B8Wit9wiTXiwXdixLIgZ+kaqELu/4fz1b6ZYVVN1vlJHULxLC2vzi7gq+VHj7KUcDlIGyeLae5agrOXS3Ssx9kwdJFTuZFX9N9iPw9dMXSvOBcHS1BjwI7YzG0rcohTiK/MGPfM2oScc5LFWT/k2sbLUkYdSVppGIv729IbeutK5Bq+f6jt4jS1M6en7haqpY5DhRUtR2lxFq5jTHH0+378UO2Fy3Tu7o+7p066FaiNUU1AH4+7ODJVlpwJH/MllfEvhuKZLjueZqeQv261mFK6pbKx1VAdn7HVAO5u0e7cncAaqm5ruB0xABHdnJgt6EKNgSR45Rz8K8jv4rkL8NtSx2aFmE3MXYiGyncCTuUkBu2RDvs3VWBGkupWQ6c0YEYGN7C6VblnLMS36hyxJB5b4Jn5eRQcqwVP9yDQfa5LHqdpGTZk3XqNwySEHbqOh66sbDdIENtzpxqDJW92zF9aiveJPKb5DAWbBt03q2Wo2K6ULcxSf4LTD5rE8ij9KNAu0fTct6DVFqXAKGoqMRlUZAd/jE0JStRTD548Zx5HyXP2E/dYLrwQ3pJa1urGE7Y5THC5WN1HvilijjdW6Hp117ZsoPaRlj6/UYzm9dY+4HP8AH4mXjVe1Dfyd6SS5KZ4o1jlkk+J7E4djPZCEF+1IiFX/AFMdvTWr4EKMMPoOAmSY1Zsfv4zQpUbWbno4/HQ1Xu2IXSvT+NqtexHE7S+3rvDPC/d6n3eu+s2YICWrQccyPuDNQpcgLSvr+ZVfGPjLN4vOSck5GYY7yw/b0aNY7xwxkBT1HT/FdlA3+p33OpO93qsmhMuJPGUdptGVtb58BKnqVKUNEJGPL/Cc+ORf9nxFI5SrbrCpk6SAs4CejAKQ2xG3uXqpGrXT9ymjlsdJBqDJO+27a9aitRQiJOK4bzHldunj4MRJisRXdmklnWRUQuR8srvLs80pVQqgDYDYdBp65uLdoFi2pu3kImli5dIFNK9vOamb8Uc745kbIwdYZnEWgEKERv3xhu5UsQuU3KMN1dT/AE1lb39q4o1nSw7YGaXNldtk6fcp7Yxq8XeNuR18/HybkqR1HqwmHG46Lt9gYbblU3VFVWOw3J3JJOlN9vEKaExrmY1s9o4bW+FMhK/qPKkNEIaIQ0QgNEIaIQ0QhohDRCf/2Q==");');
}
/****************************************************************************************

                          XP_TEXTURE

****************************************************************************************/


var XP_texture = function (renderer, readyCallback) {
  this.loadCount = 0;
  this.ready = readyCallback;
  this.renderer = $(renderer);
  this.first = false;
  this.scene = new THREE.Scene();
  this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  this.camera.position.z = 15;
  this.renderer3D = null;
  this.mouse = {
    x: 0,
    y: 0
  };
  this.down = false;
  this.angleRadar = 0;
  this.oldAngle = 0;
  this.oldId = 0;
  this.choix = -1;
  this.nbText = 9;
  this.downRadar = false;
  this.ambient = null;
  this.light = null;
  //this.oldid = 0;
  this.radarShape = new THREE.Shape();
  this.radarShapeCache = new THREE.Shape();
  this.radarArc = null;
  this.radarArcCache = null;
  this.auto = false;

  /*****************
      Jean 

      */
  this.manager = new THREE.LoadingManager();
  this.plotpos = new THREE.Vector2(0, 0);
  this.rot = new THREE.Vector2(0, 0);
  this.jean = null;
  this.jeanTexD = null;
  this.jeanTexN = null;
  this.normVertShader = document.getElementById('vertexShaderJean');
  this.normVertShaderDef = document.getElementById('vertexShaderJeanDeform');
  this.normFragShader = document.getElementById('fragmentShaderJean');
  this.jeanShader = THREE.JeanShader;


  /***************

    Crystal

    */
  this.crystal = new THREE.Object3D();;
  var urls = [
    'images/cube/diamond1.png',
    'images/cube/diamond2.png',
    'images/cube/diamond3.png',
    'images/cube/diamond4.png',
    'images/cube/diamond1.png',
    'images/cube/diamond2.png'
  ];

  this.crystal_envmap1 = THREE.ImageUtils.loadTextureCube(urls, undefined, this.loaded());
  this.crystal_envmap1.format = THREE.RGBFormat;
  this.crystal_envmap1.maping = THREE.CubeRefractionMapping;
  this.crystalMat = null;
  this.CrystalRotX = 0;
  this.CrystalRotY = 0;
  this.downX = 0;
  this.downY = 0;




  /***********
      sphere elec

  */
  this.electPoint = THREE.ImageUtils.loadTexture("images/elect_point.png", undefined, this.loaded());
  this.fibrepoint = new THREE.PointCloud(new THREE.SphereGeometry(5, 32, 32, 0, Math.PI, 0, Math.PI), new THREE.PointCloudMaterial({
    color: 'white',
    map: this.electPoint,
    transparent: true,
    size: 0.3,
    depthTest: false,
    blending: THREE.AdditiveBlending
  }));
  this.lineFibre = null;
  this.SphereElec = new THREE.Object3D();
  this.SphereElec.add(this.fibrepoint);

  /*****************

      Eau
  */
  this.eauIntensity = 0;
  this.eauRotX = 0;
  this.eauRotY = 0;
  urls = [
    'images/cube/o0001.png', //droite
    'images/cube/o0002.png', //gauche
    'images/cube/o0004.png', //haut
    'images/cube/o0005.png', //bas
    'images/cube/o0006.png', //face
    'images/cube/o0003.png' //fond
  ];

  var EautextureCube = THREE.ImageUtils.loadTextureCube(urls, undefined, this.loaded());
  EautextureCube.format = THREE.RGBFormat;


  var shader = THREE.FresnelShader;
  var uniforms = THREE.UniformsUtils.clone(shader.uniforms);

  uniforms["tCube"].value = EautextureCube;

  var parameters = {
    color: new THREE.Color(100, 100, 100),
    fragmentShader: shader.fragmentShader,
    vertexShader: shader.vertexShader,
    uniforms: uniforms,
    shininess: 50,
    depthWrite: false
  };


  //var EauSurfacetexture = new THREE.WebGLRenderTarget(width, height);
  //  this.tempTexture = new THREE.WebGLRenderTarget(width, height);

  var EauSurfaceShader = THREE.WaterShader;
  var EauSurfaceUniforms = THREE.UniformsUtils.clone(EauSurfaceShader.uniforms);
  var EauNormalText = THREE.ImageUtils.loadTexture("images/waternormals.jpg", undefined, this.loaded());
  EauNormalText.wrapT = EauNormalText.wrapS = THREE.RepeatWrapping;

  this.eau_dec = new THREE.Vector2(0, 0);;
  this.eauWave = 0;
  this.EauSurfacematerial = new THREE.ShaderMaterial({
    color: 0xdddddd,
    specular: 0x222222,
    shininess: 35,
    uniforms: {
      mode: {
        type: 'i',
        value: 0
      },
      normText: {
        type: 't',
        value: EauNormalText
      },
      envMap: {
        type: 't',
        value: EautextureCube
      },
      dec: {
        type: 'v2',
        value: this.eau_dec
      },
      wave2: {
        type: 'f',
        value: this.eauWave
      },
      intensity: {
        type: 'f',
        value: 0.8
      }
    },
    fragmentShader: EauSurfaceShader.fragmentShader,
    vertexShader: EauSurfaceShader.vertexShader,
    depthTest: false,
    //  depthWrite: false,
    //  blending:THREE.MultiplyBlending,
    transparent: true,
    opacity: 1.0
  });

  var material = new THREE.ShaderMaterial(parameters);

  this.bocal = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 32), material);

  this.eaudedans = new THREE.Mesh(new THREE.SphereGeometry(4.9, 32, 32, 0, Math.PI, 0, Math.PI), new THREE.MeshPhongMaterial({
    color: '#191933',
    //  depthTest: false,
    //  depthWrite: false,
    // blending:THREE.MultiplyBlending,
    transparent: true,
    opacity: 0.2
    // side:THREE.DoubleSide
  }));
  this.eaudedans.rotation.x = Math.PI / 2;

  this.eausurface = null;

  this.EauObj = new THREE.Object3D();
  this.EauMove = new THREE.Object3D();
  this.EauObj.add(this.bocal);
  this.EauObj.add(this.EauMove);

  this.eauCount = 0;
  this.eauRedress = null;
  this.EauSurfaceMove = new THREE.Vector2(1, 1);



  /***************************

          SATIN

          */
  this.satinNormMap = THREE.ImageUtils.loadTexture("images/satinNorm.jpg", undefined, this.loaded());
  this.satinNormMap.wrapT = this.satinNormMap.wrapS = THREE.RepeatWrapping;
  this.satinShader = THREE.SatinShader;

  this.satin = null;
  this.satinFroisseX = 0;
  this.satinFroisseY = 0;


  /**********************************

          Cotonneu
  */
  var c;
  this.coton = new THREE.Object3D();
  this.cotons = [];
  for (c = 0; c < 50; c++) {
    nuage = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({
      map: THREE.ImageUtils.loadTexture("images/nuage.png", undefined, this.loaded()),

      transparent: true,
      depthTest: false,
      depthWrite: false,
      opacity: 0.7
    }));
    nuage.position.x = Math.random() * 5 - 2.5;
    nuage.position.y = Math.random() * 5 - 2.5;
    nuage.rotation.z = Math.random() * Math.PI;
    nuage.orig = nuage.position.clone();
    this.cotons.push(nuage);
    this.coton.add(nuage);
  }
  this.scene.add(this.coton);


  /*****************************************
        peau de peche

 */
  this.peche_text1 = THREE.ImageUtils.loadTexture("images/peau_peche2.jpg", undefined, this.loaded());
  this.peche_text1.wrapT = this.peche_text1.wrapS = THREE.RepeatWrapping;
  this.peche_text1.repeat.set(4, 4);

  this.peche_text2 = THREE.ImageUtils.loadTexture("images/peau_peche3.jpg", undefined, this.loaded());
  this.peche_text2.wrapT = this.peche_text2.wrapS = THREE.RepeatWrapping;
  this.peche_text2.repeat.set(4, 4);

  this.peche_norm1 = THREE.ImageUtils.loadTexture("images/peau_peche_norm.jpg", undefined, this.loaded());
  this.peche_norm1.wrapT = this.peche_norm1.wrapS = THREE.RepeatWrapping;
  this.peche_norm1.repeat.set(4, 4);

  this.peche_spec1 = THREE.ImageUtils.loadTexture("images/peau_peche_spec.jpg", undefined, this.loaded());
  this.peche_spec1.wrapT = this.peche_spec1.wrapS = THREE.RepeatWrapping;
  this.peche_spec1.repeat.set(4, 4);

  this.doigt = null; // new THREE.Texture();
  //this.doigt.wrapT = this.doigt.wrapS = THREE.RepeatWrapping;
  //this.doigt.repeat.set(4,4);

  this.peche_norm2 = THREE.ImageUtils.loadTexture("images/peau_peche_norm2.jpg", undefined, this.loaded());
  this.peche_norm2.wrapT = this.peche_norm2.wrapS = THREE.RepeatWrapping;
  this.peche_norm2.repeat.set(4, 4);

  this.peche_spec2 = THREE.ImageUtils.loadTexture("images/peau_peche_spec2.jpg", undefined, this.loaded());
  this.peche_spec2.wrapT = this.peche_spec2.wrapS = THREE.RepeatWrapping;
  this.peche_spec2.repeat.set(4, 4);
  this.PecheShader = THREE.PecheShader2;

  this.doigtCtx = null;
  this.doigtSprite = new Image();
  this.doigtSprite.src = 'images/doigt.png';
  this.doigtSpriteb = new Image();
  this.doigtSpriteb.src = 'images/doigtb.png';
  var pecheMat = new THREE.Matrix4();
  this.peche = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 32), new THREE.ShaderMaterial({
    uniforms: {
      Resolution: {
        type: 'v2',
        value: new THREE.Vector2(window.innerHeight, window.innerWidth)
      },
      LightPos: {
        type: 'v3',
        value: new THREE.Vector3(20, 5, -20)
      },
      LightColor: {
        type: 'v4',
        value: new THREE.Vector4(1, 1, 1, 1)
      },
      AmbientColor: {
        type: 'v4',
        value: new THREE.Vector4(0.1, 0.1, 0.1, 1)
      },
      Falloff: {
        type: 'v3',
        value: new THREE.Vector3(0.4, 3, 20)
      },
      normalMap1: {
        type: 't',
        value: this.peche_norm1
      },
      Text1: {
        type: 't',
        value: this.peche_text1
      },
      Text2: {
        type: 't',
        value: this.peche_text2
      },
      Spec1: {
        type: 't',
        value: this.peche_spec1
      },
      normalMap2: {
        type: 't',
        value: this.peche_norm2
      },
      doigt: {
        type: 't',
        value: this.doigt
      },
      Spec2: {
        type: 't',
        value: this.peche_spec2
      }
    },
    fragmentShader: this.PecheShader.fragmentShader,
    vertexShader: this.PecheShader.vertexShader
  }));
  pecheMat.getInverse(this.peche.matrixWorld);
  this.peche.geometry.computeFaceNormals();
  this.peche.geometry.computeVertexNormals();
  this.peche.geometry.computeTangents();

  this.scene.add(this.peche);


  /*****************************************
        petales

 */
  this.petale = null;
  this.petalIntensity = 0;
  this.petalRotX = 0;
  this.petalRotY = 0;
  this.petalCount = 0;

  /***********************************

      bouboules

  */

  this.bouboules = new THREE.Object3D();
  this.boules = [];
  this.bouleMat = new THREE.ShaderMaterial({
    vertexShader: THREE.BouleShader.vertexShader,
    fragmentShader: THREE.BouleShader.fragmentShader
  })
  var m = null
  for (c = 0; c < 6; c++) {
    m = new THREE.Mesh(new THREE.SphereGeometry(1.6, 32, 32), this.bouleMat);
    m.position.x = 4 * Math.cos(c * Math.PI / 3 + Math.PI / 2);
    m.position.y = 4 * Math.sin(c * Math.PI / 3 + Math.PI / 2);
    m.orig = m.position.clone();
    this.bouboules.add(m);
    this.boules.push(m);
  }

  for (c = 0; c < 3; c++) {
    m = new THREE.Mesh(new THREE.SphereGeometry(1.6, 32, 32), this.bouleMat);
    m.position.x = 2.8 * Math.cos(c * Math.PI / 1.5);
    m.position.y = 2.8 * Math.sin(c * Math.PI / 1.5);
    m.position.z = 0.8;
    m.orig = m.position.clone();
    this.bouboules.add(m);
    this.boules.push(m);
  }
  m = new THREE.Mesh(new THREE.SphereGeometry(1.6, 32, 32), this.bouleMat);
  m.position.x = 0;
  m.position.y = 0;
  m.position.z = 2;
  m.orig = m.position.clone();
  this.bouboules.add(m);
  this.boules.push(m);

  for (c = 0; c < 3; c++) {
    m = new THREE.Mesh(new THREE.SphereGeometry(1.35, 32, 32), this.bouleMat);
    m.position.x = 2.3 * Math.cos(c * Math.PI / 1.5 + Math.PI / 3);
    m.position.y = 2.3 * Math.sin(c * Math.PI / 1.5 + Math.PI / 3);
    m.position.z = 3;
    m.orig = m.position.clone();
    this.bouboules.add(m);
    this.boules.push(m);
  }

  // console.log(this.boules.length);
  this.scene.add(this.bouboules);
}


XP_texture.prototype = {
  loaded: function () {
    this.loadCount++;

    if (this.loadCount == 67) {
      $('#transition .transition_box').append($('#clickbut').html());
    }
  },
  ecrase_boules: function (x, y) {
    var a = (x - 0.25) * 4;
    var b = (y - 0.5) * 4;
    var c;

    for (c in this.boules) {
      var v = new THREE.Vector2(a - this.boules[c].orig.x, b - this.boules[c].orig.y);


      //  console.log(v.length());
      if (v.length() < 3) {

        if ((this.boules[c].position.length() > this.boules[c].orig.length() / 1.3))
          this.boules[c].position.setLength(this.boules[c].position.length() * 0.95);
      } else {
        this.boules[c].position.x += (this.boules[c].orig.x - this.boules[c].position.x) * 0.1;
        this.boules[c].position.y += (this.boules[c].orig.y - this.boules[c].position.y) * 0.1;
        this.boules[c].position.z += (this.boules[c].orig.z - this.boules[c].position.z) * 0.1;
      }
    }
  },

  replace_boules: function () {
    var c;
    for (c in this.boules) {
      this.boules[c].position.x += (this.boules[c].orig.x - this.boules[c].position.x) * 0.1;
      this.boules[c].position.y += (this.boules[c].orig.y - this.boules[c].position.y) * 0.1;
      this.boules[c].position.z += (this.boules[c].orig.z - this.boules[c].position.z) * 0.1;
    }
  },

  create_eau_surface_geo: function () {

  },

  get_jean_origin: function () {
    /*var c;
    var or = [];
    for (c in this.jean1.geometry.vertices) {
      or.push(new THREE.Vector3(this.jean1.geometry.vertices[c].x, this.jean1.geometry.vertices[c].y, this.jean1.geometry.vertices[c].z));
    }
    this.jean1.geometry.origin = or;*/
  },
  deforme_jean: function (a) {
    var c, d, e, p, cl;
    p = new THREE.Vector2((this.mouse.x - 0.25) * 12, (this.mouse.y - 0.5) * 8);
    this.jean1.updateMatrixWorld();
    for (c in this.jean1.geometry.vertices) {
      cl = this.jean1.geometry.origin[c].clone();

      cl.applyMatrix4(this.jean1.matrixWorld);
      d = new THREE.Vector2(cl.x, cl.y);
      d.sub(p);
      e = 0;
      if ((d.length() < 2) && a) {
        e = 3 * (2 - d.length());
      }
      this.jean1.geometry.vertices[c].setLength(this.jean1.geometry.origin[c].length() - e);
    }
    this.jean1.geometry.verticesNeedUpdate = true;
    this.jean1.geometry.computeFaceNormals();
    this.jean1.geometry.computeTangents();
  },
  move_coton: function () {
    var c;
    var v = new THREE.Vector3((this.mouse.x - 0.25) * 4, (this.mouse.y - 0.5) * 4, 0);
    var v2;
    for (c in this.cotons) {
      v2 = new THREE.Vector3(this.cotons[c].position.x, this.cotons[c].position.y, 0);
      v2.sub(v);

      if (v2.length() < 2.1) {
        this.cotons[c].position.x -= (this.downX - this.mouse.x) * (4 - v2.length());
        this.cotons[c].position.y -= (this.downY - this.mouse.y) * (4 - v2.length());
        this.cotons[c].rotation.z += 0.004;
        this.cotons[c].material.opacity *= 0.97;
      }
    }
  },

  fibre_origin: function () {
    var c;
    for (c in this.fibrepoint.geometry.vertices) {


      this.fibrepoint.geometry.vertices[c].x -= (this.fibrepoint.geometry.vertices[c].x - this.fibrepoint.geometry.orig[c].x) * 0.2;
      this.fibrepoint.geometry.vertices[c].y -= (this.fibrepoint.geometry.vertices[c].y - this.fibrepoint.geometry.orig[c].y) * 0.2;
      this.fibrepoint.geometry.vertices[c].z -= (this.fibrepoint.geometry.vertices[c].z - this.fibrepoint.geometry.orig[c].z) * 0.2;


    }
    this.fibrepoint.geometry.verticesNeedUpdate = true;
    this.lineFibre.geometry.verticesNeedUpdate = true;
  },


  fibre_attire: function (x, y) {

    var c, l, d, a, l2, si, co, angle;
    d = new THREE.Vector3(0, 0, 0);
    a = new THREE.Vector3(0, 0, 0);
    var p;

    for (c in this.fibrepoint.geometry.vertices) {
      p = new THREE.Vector3((x - 0.25) * 12, (y - 0.5) * 8, this.fibrepoint.geometry.orig[c].z);


      d.subVectors(this.fibrepoint.geometry.orig[c], p);

      l2 = d.length();

      if (l2 < 5) {

        si = Math.sin((l2 / 2.5) * Math.PI / 2);
        l = this.fibrepoint.geometry.orig[c].length();

        a.x = p.x * si + this.fibrepoint.geometry.orig[c].x * (1 - si);
        a.y = p.y * si + this.fibrepoint.geometry.orig[c].y * (1 - si);
        a.z = p.z * si + this.fibrepoint.geometry.orig[c].z * (1 - si);



        this.fibrepoint.geometry.vertices[c].set(a.x, a.y, a.z);

        this.fibrepoint.geometry.vertices[c].setLength(l);
      }


    }
    this.fibrepoint.geometry.verticesNeedUpdate = true;
    this.lineFibre.geometry.verticesNeedUpdate = true;
  },

  make_fibre: function (mat, color1, color2) {
    var c;
    var geo = new THREE.Geometry();

    this.fibrepoint.geometry.orig = [];

    for (c in this.fibrepoint.geometry.vertices) {
      geo.vertices.push(new THREE.Vector3(Math.random() * 0.1, Math.random() * 0.1, Math.random() * 0.1));
      geo.vertices.push(this.fibrepoint.geometry.vertices[c]);
      this.fibrepoint.geometry.orig.push(new THREE.Vector3(this.fibrepoint.geometry.vertices[c].x, this.fibrepoint.geometry.vertices[c].y, this.fibrepoint.geometry.vertices[c].z));
    }
    var cols = [];
    for (c in geo.vertices) {
      if (c % 2 === 0) {
        cols[c] = color1;
      } else {
        cols[c] = color2;
      }
    }
    geo.colors = cols;
    return new THREE.Line(geo, mat, THREE.LinePieces);
  },


  rotateAroundWorldAxis: function (object, axis, radians) {
    var rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);


    rotWorldMatrix.multiply(object.matrix); // pre-multiply

    object.matrix = rotWorldMatrix;


    object.rotation.setFromRotationMatrix(object.matrix);
  },
  size_away: function () {
    var h = 2 * this.camera.position.z * Math.tan(this.camera.fov / 2 * (Math.PI / 180));
    var w = h * window.innerWidth / window.innerHeight;
    return {
      width: w,
      height: h
    };
  },
  start: function () {
    var obj = this;
    $('#transition').html('');
    $('#transition').hide();
    bouton_validate(false);

    $('#bouton_validate').tap(function () {
      obj.validate();
    });

    this.auto = true;
  },

  loadTexts: function () {

    this.jeanTexD = THREE.ImageUtils.loadTexture("images/Denim.jpg", undefined, this.loaded());
    this.jeanTexD.wrapS = THREE.RepeatWrapping;
    this.jeanTexD.wrapT = THREE.RepeatWrapping;
    this.jeanTexD.anisotropy = 64;
    this.jeanTexD.repeat.set(4, 4);

    this.jeanTexN = THREE.ImageUtils.loadTexture("images/1-text-norm.png", undefined, this.loaded());
    this.jeanTexN.wrapS = THREE.RepeatWrapping;
    this.jeanTexN.wrapT = THREE.RepeatWrapping;
    this.jeanTexN.anisotropy = 64;
    this.jeanTexN.repeat.set(4, 4);






  },

  crystal_geometry: function (r, l, s, f) {


    var geo = new THREE.Geometry();

    //les deux pointes
    geo.vertices.push(new THREE.Vector3(0, l + s, 0)) //0;
    geo.vertices.push(new THREE.Vector3(0, -s, 0)) //1;

    //les arrettes
    var c, x, z;
    for (c = 0; c < f; c++) {
      x = r * Math.cos((c / f) * Math.PI * 2);
      z = r * Math.sin((c / f) * Math.PI * 2);
      geo.vertices[2 + c] = new THREE.Vector3(x, l, z); //2-3-4-5-6-7....
      geo.vertices[2 + f + c] = new THREE.Vector3(x, 0, z); //7
    }
    for (c = 0; c < f - 1; c++) {
      geo.faces.push(new THREE.Face3(0, 3 + c, 2 + c));
      geo.faces.push(new THREE.Face3(1, 2 + f + c, 3 + f + c));

      geo.faces.push(new THREE.Face3(2 + c, 3 + c, 2 + f + c));
      geo.faces.push(new THREE.Face3(2 + f + c, 3 + c, 3 + f + c));
    }
    geo.faces.push(new THREE.Face3(0, 2, 1 + f));
    geo.faces.push(new THREE.Face3(1, 1 + f * 2, 2 + f));
    geo.faces.push(new THREE.Face3(1 + f, 2, 1 + f * 2));
    geo.faces.push(new THREE.Face3(1 + f * 2, 2, 2 + f));
    geo.computeFaceNormals();
    return geo;
  },


  create_crystals: function () {



    var r = 1;
    var l = 4;
    var s = 1;
    var f = 6;
    var c, cubeCamera, crystalMat;
    for (c = 0; c < 24; c++) {
      r = 0.2 + Math.random() * 0.5;
      l = r * 6 + Math.random() * 0.5;
      s = r + Math.random() * 0.5;
      f = 6;




      var crystalMat = new THREE.MeshLambertMaterial({
        color: '#FFFFFF',
        specular: 0xA0A0A0,
        shininess: 80,
        metal: true,
        opacity: 0.9,
        shading: THREE.FlatShading,
        transparent: true,
        side: THREE.DoubleSide,
        envMap: this.crystal_envmap1
      });

      crystal = new THREE.Mesh(this.crystal_geometry(r, l, s, f), crystalMat);
      crystal.rotation.x = Math.random() * Math.PI * 2;
      crystal.rotation.z = Math.random() * Math.PI * 2;
      crystal.rotation.y = Math.random() * Math.PI * 2;



      this.crystal.add(crystal);
    }

  },

  eau_bouge: function () {
    var rZ = this.eauRotY * (-this.eauRotX + 0.25) * 4.0;
    this.rotateAroundWorldAxis(this.EauMove, new THREE.Vector3(0, 0, 1), rZ);
    this.rotateAroundWorldAxis(this.EauMove, new THREE.Vector3(1, 0, 0), this.eauRotY);
    //this.eauCount = 0;

    if (this.eauIntensity < 1.5) {
      this.eauIntensity += Math.abs(-this.eauRotX + 0.25) * Math.abs(this.eauRotY) * 800;
      this.eauIntensity = Math.min(this.eauIntensity, 2.0);
    }
    this.eau_dec.x = (this.eauIntensity * 10.0);
    this.eau_dec.y = (this.eauIntensity * 10.0);
  },

  redress_eau: function () {
    if ((this.eauCount % 18 == 0)) {
      this.eauRedress = new THREE.Euler().setFromQuaternion(this.EauMove.getWorldQuaternion(), 'XYZ');
      this.eauCount = 0;
    }
    this.eauCount++;
    this.eauIntensity *= 0.995;
    this.eau_dec.x *= 0.99;
    this.eau_dec.y *= 0.99;
    //this.eaud
    this.EauMove.rotation.x -= this.eauRedress.x * 0.1;
    this.EauMove.rotation.y -= this.eauRedress.y * 0.1;
    this.EauMove.rotation.z -= this.eauRedress.z * 0.1;

    this.EauSurfacematerial.uniforms.intensity.value = this.eauIntensity;

  },
  petal_bouge: function () {

    var rZ = this.petalRotY * (-this.petalRotX + 0.25) * 4.0;
    this.rotateAroundWorldAxis(this.petal, new THREE.Vector3(0, 0, 1), rZ / 4);
    this.petal.rotation.y = .1 + this.petalRotY / 4;
    this.petalCount = 0;

    this.petalIntensity += Math.abs(-this.petalRotX + 0.25) * Math.abs(this.petalRotY) * 800;
    this.petalIntensity = Math.min(this.petalIntensity, 2.0);

  },

  redress_petal: function () {
    if ((this.petalCount % 18 == 0)) {
      this.petalRedress = new THREE.Euler().setFromQuaternion(this.petal.getWorldQuaternion(), 'XYZ');

    }
    this.petalCount++;
    this.petalIntensity *= 0.995;

    //this.eaud
    this.petal.rotation.x -= this.petalRedress.x * 0.1;
    this.petal.rotation.y -= this.petalRedress.y * 0.1;
    this.petal.rotation.z -= this.petalRedress.z * 0.07;

    this.EauSurfacematerial.uniforms.intensity.value = this.petalIntensity;

  },
  radar_shape: function () {
    var angle = 0;
    var depart = 0;

    angle = -this.angleRadar;



    var cx = cy = $('#rond_texture').width() / 2;
    var r = $('#rond_texture').width() / 2.05;
    var arX = cx + r * Math.cos(angle);
    var arY = cy - r * Math.sin(angle);
    //A '+r+' '+r+' 45 1 1 
    if (angle > -Math.PI * 2 && angle <= -Math.PI) {
      $('#coucou').attr('d', 'M ' + (cx + r) + ',' + (cy) + ' A ' + r + ' ' + r + ' 45 1 1  ' + arX + ',' + arY);
    } else {
      $('#coucou').attr('d', 'M ' + (cx + r) + ',' + (cy) + ' A ' + r + ' ' + r + ' 45 0 1  ' + arX + ',' + arY);
    }
    $('#coucou').attr('style', 'fill:none; stroke:black;')
  },

  get_angle: function (x, y) {
    console.log(x, y);
    var v = new THREE.Vector3(x, y, 0);
    v.normalize();
    var dec = 0;

    if (x < 0) {
      dec = -Math.PI;
    }

    var a = Math.PI - Math.sign(x) * v.angleTo(new THREE.Vector3(0, 1, 0));

    if (x == 0) {
      a = 0;
    }

    return a;
  },

  svgArc: function () {
    var t = '<svg width="100" height="100" id="svgArc" xml:lang="fr" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">';
    t += '<path id="coucou" d="M 10,50 A 0 0 0 0 0 0,0" style="fill:none; stroke:none;"/>';
    return t;
  },

  trace_doigt: function (x, y, sens) {
    if (sens < 0) {
      this.doigtCtx.drawImage(this.doigtSprite, x * 512 * .4 + 64 - 20, 512 - y * 512 * .6 - 128);
    }
    if (sens > 0) {
      this.doigtCtx.drawImage(this.doigtSpriteb, x * 512 * .4 + 64 - 20, 512 - y * 512 * .6 - 128);
    }
    this.doigt.needsUpdate = true;
    this.peche.material.uniforms.doigt.value = this.doigt;
  },

  init: function (readyCallback) {
    //initialise l'XP (les éléments du DOM, etc.)
    $('#transition').show();
    $('#transition').html($('#resText').html());
    $('body').css({
      'background': 'url(images/background_texture.jpg) repeat-x',
      'background-size': 'cover',
      'background-position': 'center bottom'
    });
    $('body').prepend('<div id="coord"></div>');
    $('body').prepend(('<div id="rond_texture"></div>'));
    $('body').prepend('<canvas id="renderer"></canvas>');

    $('body').prepend(this.svgArc());
    $('body').append(('<div id="radar_texture"></div>'));


    $('body').append('<canvas id="doigt" width="512px" height="512px" style="display:none"></canvas>');
    this.doigtCtx = $('#doigt').get(0).getContext('2d');
    this.doigtCtx.width = 512;
    this.doigtCtx.height = 512;
    this.doigtCtx.fillStyle = '#FFFFFF';
    this.doigtCtx.fillRect(0, 0, 512, 512);

    this.doigt = new THREE.Texture($('#doigt').get(0));
    this.doigt.needsUpdate = true;
    this.peche.material.uniforms.doigt.value = this.doigt;

    this.renderer = $('#renderer');
    this.renderer3D = new THREE.WebGLRenderer({
      canvas: this.renderer.get(0),
      alpha: true,
      antialiasing: true
    });
    this.renderer3D.setClearColor(0x000000, 0);
    this.renderer3D.setSize(window.innerWidth, window.innerHeight); //*1.5????

    this.renderer.css({
      'width': window.innerWidth + 'px',
      'height': window.innerHeight + 'px'
    });

    this.scene.add(this.camera);

    this.light = new THREE.DirectionalLight(0xffffff, 1.5);

    var obj = this;





    this.loadTexts();



    this.light.position.set(150, 150, 150);
    this.scene.add(this.light);


    this.ambient = new THREE.AmbientLight(0x0A0A0A);
    this.scene.add(this.ambient);


    this.mat_jean = new THREE.ShaderMaterial({
      uniforms: {
        def: {
          type: 'i',
          value: true
        },
        lightPosition: {
          type: 'v3',
          value: this.light.position
        },
        textureMap: {
          type: 't',
          value: this.jeanTexD
        },
        normalMap: {
          type: 't',
          value: this.jeanTexN
        },
        displaceMap: {
          type: 't',
          value: this.plot
        },
        plotpos: {
          type: 'v2',
          value: this.plotpos
        },

        scale: {
          type: "f",
          value: 2
        },
        uvScale: {
          type: 'v2',
          value: new THREE.Vector2(4.0, 4.0)
        },
        rot: {
          type: 'v2',
          value: 0 //;this.rot
        }
      },
      vertexShader: this.jeanShader.vertexShader,
      fragmentShader: this.jeanShader.fragmentShader

    });


    this.ready = readyCallback;




    var loader = new THREE.JSONLoader(this.manager);
    loader.load('images/jean.json', function (object, mat) {


      object.computeFaceNormals();
      object.computeTangents();
      obj.jean = new THREE.Mesh(object, obj.mat_jean);
      obj.get_jean_origin();
      obj.jean.scale.set(0.65, 0.65, 0.65);
      obj.scene.add(obj.jean);
      obj.loaded();
    });


    loader.load('images/water_surface.json', function (object) {


      object.computeFaceNormals();
      object.computeTangents();
      obj.eausurface = new THREE.Mesh(object, obj.EauSurfacematerial);

      obj.eausurface.position.y = -0.20;
      obj.EauMove.add(obj.eausurface);
      obj.EauMove.add(obj.eaudedans);
      obj.loaded();
    });

    loader.load('images/petal.json', function (object) {


      object.computeFaceNormals();
      object.computeTangents();
      obj.petal = new THREE.Mesh(object, new THREE.MeshPhongMaterial({
        color: '#FFFFFF',
        side: THREE.DoubleSide,
        shininess: 0.002,
        map: THREE.ImageUtils.loadTexture('images/petal_diff.jpg'),
        normalMap: THREE.ImageUtils.loadTexture('images/petal_norm.jpg'),
        specularMap: THREE.ImageUtils.loadTexture('images/petal_spec.jpg'),
        normalScale: new THREE.Vector2(0.05, 0.05)
      }));
      obj.petal.scale.set(2.6, 2.6, 2.6);
      obj.scene.add(obj.petal);
      obj.loaded();
    });

    loader.load('images/satin2.json', function (object, mat) {


      //object.computeFaceNormals();
      //  object.computeVertexNormals();
      object.computeMorphNormals();
      object.computeTangents();
      var obMat = new THREE.Matrix4();

      obj.satinMat = new THREE.ShaderMaterial({
        uniforms: {
          intensity: {
            type: 'f',
            value: 100
          },
          _World2Object: {
            type: 'm4',
            value: obMat
          },
          normalMap: {
            type: 't',
            value: obj.satinNormMap
          }
        },
        fragmentShader: obj.satinShader.fragmentShader,
        vertexShader: obj.satinShader.vertexShader,
        morphTargets: true,
        morphNormals: true
      });


      obj.satin = new THREE.Mesh(object, obj.satinMat);
      obMat.getInverse(obj.satin.matrixWorld);
      obj.satin.morphTargetInfluences[0] = 1; //neutre
      obj.satin.morphTargetInfluences[1] = 0;
      obj.satin.morphTargetInfluences[3] = 0; //gauche
      obj.satin.morphTargetInfluences[2] = 0; //haut
      obj.satin.morphTargetInfluences[4] = 0; //bas
      obj.satin.scale.set(5, 5, 5);


      obj.scene.add(obj.satin);
      obj.loaded();
    });



    this.jean = new THREE.Mesh(new THREE.SphereGeometry(5, 64, 64), this.mat_jean);
    this.jean.geometry.computeFaceNormals();
    this.jean.geometry.computeTangents();
    this.create_crystals();
    this.lineFibre = this.make_fibre(new THREE.LineBasicMaterial({
      color: 0xffffff,
      opacity: 1,
      linewidth: 5,
      vertexColors: THREE.VertexColors


    }), new THREE.Color('#051c24'), new THREE.Color('#669aa8'))
    this.SphereElec.add(this.lineFibre);



    this.scene.add(this.crystal);
    this.scene.add(this.SphereElec);
    this.scene.add(this.EauObj);

    var vFOV = this.camera.fov * Math.PI / 180; // convert vertical fov to radians
    var height = 2 * Math.tan(vFOV / 2) * 15; // visible height

    var spL = 15 / height * 83;




    $('#coord').css({
      'height': spL * 0.8 + '%'
    });
    $('#coord').css({
      'width': $('#coord').height() + 'px'
    });



    $('#coord').css({
      'top': ($('#coord').position().top - $('#coord').height() / 2) + 'px',
      'left': ($('#coord').position().left - $('#coord').width() / 2) + 'px'
    });

    $('#rond_texture').css({
      'height': spL + '%'
    });
    $('#rond_texture').css({
      'width': $('#rond_texture').height() + 'px'
    });

    $('#rond_texture').css({
      'height': $('#rond_texture').width() + 'px'
    });

    $('#svgArc').attr('width', $('#rond_texture').height());
    $('#svgArc').attr('height', $('#rond_texture').height());
    $('#svgArc').css({
      'stroke-width': $('#rond_texture').height() / 50
    })
    $('#radar_texture').css({
      'height': (spL / 10) + '%'
    });
    $('#radar_texture').css({
      'width': $('#radar_texture').height() + 'px',
      'transform': 'translate(' + $('#rond_texture').height() + 'px,' + $('#rond_texture').height() + 'px)'
    });




    $('#coord').tapmove(function (e, d) {
      e.preventDefault();
      obj.mouse.x = d.offset.x / ($('#coord').width() * 2);
      obj.mouse.y = ($('#coord').height() - d.offset.y) / ($('#coord').height());

      if ((d.offset.x < 2) || (d.offset.x > $('#coord').width() - 2) || (d.offset.y < 2) || (d.offset.y > $('#coord').width() - 2)) {
        obj.down = false;
        //obj.downX = this.mouse.x;
        //obj.downY = this.mouse.y;
      }

    })


    $('#coord').tapstart(function (e, d) {
      e.preventDefault();
      obj.mouse.x = d.offset.x / ($('#coord').width() * 2);
      obj.mouse.y = ($('#coord').height() - d.offset.y) / ($('#coord').height());
      obj.down = true;

      obj.CrystalRotX = 0;
      obj.CrystalRotY = 0;
      obj.auto = false;


    })

    $('#coord').tapend(function (e, d) {
      obj.down = false;
      obj.downX = obj.mouse.x;
      obj.downY = obj.mouse.y;
    })



    $('#rond_texture').tapstart(function (e, d) {

      e.preventDefault();
      obj.auto = false;
      if (e.pageX) {
        var x = e.pageX;
        var y = e.pageY;
      } else {
        var x = e.originalEvent.touches[0].pageX;
        var y = e.originalEvent.touches[0].pageY;
      }


      obj.angleRadar = obj.get_angle((x - $('body').width() / 2), (y - ($('body').height() / 2)));
      console.log('ley', $('body').height());


      obj.downRadar = true;

    })
    $('#radar_texture').tapstart(function (e, d) {

      e.preventDefault();
      obj.auto = false;
      if (e.pageX) {
        var x = e.pageX;
        var y = e.pageY;
      } else {
        var x = e.originalEvent.touches[0].pageX;
        var y = e.originalEvent.touches[0].pageY;
      }


      obj.angleRadar = obj.get_angle((x - $('body').width() / 2), (y - ($('body').height() / 2)));



      obj.downRadar = true;

    })
    $('#rond_texture').tapmove(function (e, d) {
      if (e.pageX) {
        var x = e.pageX;
        var y = e.pageY;
      } else {
        var x = e.originalEvent.touches[0].pageX;
        var y = e.originalEvent.touches[0].pageY;
      }

      if (obj.downRadar) {
        obj.angleRadar = obj.get_angle((x - $('body').width() / 2), (y - ($('body').height() / 2)));


      }
    });
    $('#radar_texture').tapmove(function (e, d) {
      if (e.pageX) {
        var x = e.pageX;
        var y = e.pageY;
      } else {
        var x = e.originalEvent.touches[0].pageX;
        var y = e.originalEvent.touches[0].pageY;
      }

      if (obj.downRadar) {
        obj.angleRadar = obj.get_angle((x - $('body').width() / 2), (y - ($('body').height() / 2)));


      }
    });


    $('#radar_texture').tapend(function (e, d) {



      obj.downRadar = false;


    });
    $('#renderer').tapend(function (e, d) {



      obj.downRadar = false;


    })

    $('body').tapstart(function (e) {
      // e.preventDefault();

    });

    $('body').tapmove(function (e) {
      // e.preventDefault();

    });

    $('body').tapend(function (e) {
      // e.preventDefault();
      obj.downRadar = false;
      this.down = false;
    });


    $('body').tapmove(function (e, d) {
      e.preventDefault();
    })
    //    this.ready(); //appelle le callback pour prevenir que l'xp est prète.


  },

  update: function () {
    this.light.position.set(150, 150, 150);
    if (this.auto) {
      this.angleRadar += 0.004;
      if (this.angleRadar > Math.PI * 2) {
        this.angleRadar = 0;
      }
    }

    if (this.pause) {
      return
    }
    id = 2;




    if (this.angleRadar >= 0 && this.angleRadar < Math.PI / 4.5) {
      id = 0;
    }

    if (this.angleRadar >= Math.PI / 4.5 && this.angleRadar < 2 * Math.PI / 4.5) {
      id = 1;
    }

    if (this.angleRadar >= 2 * Math.PI / 4.5 && this.angleRadar < 3 * Math.PI / 4.5) {
      id = 2;
    }

    if (this.angleRadar >= 3 * Math.PI / 4.5 && this.angleRadar < 4 * Math.PI / 4.5) {
      id = 3;
    }

    if ((this.angleRadar >= 4 * Math.PI / 4.5 && this.angleRadar < 5 * Math.PI / 4.5) ||
      (this.angleRadar >= 4 * Math.PI / 4.5 && this.angleRadar < 5 * Math.PI / 4.5)) {
      id = 4;
    }

    if (this.angleRadar >= 5 * Math.PI / 4.5 && this.angleRadar < 6 * Math.PI / 4.5) {
      id = 5;
    }
    if (this.angleRadar >= 6 * Math.PI / 4.5 && this.angleRadar < 7 * Math.PI / 4.5) {
      id = 6;
    }
    if (this.angleRadar >= 7 * Math.PI / 4.5 && this.angleRadar < 8 * Math.PI / 4.5) {
      id = 7;
    }
    if (this.angleRadar >= 8 * Math.PI / 4.5 && this.angleRadar < 9 * Math.PI / 4.5) {
      id = 8;
    }

    this.choix = id;
    /*  if (this.angleRadar < 0) {
      this.angleRadar += Math.PI * 2;
    }*/
    $('#radar_texture').css({
      'transform': 'translate(-50%,-50%) rotateZ(-' + (Math.PI * 2 - this.angleRadar + Math.PI / 2) + 'rad) translateX(' + ($('#rond_texture').height() / 2) + 'px)'
    });

    if (this.angleRadar != this.oldAngle) {
      this.radar_shape();

    }
    if (id >= this.nbText) {
      id = this.nbText - 1;
    }
    if (!this.first) {

      this.jean.visible = false;
      this.crystal.visible = false;
      this.SphereElec.visible = false;
      this.EauObj.visible = false;
      this.peche.visible = false;
      if (this.satin != null) {
        this.satin.visible = false;
      }
      if (this.petal != null) {
        this.petal.visible = false;
      }
      this.coton.visible = false;
      this.bouboules.visible = false;
    } else {
      this.jean.visible = true;
      this.crystal.visible = true;
      this.SphereElec.visible = true;
      this.EauObj.visible = true;
      this.peche.visible = true;
      if (this.satin != null) {
        this.satin.visible = true;
      }
      if (this.petal != null) {
        this.petal.visible = true;
      }
      this.coton.visible = true;
      this.bouboules.visible = true;
      this.first = false;


    }

    this.light.intensity = 1.5;

    /********************* jean *******************/

    if (id === 0) {
      this.ambient.color.setHex(0x0A0A0A);
      this.jean.visible = true;

      // this.rot.x += 0.002;

      if (this.rot.x > Math.PI * 2) {
        this.rot.x = 0;
      }
      if (this.down) {


        var a = this.mouse.x - this.jean.rotation.y / (Math.PI * 2);
        var b = this.mouse.y;

        this.plotpos.set(a, b);


      } else {


        var a = this.jean.rotation.y / (Math.PI * 2);


        this.plotpos.set(1, 0.5);


      }

      this.mat_jean.uniforms.rot.value = this.rot;
    }


    /*********************** Diamand ******************************************/

    if (id === 1) {

      if (this.down) {
        this.CrystalRotX = -(this.downX - this.mouse.x) * 2;
        this.CrystalRotY = (this.downY - this.mouse.y) * 2;
      }

      this.ambient.color.setHex(0xFFFFFF);
      this.rotateAroundWorldAxis(this.crystal, new THREE.Vector3(0, 1, 0), this.CrystalRotX);
      this.rotateAroundWorldAxis(this.crystal, new THREE.Vector3(1, 0, 0), this.CrystalRotY);

      this.CrystalRotX *= 0.95;
      this.CrystalRotY *= 0.95;
      this.crystal.visible = true;


    }

    /************************** Boule Elec **************************************/

    if (id === 2) {
      this.SphereElec.visible = true;
      if (this.down) {
        this.fibre_attire(this.mouse.x, this.mouse.y);
      } else {
        this.fibre_origin();
      }

    }

    /************************** Boule Eau **************************************/
    this.renderer3D.sortObjects = true;
    if (id === 3) {

      this.eauWave++;
      this.renderer3D.sortObjects = false;
      this.EauObj.visible = true;
      //this.EauMove.rotation.x += 0.001 * this.EauSurfaceMove.x;
      //this.EauMove.rotation.z += 0.0015 * this.EauSurfaceMove.y;

      this.eausurface.material.uniforms.wave2.value = this.eauWave;
      if (this.down) {
        this.eauRotX = this.mouse.x;
        this.eauRotY = (this.downY - this.mouse.y) * 2;
        this.eau_bouge();
      }
      this.redress_eau();
    }
    //console.log(this.satin.matrixWorld);
    /************************** Satin **************************************/
    if (id === 4) {
      this.satin.visible = true;
      if (this.down) {
        this.satinFroisseX -= (this.downX - this.mouse.x);
        this.satinFroisseY -= (this.downY - this.mouse.y);

        // console.log(this.satinFroisseX);

        this.satinFroisseX = Math.min(Math.max(this.satinFroisseX, -0.25), 0.25);
        this.satinFroisseY = Math.min(Math.max(this.satinFroisseY, -0.25), 0.25);

        var v = new THREE.Vector2(this.satinFroisseX * 4, this.satinFroisseY * 4);
        if (v.length() > 1) {
          v.normalize();
        }



        this.satin.morphTargetInfluences[0] = 1 - v.length(); //neutre
        this.satin.morphTargetInfluences[1] = Math.max(v.x * 1.2, 0.0);
        this.satin.morphTargetInfluences[3] = Math.max(-v.x * 1.2, 0.0); //gauche
        this.satin.morphTargetInfluences[2] = Math.max(v.y * 1.2, 0.0);; //haut
        this.satin.morphTargetInfluences[4] = Math.max(-v.y * 1.2, 0.0);; //bas


      }


    }

    /************************ Coton ************************************/
    if (id === 5) {
      this.coton.visible = true;
      if (this.oldId != id) {
        this.oldId = id;
        var a;
        for (a in this.cotons) {
          this.cotons[a].position.x = this.cotons[a].orig.x;
          this.cotons[a].position.y = this.cotons[a].orig.y;
          this.cotons[a].position.z = this.cotons[a].orig.z;
          this.cotons[a].material.opacity = 1;
        }
      }
      if (this.down) {
        // this.move_coton();
        var a;
        for (a in this.cotons) {
          if (this.cotons[a].material.opacity > 0.2) {
            this.cotons[a].position.x = this.cotons[a].position.x * 1.01;
            this.cotons[a].position.y = this.cotons[a].position.y * 1.01;

            this.cotons[a].material.opacity *= 0.98;

            this.cotons[a].rotation.z += 0.002;
          }
        }

      }
    }
    /*************************** PECHE *******************************/
    if (id === 6) {

      this.peche.visible = true;
      if (this.down) {
        this.trace_doigt(this.mouse.x, this.mouse.y, this.downY - this.mouse.y);
      }

    }


    /************************* Petal ************************/

    if (id === 7) {
      this.ambient.color.setHex(0x7d6d75);
      this.light.position.set(-150, -50, 150);
      this.light.intensity = 0.7;
      this.petal.visible = true;
      if (this.down) {
        this.petalRotX = this.mouse.x;
        this.petalRotY = (this.downY - this.mouse.y) * 2;
        this.petal_bouge();
      }
      this.redress_petal();

    }

    /************************* bouboule ************************/

    if (id === 8) {
      this.ambient.color.setHex(0x0A0A0A);
      this.bouboules.visible = true;

      if (this.down) {
        this.ecrase_boules(this.mouse.x, this.mouse.y);
      } else {
        this.replace_boules();
      }

    }
    this.oldId = id;
    this.renderer3D.render(this.scene, this.camera);
    this.downX = this.mouse.x;
    this.downY = this.mouse.y;
  },


  choix: function (id) {
    this.pause = true;

    $('#xp_lieux_lumiere').css({
      'background-image': 'url(' + this.lieuxAsset[id] + '00.jpg)',
      'display': 'block'
    })
    $('#xp_lieux_assombri').css({
      'background-image': 'url(' + this.lieuxAsset[id] + '14.jpg)',
      'display': 'block'
    })


  },



  validate: function () {

    $('#jour').hide();
    $('#nuit').hide();
    $('#bouton_validate').hide();
    $('#validate').append($('#valYN').html());
    $('#validate').show();

  },

  no: function () {

    this.pause = false;
    $('#bouton_validate').show();
  },
  destroy: function () {
    Choix.change('texture', this.choix);
    $('#renderer').remove();
    $('#validate').html('');
    $('#validate').css({
      'background': 'none'
    });
    $('#validate').hide();
    $('#coord').remove();
    $('#radar_texture').remove()
    $('#rond_texture').remove();
    $('#bouton_validate').remove();
    $('#svgArc').remove();
    delete this;
  }
}



/**************************************************************************************

            AuraGramme

*****************************************************************************************/

var pcount = 0;
var part = function (lt, v) {
  this.v = v;
  this.vel = new THREE.Vector3(0, 0, 0),
  this.acc = new THREE.Vector3(0, 0, 0),
  this.dead = true,
  this.age = 0,
  this.lifeTime = lt
  this.id = pcount++;
}

part.prototype = {
  update: function (pos, t, att) {
    if (this.dead) {
      return
    }

    this.vel.x += this.acc.x * t;
    this.vel.y += this.acc.y * t;
    this.vel.z += this.acc.z * t;

    pos.x += this.vel.x * t;
    pos.y += this.vel.y * t;
    pos.z += this.vel.z * t;

    if (pos.y < 3 * window.innerWidth / -4 || pos.y > 3 * window.innerWidth / 4) {
      this.age = aura.lifeTime;
    }
    this.age += t;
    var ageRef = this.age / aura.lifeTime;

    att.age.value[this.id] = ageRef;

    if (this.age > aura.lifeTime) {
      this.vel.set(0, 0, 0);
      this.acc.set(0, 0, 0);

      pos.set(100000, 100000, 100000);
      this.dead = true;
      this.age = 0;
    }
  }
}

var _Emitter = function (nbSec, lt, t, max, v) {

  this.geometry = new THREE.Geometry();
  this.direction = new THREE.Vector3(0, 0, 0);
  this.count = 0;
  this.manque = 0;
  this.elapsedTime = 0;
  this.oldTime = t;
  this.nbMili = nbSec / 1000;
  this.trajTime = 0;
  this.time = 0;
  this.timeRef = new Date().getTime();
  this.alive = [];
  this.dead = [];
  var c;
  for (c = 0; c < max; c++) {

    this.geometry.vertices.push(new THREE.Vector3(10000, 10000, 10000));
    this.geometry.vertices[c].particles = new part(lt, this.v);
    this.dead.push(this.geometry.vertices[c]);
  }

  this.position = new THREE.Vector3(0, 0, 0);
  this.attributes = {
    age: {
      type: 'f',
      value: []
    }

  };

  this.uniforms = {
    amplitude: {
      type: "f",
      value: 1.0
    },
    color: {
      type: "c",
      value: new THREE.Color(0xffffff)
    },
    texture: {
      type: "t",
      value: aura.forme
    },
    size: {
      type: 'f',
      value: aura.size
    },
    ca1: {
      type: 'c',
      value: aura.color1
    },
    ca2: {
      type: 'c',
      value: aura.color2
    },
    eff_col: {
      type: 'f',
      value: aura.effCol
    },
    eff_size: {
      type: 'f',
      value: aura.effSize
    },

  };
  var partShader = THREE.partShader;
  var shaderMaterial = new THREE.ShaderMaterial({
    uniforms: this.uniforms,
    attributes: this.attributes,
    vertexShader: partShader.vertexShader,
    fragmentShader: partShader.fragmentShader,
    transparent: true,
    //    depthWrite: false,
    //   depthTest: false,
    blending: THREE.AdditiveBlending
  });

  this.pointCloud = new THREE.PointCloud(this.geometry, shaderMaterial);

  var c;

  var al = this.attributes.age.value;
  for (c in this.geometry.vertices) {

    al[c] = 0;
  }
}

_Emitter.prototype = {
  remove_dead: function () {
    var r = [];
    var c;
    for (c in this.alive) {
      if (!this.alive[c].particles.dead) {
        r.push(this.alive[c]);
      } else {
        this.dead.push(this.alive[c]);
      }
    }
    return r;
  },
  createNews: function () {


    this.manque += this.elapsedTime * aura.space / 1000;
    var c, d, p, l;
    if (this.manque > 0) {

      l = Math.floor(this.manque);

      for (c = 0; c < l; c++) {

        if (this.dead.length > 0) {

          p = this.dead.pop();
          p.particles.dead = false;
          p.particles.age = 0;
          p.set(this.position.x, this.position.y, this.position.z);
          p.particles.vel.set((-this.direction.x / 500 + Math.random()) * aura.dispertion / 100, (-this.direction.y / 500 + Math.random()) * aura.dispertion / 100, 0);


          this.manque -= 1;
          this.alive.push(p);
        }

      }
    }
  },
  update: function (t, path, vel) {

    this.elapsedTime = t - this.oldTime;
    this.oldTime = t;
    this.time += this.elapsedTime;
    this.trajTime += this.elapsedTime / 1000 * vel;

    if (this.trajTime > 1) {
      this.trajTime = 0;
    }

    var pt = path.getPointAt(this.trajTime);
    this.direction = new THREE.Vector3(pt.x - this.position.x, pt.y - this.position.y, 0);
    this.position.set(pt.x, pt.y, 0);


    this.createNews();
    var c, p;

    for (c = 0; c < this.alive.length; c++) {
      p = this.alive[c];
      p.particles.update(p, this.elapsedTime, this.attributes);


    }
    this.alive = this.remove_dead();
    this.geometry.verticesNeedUpdate = true;

    this.attributes.age.needsUpdate = true;

  }
}


function transformSVGPath(pathStr, mul) {

  var DIGIT_0 = 48,
    DIGIT_9 = 57,
    COMMA = 44,
    SPACE = 32,
    PERIOD = 46,
    MINUS = 45;

  var path = new THREE.Shape();

  var idx = 1,
    len = pathStr.length,
    activeCmd,
    x = 0,
    y = 0,
    nx = 0,
    ny = 0,
    firstX = null,
    firstY = null,
    x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0,
    rx = 0,
    ry = 0,
    xar = 0,
    laf = 0,
    sf = 0,
    cx, cy;

  function eatNum() {
    var sidx, c, isFloat = false,
      s;
    // eat delims
    while (idx < len) {
      c = pathStr.charCodeAt(idx);
      if (c !== COMMA && c !== SPACE)
        break;
      idx++;
    }
    if (c === MINUS)
      sidx = idx++;
    else
      sidx = idx;
    // eat number
    while (idx < len) {
      c = pathStr.charCodeAt(idx);
      if (DIGIT_0 <= c && c <= DIGIT_9) {
        idx++;
        continue;
      } else if (c === PERIOD) {
        idx++;
        isFloat = true;
        continue;
      }

      s = pathStr.substring(sidx, idx);
      return isFloat ? parseFloat(s) : parseInt(s);
    }

    s = pathStr.substring(sidx);
    return isFloat ? parseFloat(s) : parseInt(s);
  }

  function nextIsNum() {
    var c;
    // do permanently eat any delims...
    while (idx < len) {
      c = pathStr.charCodeAt(idx);
      if (c !== COMMA && c !== SPACE)
        break;
      idx++;
    }
    c = pathStr.charCodeAt(idx);
    return (c === MINUS || (DIGIT_0 <= c && c <= DIGIT_9));
  }

  var canRepeat;
  activeCmd = pathStr[0];
  while (idx <= len) {
    canRepeat = true;
    switch (activeCmd) {
      // moveto commands, become lineto's if repeated
    case 'M':
      x = eatNum();
      y = eatNum();
      path.moveTo((x - 5) * mul, (y - 5) * mul);
      activeCmd = 'L';
      break;
    case 'm':
      x += eatNum();
      y += eatNum();
      path.moveTo((x - 5) * mul, (y - 5) * mul);
      activeCmd = 'l';
      break;
    case 'Z':
    case 'z':
      canRepeat = false;
      if (x !== firstX || y !== firstY)
        path.lineTo((firstX - 5) * mul, (firstY - 5) * mul);
      break;
      // - lines!
    case 'L':
    case 'H':
    case 'V':
      nx = (activeCmd === 'V') ? x : eatNum();
      ny = (activeCmd === 'H') ? y : eatNum();
      path.lineTo((nx - 5) * mul, (ny - 5) * mul);
      x = nx;
      y = ny;
      break;
    case 'l':
    case 'h':
    case 'v':
      nx = (activeCmd === 'v') ? x : (x + eatNum());
      ny = (activeCmd === 'h') ? y : (y + eatNum());
      path.lineTo((nx - 5) * mul, (ny - 5) * mul);
      x = nx;
      y = ny;
      break;
      // - cubic bezier
    case 'C':
      x1 = eatNum();
      y1 = eatNum();
    case 'S':
      if (activeCmd === 'S') {
        x1 = 2 * x - x2;
        y1 = 2 * y - y2;
      }
      x2 = eatNum();
      y2 = eatNum();
      nx = eatNum();
      ny = eatNum();
      path.bezierCurveTo((x1 - 5) * mul, (y1 - 5) * mul, (x2 - 5) * mul, (y2 - 5) * mul, (nx - 5) * mul, (ny - 5) * mul);
      x = nx;
      y = ny;
      break;
    case 'c':
      x1 = x + eatNum();
      y1 = y + eatNum();
    case 's':
      if (activeCmd === 's') {
        x1 = 2 * x - x2;
        y1 = 2 * y - y2;
      }
      x2 = x + eatNum();
      y2 = y + eatNum();
      nx = x + eatNum();
      ny = y + eatNum();
      path.bezierCurveTo((x1 - 5) * mul, (y1 - 5) * mul, (x2 - 5) * mul, (y2 - 5) * mul, (nx - 5) * mul, (ny - 5) * mul);
      x = nx;
      y = ny;
      break;
      // - quadratic bezier
    case 'Q':
      x1 = eatNum();
      y1 = eatNum();
    case 'T':
      if (activeCmd === 'T') {
        x1 = 2 * x - x1;
        y1 = 2 * y - y1;
      }
      nx = eatNum();
      ny = eatNum();
      path.quadraticCurveTo((x1 - 5) * mul, (y1 - 5) * mul, (nx - 5) * mul, (ny - 5) * mul);
      x = nx;
      y = ny;
      break;
    case 'q':
      x1 = x + eatNum();
      y1 = y + eatNum();
    case 't':
      if (activeCmd === 't') {
        x1 = 2 * x - x1;
        y1 = 2 * y - y1;
      }
      nx = x + eatNum();
      ny = y + eatNum();
      path.quadraticCurveTo((x1 - 5) * mul, (y1 - 5) * mul, (nx - 5) * mul, (ny - 5) * mul);
      x = nx;
      y = ny;
      break;
      // - elliptical arc
    case 'A':
      rx = eatNum();
      ry = eatNum();
      xar = eatNum() * DEGS_TO_RADS;
      laf = eatNum();
      sf = eatNum();
      nx = eatNum();
      ny = eatNum();
      if (rx !== ry) {
        //  console.warn("Forcing elliptical arc to be a circular one :(",rx, ry);
      }
      // SVG implementation notes does all the math for us! woo!
      // http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
      // step1, using x1 as x1'
      x1 = Math.cos(xar) * (x - nx) / 2 + Math.sin(xar) * (y - ny) / 2;
      y1 = -Math.sin(xar) * (x - nx) / 2 + Math.cos(xar) * (y - ny) / 2;
      // step 2, using x2 as cx'
      var norm = Math.sqrt(
        (rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1) /
        (rx * rx * y1 * y1 + ry * ry * x1 * x1));
      if (laf === sf)
        norm = -norm;
      x2 = norm * rx * y1 / ry;
      y2 = norm * -ry * x1 / rx;
      // step 3
      cx = Math.cos(xar) * x2 - Math.sin(xar) * y2 + (x + nx) / 2;
      cy = Math.sin(xar) * x2 + Math.cos(xar) * y2 + (y + ny) / 2;

      var u = new THREE.Vector2(1, 0),
        v = new THREE.Vector2((x1 - x2) / rx, (y1 - y2) / ry);
      var startAng = Math.acos(u.dot(v) / u.length() / v.length());
      if (u.x * v.y - u.y * v.x < 0)
        startAng = -startAng;

      // we can reuse 'v' from start angle as our 'u' for delta angle
      u.x = (-x1 - x2) / rx;
      u.y = (-y1 - y2) / ry;

      var deltaAng = Math.acos(v.dot(u) / v.length() / u.length());
      // This normalization ends up making our curves fail to triangulate...
      if (v.x * u.y - v.y * u.x < 0)
        deltaAng = -deltaAng;
      if (!sf && deltaAng > 0)
        deltaAng -= Math.PI * 2;
      if (sf && deltaAng < 0)
        deltaAng += Math.PI * 2;

      path.absarc((cx - 5) * mul, (cy - 5) * mul, (rx - 5) * mul, startAng, startAng + deltaAng, sf);
      x = nx;
      y = ny;
      break;
    default:
      throw new Error("weird path command: " + activeCmd);
    }
    if (firstX === null) {
      firstX = x;
      firstY = y;
    }
    // just reissue the command
    if (canRepeat && nextIsNum())
      continue;
    activeCmd = pathStr[idx++];
  }

  return path;
}

var AuraGramme = function (rendrer, readyCallback) {
  this.renderer = null;
  this.scene = new THREE.Scene();
  this.sceneRTT = new THREE.Scene();
  this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  this.camera.position.z = 850;
  this.renderer3D = null;


  this.cameraRTT = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerWidth / 2, window.innerWidth / -2, -10000, 10000);
  this.cameraRTT.position.z = 800;

  //


  this.rtTexture = new THREE.WebGLRenderTarget(window.innerWidth, window.innerWidth, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBFormat,

  });




  this.path = new THREE.Shape();
  this.time = new Date().getTime();
  this.emitter = new _Emitter(aura.space, aura.lifeTime, this.time, 100000);

  var cadreNoir = new THREE.Shape();
  cadreNoir.moveTo(window.innerWidth / -2, window.innerWidth / -2);
  cadreNoir.lineTo(window.innerWidth / 2, window.innerWidth / -2);
  cadreNoir.lineTo(window.innerWidth / 2, window.innerWidth / 2);
  cadreNoir.lineTo(window.innerWidth / -2, window.innerWidth / 2);
  cadreNoir.lineTo(window.innerWidth / -2, window.innerWidth / -2);


  var cadreLine = new THREE.Line(cadreNoir.makeGeometry(), new THREE.LineBasicMaterial({
    color: 'black',
    dephtTest: true
  }));
  cadreLine.position.z = 1;
  this.sceneRTT.add(cadreLine);
  this.sceneRTT.add(this.emitter.pointCloud);

  this.gui = null;
}


AuraGramme.prototype = {
  change: function () {
    this.emitter.uniforms.size.value = aura.size;
    this.emitter.uniforms.eff_col.value = aura.effCol;
    this.emitter.uniforms.eff_size.value = aura.effSize;
    this.emitter.uniforms.texture.value = aura.forme;
    this.emitter.uniforms.ca1.value = aura.color1;
    this.emitter.uniforms.ca2.value = aura.color2;

  },
  size_away: function () {
    var h = 2 * this.camera.position.z * Math.tan(this.camera.fov / 2 * (Math.PI / 180));
    var w = h * window.innerWidth / window.innerHeight;
    return {
      width: w,
      height: h
    };
  },
  screen: function (w, h) {
    var geo = new THREE.Geometry();

    //centre
    geo.vertices.push(new THREE.Vector3(0, 0, 0)); //0

    //les 4 coins
    geo.vertices.push(new THREE.Vector3(-w / 2, h / 2, 0)); //1
    geo.vertices.push(new THREE.Vector3(-w / 2, -h / 2, 0)); //2
    geo.vertices.push(new THREE.Vector3(w / 2, -h / 2, 0)); //3
    geo.vertices.push(new THREE.Vector3(w / 2, h / 2, 0)); //4

    //triangles
    geo.faces.push(new THREE.Face3(0, 4, 1)); //haut
    geo.faces.push(new THREE.Face3(0, 2, 3)); //bas
    geo.faces.push(new THREE.Face3(0, 3, 4)); //g
    geo.faces.push(new THREE.Face3(0, 1, 2)); //d

    var p = 0;
    if (w > h) {
      p = ((w - (h / 2)) / 2) / w;
    } else {
      p = ((h - (w / 2)) / 2) / h;
    }
    //   geo.faceVertexUvs[0].push([new THREE.Vector2(0, 0.5), new THREE.Vector2(1, -p), new THREE.Vector2(1, 1 + p)]);
    //   geo.faceVertexUvs[0].push([new THREE.Vector2(0, 0.5), new THREE.Vector2(1, 1 + p), new THREE.Vector2(1, -p)]);
    geo.faceVertexUvs[0].push([new THREE.Vector2(0, 0.5), new THREE.Vector2(1, 0), new THREE.Vector2(1, 1)]);
    geo.faceVertexUvs[0].push([new THREE.Vector2(0, 0.5), new THREE.Vector2(1, 1), new THREE.Vector2(1, 0)]);
    if (w > h) {
      p = ((h - (h / 2)) / 2) / h;
    } else {
      p = ((h - (w / 2)) / 2) / h;
    }
    //  geo.faceVertexUvs[0].push([new THREE.Vector2(0, 0.5), new THREE.Vector2(1, -p), new THREE.Vector2(1, 1 + p)]);
    //  geo.faceVertexUvs[0].push([new THREE.Vector2(0, 0.5), new THREE.Vector2(1, 1 + p), new THREE.Vector2(1, -p)]);
    geo.faceVertexUvs[0].push([new THREE.Vector2(0, 0.5), new THREE.Vector2(1, 0), new THREE.Vector2(1, 1)]);
    geo.faceVertexUvs[0].push([new THREE.Vector2(0, 0.5), new THREE.Vector2(1, 1), new THREE.Vector2(1, 0)]);

    geo.computeFaceNormals();
    geo.computeVertexNormals();
    return geo;
  },

  init: function () {

    $('body').prepend($('#pageReco').html());
    $('body').prepend('<canvas id="renderer"></canvas>');
    $('body').css({
      'overflow': 'auto'
    });
    this.renderer = $('#renderer');
    this.renderer3D = new THREE.WebGLRenderer({
      canvas: this.renderer.get(0),
      alpha: false,
      antialias: true
    });

    /*
    this.gui = new dat.GUI();

    this.gui.add(aura, 'vel', 0, 100, 1).name('Vitesse');

    var obj = this;
    this.gui.add(aura, 'dispertion', 0, 10, 1).name('Dispertion');
    this.gui.add(aura, 'lifeTime', 10, 10000, 10).name('Durée de vie');
    this.gui.add(aura, 'size', 0, 50, 1).name("taille d'origine").onChange(function (a) {
      obj.emitter.uniforms.size.value = a;
    });
    this.gui.add(aura, 'space', 10, 500, 1).name('Nombre générées par secondes');

    this.gui.add(aura, 'effCol', 0, 200, 1).name("Couleur / age").onChange(function (a) {
      obj.emitter.uniforms.eff_col.value = a
    });

    this.gui.add(aura, 'effSize', -100, 100, 1).name("Taille / age").onChange(function (a) {
      obj.emitter.uniforms.eff_size.value = a
    });

    this.gui.add(aura, 'forme1').name('Cercles doux').listen().onChange(function (a) {

      aura.forme1 = true;
      aura.forme2 = false;
      aura.forme3 = false;
      obj.emitter.uniforms.texture.value = disquepleindoux;
    });
    this.gui.add(aura, 'forme2').name('Cercles durs').listen().onChange(function (a) {

      aura.forme1 = false;
      aura.forme2 = true;
      aura.forme3 = false;
      obj.emitter.uniforms.texture.value = disquepleindur;

    });
    this.gui.add(aura, 'forme3').name('Ronds évidés').listen().onChange(function (a) {

      aura.forme1 = false;
      aura.forme2 = false;
      aura.forme3 = true;
      obj.emitter.uniforms.texture.value = ronds;

    });

    this.gui.addColor(aura, 'color1').name('Couleur 1').onChange(function (a) {

      aura.color1 = a;
      obj.emitter.uniforms.ca1.value = new THREE.Color(a);
    });
    this.gui.addColor(aura, 'color2').name('Couleur 2').onChange(function (a) {

      aura.color2 = a;
      // console.log(a);
      obj.emitter.uniforms.ca2.value = new THREE.Color(a);
    });

    this.gui.close();
    */
    this.renderer3D.setClearColor(0x000000, 1);
    this.renderer3D.setSize(window.innerWidth, window.innerHeight);

    var t = this.size_away();
    var s = (t.width > t.height) ? t.height : t.width;

    this.screen = new THREE.Mesh(this.screen(s, s), new THREE.MeshBasicMaterial({
      color: 'white',
      map: this.rtTexture
    }))
    this.scene.add(this.screen);

    var scale = window.innerWidth / 10;

    //-37,134-6,198,126,188
    this.path = transformSVGPath("M9.343,8.922C9.828,8.907,9.609,1.1,9.219,1.016 S7.813,8.107,7.484,8.172S7.234,4.448,6.75,4.134S5.847,4.985,5.753,5.164S5,4.752,4.688,4.577S3.547,4.298,2.641,4.532 S1.125,5.066,1.844,5.405c0.719,0.339,0.578,0.444,1.625,0.469c1.047,0.025,1.953-1.052,1.938-1.446 C5.391,4.034,5.422,3.854,4.578,3.829s-1.719-0.1-1.813,0.219S2.406,4.896,2.906,5.071s1.031,0.484,1.578,0.768 S4.297,6.786,5.422,6.766s1.266,0.128,1.047-0.5S6.109,2.386,6.5,2.281s0.984-0.063,1.266,0.281S7.625,5.43,7.875,5.724 C8.125,6.018,8.859,8.937,9.343,8.922z", scale);






    //debug
    /*var line = new THREE.Line(this.path.makeGeometry(), new THREE.LineBasicMaterial({
      color: 'white'
    }))
    this.sceneRTT.add(line);*/
    this.time = 0;

  },

  start: function () {

    $('#intro').hide();
    this.change();
  },
  update: function () {

    this.time = new Date().getTime();
    this.emitter.update(this.time, this.path, aura.vel / 1000);
    this.renderer3D.render(this.sceneRTT, this.cameraRTT, this.rtTexture, true);
    this.renderer3D.render(this.scene, this.camera);
  },


  validate: function () {

  },
  destroy: function () {
    this.scene = null;
    this.camera = null;
    $('#renderer').remove();
    delete this;
  }
}




/****************************************************************************************

                          GLOBAL

****************************************************************************************/


var _choix = function () {
  this.aura_col1 = '#000000';
  this.aura_col2 = '#000000';
  this.couleur = '#000000';
  this.lieu = -1;
  this.lum = -1;
  this.son = -1;
  this.texture = -1;
  this.gout = -1;
  this.genre = '';
}

_choix.prototype = {

  change: function (xp, a, b, c) {
    console.log('change');

    switch (xp) {
    case 'couleur':
      this.couleur = a;
      this.aura_col1 = a;
      this.aura_col2 = c;
      aura.color1 = new THREE.Color(a);
      aura.color2 = new THREE.Color(c);
      break;
    case 'lieu':
      this.lieu = a;
      this.lum = b;
      break;
    case 'son':
      this.son = a;
      switch (a) {
      case 0:
        aura.vel = 5;
        aura.space = 50;
        break;
      case 1:
        aura.vel = 25;
        aura.space = 600;
        break;
      case 2:
        aura.vel = 80;
        aura.space = 100;
        break;
      case 3:
        aura.vel = 10;
        aura.space = 500;
        break;
      case 4:
        aura.vel = 25;
        aura.space = 500;
        break;
      case 5:
        aura.vel = 80;
        aura.space = 500;
        break;
      }
      break;
    case 'texture':
      this.texture = a;
      switch (a) {
      case 0: //jean
        aura.dispertion = 8;
        aura.size = 20;
        aura.forme = disquepleindur;
        break;
      case 1: //crystal
        aura.dispertion = 10;
        aura.size = 10;
        aura.forme = disquepleindur;
        break;
      case 2: //elec
        aura.dispertion = 10;
        aura.size = 1;
        aura.forme = disquepleindur;
        break;
      case 3: //eau
        aura.dispertion = 10;
        aura.size = 40;
        aura.forme = ronds;
        break;
      case 4: //satin
        aura.dispertion = 10;
        aura.size = 30;
        aura.forme = disquepleindoux;
        break;
      case 5: //nuage
        aura.dispertion = 0;
        aura.size = 40;
        aura.forme = ronds;
        break;
      case 6: //peche
        aura.dispertion = 9;
        aura.size = 30;
        aura.forme = disquepleindoux;
        break;
      case 7: //petal
        aura.dispertion = 8;
        aura.size = 20;
        aura.forme = disquepleindoux;
        break;
      case 8: //balles
        aura.dispertion = 6;
        aura.size = 20;
        aura.forme = disquepleindoux;
        break;
      }
      break;
    case 'gout':
      this.gout = a;
      break;
    case 'genre':
      this.genre = a;
      break;

    }
    reco({
      texture: this.texture,
      couleur: [this.couleur,this.aura_col1,this.aura_col2],
      lieu: this.lieu,
      lum:this.lum,
      son: this.son,
      gout: this.gout,
      genre: this.genre
    });
  }
}


var e = 2.158585;
var XPs = [];
var Intro = null;

var disquepleindoux = THREE.ImageUtils.loadTexture("images/disc.png");
var disquepleindur = THREE.ImageUtils.loadTexture("images/disc2.png");
var ronds = THREE.ImageUtils.loadTexture("images/disc3.png");
var aura = {
  size: 5,
  color1: new THREE.Color('#FE86cd'),
  color2: new THREE.Color('#0000ff'),
  dispertion: 10,
  forme: disquepleindoux,
  forme1: true,
  forme2: false,
  forme3: false,
  lifeTime: 10000,
  space: 500,
  vel: 38.0,

  effCol: 128,
  effSize: 2
};

XPs = new XP_texture('#renderer', null);

XP_pause = false;
var textVal = ['textures', 'color', 'taste', 'sound', 'place', 'gender', 'aura'];
var Choix = new _choix();


function validate_yes() {
  XPs.destroy();
  delete XPs;
  $('*').unbind();
  XPs = null;
  //Components.utils.forceGC();
  xp_encours++;

  if (xp_encours < 5) {
    $('#nb').html('- ' + (xp_encours + 1) + ' / 5 -');
  } else {
    $('#nb').html('');
  }

  $('#xp_txt').html(textVal[xp_encours]);
  switch (textVal[xp_encours]) {
  case 'textures':
    XPs = new XP_texture('#renderer', null);
    break;
  case 'color':
    XPs = new XP_couleur('#renderer', null);
    break;
  case 'taste':
    XPs = new XP_gout('#renderer', null);
    break;
  case 'sound':
    XPs = new XP_son('#renderer', null);
    break;
  case 'place':
    XPs = new XP_lieux('#renderer', null);
    break;
  case 'gender':
    XPs = new XP_sexe('#renderer', null);
    break;
  case 'aura':
    XPs = new AuraGramme('#renderer', null);
    break;

  }


  XPs.init();
  if (Intro) {
    //Intro.pause = false;
  }
  if (xp_encours == 6) {
    XPs.start();

    // Intro.pause = true;
  } else {
    // $('#intro').fadeIn(5);
  }
};

function validate_no() {
  //retour à l'xp
  $('#validate').hide();
  XPs.no();
};

function start() {
  //netoyage des tutos => si un tuto est ouvert avant de lancer l'XP
  //la modale de validation se cache (.access-info)
  //et à l'XP suivante le tuto est visible d'entré (.access_info3)
  //retirer les classes permet d'éviter le problème
  $('.access-info3').removeClass('access-info3');
  $('.access-info').removeClass('access-info');


  $('#intro').hide();
  if (Intro) {
    Intro.pause = true;
  }
  XPs.start();
};


function extractUrlParams() {
  var t = location.search.substring(1).split('&');

  params = [];
  for (var i = 0; i < t.length; i++) {
    var x = t[i].split('=');

    params[x[0]] = x[1];

  }
  // return f;
};

var xp_encours = 0;
var params = [];


function goXP(){

  $('#intro').hide();
  extractUrlParams();
  // console.log(params);
  // console.log(params.length);
  if ((params['XP'])) {
    xp_encours = params['XP'] - 1;
    switch (textVal[xp_encours]) {
    case 'textures':
      console.log('texture');
      XPs = new XP_texture('#renderer', null);
      break;
    case 'color':
      XPs = new XP_couleur('#renderer', null);
      break;
    case 'taste':
      XPs = new XP_gout('#renderer', null);
      break;
    case 'sound':
      XPs = new XP_son('#renderer', null);
      break;
    case 'place':
      XPs = new XP_lieux('#renderer', null);
      break;
    case 'gender':
      XPs = new XP_sexe('#renderer', null);
      break;
    case 'aura':
       XPs = new AuraGramme('#renderer', null);
      break;

    }
    XPs.init();
  } else {

    if ((params['id'])) {
        loadDiagnostic(params);
    } else {
      // Intro = new _Intro(function () {
      xp_encours = 0;
      XPs.init();
      // });
    }
  }

  $('#nb').html('- ' + (xp_encours + 1) + ' / 5 -');
  $('#xp_txt').html(textVal[xp_encours]);


  function render() {

    requestAnimationFrame(render);
    if (Intro) {
      if (!Intro.pause) {
        Intro.update();
      } else {

        XPs.update();

      }
    } else {
      XPs.update();
    }
  }
  render();
};

$(function(){
    setTimeout(goXP,9000);
})
