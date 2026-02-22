shader_type spatial;
render_mode blend_add, depth_draw_opaque, cull_disabled, unshaded;

// Luminara Shader Pack - Force Field / Energy Shield
// Hexagonal patterned energy shield with intersection highlight and pulse.

group_uniforms color;
uniform vec4 primary_color : source_color = vec4(0.1, 0.5, 1.0, 1.0);
uniform vec4 secondary_color : source_color = vec4(0.0, 0.8, 1.0, 1.0);
uniform float brightness : hint_range(0.0, 10.0) = 2.0;
uniform float base_alpha : hint_range(0.0, 1.0) = 0.15;

group_uniforms pattern;
uniform float hex_scale : hint_range(1.0, 50.0) = 12.0;
uniform float hex_line_width : hint_range(0.01, 0.2) = 0.05;
uniform float pattern_intensity : hint_range(0.0, 1.0) = 0.6;

group_uniforms intersection;
uniform float intersection_width : hint_range(0.0, 5.0) = 1.0;
uniform float intersection_intensity : hint_range(0.0, 10.0) = 4.0;

group_uniforms fresnel;
uniform float fresnel_power : hint_range(0.0, 10.0) = 3.0;
uniform float fresnel_intensity : hint_range(0.0, 5.0) = 2.0;

group_uniforms animation;
uniform float pulse_speed : hint_range(0.0, 10.0) = 2.0;
uniform float pulse_intensity : hint_range(0.0, 1.0) = 0.3;
uniform float scroll_speed : hint_range(0.0, 5.0) = 0.5;

uniform sampler2D DEPTH_TEXTURE : hint_depth_texture, filter_linear_mipmap;

// Hex grid pattern
vec4 hex_coords(vec2 uv) {
	vec2 r = vec2(1.0, 1.732);
	vec2 h = r * 0.5;
	vec2 a = mod(uv, r) - h;
	vec2 b = mod(uv - h, r) - h;
	vec2 gv = length(a) < length(b) ? a : b;
	float edge = 0.5 - max(
		dot(abs(gv), normalize(vec2(1.0, 1.732))),
		abs(gv.x)
	);
	return vec4(gv, edge, 0.0);
}

void fragment() {
	// Fresnel
	float fresnel = pow(1.0 - abs(dot(NORMAL, VIEW)), fresnel_power) * fresnel_intensity;

	// Hex pattern
	vec2 hex_uv = UV * hex_scale + vec2(0.0, TIME * scroll_speed);
	vec4 hex = hex_coords(hex_uv);
	float hex_edge = 1.0 - smoothstep(hex_line_width, hex_line_width + 0.02, hex.z);

	// Pulse animation
	float pulse = sin(TIME * pulse_speed) * 0.5 + 0.5;
	float pulse_factor = 1.0 + pulse * pulse_intensity;

	// Depth-based intersection
	float depth_raw = texture(DEPTH_TEXTURE, SCREEN_UV).r;
	vec4 world_from_depth = INV_PROJECTION_MATRIX * vec4(SCREEN_UV * 2.0 - 1.0, depth_raw * 2.0 - 1.0, 1.0);
	world_from_depth.xyz /= world_from_depth.w;
	float depth_diff = VERTEX.z - world_from_depth.z;
	float intersection = 1.0 - clamp(depth_diff / intersection_width, 0.0, 1.0);
	intersection = pow(intersection, 2.0) * intersection_intensity;

	// Color blending
	vec3 color = mix(primary_color.rgb, secondary_color.rgb, fresnel);

	// Combine layers
	float pattern_alpha = hex_edge * pattern_intensity;
	float final_alpha = base_alpha + fresnel * 0.5 + pattern_alpha + intersection;
	final_alpha *= pulse_factor;

	ALBEDO = color * brightness * pulse_factor + secondary_color.rgb * intersection;
	ALPHA = clamp(final_alpha, 0.0, 1.0);
}
