// Global type definitions for NW.js API
// This file provides TypeScript types for the Node-WebKit (NW.js) APIs used in the application

declare namespace nw {
  interface App {
    argv: string[];
  }

  interface Window {
    open(url: string, options?: any, callback?: (win: Window) => void): Window;
    setAlwaysOnTop(alwaysOnTop: boolean): void;
    moveTo(x: number, y: number): void;
    on(event: 'loaded', callback: () => void): void;

    window: {
      setBlockData(data: any): void;
    };
  }

  interface MenuItem {
    label?: string;
    click?: () => void;
    type?: 'separator' | 'checkbox';
    checked?: boolean;
  }

  class Menu {
    append(item: MenuItem): void;
    popup(x: number, y: number): void;
  }

  const App: App;
  const Window: Window;
  const Menu: typeof Menu;
  function MenuItem(options: MenuItem): MenuItem;
}

// Global declaration for NW.js
declare const nw: nw.App & nw.Window & {
  Menu: typeof nw.Menu;
  MenuItem: typeof nw.MenuItem;
};
