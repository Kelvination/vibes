shader_type spatial;
render_mode cull_disabled;

// Luminara Shader Pack - Dissolve Effect
// Burn-edge dissolve with customizable noise, edge glow, and emission.

group_uniforms dissolve;
uniform float dissolve_amount : hint_range(0.0, 1.0) = 0.0;
uniform sampler2D dissolve_noise : filter_linear_mipmap, repeat_enable;
uniform float noise_scale : hint_range(0.1, 10.0) = 1.0;
uniform bool use_world_coords = false;

group_uniforms edge;
uniform float edge_width : hint_range(0.0, 0.2) = 0.05;
uniform vec4 edge_color_inner : source_color = vec4(1.0, 0.8, 0.0, 1.0);
uniform vec4 edge_color_outer : source_color = vec4(1.0, 0.2, 0.0, 1.0);
uniform float edge_emission_strength : hint_range(0.0, 20.0) = 6.0;

group_uniforms base;
uniform vec4 base_color : source_color = vec4(0.9, 0.9, 0.9, 1.0);
uniform sampler2D base_texture : source_color, filter_linear_mipmap;
uniform float metallic : hint_range(0.0, 1.0) = 0.0;
uniform float roughness : hint_range(0.0, 1.0) = 0.5;

group_uniforms animation;
uniform bool animate = false;
uniform float animation_speed : hint_range(0.1, 5.0) = 1.0;
uniform float animation_direction : hint_range(-1.0, 1.0) = 1.0;

// Simple hash-based noise fallback if no texture is provided
float hash(vec2 p) {
	vec3 p3 = fract(vec3(p.xyx) * 0.1031);
	p3 += dot(p3, p3.yzx + 33.33);
	return fract((p3.x + p3.y) * p3.z);
}

float value_noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	vec2 shift = vec2(100.0);
	mat2 rot = mat2(vec2(cos(0.5), sin(0.5)), vec2(-sin(0.5), cos(0.5)));
	for (int i = 0; i < 4; i++) {
		v += a * value_noise(p);
		p = rot * p * 2.0 + shift;
		a *= 0.5;
	}
	return v;
}

varying vec3 world_position;

void vertex() {
	world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	vec4 tex = texture(base_texture, UV);
	ALBEDO = base_color.rgb * tex.rgb;
	METALLIC = metallic;
	ROUGHNESS = roughness;

	// Sample dissolve pattern
	vec2 noise_uv = use_world_coords ? world_position.xz : UV;
	noise_uv *= noise_scale;

	float noise_val = fbm(noise_uv);

	// Animated dissolve
	float dissolve = dissolve_amount;
	if (animate) {
		dissolve = fract(TIME * animation_speed * 0.2) * animation_direction;
		dissolve = clamp(dissolve, 0.0, 1.0);
	}

	// Apply dissolve
	float threshold = dissolve;
	float diff = noise_val - threshold;

	if (diff < 0.0) {
		discard;
	}

	// Edge glow
	float edge_factor = 1.0 - smoothstep(0.0, edge_width, diff);
	vec3 edge_color = mix(edge_color_outer.rgb, edge_color_inner.rgb, edge_factor);

	ALBEDO = mix(ALBEDO, edge_color, edge_factor);
	EMISSION = edge_color * edge_factor * edge_emission_strength;
}
