shader_type spatial;
render_mode blend_add, depth_draw_opaque, cull_disabled, unshaded;

// Luminara Shader Pack - Energy Beam / Laser
// Animated energy beam with core glow, noise distortion, and particle sparkle.

group_uniforms color;
uniform vec4 core_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform vec4 inner_color : source_color = vec4(0.3, 0.7, 1.0, 1.0);
uniform vec4 outer_color : source_color = vec4(0.1, 0.2, 1.0, 0.5);
uniform float intensity : hint_range(0.0, 20.0) = 5.0;

group_uniforms beam;
uniform float core_width : hint_range(0.0, 0.5) = 0.05;
uniform float inner_width : hint_range(0.0, 0.5) = 0.15;
uniform float outer_width : hint_range(0.0, 1.0) = 0.4;
uniform float softness : hint_range(0.0, 0.5) = 0.05;

group_uniforms noise;
uniform float noise_scale : hint_range(0.1, 20.0) = 5.0;
uniform float noise_speed : hint_range(0.0, 10.0) = 3.0;
uniform float noise_intensity : hint_range(0.0, 0.5) = 0.1;
uniform int noise_octaves : hint_range(1, 6) = 3;

group_uniforms animation;
uniform float scroll_speed : hint_range(0.0, 20.0) = 8.0;
uniform float pulse_speed : hint_range(0.0, 10.0) = 0.0;
uniform float pulse_amount : hint_range(0.0, 1.0) = 0.2;
uniform float flicker_speed : hint_range(0.0, 30.0) = 15.0;
uniform float flicker_amount : hint_range(0.0, 0.5) = 0.1;

group_uniforms sparkle;
uniform bool sparkle_enabled = true;
uniform float sparkle_density : hint_range(1.0, 50.0) = 20.0;
uniform float sparkle_speed : hint_range(0.0, 20.0) = 10.0;
uniform float sparkle_intensity : hint_range(0.0, 5.0) = 2.0;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise_func(vec2 p) {
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
	for (int i = 0; i < noise_octaves; i++) {
		v += a * noise_func(p);
		p *= 2.0;
		a *= 0.5;
	}
	return v;
}

void fragment() {
	// UV: x = along beam, y = across beam (0.5 = center)
	float dist_from_center = abs(UV.y - 0.5) * 2.0;

	// Noise distortion
	float t = TIME;
	vec2 noise_uv = vec2(UV.x * noise_scale - t * noise_speed, UV.y * noise_scale);
	float noise_val = fbm(noise_uv) * 2.0 - 1.0;
	dist_from_center += noise_val * noise_intensity;

	// Scrolling energy pattern
	float scroll = UV.x * 10.0 - t * scroll_speed;
	float energy = noise_func(vec2(scroll, UV.y * 3.0)) * 0.3;

	// Beam layers
	float core = 1.0 - smoothstep(core_width - softness, core_width, dist_from_center);
	float inner = 1.0 - smoothstep(inner_width - softness, inner_width, dist_from_center);
	float outer = 1.0 - smoothstep(outer_width - softness * 2.0, outer_width, dist_from_center);

	// Color blending
	vec3 color = outer_color.rgb * outer;
	color = mix(color, inner_color.rgb, inner);
	color = mix(color, core_color.rgb, core);

	// Energy pattern overlay
	color += inner_color.rgb * energy * inner;

	// Pulse
	float pulse = 1.0;
	if (pulse_speed > 0.0) {
		pulse = 1.0 - pulse_amount + pulse_amount * (sin(t * pulse_speed) * 0.5 + 0.5);
	}

	// Flicker
	float flicker = 1.0 - flicker_amount * hash(vec2(floor(t * flicker_speed), 0.0));

	// Sparkle particles along beam
	float sparkle = 0.0;
	if (sparkle_enabled) {
		vec2 spark_uv = vec2(UV.x * sparkle_density - t * sparkle_speed, UV.y * sparkle_density);
		vec2 spark_cell = floor(spark_uv);
		vec2 spark_fract = fract(spark_uv);
		float spark_rand = hash(spark_cell);
		if (spark_rand > 0.85) {
			float spark_dist = length(spark_fract - vec2(hash(spark_cell + 0.5), 0.5));
			sparkle = smoothstep(0.15, 0.0, spark_dist) * sparkle_intensity * inner;
		}
	}

	float alpha = max(max(core, inner * 0.7), outer * 0.3);
	alpha *= pulse * flicker;

	ALBEDO = (color * intensity + core_color.rgb * sparkle) * pulse * flicker;
	ALPHA = clamp(alpha + sparkle * 0.5, 0.0, 1.0);
}
