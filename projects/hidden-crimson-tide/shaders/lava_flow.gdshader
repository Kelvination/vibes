shader_type spatial;

// Luminara Shader Pack - Lava / Magma Flow
// Animated flowing lava with crust, cracks, heat distortion, and emission.

group_uniforms lava_color;
uniform vec4 hot_color : source_color = vec4(1.0, 0.6, 0.0, 1.0);
uniform vec4 warm_color : source_color = vec4(1.0, 0.15, 0.0, 1.0);
uniform vec4 crust_color : source_color = vec4(0.1, 0.05, 0.03, 1.0);
uniform float emission_strength : hint_range(0.0, 30.0) = 8.0;

group_uniforms flow;
uniform vec2 flow_direction = vec2(0.3, 0.7);
uniform float flow_speed : hint_range(0.0, 3.0) = 0.4;
uniform float turbulence : hint_range(0.0, 5.0) = 2.0;
uniform float scale : hint_range(0.1, 20.0) = 3.0;

group_uniforms crust;
uniform float crust_threshold : hint_range(0.0, 1.0) = 0.45;
uniform float crust_softness : hint_range(0.0, 0.3) = 0.08;
uniform float crust_roughness : hint_range(0.0, 1.0) = 0.95;

group_uniforms displacement;
uniform float height_scale : hint_range(0.0, 2.0) = 0.3;
uniform bool vertex_displacement = true;

group_uniforms surface;
uniform float roughness_hot : hint_range(0.0, 1.0) = 0.2;
uniform float metallic : hint_range(0.0, 1.0) = 0.1;

// Noise functions
float hash(vec2 p) {
	vec3 p3 = fract(vec3(p.xyx) * 0.1031);
	p3 += dot(p3, p3.yzx + 33.33);
	return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p, int octaves) {
	float v = 0.0;
	float a = 0.5;
	mat2 rot = mat2(vec2(cos(0.5), sin(0.5)), vec2(-sin(0.5), cos(0.5)));
	for (int i = 0; i < octaves; i++) {
		v += a * noise(p);
		p = rot * p * 2.0 + vec2(100.0);
		a *= 0.5;
	}
	return v;
}

float lava_pattern(vec2 uv, float time) {
	vec2 flow = normalize(flow_direction) * time * flow_speed;

	// Domain warping for organic look
	float warp_x = fbm(uv * scale + flow, 4);
	float warp_y = fbm(uv * scale + flow + vec2(5.2, 1.3), 4);
	vec2 warped = uv * scale + vec2(warp_x, warp_y) * turbulence + flow;

	return fbm(warped, 5);
}

varying float height_value;

void vertex() {
	float pattern = lava_pattern(UV, TIME);
	height_value = pattern;

	if (vertex_displacement) {
		VERTEX.y += (pattern - 0.5) * height_scale;

		// Approximate normal recalculation
		float eps = 0.01;
		float h_right = lava_pattern(UV + vec2(eps, 0.0), TIME);
		float h_up = lava_pattern(UV + vec2(0.0, eps), TIME);
		vec3 tangent = normalize(vec3(eps, (h_right - pattern) * height_scale, 0.0));
		vec3 bitangent = normalize(vec3(0.0, (h_up - pattern) * height_scale, eps));
		NORMAL = normalize(cross(bitangent, tangent));
	}
}

void fragment() {
	float pattern = lava_pattern(UV, TIME);

	// Crust vs molten separation
	float crust_factor = smoothstep(crust_threshold - crust_softness, crust_threshold + crust_softness, pattern);

	// Lava color gradient (hot core to warm edges)
	vec3 lava_color = mix(warm_color.rgb, hot_color.rgb, pattern * pattern);

	// Final color: crust on top, lava underneath
	vec3 final_color = mix(lava_color, crust_color.rgb, crust_factor);

	// Emission only from molten parts
	float emission = (1.0 - crust_factor) * emission_strength;
	vec3 emission_color = lava_color * emission;

	// Small bright cracks in crust
	float crack_noise = noise(UV * scale * 8.0 + TIME * flow_speed * 0.5);
	float cracks = smoothstep(0.48, 0.5, crack_noise) * crust_factor;
	final_color = mix(final_color, hot_color.rgb, cracks);
	emission_color += hot_color.rgb * cracks * emission_strength * 0.5;

	ALBEDO = final_color;
	EMISSION = emission_color;
	ROUGHNESS = mix(roughness_hot, crust_roughness, crust_factor);
	METALLIC = metallic;
}
