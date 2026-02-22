shader_type spatial;
render_mode blend_mix, depth_draw_opaque, cull_back;

// Luminara Shader Pack - Frosted Glass / Ice
// Realistic frosted glass with blur approximation, refraction, and frost patterns.

group_uniforms glass;
uniform vec4 tint_color : source_color = vec4(0.9, 0.95, 1.0, 0.3);
uniform float opacity : hint_range(0.0, 1.0) = 0.4;
uniform float roughness : hint_range(0.0, 1.0) = 0.15;
uniform float metallic : hint_range(0.0, 1.0) = 0.0;
uniform float specular_strength : hint_range(0.0, 1.0) = 0.7;

group_uniforms frost;
uniform bool frost_enabled = true;
uniform float frost_amount : hint_range(0.0, 1.0) = 0.5;
uniform float frost_scale : hint_range(0.1, 20.0) = 5.0;
uniform float frost_roughness_boost : hint_range(0.0, 1.0) = 0.6;
uniform vec4 frost_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);

group_uniforms refraction;
uniform float refraction_strength : hint_range(0.0, 0.5) = 0.05;
uniform float blur_amount : hint_range(0.0, 10.0) = 3.0;

group_uniforms fresnel;
uniform float fresnel_power : hint_range(0.0, 10.0) = 4.0;
uniform float fresnel_opacity : hint_range(0.0, 1.0) = 0.8;

group_uniforms thickness;
uniform bool thickness_variation = true;
uniform sampler2D thickness_texture : filter_linear_mipmap;
uniform float thickness_scale : hint_range(0.0, 2.0) = 1.0;

uniform sampler2D SCREEN_TEXTURE : hint_screen_texture, filter_linear_mipmap;

// Voronoi-based frost pattern
vec2 random2(vec2 p) {
	return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

float voronoi(vec2 uv) {
	vec2 i = floor(uv);
	vec2 f = fract(uv);
	float min_dist = 1.0;
	for (int y = -1; y <= 1; y++) {
		for (int x = -1; x <= 1; x++) {
			vec2 neighbor = vec2(float(x), float(y));
			vec2 point = random2(i + neighbor);
			vec2 diff = neighbor + point - f;
			float dist = length(diff);
			min_dist = min(min_dist, dist);
		}
	}
	return min_dist;
}

float frost_pattern(vec2 uv, float scale) {
	float v1 = voronoi(uv * scale);
	float v2 = voronoi(uv * scale * 2.0 + vec2(5.2, 1.3));
	float v3 = voronoi(uv * scale * 4.0 + vec2(9.1, 4.7));
	return v1 * 0.5 + v2 * 0.3 + v3 * 0.2;
}

void fragment() {
	// Frost pattern
	float frost = 0.0;
	float frost_mask = 1.0;
	if (frost_enabled) {
		frost = frost_pattern(UV, frost_scale);
		frost_mask = smoothstep(1.0 - frost_amount, 1.0, frost);
	}

	// Thickness variation
	float thickness = 1.0;
	if (thickness_variation) {
		thickness = texture(thickness_texture, UV).r * thickness_scale;
	}

	// Refraction with blur approximation
	vec2 refracted_uv = SCREEN_UV + NORMAL.xy * refraction_strength;
	vec3 bg_color = vec3(0.0);
	float blur_samples = blur_amount + frost_mask * 3.0;
	float total_weight = 0.0;
	for (float i = 0.0; i < 8.0; i++) {
		float angle = i * PI * 2.0 / 8.0;
		vec2 offset = vec2(cos(angle), sin(angle)) * blur_samples * SCREEN_PIXEL_SIZE;
		bg_color += texture(SCREEN_TEXTURE, refracted_uv + offset).rgb;
		total_weight += 1.0;
	}
	bg_color += texture(SCREEN_TEXTURE, refracted_uv).rgb;
	total_weight += 1.0;
	bg_color /= total_weight;

	// Base glass color
	vec3 glass_color = mix(bg_color, tint_color.rgb, tint_color.a);

	// Apply frost coloring
	if (frost_enabled) {
		glass_color = mix(glass_color, frost_color.rgb, frost_mask * 0.5);
	}

	// Fresnel
	float fresnel = pow(1.0 - max(dot(NORMAL, VIEW), 0.0), fresnel_power);
	float final_opacity = mix(opacity, fresnel_opacity, fresnel);
	final_opacity = max(final_opacity, frost_mask * 0.4);

	ALBEDO = glass_color;
	ALPHA = final_opacity;
	ROUGHNESS = roughness + frost_mask * frost_roughness_boost;
	METALLIC = metallic;
	SPECULAR = specular_strength;
	NORMAL_MAP_DEPTH = 1.0;
}
