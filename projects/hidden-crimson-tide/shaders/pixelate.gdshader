shader_type canvas_item;

// Luminara Shader Pack - Pixelation Post-Process
// Retro pixelation effect with optional color palette reduction and CRT scanlines.

group_uniforms pixelation;
uniform float pixel_size : hint_range(1.0, 64.0) = 8.0;
uniform bool snap_to_grid = true;

group_uniforms color_reduction;
uniform bool reduce_colors = true;
uniform float color_levels : hint_range(2.0, 32.0, 1.0) = 8.0;
uniform bool dither_enabled = true;
uniform float dither_intensity : hint_range(0.0, 1.0) = 0.5;

group_uniforms crt;
uniform bool crt_enabled = false;
uniform float scanline_weight : hint_range(0.0, 1.0) = 0.2;
uniform float scanline_frequency : hint_range(1.0, 10.0) = 3.0;
uniform float curvature : hint_range(0.0, 0.1) = 0.02;
uniform float vignette_intensity : hint_range(0.0, 1.0) = 0.3;

group_uniforms adjustments;
uniform float brightness_boost : hint_range(0.0, 2.0) = 1.0;
uniform float contrast : hint_range(0.0, 3.0) = 1.0;
uniform float saturation : hint_range(0.0, 3.0) = 1.0;

uniform sampler2D SCREEN_TEXTURE : hint_screen_texture, filter_nearest;

// Bayer 4x4 dither matrix
float bayer4(vec2 pos) {
	ivec2 p = ivec2(mod(pos, 4.0));
	int index = p.x + p.y * 4;
	float matrix[16] = float[16](
		0.0, 8.0, 2.0, 10.0,
		12.0, 4.0, 14.0, 6.0,
		3.0, 11.0, 1.0, 9.0,
		15.0, 7.0, 13.0, 5.0
	);
	return matrix[index] / 16.0 - 0.5;
}

vec2 crt_curve(vec2 uv) {
	uv = uv * 2.0 - 1.0;
	vec2 offset = abs(uv.yx) * curvature;
	uv = uv + uv * offset * offset;
	uv = uv * 0.5 + 0.5;
	return uv;
}

vec3 adjust_color(vec3 color) {
	// Brightness
	color *= brightness_boost;

	// Contrast
	color = (color - 0.5) * contrast + 0.5;

	// Saturation
	float grey = dot(color, vec3(0.2126, 0.7152, 0.0722));
	color = mix(vec3(grey), color, saturation);

	return clamp(color, 0.0, 1.0);
}

void fragment() {
	vec2 uv = SCREEN_UV;

	// CRT curvature
	if (crt_enabled) {
		uv = crt_curve(uv);
	}

	// Pixelation
	vec2 screen_size = 1.0 / SCREEN_PIXEL_SIZE;
	vec2 pixel_count = floor(screen_size / pixel_size);

	if (snap_to_grid) {
		uv = floor(uv * pixel_count) / pixel_count;
		uv += 0.5 / pixel_count; // center of pixel
	}

	// Out of bounds check for CRT curve
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
		COLOR = vec4(0.0, 0.0, 0.0, 1.0);
		return;
	}

	vec3 color = texture(SCREEN_TEXTURE, uv).rgb;

	// Color adjustments
	color = adjust_color(color);

	// Color reduction with optional dithering
	if (reduce_colors) {
		if (dither_enabled) {
			vec2 pixel_pos = uv * screen_size / pixel_size;
			float dither = bayer4(pixel_pos) * dither_intensity / color_levels;
			color += dither;
		}
		color = floor(color * color_levels) / color_levels;
	}

	// CRT scanlines and vignette
	if (crt_enabled) {
		float scanline = 1.0 - scanline_weight * (sin(SCREEN_UV.y * screen_size.y * scanline_frequency * PI) * 0.5 + 0.5);
		color *= scanline;

		// Vignette
		vec2 vig_uv = SCREEN_UV * 2.0 - 1.0;
		float vignette = 1.0 - dot(vig_uv, vig_uv) * vignette_intensity;
		color *= clamp(vignette, 0.0, 1.0);
	}

	COLOR = vec4(color, 1.0);
}
