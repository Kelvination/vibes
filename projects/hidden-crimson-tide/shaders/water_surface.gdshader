shader_type spatial;
render_mode blend_mix, depth_draw_opaque, cull_back;

// Luminara Shader Pack - Stylized Water Surface
// Animated water with dual-layer waves, foam, depth fade, and refraction.

group_uniforms color;
uniform vec4 shallow_color : source_color = vec4(0.1, 0.6, 0.7, 0.8);
uniform vec4 deep_color : source_color = vec4(0.02, 0.15, 0.3, 0.95);
uniform float depth_distance : hint_range(0.1, 50.0) = 5.0;

group_uniforms waves;
uniform float wave_speed : hint_range(0.0, 5.0) = 1.0;
uniform float wave_height : hint_range(0.0, 2.0) = 0.15;
uniform vec2 wave_direction_1 : hint_range(-1.0, 1.0) = vec2(1.0, 0.0);
uniform vec2 wave_direction_2 : hint_range(-1.0, 1.0) = vec2(0.0, 1.0);
uniform float wave_frequency_1 : hint_range(0.1, 10.0) = 2.0;
uniform float wave_frequency_2 : hint_range(0.1, 10.0) = 3.5;

group_uniforms surface;
uniform float roughness : hint_range(0.0, 1.0) = 0.05;
uniform float metallic : hint_range(0.0, 1.0) = 0.3;
uniform float specular_strength : hint_range(0.0, 1.0) = 0.8;

group_uniforms normal_map;
uniform sampler2D normal_texture_1 : hint_normal, filter_linear_mipmap, repeat_enable;
uniform sampler2D normal_texture_2 : hint_normal, filter_linear_mipmap, repeat_enable;
uniform float normal_scale : hint_range(0.0, 5.0) = 1.0;
uniform float normal_tile : hint_range(0.1, 20.0) = 4.0;
uniform float normal_speed : hint_range(0.0, 2.0) = 0.3;

group_uniforms foam;
uniform bool foam_enabled = true;
uniform vec4 foam_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform float foam_amount : hint_range(0.0, 2.0) = 0.5;
uniform float foam_sharpness : hint_range(0.0, 10.0) = 3.0;

group_uniforms fresnel;
uniform float fresnel_power : hint_range(0.0, 10.0) = 3.0;
uniform float fresnel_intensity : hint_range(0.0, 1.0) = 0.5;

uniform sampler2D DEPTH_TEXTURE : hint_depth_texture, filter_linear_mipmap;
uniform sampler2D SCREEN_TEXTURE : hint_screen_texture, filter_linear_mipmap;

float wave(vec2 pos, vec2 dir, float freq, float t) {
	return sin(dot(normalize(dir), pos) * freq + t) * 0.5 + 0.5;
}

void vertex() {
	float t = TIME * wave_speed;
	vec3 world = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;

	float w1 = wave(world.xz, wave_direction_1, wave_frequency_1, t);
	float w2 = wave(world.xz, wave_direction_2, wave_frequency_2, t * 1.3);
	float combined = (w1 + w2) * 0.5;

	VERTEX.y += combined * wave_height;

	// Compute approximate tangent-space normals from wave derivatives
	float dx = cos(dot(normalize(wave_direction_1), world.xz) * wave_frequency_1 + t) * wave_height * wave_frequency_1 * 0.5;
	float dz = cos(dot(normalize(wave_direction_2), world.xz) * wave_frequency_2 + t * 1.3) * wave_height * wave_frequency_2 * 0.5;
	NORMAL = normalize(vec3(-dx, 1.0, -dz));
}

void fragment() {
	float t = TIME * normal_speed;
	vec2 uv1 = UV * normal_tile + vec2(t * 0.7, t * 0.3);
	vec2 uv2 = UV * normal_tile * 1.3 + vec2(-t * 0.4, t * 0.6);

	// Dual-layer normal mapping
	vec3 n1 = texture(normal_texture_1, uv1).rgb * 2.0 - 1.0;
	vec3 n2 = texture(normal_texture_2, uv2).rgb * 2.0 - 1.0;
	vec3 normal_blend = normalize(vec3(n1.xy + n2.xy, n1.z * n2.z)) * normal_scale;
	NORMAL_MAP = normal_blend * 0.5 + 0.5;

	// Depth-based color blending
	float depth_raw = texture(DEPTH_TEXTURE, SCREEN_UV).r;
	vec4 world_from_depth = INV_PROJECTION_MATRIX * vec4(SCREEN_UV * 2.0 - 1.0, depth_raw * 2.0 - 1.0, 1.0);
	world_from_depth.xyz /= world_from_depth.w;
	float depth_diff = VERTEX.z - world_from_depth.z;
	float depth_factor = clamp(depth_diff / depth_distance, 0.0, 1.0);

	vec4 water_color = mix(shallow_color, deep_color, depth_factor);

	// Fresnel
	float fresnel = pow(1.0 - max(dot(NORMAL, VIEW), 0.0), fresnel_power) * fresnel_intensity;
	water_color.rgb = mix(water_color.rgb, vec3(1.0), fresnel);

	// Foam at shallow depth
	if (foam_enabled) {
		float foam_factor = 1.0 - clamp(depth_diff / foam_amount, 0.0, 1.0);
		foam_factor = pow(foam_factor, foam_sharpness);
		water_color.rgb = mix(water_color.rgb, foam_color.rgb, foam_factor);
		water_color.a = mix(water_color.a, 1.0, foam_factor * 0.5);
	}

	ALBEDO = water_color.rgb;
	ALPHA = water_color.a;
	ROUGHNESS = roughness;
	METALLIC = metallic;
	SPECULAR = specular_strength;
}
