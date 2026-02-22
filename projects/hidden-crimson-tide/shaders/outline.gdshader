shader_type spatial;

// Luminara Shader Pack - Outline / Stroke Effect
// Inverted-hull outline for 3D meshes with customizable color, width, and style.
// Apply this as a NEXT PASS material on your mesh for the outline effect.

render_mode unshaded, cull_front;

group_uniforms outline;
uniform vec4 outline_color : source_color = vec4(0.0, 0.0, 0.0, 1.0);
uniform float outline_width : hint_range(0.0, 0.5) = 0.03;
uniform bool use_vertex_color = false;

group_uniforms style;
uniform bool distance_fade = true;
uniform float fade_min_distance : hint_range(0.0, 50.0) = 5.0;
uniform float fade_max_distance : hint_range(0.0, 200.0) = 50.0;
uniform float width_at_distance : hint_range(0.0, 3.0) = 1.5;

group_uniforms animation;
uniform bool pulse_enabled = false;
uniform float pulse_speed : hint_range(0.0, 10.0) = 3.0;
uniform float pulse_min : hint_range(0.0, 1.0) = 0.5;
uniform float pulse_max : hint_range(1.0, 3.0) = 1.5;

void vertex() {
	float width = outline_width;

	// Pulse animation
	if (pulse_enabled) {
		float pulse = mix(pulse_min, pulse_max, sin(TIME * pulse_speed) * 0.5 + 0.5);
		width *= pulse;
	}

	// Distance-based width scaling
	if (distance_fade) {
		vec4 world_pos = MODEL_MATRIX * vec4(VERTEX, 1.0);
		float cam_dist = length(world_pos.xyz - CAMERA_POSITION_WORLD);
		float dist_factor = smoothstep(fade_min_distance, fade_max_distance, cam_dist);
		width *= mix(1.0, width_at_distance, dist_factor);
	}

	// Expand vertices along normals (inverted hull method)
	VERTEX += NORMAL * width;
}

void fragment() {
	vec3 color = outline_color.rgb;
	if (use_vertex_color) {
		color = COLOR.rgb;
	}
	ALBEDO = color;
	ALPHA = outline_color.a;
}
