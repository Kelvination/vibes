shader_type spatial;
render_mode cull_disabled;

// Luminara Shader Pack - Wind / Vegetation Sway
// Vertex animation for foliage, grass, and cloth with wind simulation.

group_uniforms base;
uniform vec4 base_color : source_color = vec4(0.3, 0.6, 0.2, 1.0);
uniform sampler2D base_texture : source_color, filter_linear_mipmap;
uniform float alpha_scissor : hint_range(0.0, 1.0) = 0.5;
uniform float roughness : hint_range(0.0, 1.0) = 0.8;

group_uniforms wind;
uniform float wind_strength : hint_range(0.0, 5.0) = 1.0;
uniform vec2 wind_direction = vec2(1.0, 0.5);
uniform float wind_speed : hint_range(0.0, 10.0) = 2.0;
uniform float wind_turbulence : hint_range(0.0, 5.0) = 1.0;
uniform float wind_frequency : hint_range(0.0, 10.0) = 3.0;

group_uniforms sway;
uniform float sway_amount : hint_range(0.0, 2.0) = 0.5;
uniform float sway_speed : hint_range(0.0, 10.0) = 1.5;
uniform bool use_vertex_color_mask = true; // Red channel = sway weight
uniform float height_mask_power : hint_range(0.0, 5.0) = 2.0;

group_uniforms detail;
uniform float micro_sway : hint_range(0.0, 1.0) = 0.2;
uniform float micro_frequency : hint_range(0.0, 20.0) = 8.0;

group_uniforms color_variation;
uniform bool color_variation_enabled = true;
uniform vec4 tip_color : source_color = vec4(0.5, 0.7, 0.1, 1.0);
uniform float tip_blend : hint_range(0.0, 1.0) = 0.3;
uniform vec4 shadow_tint : source_color = vec4(0.1, 0.2, 0.1, 1.0);
uniform float subsurface_amount : hint_range(0.0, 1.0) = 0.3;

varying float sway_mask;
varying vec3 world_pos;

float hash_pos(vec3 p) {
	return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

void vertex() {
	world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;

	// Sway mask: use vertex color red channel or UV.y (height)
	if (use_vertex_color_mask) {
		sway_mask = COLOR.r;
	} else {
		sway_mask = pow(UV.y, height_mask_power);
	}

	// Per-instance variation based on world position
	float instance_phase = hash_pos(floor(world_pos * 0.1)) * TAU;
	float instance_scale = 0.7 + hash_pos(floor(world_pos * 0.1) + vec3(42.0)) * 0.6;

	float t = TIME;
	vec2 wind_dir = normalize(wind_direction);

	// Main wind sway
	float wind_noise = sin(dot(world_pos.xz, wind_dir) * wind_frequency + t * wind_speed + instance_phase);
	wind_noise += sin(dot(world_pos.xz, wind_dir) * wind_frequency * 0.5 + t * wind_speed * 1.3) * 0.5;
	wind_noise *= 0.667; // normalize

	// Turbulence (cross-wind variation)
	float turb = sin(world_pos.x * 2.0 + t * 3.0) * cos(world_pos.z * 1.5 + t * 2.5);
	turb *= wind_turbulence;

	// Gentle sway
	float sway_val = sin(t * sway_speed + instance_phase) * sway_amount;

	// Micro detail sway (leaves/tips)
	float micro = sin(t * micro_frequency + VERTEX.x * 10.0 + VERTEX.z * 10.0) * micro_sway;

	// Combine and apply
	float total_x = (wind_noise * wind_strength + turb * 0.3 + sway_val + micro) * sway_mask * instance_scale;
	float total_z = (wind_noise * wind_strength * 0.3 + turb * 0.5 + micro * 0.5) * sway_mask * instance_scale;

	VERTEX.x += total_x * 0.1;
	VERTEX.z += total_z * 0.1;

	// Slight vertical compression when bending
	VERTEX.y -= abs(total_x + total_z) * 0.02 * sway_mask;
}

void fragment() {
	vec4 tex = texture(base_texture, UV);
	vec3 color = base_color.rgb * tex.rgb;

	// Color variation (tip coloring)
	if (color_variation_enabled) {
		color = mix(color, tip_color.rgb * tex.rgb, sway_mask * tip_blend);
	}

	ALBEDO = color;
	ALPHA = tex.a;
	ALPHA_SCISSOR_THRESHOLD = alpha_scissor;
	ROUGHNESS = roughness;
	BACKLIGHT = vec3(subsurface_amount);
}
