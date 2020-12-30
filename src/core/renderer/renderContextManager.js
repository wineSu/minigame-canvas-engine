import {
  setupGl
} from '../../renderer/gl_rect.js';
import {
  createRender,
  VIDEOS,
  renderDetection
} from '../../renderer/util.js';


import {
  createImage
} from '../common/util'
const {
  wx
} = pluginEnv.customEnv;

/**
 * @description 逻辑线程渲染管理器，用于搜集每个节点需要的渲染数据
 */
import RenderContext from './renderContext'


function createCanvas() {
  return wx.createCanvas();
}

const canvasPool = [];

function clearPool(obj) {
  Object.getOwnPropertyNames(obj).forEach(function(key){
    delete obj[key];
  });
}

export default class RenderContextManager {
  constructor(canvasContext, scale = 1) {
    this.canvasContext = canvasContext;
    this.glRects = [];
    this.scale = scale;

    this.width = 0;
    this.height = 0;

    this.renderer = createRender({
      dpr: scale,
      createImage,
      createCanvas
    });

    this.layout = null;

    this.hasSetup = false;
    this.gl = null;
    this.hasScroll = false;
  }

  createRoundRect(id, type) {
    const glRect = new RenderContext(id, type);
    this.glRects.push(glRect);
    return glRect;
  }
  /**
   * @description 清空数据
   */
  clear() {
    this.glRects = [];
    this.scrollGlrects = [];
  }

  release() {
    clearPool(this.renderer.TEXT_TEXTURE);
    clearPool(this.renderer.IMAGE_POOL);
    clearPool(this.renderer.glPool);

    console.log(this.renderer.TEXT_TEXTURE, this.renderer.IMAGE_POOL, this.renderer.glPool);

    this.gl = null;

    this.clear();
  }

  getChildrenGlRects(node, res = []) {
    if (node !== this.layout.scrollview && node.glRect) {
      const index = this.glRects.indexOf(node.glRect);
      this.glRects.splice(index, 1);
      res.push(node.glRect)
    }

    node.children.forEach(child => {
      this.getChildrenGlRects(child, res);
    });

    return res;
  }

  /**
   * @description 传递数据给渲染线程
   */
  draw(needInit = false) {
    if (!this.hasSetup || needInit) {
      this.hasSetup = true;

      const gl = setupGl(this.canvasContext.canvas, false);
      gl.canvas.height = this.height;
      gl.canvas.width = this.width;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      this.gl = gl;

      if (this.layout.scrollview) {
        this.hasScroll = true;

        this.scrollGlrects = [];
        this.getChildrenGlRects(this.layout.scrollview, this.scrollGlrects);
      }
    }

    this.renderer.repaint(this.gl, this.glRects, this.scrollGlrects);
  }
}
