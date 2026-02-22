shader_type spatial;
render_mode diffuse_toon, specular_toon;

// Luminara Shader Pack - Toon/Cel Shading
// A versatile toon shader with configurable color bands, outline, and rim lighting.

group_uniforms base;
uniform vec4 base_color : source_color = vec4(0.8, 0.4, 0.2, 1.0);
uniform sampler2D base_texture : source_color, filter_linear_mipmap;
uniform float bands : hint_range(2.0, 10.0, 1.0) = 3.0;

group_uniforms lighting;
uniform float shadow_threshold : hint_range(0.0, 1.0) = 0.5;
uniform vec4 shadow_color : source_color = vec4(0.15, 0.1, 0.2, 1.0);
uniform float shadow_smoothness : hint_range(0.0, 0.1) = 0.02;

group_uniforms rim;
uniform bool rim_enabled = true;
uniform vec4 rim_color : source_color = vec4(1.0, 0.9, 0.8, 1.0);
uniform float rim_amount : hint_range(0.0, 1.0) = 0.7;
uniform float rim_intensity : hint_range(0.0, 5.0) = 1.5;

group_uniforms specular;
uniform float specular_size : hint_range(0.0, 1.0) = 0.3;
uniform float specular_smoothness : hint_range(0.0, 0.1) = 0.02;
uniform vec4 specular_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform float specular_intensity : hint_range(0.0, 5.0) = 1.0;

varying vec3 world_normal;
varying vec3 world_pos;

void vertex() {
	world_normal = (MODEL_MATRIX * vec4(NORMAL, 0.0)).xyz;
	world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

float quantize(float value, float steps) {
	return floor(value * steps) / steps;
}

void fragment() {
	vec4 tex = texture(base_texture, UV);
	ALBEDO = base_color.rgb * tex.rgb;
	ALPHA = base_color.a * tex.a;
	ROUGHNESS = 0.8;
	SPECULAR = specular_size;
}

void light() {
	// Quantized diffuse lighting
	float NdotL = dot(NORMAL, LIGHT);
	float stepped = quantize(NdotL * 0.5 + 0.5, bands);
	float shade = smoothstep(shadow_threshold - shadow_smoothness, shadow_threshold + shadow_smoothness, stepped);
	vec3 diffuse = mix(shadow_color.rgb, ALBEDO, shade) * ATTENUATION * LIGHT_COLOR;

	// Toon specular highlight
	vec3 half_dir = normalize(LIGHT + VIEW);
	float NdotH = dot(NORMAL, half_dir);
	float spec = smoothstep(1.0 - specular_size - specular_smoothness, 1.0 - specular_size + specular_smoothness, NdotH);
	vec3 specular = specular_color.rgb * spec * specular_intensity * ATTENUATION * LIGHT_COLOR;

	// Rim lighting
	vec3 rim = vec3(0.0);
	if (rim_enabled) {
		float NdotV = 1.0 - dot(NORMAL, VIEW);
		float rim_factor = smoothstep(rim_amount - 0.01, rim_amount + 0.01, NdotV);
		rim = rim_color.rgb * rim_factor * rim_intensity * max(NdotL, 0.0) * ATTENUATION;
	}

	DIFFUSE_LIGHT += diffuse + specular + rim;
}
