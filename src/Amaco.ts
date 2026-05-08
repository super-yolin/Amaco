import { resolveEasing, linear } from './easing';
import {
  getPropType,
  readComputedValue,
  resolveValue,
  buildInterpolator,
  Interpolator,
} from './properties';
import type {
  AnimatableProps,
  Condition,
  EasingFn,
  EasingInput,
  PlayState,
  StartCallback,
  CompleteCallback,
  UpdateCallback,
} from './types';

interface StepDef {
  props: AnimatableProps;
  easing: EasingFn | null;
}

interface StepSnapshot {
  interpolators: Record<string, Interpolator>;
  finalValues: Record<string, string>;
}

export class Amaco {
  private _element!: HTMLElement;
  private _steps: StepDef[] = [];
  private _durations: number[] = [];
  private _fromProps: AnimatableProps = {};
  private _loopCount = 1;
  private _yoyo = false;
  private _globalEasing: EasingFn = linear;
  private _conditions: Condition[] = [];

  private _onStartCb?: StartCallback;
  private _onCompleteCb?: CompleteCallback;
  private _onUpdateCb?: UpdateCallback;

  // Runtime state
  private _rafId = 0;
  private _state: PlayState = 'idle';
  private _startTime = 0;
  private _pausedAt = 0;
  private _totalDuration = 0;
  private _cumulativeTimes: number[] = [];
  private _snapshots: StepSnapshot[] = [];
  private _resolvePromise?: () => void;

  // ─── Builder API ──────────────────────────────────────────────────────────

  target(element: HTMLElement): this {
    this._element = element;
    return this;
  }

  from(props: AnimatableProps): this {
    this._fromProps = props;
    return this;
  }

  to(props: AnimatableProps): this {
    this._steps.push({ props, easing: null });
    return this;
  }

  duration(ms: number): this {
    const unassigned = this._steps.length - this._durations.length;
    if (unassigned <= 0) {
      throw new Error('duration(): no pending animation steps. Call .to() first.');
    }
    const perStep = ms / unassigned;
    for (let i = 0; i < unassigned; i++) {
      this._durations.push(perStep);
    }
    return this;
  }

  easing(input: EasingInput): this {
    const fn = resolveEasing(input);
    if (this._steps.length > 0) {
      this._steps[this._steps.length - 1].easing = fn;
    } else {
      this._globalEasing = fn;
    }
    return this;
  }

  loop(count = 0): this {
    this._loopCount = count;
    return this;
  }

  yoyo(enabled = true): this {
    this._yoyo = enabled;
    return this;
  }

  onStart(cb: StartCallback): this {
    this._onStartCb = cb;
    return this;
  }

  onComplete(cb: CompleteCallback): this {
    this._onCompleteCb = cb;
    return this;
  }

  onUpdate(cb: UpdateCallback): this {
    this._onUpdateCb = cb;
    return this;
  }

  condition(conditions: Condition[]): this {
    this._conditions = [...conditions];
    return this;
  }

  // ─── Backwards-compat aliases ─────────────────────────────────────────────

  time(ms: number): this { return this.duration(ms); }
  speed(input: EasingInput): this { return this.easing(input); }
  start(cb: StartCallback): this { return this.onStart(cb); }
  end(cb: CompleteCallback): this { return this.onComplete(cb); }
  when(cb: UpdateCallback): this { return this.onUpdate(cb); }
  run(): this { void this.play(); return this; }
  over(): this { this.cancel(); return this; }

  // ─── Control API ──────────────────────────────────────────────────────────

  play(): Promise<void> {
    this._validate();
    this._buildSnapshots();
    this._computeTiming();
    this._applyInitialState();
    this._state = 'running';
    this._onStartCb?.(this._element);

    return new Promise<void>((resolve) => {
      this._resolvePromise = resolve;
      this._startTime = performance.now();
      this._rafId = requestAnimationFrame(this._tick.bind(this));
    });
  }

  pause(): this {
    if (this._state !== 'running') return this;
    this._state = 'paused';
    this._pausedAt = performance.now();
    cancelAnimationFrame(this._rafId);
    this._rafId = 0;
    return this;
  }

  resume(): this {
    if (this._state !== 'paused') return this;
    this._state = 'running';
    this._startTime += performance.now() - this._pausedAt;
    this._rafId = requestAnimationFrame(this._tick.bind(this));
    return this;
  }

  cancel(): this {
    if (this._state === 'finished' || this._state === 'cancelled') return this;
    this._state = 'cancelled';
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = 0;
    }
    this._resolvePromise?.();
    return this;
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private _validate(): void {
    if (!this._element) {
      throw new Error('No target element. Call .target(element) first.');
    }
    if (this._steps.length === 0) {
      throw new Error('No animation steps. Call .to({...}) first.');
    }
    if (this._durations.length < this._steps.length) {
      throw new Error('Missing duration. Call .duration(ms) after your .to() call(s).');
    }
  }

