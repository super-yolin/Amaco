import CssDirector from './model/cssDirector';
import AmacoInit from './polyfill';
import BezierEasing from 'bezier-easing';

interface Amaco {
  target(element: any): Amaco;
  start(func: (option: any) => void): Amaco;
  end(func: (option: any) => void): Amaco;
  from(option: any): Amaco;
  to(option: any): Amaco;
  time(time: number): Amaco;
  speed(func: (process: number) => number | any): Amaco;
  when(
    func: (animationStep: number, degree: number, element: any) => void
  ): Amaco;
  // 不用run当什么时候触发
  trigger(func: (option: any) => void): Amaco;
  /// Only executed once the conditions are met
  /// { if:func, do:func }
  condition(conditions: any[]): Amaco;
  run(): Amaco;
  over(): Amaco;
}
class Amaco {
  private element: any;
  private animationId: number;
  private startTime: number;
  private timeSum: number;
  private step: number;
  private conditions: any[];
  private animations: any[];
  private times: any[];
  private startState: any;
  private endState: any;
  private process: number;
  private startFunc: any;
  private endFunc: any;
  private whenFunc: any;
  private speedFunc: any;
  constructor() {
    this.conditions = [];
    this.animations = [];
    this.times = [];
    this.startState = { };
    this.endState = { };
    this.animationId = 0;
    this.startTime = 0;
    this.timeSum = 0;
    this.step = 0;
    this.process = 0;
  }
  target(element: any): Amaco {
    if (element == null) {
      throw new Error("can't get the property style !");
    }
    this.element = element;

    return this;
  }
  start(func: (option: any) => void): Amaco {
    this.startFunc = func;

    return this;
  }
  end(func: (option: any) => void): Amaco {
    this.endFunc = func;

    return this;
  }
  from(option: any): Amaco {
    this.startState = option;

    return this;
  }
  to(option: any): Amaco {
    this.animations.push(option);

    return this;
  }
  // time肯能精细到map,每一个样式执行时间,事件有可能无限循环,设置线性,曲线
  time(time: number): Amaco {
    if (this.animations.length - (this.times.length + 1) !== 0) {
      throw new Error("set time: animation can't be null !");
    }
    const length = this.animations.length - this.times.length;
    const interval = time / length;
    this.timeSum += time;
    const initTime =
      this.times.length > 0 ? this.times[this.times.length - 1] : 0;

    for (let index = 1; index <= length; index++) {
      const value = index * interval + initTime;
      this.times.push(value);
    }

    return this;
  }
  when(
    func: (animationStep: number, degree: number, element: any) => void
  ): Amaco {
    this.whenFunc = func;

    return this;
  }
  condition(conditions: any[]): Amaco {
    this.conditions = conditions;

    return this;
  }
  // tslint:disable-next-line: cyclomatic-complexity
  speed(func: any): Amaco {
    if (typeof func === 'string') {
      switch (func) {
        case 'linear':
          break;
        case 'u-speed':
          const var1 = 4;
          const var2 = 6;
          const var3 = 3;
          this.speedFunc = function (x: number) {
            return var1 * Math.pow(x, 3) - var2 * Math.pow(x, 2) + var3 * x;
          };
          break;
        case 'ease':
          // tslint:disable-next-line: no-magic-numbers
          const ease = BezierEasing(0.25, 0.1, 0.25, 1);
          this.speedFunc = ease;
          break;
        case 'ease-in':
          // tslint:disable-next-line: no-magic-numbers
          const easeIn = BezierEasing(0.42, 0, 1, 1);
          this.speedFunc = easeIn;
          break;
        case 'ease-out':
          // tslint:disable-next-line: no-magic-numbers
          const easeOut = BezierEasing(0, 0, 0.58, 1);
          this.speedFunc = easeOut;
          break;
        case 'ease-in-out':
          // tslint:disable-next-line: no-magic-numbers
          const easeInOut = BezierEasing(0.42, 0, 0.58, 1);
          this.speedFunc = easeInOut;
          break;
      }
    } else if (typeof func === 'object') {
      // tslint:disable-next-line: no-magic-numbers
      if (func.length >= 4) {
        this.speedFunc = BezierEasing(func[0], func[1], func[2], func[3]);
      }
    } else {
      console.assert(func !== null);
      this.speedFunc = func;
    }

    return this;
  }
  // tslint:disable-next-line: cyclomatic-complexity
  run(): Amaco {
    const _self = this;
    // cancel
    if (this.animationId) {
      window.cancelAnimationFrame(this.animationId);
    }
    this.animationId = 0;
    // start func
    if (this.startFunc) {
      this.startFunc(this);
    }
    // init state
    if (this.startState) {
      for (const key of Object.keys(this.startState)) {
        this.element.style[key] = this.startState[key];
      }
    }
    for (const result of this.animations) {
      for (const key of Object.keys(result)) {
        this.endState[key] = result[key];
      }
    }
    this.startTime = window.performance.now();
    this.animationId = window.requestAnimationFrame(this.animate.bind(this));
    setTimeout(function () {
      _self.over();
    }, this.timeSum);

    return this;
  }
  // 暂停
  // 结束
  over(isSetEndState: boolean = true): Amaco {
    this.process = 1;
    // run condition
    this.runCondition();
    // end func
    if (this.endFunc) {
      this.endFunc(this);
    }
    if (isSetEndState) {
      this.setEndState();
    }
    if (this.animationId) {
      window.cancelAnimationFrame(this.animationId);
    }
    this.animationId = 0;

    return this;
  }
  // tslint:disable-next-line: cyclomatic-complexity
  private animate(time: number) {
    // When you switch the tab, it will not run, here is replaced by the window time
    time = window.performance.now();
    const interval = time - this.startTime;
    const beforeTime = this.step !== 0 ? this.times[this.step - 1] : 0;
    this.process =
      (interval - beforeTime) / (this.times[this.step] - beforeTime);
    this.animateStep();

    if (time < this.startTime + this.timeSum) {
      // 超时进行下一步
      if (interval > this.times[this.step]) {
        this.step += 1;
        if (this.step < this.animations.length) {
          const result: any = this.animations[this.step];
          for (const key of Object.keys(result)) {
            this.startState[key] = CssDirector.getTargetCss(key, this.element);
          }
        }
      }
      this.animationId = window.requestAnimationFrame(this.animate.bind(this));
    } else {
      this.over();
    }
  }
  private animateStep() {
    const result: any = this.animations[this.step];
    for (const key of Object.keys(result)) {
      this.animateItem(key);
    }
  }
  private animateItem(key: string) {
    if (!this.startState[key]) {
      this.startState[key] = CssDirector.getTargetCss(key, this.element);
    }
    const value = this.startState[key];
    const result = CssDirector.getResultCss(
      key,
      this.element,
      this.animations[this.step][key]
    );
    const process = this.process;
    if (this.speedFunc) {
      CssDirector.set(
        key,
        this.element,
        value,
        result,
        this.speedFunc(process)
      );
    } else {
      CssDirector.set(key, this.element, value, result, process);
    }
    // run whenFun
    if (this.whenFunc) {
      this.whenFunc(this.step, process, this.element);
    }
    // run condition
    this.runCondition();
  }
  private runCondition() {
    if (this.conditions.length > 0) {
      for (let i = this.conditions.length - 1; i >= 0; i--) {
        const condition = this.conditions[i];
        if (condition.if(this.step, this.process, this.element)) {
          condition.do(this.step, this.process, this.element);
          this.conditions.splice(i, 1);
        }
      }
    }
  }
  private setEndState() {
    const result: any = this.endState;
    for (const key of Object.keys(result)) {
      this.element.style[key] = result[key];
    }
  }
}

export default Amaco;
export { AmacoInit, CssDirector };
