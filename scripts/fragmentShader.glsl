uniform sampler2D uReflectionTexture;
uniform float uTransparency;
uniform float uDistortionFactor;

varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {
  // Calcular a reflexão
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  vec3 reflectDirection = reflect(-viewDirection, vNormal);

  // Aplicar distorção ao vetor de reflexão
  reflectDirection.xy *= uDistortionFactor;

  // Mapear a reflexão para coordenadas de textura
  vec2 reflectionUV = reflectDirection.xy * 0.5 + 0.5;

  // Amostrar a textura de reflexão
  vec4 reflectionColor = texture2D(uReflectionTexture, reflectionUV);

  // Aplicar transparência
  gl_FragColor = vec4(reflectionColor.rgb, uTransparency);
}