  private _buildSnapshots(): void {
    this._snapshots = [];
    const resolvedTo: Record<string, string> = {};

    const resolvedFrom: Record<string, string> = {};
    for (const [key, value] of Object.entries(this._fromProps)) {
      if (value !== undefined) {
        resolvedFrom[key] = resolveValue(this._element, key, String(value));
      }
    }

    for (let i = 0; i < this._steps.length; i++) {
      const step = this._steps[i];
      const interpolators: Record<string, Interpolator> = {};
      const finalValues: Record<string, string> = {};

      for (const [key, value] of Object.entries(step.props)) {
        if (value === undefined || getPropType(key) === null) continue;

        let fromValue: string;
        if (i === 0 && key in resolvedFrom) {
          fromValue = resolvedFrom[key];
        } else if (key in resolvedTo) {
          fromValue = resolvedTo[key];
        } else {
          fromValue = readComputedValue(key, this._element);
          if (getPropType(key) === 'length') {
            fromValue = resolveValue(this._element, key, fromValue);
          }
        }

        const toValue = resolveValue(this._element, key, String(value));
        const interp = buildInterpolator(key, fromValue, toValue);
        if (interp) {
          interpolators[key] = interp;
          finalValues[key] = toValue;
          resolvedTo[key] = toValue;
        }
      }

      this._snapshots.push({ interpolators, finalValues });
    }
  }

  private _computeTiming(): void {
    this._cumulativeTimes = [];
    let cumulative = 0;
    for (const d of this._durations) {
      cumulative += d;
      this._cumulativeTimes.push(cumulative);
    }
    this._totalDuration = cumulative;
  }

  private _applyInitialState(): void {
    const { interpolators } = this._snapshots[0];
    for (const [key, interp] of Object.entries(interpolators)) {
      (this._element.style as unknown as Record<string, string>)[key] = interp(0);
    }
  }

  private _tick(now: number): void {
    if (this._state !== 'running') return;

    const elapsed = now - this._startTime;
    const iterDuration = this._yoyo ? this._totalDuration * 2 : this._totalDuration;
    const maxElapsed = this._loopCount === 0 ? Infinity : iterDuration * this._loopCount;

    if (elapsed >= maxElapsed) {
      this._finish();
      return;
    }

    const cycleElapsed = elapsed % iterDuration;
    const reversed = this._yoyo && cycleElapsed >= this._totalDuration;
    const effectiveElapsed = reversed
      ? iterDuration - cycleElapsed
      : cycleElapsed;

    this._renderFrame(effectiveElapsed);
    this._rafId = requestAnimationFrame(this._tick.bind(this));
  }

  private _renderFrame(elapsed: number): void {
    let step = this._steps.length - 1;
    for (let i = 0; i < this._cumulativeTimes.length; i++) {
      if (elapsed <= this._cumulativeTimes[i]) {
        step = i;
        break;
      }
    }

    const stepStartTime = step === 0 ? 0 : this._cumulativeTimes[step - 1];
    const stepEndTime = this._cumulativeTimes[step];
    const stepDuration = stepEndTime - stepStartTime;
    const rawProgress = stepDuration === 0 ? 1 : (elapsed - stepStartTime) / stepDuration;
    const clampedProgress = Math.max(0, Math.min(1, rawProgress));

    const stepEasing = this._steps[step].easing ?? this._globalEasing;
    const t = stepEasing(clampedProgress);

    const { interpolators } = this._snapshots[step];
    for (const [key, interp] of Object.entries(interpolators)) {
      (this._element.style as unknown as Record<string, string>)[key] = interp(t);
    }

    this._onUpdateCb?.(clampedProgress, step, this._element);
    this._runConditions(step, clampedProgress);
  }

  private _finish(): void {
    this._state = 'finished';
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = 0;
    }
    // Apply exact final values (avoids floating point drift on the last frame)
    const lastSnapshot = this._snapshots[this._snapshots.length - 1];
    for (const [key, value] of Object.entries(lastSnapshot.finalValues)) {
      (this._element.style as unknown as Record<string, string>)[key] = value;
    }
    this._onCompleteCb?.(this._element);
    this._resolvePromise?.();
  }

  private _runConditions(step: number, progress: number): void {
    for (let i = this._conditions.length - 1; i >= 0; i--) {
      const cond = this._conditions[i];
      if (cond.if(step, progress, this._element)) {
        cond.do(step, progress, this._element);
        this._conditions.splice(i, 1);
      }
    }
  }
}
