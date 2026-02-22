shader_type spatial;
render_mode blend_add, depth_draw_opaque, cull_disabled, unshaded;

// Luminara Shader Pack - Hologram Effect
// Sci-fi hologram with scanlines, flicker, glitch, and fresnel glow.

group_uniforms color;
uniform vec4 hologram_color : source_color = vec4(0.0, 0.8, 1.0, 1.0);
uniform vec4 hologram_color_secondary : source_color = vec4(0.0, 0.4, 1.0, 1.0);
uniform float brightness : hint_range(0.0, 5.0) = 1.5;
uniform float alpha : hint_range(0.0, 1.0) = 0.7;

group_uniforms scanlines;
uniform bool scanlines_enabled = true;
uniform float scanline_density : hint_range(10.0, 500.0) = 120.0;
uniform float scanline_speed : hint_range(0.0, 10.0) = 2.0;
uniform float scanline_intensity : hint_range(0.0, 1.0) = 0.3;

group_uniforms flicker;
uniform bool flicker_enabled = true;
uniform float flicker_speed : hint_range(0.0, 30.0) = 12.0;
uniform float flicker_intensity : hint_range(0.0, 1.0) = 0.15;

group_uniforms glitch;
uniform bool glitch_enabled = true;
uniform float glitch_speed : hint_range(0.0, 10.0) = 3.0;
uniform float glitch_intensity : hint_range(0.0, 0.1) = 0.02;

group_uniforms fresnel;
uniform float fresnel_power : hint_range(0.0, 10.0) = 2.0;
uniform float fresnel_intensity : hint_range(0.0, 5.0) = 1.5;

group_uniforms distortion;
uniform float vertex_offset_intensity : hint_range(0.0, 0.1) = 0.01;
uniform float wave_frequency : hint_range(0.0, 20.0) = 5.0;

varying vec3 world_pos;

float random(float x) {
	return fract(sin(x * 127.1) * 43758.5453);
}

void vertex() {
	world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;

	// Vertex displacement for holographic wobble
	float wave = sin(VERTEX.y * wave_frequency + TIME * 2.0) * vertex_offset_intensity;
	VERTEX.x += wave;

	// Glitch displacement
	if (glitch_enabled) {
		float glitch_time = floor(TIME * glitch_speed * 10.0);
		float glitch_val = random(glitch_time);
		if (glitch_val > 0.95) {
			float slice = step(0.5, fract(VERTEX.y * 10.0 + glitch_time));
			VERTEX.x += slice * glitch_intensity * (random(glitch_time + 1.0) - 0.5) * 2.0;
		}
	}
}

void fragment() {
	vec3 color = hologram_color.rgb;

	// Fresnel / rim glow
	float fresnel = pow(1.0 - abs(dot(NORMAL, VIEW)), fresnel_power);
	color = mix(hologram_color_secondary.rgb, hologram_color.rgb, fresnel);
	float glow = fresnel * fresnel_intensity;

	// Scanlines
	float scanline = 1.0;
	if (scanlines_enabled) {
		float scan_pos = world_pos.y * scanline_density + TIME * scanline_speed;
		scanline = 1.0 - scanline_intensity * (sin(scan_pos) * 0.5 + 0.5);
	}

	// Flicker
	float flicker = 1.0;
	if (flicker_enabled) {
		float t = TIME * flicker_speed;
		flicker = 1.0 - flicker_intensity * (random(floor(t)) * 0.5 + sin(t * 1.7) * 0.25 + sin(t * 3.1) * 0.25);
	}

	// Horizontal band artifacts
	float bands = 1.0;
	if (glitch_enabled) {
		float band_pos = world_pos.y * 3.0 + TIME * 0.5;
		bands = smoothstep(0.0, 0.1, abs(sin(band_pos)));
	}

	// Combine
	float final_alpha = alpha * scanline * flicker * bands;
	color = color * brightness * scanline + color * glow;

	ALBEDO = color * flicker;
	ALPHA = clamp(final_alpha + glow * 0.3, 0.0, 1.0);
}
