/**
 * app.js - Main application controller (ES module).
 * Ties together the graph, renderer, viewport, shader preview, and UI.
 * Supports both geometry and shader graph types via tabs.
 */
import { registry } from './core/registry.js';
import { NodeGraph } from './core/graph.js';

// Import node registrations (side-effect modules)
import './geo/nodes.js';
import './shader/nodes.js';

import { GraphRenderer } from './ui/renderer.js';
import { Viewport3D } from './ui/viewport.js';
import { ShaderPreview } from './shader/preview.js';
import { compileShader } from './shader/compiler.js';

(function () {
  'use strict';

  // ===== Dual graph instances =====
  const geoGraph = new NodeGraph('geo');
  const shaderGraph = new NodeGraph('shader');
  let activeGraphType = 'geo';
  let activeGraph = geoGraph;

  // ===== Core UI instances =====
  const graphCanvas = document.getElementById('graph-canvas');
  let renderer = new GraphRenderer(graphCanvas, activeGraph);

  const threeCanvas = document.getElementById('three-canvas');
  const viewport = new Viewport3D(threeCanvas);

  const shaderCanvas = document.getElementById('shader-canvas');
  let shaderPreview = null;
  try {
    shaderPreview = new ShaderPreview(shaderCanvas);
  } catch (e) {
    console.warn('Shader preview init failed:', e);
  }

  // ===== UI Elements =====
  const btnMenu = document.getElementById('btn-menu');
  const btnAddNode = document.getElementById('btn-add-node');
  const btnRun = document.getElementById('btn-run');
  const btnToggleView = document.getElementById('btn-toggle-view');
  const btnZoomFit = document.getElementById('btn-zoom-fit');
  const btnUndo = document.getElementById('btn-undo');
  const sideMenu = document.getElementById('side-menu');
  const menuOverlay = document.getElementById('menu-overlay');
  const btnCloseMenu = document.getElementById('btn-close-menu');
  const nodeSearch = document.getElementById('node-search');
  const nodeCategories = document.getElementById('node-categories');
  const propsPanel = document.getElementById('properties-panel');
  const propsOverlay = document.getElementById('props-overlay');
  const btnCloseProps = document.getElementById('btn-close-props');
  const propsTitle = document.getElementById('props-title');
  const propsContent = document.getElementById('props-content');
  const btnDeleteNode = document.getElementById('btn-delete-node');
  const viewport3d = document.getElementById('viewport-3d');
  const shaderPreviewEl = document.getElementById('shader-preview');
  const btnResetCam = document.getElementById('btn-reset-cam');
  const btnWireframe = document.getElementById('btn-wireframe');
  const viewportInfo = document.getElementById('viewport-info');
  const shaderPreviewInfo = document.getElementById('shader-preview-info');
  const statusText = document.getElementById('status-text');
  const graphTabs = document.getElementById('graph-tabs');
  const btnShaderShape = document.getElementById('btn-shader-shape');

  const dropMenu = document.getElementById('drop-menu');
  const dropMenuSearch = document.getElementById('drop-menu-search');
  const dropMenuItems = document.getElementById('drop-menu-items');
  const dropMenuOverlay = document.getElementById('drop-menu-overlay');

  let viewportVisible = false;
  let shaderPreviewVisible = false;
  let currentPropsNode = null;
  let pendingDrop = null; // stores connection drop info for context menu

  // ===== Graph Version & Storage =====
  const GRAPH_VERSION = 3;

  function getStorageKey(graphType) {
    return graphType === 'shader' ? 'geonodes_shader_graph' : 'geonodes_graph';
  }

  function initDefaultScene(graph) {
    const savedVersion = localStorage.getItem('geonodes_version');
    const saved = localStorage.getItem(getStorageKey(graph.graphType));
    if (saved && parseInt(savedVersion) === GRAPH_VERSION && graph.fromJSON(saved)) {
      statusText.textContent = `Loaded saved ${graph.graphType} graph`;
      return;
    }

    if (graph.graphType === 'geo') {
      const cubeNode = graph.addNode('mesh_cube', 50, 100);
      const transformNode = graph.addNode('transform', 300, 80);
      const outputNode = graph.addNode('output', 550, 120);
      if (cubeNode && transformNode && outputNode) {
        graph.addConnection(cubeNode.id, 0, transformNode.id, 0);
        graph.addConnection(transformNode.id, 0, outputNode.id, 0);
      }
      statusText.textContent = 'Default geometry scene loaded';
    } else if (graph.graphType === 'shader') {
      const colorNode = graph.addNode('color_value', 50, 80);
      const bsdfNode = graph.addNode('principled_bsdf', 300, 60);
      const outputNode = graph.addNode('shader_output', 550, 100);
      if (colorNode && bsdfNode && outputNode) {
        graph.addConnection(colorNode.id, 0, bsdfNode.id, 0);
        graph.addConnection(bsdfNode.id, 0, outputNode.id, 0);
      }
      statusText.textContent = 'Default shader scene loaded';
    }
  }

  function saveGraph() {
    try {
      localStorage.setItem(getStorageKey(activeGraph.graphType), activeGraph.toJSON());
      localStorage.setItem('geonodes_version', GRAPH_VERSION.toString());
      localStorage.setItem('geonodes_active_tab', activeGraphType);
    } catch (e) {
      // Storage full
    }
  }

  // ===== Tab Switching =====
  function switchTab(graphType) {
    if (graphType === activeGraphType) return;

    // Save current state
    saveGraph();
    closeProperties();

    activeGraphType = graphType;
    activeGraph = graphType === 'shader' ? shaderGraph : geoGraph;

    // Update renderer to use new graph
    renderer.destroy();
    renderer = new GraphRenderer(graphCanvas, activeGraph);
    setupRendererCallbacks();
    renderer.zoomToFit();

    // Update tab UI
    graphTabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === graphType);
    });

    // Toggle viewport vs shader preview
    if (graphType === 'shader') {
      if (viewportVisible) {
        viewport3d.classList.add('hidden');
        viewport.stop();
        viewportVisible = false;
      }
    } else {
      if (shaderPreviewVisible) {
        shaderPreviewEl.classList.add('hidden');
        if (shaderPreview) shaderPreview.stop();
        shaderPreviewVisible = false;
      }
    }

    statusText.textContent = `Switched to ${graphType === 'shader' ? 'Shader' : 'Geometry'} graph`;
    setTimeout(() => renderer._resize(), 50);
  }

  // ===== Side Menu (Add Node) =====
  function openMenu() {
    sideMenu.classList.remove('hidden');
    sideMenu.classList.add('visible');
    menuOverlay.classList.remove('hidden');
    menuOverlay.classList.add('visible');
    nodeSearch.value = '';
    buildNodeList('');
    setTimeout(() => nodeSearch.focus(), 300);
  }

  function closeMenu() {
    sideMenu.classList.remove('visible');
    menuOverlay.classList.remove('visible');
    setTimeout(() => {
      sideMenu.classList.add('hidden');
      menuOverlay.classList.add('hidden');
    }, 250);
  }

  function buildNodeList(filter) {
    nodeCategories.innerHTML = '';
    const lowerFilter = filter.toLowerCase();
    const nodeTypes = registry.getNodeTypes(activeGraphType);
    const categories = registry.getCategories(activeGraphType);

    const outputTypeId = activeGraphType === 'shader' ? 'shader_output' : 'output';

    const grouped = {};
    for (const [typeId, def] of Object.entries(nodeTypes)) {
      if (typeId === outputTypeId) continue;
      if (lowerFilter && !def.label.toLowerCase().includes(lowerFilter)) continue;

      const cat = def.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ typeId, def });
    }

    for (const [catId, items] of Object.entries(grouped)) {
      const catDef = categories[catId];
      if (!catDef) continue;

      const section = document.createElement('div');
      section.className = 'node-category';

      const h3 = document.createElement('h3');
      h3.textContent = catDef.name;
      section.appendChild(h3);

      for (const item of items) {
        const el = document.createElement('div');
        el.className = 'node-list-item';
        el.innerHTML = `
          <div class="node-icon" style="background:${catDef.color}">${catDef.icon}</div>
          <span class="node-label">${item.def.label}</span>
        `;
        el.addEventListener('click', () => {
          addNodeToCenter(item.typeId);
          closeMenu();
        });
        section.appendChild(el);
      }

      nodeCategories.appendChild(section);
    }
  }

  function addNodeToCenter(typeId) {
    const center = renderer.screenToWorld(renderer.viewWidth / 2, renderer.viewHeight / 2);
    const x = center.x - renderer.nodeWidth / 2 + (Math.random() - 0.5) * 40;
    const y = center.y - 40 + (Math.random() - 0.5) * 40;
    const node = activeGraph.addNode(typeId, x, y);
    if (node) {
      renderer.selectedNode = node.id;
      const def = registry.getNodeDef(activeGraphType, typeId);
      statusText.textContent = `Added ${def?.label || typeId}`;
      saveGraph();
      autoRun();
    }
  }

  // ===== Connection Drop Context Menu =====
  function openDropMenu(info) {
    pendingDrop = info;
    const nodeTypes = registry.getNodeTypes(activeGraphType);
    const categories = registry.getCategories(activeGraphType);
    const outputTypeId = activeGraphType === 'shader' ? 'shader_output' : 'output';

    // Filter to compatible nodes
    const compatible = [];
    for (const [typeId, def] of Object.entries(nodeTypes)) {
      if (typeId === outputTypeId) continue;
      if (def.singular) continue;

      if (info.isOutput) {
        // Dragged from an output: need nodes with a matching INPUT
        const matchIdx = def.inputs.findIndex(inp => inp.type === info.socketType);
        if (matchIdx >= 0) compatible.push({ typeId, def, matchIdx, matchIsOutput: false });
      } else {
        // Dragged from an input: need nodes with a matching OUTPUT
        const matchIdx = def.outputs.findIndex(out => out.type === info.socketType);
        if (matchIdx >= 0) compatible.push({ typeId, def, matchIdx, matchIsOutput: true });
      }
    }

    if (compatible.length === 0) return;

    // Position the menu at the cursor
    const menuW = 240, menuH = 360;
    let left = info.screenX;
    let top = info.screenY;
    if (left + menuW > window.innerWidth) left = window.innerWidth - menuW - 8;
    if (top + menuH > window.innerHeight) top = window.innerHeight - menuH - 8;
    if (left < 4) left = 4;
    if (top < 4) top = 4;
    dropMenu.style.left = left + 'px';
    dropMenu.style.top = top + 'px';

    dropMenuSearch.value = '';
    buildDropMenuList(compatible, categories, '');

    dropMenu.classList.remove('hidden');
    dropMenuOverlay.classList.remove('hidden');
    setTimeout(() => dropMenuSearch.focus(), 50);

    // Live search
    dropMenuSearch.oninput = () => {
      buildDropMenuList(compatible, categories, dropMenuSearch.value);
    };
  }

  function buildDropMenuList(compatible, categories, filter) {
    dropMenuItems.innerHTML = '';
    const lf = filter.toLowerCase();

    const grouped = {};
    for (const item of compatible) {
      if (lf && !item.def.label.toLowerCase().includes(lf)) continue;
      const cat = item.def.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }

    for (const [catId, items] of Object.entries(grouped)) {
      const catDef = categories[catId];
      if (!catDef) continue;

      const catEl = document.createElement('div');
      catEl.className = 'drop-menu-cat';
      catEl.textContent = catDef.name;
      dropMenuItems.appendChild(catEl);

      for (const item of items) {
        const el = document.createElement('div');
        el.className = 'drop-menu-item';
        el.innerHTML = `<div class="dmi-icon" style="background:${catDef.color}">${catDef.icon}</div>${item.def.label}`;
        el.addEventListener('click', () => {
          selectDropMenuItem(item);
        });
        dropMenuItems.appendChild(el);
      }
    }
  }

  function selectDropMenuItem(item) {
    if (!pendingDrop) return;
    const info = pendingDrop;

    // Create node at the drop world position
    const x = info.worldX - renderer.nodeWidth / 2;
    const y = info.worldY - 30;
    const node = activeGraph.addNode(item.typeId, x, y);
    if (node) {
      // Auto-connect
      if (info.isOutput) {
        // Source was an output socket, connect to the new node's matching input
        activeGraph.addConnection(info.fromNode, info.fromSocket, node.id, item.matchIdx);
      } else {
        // Source was an input socket, connect from the new node's matching output
        activeGraph.addConnection(node.id, item.matchIdx, info.fromNode, info.fromSocket);
      }

      renderer.selectedNode = node.id;
      statusText.textContent = `Added & connected ${item.def.label}`;
      saveGraph();
      autoRun();
    }

    closeDropMenu();
  }

  function closeDropMenu() {
    dropMenu.classList.add('hidden');
    dropMenuOverlay.classList.add('hidden');
    pendingDrop = null;
    dropMenuSearch.oninput = null;
  }

  // ===== Properties Panel =====
  function openProperties(node) {
    if (!node) return;
    currentPropsNode = node;
    const def = activeGraph.getNodeDef(node);
    if (!def) return;

    propsTitle.textContent = def.label;
    propsContent.innerHTML = '';

    if (!def.props || def.props.length === 0) {
      propsContent.innerHTML = '<p style="color:var(--text-dim);font-size:13px;padding:8px 0;">No editable properties</p>';
    } else {
      for (const prop of def.props) {
        const group = document.createElement('div');
        group.className = 'prop-group';

        const label = document.createElement('div');
        label.className = 'prop-label';
        label.textContent = prop.label;
        group.appendChild(label);

        switch (prop.type) {
          case 'float':
          case 'int': {
            const wrap = document.createElement('div');
            wrap.className = 'prop-slider-wrap';

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'prop-slider';
            slider.min = prop.min ?? 0;
            slider.max = prop.max ?? 10;
            slider.step = prop.step ?? (prop.type === 'int' ? 1 : 0.1);
            slider.value = node.values[prop.key] ?? 0;

            const valDisplay = document.createElement('span');
            valDisplay.className = 'prop-slider-val';
            valDisplay.textContent = formatNum(slider.value, prop.type);

            const numInput = document.createElement('input');
            numInput.type = 'number';
            numInput.className = 'prop-input';
            numInput.style.width = '70px';
            numInput.style.flex = 'none';
            numInput.min = prop.min ?? '';
            numInput.max = prop.max ?? '';
            numInput.step = prop.step ?? '';
            numInput.value = node.values[prop.key] ?? 0;

            slider.addEventListener('input', () => {
              let v = prop.type === 'int' ? parseInt(slider.value) : parseFloat(slider.value);
              activeGraph.setNodeValue(node.id, prop.key, v);
              valDisplay.textContent = formatNum(v, prop.type);
              numInput.value = v;
              saveGraph();
              autoRun();
            });

            numInput.addEventListener('change', () => {
              let v = prop.type === 'int' ? parseInt(numInput.value) : parseFloat(numInput.value);
              if (isNaN(v)) v = 0;
              activeGraph.setNodeValue(node.id, prop.key, v);
              slider.value = v;
              valDisplay.textContent = formatNum(v, prop.type);
              saveGraph();
              autoRun();
            });

            wrap.appendChild(slider);
            wrap.appendChild(valDisplay);
            group.appendChild(wrap);
            group.appendChild(numInput);
            break;
          }

          case 'bool': {
            const wrap = document.createElement('div');
            wrap.className = 'prop-checkbox-wrap';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'prop-checkbox';
            cb.checked = !!node.values[prop.key];

            const cbLabel = document.createElement('span');
            cbLabel.textContent = cb.checked ? 'On' : 'Off';
            cbLabel.style.fontSize = '13px';

            cb.addEventListener('change', () => {
              activeGraph.setNodeValue(node.id, prop.key, cb.checked);
              cbLabel.textContent = cb.checked ? 'On' : 'Off';
              saveGraph();
              autoRun();
            });

            wrap.appendChild(cb);
            wrap.appendChild(cbLabel);
            group.appendChild(wrap);
            break;
          }

          case 'select': {
            const select = document.createElement('select');
            select.className = 'prop-select';
            for (const opt of (prop.options || [])) {
              const option = document.createElement('option');
              option.value = opt.value;
              option.textContent = opt.label;
              if (node.values[prop.key] === opt.value) option.selected = true;
              select.appendChild(option);
            }
            select.addEventListener('change', () => {
              activeGraph.setNodeValue(node.id, prop.key, select.value);
              saveGraph();
              autoRun();
            });
            group.appendChild(select);
            break;
          }
        }

        propsContent.appendChild(group);
      }
    }

    // Connections info
    const connInfo = document.createElement('div');
    connInfo.style.cssText = 'margin-top:16px;padding-top:12px;border-top:1px solid var(--border);';
    const conns = activeGraph.connections.filter(c => c.fromNode === node.id || c.toNode === node.id);
    connInfo.innerHTML = `<div class="prop-label">Connections: ${conns.length}</div>
      <div style="font-size:12px;color:var(--text-dim);">Node ID: ${node.id}</div>`;
    propsContent.appendChild(connInfo);

    propsPanel.classList.remove('hidden');
    propsPanel.classList.add('visible');
    propsOverlay.classList.remove('hidden');
    propsOverlay.classList.add('visible');
  }

  function closeProperties() {
    propsPanel.classList.remove('visible');
    propsOverlay.classList.remove('visible');
    setTimeout(() => {
      propsPanel.classList.add('hidden');
      propsOverlay.classList.add('hidden');
    }, 250);
    currentPropsNode = null;
  }

  function formatNum(v, type) {
    if (type === 'int') return Math.round(v).toString();
    return parseFloat(v).toFixed(2);
  }

  // ===== 3D Viewport (Geo) =====
  function toggleViewport() {
    if (activeGraphType === 'shader') {
      toggleShaderPreview();
      return;
    }
    viewportVisible = !viewportVisible;
    if (viewportVisible) {
      viewport3d.classList.remove('hidden');
      viewport.start();
      viewport.resize();
      runGraph();
    } else {
      viewport3d.classList.add('hidden');
      viewport.stop();
    }
    setTimeout(() => renderer._resize(), 50);
  }

  function toggleShaderPreview() {
    shaderPreviewVisible = !shaderPreviewVisible;
    if (shaderPreviewVisible) {
      shaderPreviewEl.classList.remove('hidden');
      if (shaderPreview) {
        shaderPreview.start();
        shaderPreview.resize();
      }
      runGraph();
    } else {
      shaderPreviewEl.classList.add('hidden');
      if (shaderPreview) shaderPreview.stop();
    }
    setTimeout(() => renderer._resize(), 50);
  }

  function runGraph() {
    const app = document.getElementById('app');
    app.classList.add('running');

    const result = activeGraph.evaluate();

    if (result.error) {
      statusText.textContent = 'Error: ' + result.error;
    } else {
      statusText.textContent = `Evaluated (${result.evalTime || '?'}ms)`;
    }

    if (activeGraphType === 'geo') {
      // Show geo viewport
      if (!viewportVisible) {
        viewportVisible = true;
        viewport3d.classList.remove('hidden');
        viewport.start();
        viewport.resize();
        setTimeout(() => renderer._resize(), 50);
      }

      const stats = viewport.updateGeometry(result.geometries);
      viewportInfo.textContent = `Verts: ${stats.verts} | Faces: ${stats.faces}`;
    } else if (activeGraphType === 'shader') {
      // Show shader preview
      if (!shaderPreviewVisible) {
        shaderPreviewVisible = true;
        shaderPreviewEl.classList.remove('hidden');
        if (shaderPreview) {
          shaderPreview.start();
          shaderPreview.resize();
        }
        setTimeout(() => renderer._resize(), 50);
      }

      if (result.shaderResult && shaderPreview) {
        try {
          const compiled = compileShader(result.shaderResult);
          shaderPreview.updateShader(compiled);

          // Also evaluate the geo graph and use its output as the preview mesh
          const geoResult = geoGraph.evaluate();
          if (geoResult.geometries && geoResult.geometries.length > 0) {
            shaderPreview.setExternalGeometry(geoResult.geometries);
            shaderPreviewInfo.textContent = 'Shader on geo output';
          } else {
            shaderPreview.setExternalGeometry(null);
            shaderPreviewInfo.textContent = 'Shader compiled (no geo)';
          }
        } catch (e) {
          shaderPreviewInfo.textContent = 'Compile error: ' + e.message;
        }
      }
    }

    saveGraph();
    setTimeout(() => app.classList.remove('running'), 500);
  }

  // ===== Auto-update: debounced runGraph on any change =====
  let _autoRunTimer = null;
  function autoRun() {
    if (_autoRunTimer) clearTimeout(_autoRunTimer);
    _autoRunTimer = setTimeout(() => {
      _autoRunTimer = null;
      if (viewportVisible || shaderPreviewVisible) {
        runGraph();
      }
    }, 100);
  }

  // ===== Renderer callbacks =====
  function setupRendererCallbacks() {
    renderer.onNodeSelected = (node) => {
      if (!node) return;
    };

    renderer.onNodeDoubleTap = (node) => {
      openProperties(node);
    };

    renderer.onConnectionMade = () => {
      statusText.textContent = 'Connected';
      saveGraph();
      autoRun();
    };

    renderer.onConnectionDropped = (info) => {
      openDropMenu(info);
    };
  }

  // ===== Event Bindings =====
  btnMenu.addEventListener('click', openMenu);
  btnAddNode.addEventListener('click', openMenu);
  btnCloseMenu.addEventListener('click', closeMenu);
  menuOverlay.addEventListener('click', closeMenu);

  nodeSearch.addEventListener('input', () => {
    buildNodeList(nodeSearch.value);
  });

  dropMenuOverlay.addEventListener('click', closeDropMenu);

  btnCloseProps.addEventListener('click', closeProperties);
  propsOverlay.addEventListener('click', closeProperties);

  btnDeleteNode.addEventListener('click', () => {
    if (currentPropsNode) {
      const def = activeGraph.getNodeDef(currentPropsNode);
      if (def?.singular) {
        statusText.textContent = 'Cannot delete output node';
        return;
      }
      activeGraph.removeNode(currentPropsNode.id);
      renderer.selectedNode = null;
      closeProperties();
      statusText.textContent = 'Node deleted';
      saveGraph();
      autoRun();
    }
  });

  btnRun.addEventListener('click', runGraph);
  btnToggleView.addEventListener('click', toggleViewport);
  btnZoomFit.addEventListener('click', () => renderer.zoomToFit());

  btnUndo.addEventListener('click', () => {
    if (activeGraph.undo()) {
      renderer.selectedNode = null;
      statusText.textContent = 'Undo';
      saveGraph();
      autoRun();
    } else {
      statusText.textContent = 'Nothing to undo';
    }
  });

  btnResetCam.addEventListener('click', () => viewport.resetCamera());
  btnWireframe.addEventListener('click', () => {
    const wf = viewport.toggleWireframe();
    statusText.textContent = wf ? 'Wireframe on' : 'Wireframe off';
  });

  if (btnShaderShape) {
    btnShaderShape.addEventListener('click', () => {
      if (shaderPreview) {
        const shape = shaderPreview.toggleShape();
        statusText.textContent = `Preview: ${shape}`;
      }
    });
  }

  // Tab switching
  graphTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Allow Escape to close drop menu even from search input
    if (e.key === 'Escape' && pendingDrop) {
      closeDropMenu();
      return;
    }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    switch (e.key) {
      case 'a':
      case 'A':
        openMenu();
        break;
      case 'Delete':
      case 'Backspace':
        if (renderer.selectedNode) {
          const node = activeGraph.nodes.find(n => n.id === renderer.selectedNode);
          if (node) {
            const def = activeGraph.getNodeDef(node);
            if (!def?.singular) {
              activeGraph.removeNode(node.id);
              renderer.selectedNode = null;
              statusText.textContent = 'Node deleted';
              saveGraph();
              autoRun();
            }
          }
        }
        break;
      case 'f':
      case 'F':
        renderer.zoomToFit();
        break;
      case 'z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (activeGraph.undo()) {
            renderer.selectedNode = null;
            statusText.textContent = 'Undo';
            saveGraph();
            autoRun();
          }
        }
        break;
      case ' ':
        e.preventDefault();
        runGraph();
        break;
      case '1':
        switchTab('geo');
        break;
      case '2':
        switchTab('shader');
        break;
    }
  });

  // ===== Init =====
  setupRendererCallbacks();

  // Load saved tab preference
  const savedTab = localStorage.getItem('geonodes_active_tab');

  // Initialize both graphs
  initDefaultScene(geoGraph);
  initDefaultScene(shaderGraph);

  // Switch to saved tab if needed
  if (savedTab === 'shader') {
    switchTab('shader');
  }

  renderer.zoomToFit();

  // Auto-save periodically
  setInterval(saveGraph, 10000);

  // Expose for debugging
  window._geoNodes = { geoGraph, shaderGraph, renderer, viewport, shaderPreview, registry };
})();
