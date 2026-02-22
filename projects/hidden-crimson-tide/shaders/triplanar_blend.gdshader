shader_type spatial;

// Luminara Shader Pack - Triplanar Texture Blending
// Seamless triplanar mapping with height-based blending for terrain/world surfaces.

group_uniforms textures;
uniform sampler2D texture_top : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D texture_side : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D texture_bottom : source_color, filter_linear_mipmap_anisotropic, repeat_enable;

group_uniforms normal_maps;
uniform sampler2D normal_top : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D normal_side : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D normal_bottom : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform float normal_strength : hint_range(0.0, 5.0) = 1.0;

group_uniforms mapping;
uniform float texture_scale : hint_range(0.01, 10.0) = 1.0;
uniform float blend_sharpness : hint_range(1.0, 32.0) = 8.0;
uniform float top_threshold : hint_range(0.0, 1.0) = 0.7;

group_uniforms height_blend;
uniform bool use_height_blend = false;
uniform sampler2D height_top : filter_linear_mipmap, repeat_enable;
uniform sampler2D height_side : filter_linear_mipmap, repeat_enable;
uniform float height_blend_contrast : hint_range(0.0, 1.0) = 0.5;

group_uniforms surface;
uniform float roughness : hint_range(0.0, 1.0) = 0.8;
uniform float metallic : hint_range(0.0, 1.0) = 0.0;
uniform float specular : hint_range(0.0, 1.0) = 0.5;

group_uniforms color;
uniform vec4 color_tint : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform float ao_strength : hint_range(0.0, 1.0) = 0.0;

varying vec3 world_normal;
varying vec3 world_pos;

void vertex() {
	world_normal = (MODEL_MATRIX * vec4(NORMAL, 0.0)).xyz;
	world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

vec3 compute_triplanar_weights(vec3 normal, float sharpness) {
	vec3 w = abs(normal);
	w = pow(w, vec3(sharpness));
	return w / (w.x + w.y + w.z);
}

vec4 triplanar_sample(sampler2D tex, vec3 pos, vec3 weights) {
	vec4 x_proj = texture(tex, pos.yz * texture_scale);
	vec4 y_proj = texture(tex, pos.xz * texture_scale);
	vec4 z_proj = texture(tex, pos.xy * texture_scale);
	return x_proj * weights.x + y_proj * weights.y + z_proj * weights.z;
}

void fragment() {
	vec3 wn = normalize(world_normal);
	vec3 weights = compute_triplanar_weights(wn, blend_sharpness);

	// Determine top vs side vs bottom
	float top_factor = smoothstep(top_threshold - 0.1, top_threshold + 0.1, wn.y);
	float bottom_factor = smoothstep(-top_threshold + 0.1, -top_threshold - 0.1, wn.y);

	// Height-based blending for more natural transitions
	if (use_height_blend) {
		float h_top = triplanar_sample(height_top, world_pos, weights).r;
		float h_side = triplanar_sample(height_side, world_pos, weights).r;

		top_factor = clamp(top_factor + (h_top - h_side) * height_blend_contrast, 0.0, 1.0);
	}

	// Sample textures using triplanar projection
	vec4 top_col = triplanar_sample(texture_top, world_pos, weights);
	vec4 side_col = triplanar_sample(texture_side, world_pos, weights);
	vec4 bottom_col = triplanar_sample(texture_bottom, world_pos, weights);

	// Blend based on normal direction
	vec3 albedo = mix(side_col.rgb, top_col.rgb, top_factor);
	albedo = mix(albedo, bottom_col.rgb, bottom_factor);
	albedo *= color_tint.rgb;

	// Normal maps
	vec3 n_top = triplanar_sample(normal_top, world_pos, weights).rgb;
	vec3 n_side = triplanar_sample(normal_side, world_pos, weights).rgb;
	vec3 n_bottom = triplanar_sample(normal_bottom, world_pos, weights).rgb;
	vec3 blended_normal = mix(n_side, n_top, top_factor);
	blended_normal = mix(blended_normal, n_bottom, bottom_factor);

	ALBEDO = albedo;
	NORMAL_MAP = blended_normal;
	NORMAL_MAP_DEPTH = normal_strength;
	ROUGHNESS = roughness;
	METALLIC = metallic;
	SPECULAR = specular;
	AO = 1.0 - ao_strength * (1.0 - top_col.a); // Use alpha channel as AO if available
}
