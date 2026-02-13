declare module 'san-loader/lib/plugin';

// 为 App.san 组件添加类型声明
declare module '*.san' {
    import type { Component } from 'san';
    interface ComponentWithSanSSRRenders extends Component {
        sanSSRRenders?: {
            [key: string]: (data: any, ...params: any[]) => string;
        };
    }
    const component: ComponentWithSanSSRRenders;
    export default component;
}