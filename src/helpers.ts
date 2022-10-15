import { symbolDateModified, symbolGetNode, symbolIsObservable } from './globals';
import { isFunction, isObject, isObjectEmpty } from './is';
import type { NodeValue, ObservableObject, ObservableReadable, ObserveEvent, Selector } from './observableInterfaces';

export function isObservable(obs: any): obs is ObservableObject {
    return obs && !!obs[symbolIsObservable as any];
}

export function computeSelector<T>(selector: Selector<T>, e?: ObserveEvent<T>) {
    let c = selector as any;
    if (isFunction(c)) {
        c = e ? c(e) : c();
    }

    return isObservable(c) ? c.get() : c;
}

export function getNode(obs: ObservableReadable): NodeValue {
    return obs[symbolGetNode];
}

export function lockObservable(obs: ObservableReadable, value: boolean) {
    const root = getNode(obs)?.root;
    if (root) {
        root.locked = value;
    }
}
export function mergeIntoObservable(target: ObservableObject | object, ...sources: any[]) {
    if (!sources.length) return target;

    const source = sources.shift();

    const needsSet = isObservable(target);

    const isTargetObj = isObject(target);

    if (isTargetObj && isObject(source)) {
        if (source[symbolDateModified as any]) {
            if (needsSet) {
                // @ts-ignore
                target[symbolDateModified].set(source[symbolDateModified as any]);
            } else {
                target[symbolDateModified as any] = source[symbolDateModified as any];
            }
        }
        const value = isObservable(target) ? target.peek() : target;
        for (const key in source) {
            if (isObject(source[key]) && !isObjectEmpty(source[key])) {
                if (!needsSet && (!value[key] || !isObject(value[key]))) {
                    target[key] = {};
                }
                mergeIntoObservable(target[key], source[key]);
            } else {
                needsSet && target[key]?.set ? target[key].set(source[key]) : (target[key] = source[key]);
            }
        }
    } else if (needsSet && !(isTargetObj && source === undefined)) {
        target.set(source);
    }
    return mergeIntoObservable(target, ...sources);
}
